from datetime import date
from django.shortcuts import get_object_or_404, redirect, render
from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Count
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from .models import Word, WordMemory, Course, StudyLog, Book, ConfusionPair, TaskMemory, TaskMemoryScheduler
from difflib import SequenceMatcher
import random, re, json
from django.contrib.auth.decorators import login_required

def normalize_phonetic(word):
    w = word.lower()
    w = w.replace("ph", "f")
    w = re.sub(r"[aeiou]", "", w)  # 去元音
    w = w.replace("c", "k").replace("q", "k")
    w = w.replace("z", "s")
    w = w.replace("l", "r")  # 日语学习者典型混淆
    return w

def phonetic_score(a, b):
    a2 = normalize_phonetic(a)
    b2 = normalize_phonetic(b)

    score = 0
    if a2[:2] == b2[:2]:
        score += 4  # 开头音
    if a2[-2:] == b2[-2:]:
        score += 3  # 结尾音
    if a2 == b2:
        score += 6  # 整体近似
    return score


def smart_options_api(request, word_id):
    target = Word.objects.get(id=word_id)

    # ⭐ 先拿“历史混淆词”
    bound_confusions = ConfusionPair.objects.filter(word=target).order_by("-weight")
    bound_words = [c.confused_with for c in bound_confusions[:3]]

    # 不够再补音似词
    all_words = Word.objects.exclude(id=word_id).exclude(id__in=[w.id for w in bound_words])

    candidates = []
    for w in all_words:
        score = phonetic_score(w.spelling, target.spelling)
        candidates.append((w, score))

    candidates.sort(key=lambda x: x[1], reverse=True)
    extra = [w for w, _ in candidates[:3 - len(bound_words)]]

    options = bound_words + extra + [target]

    return JsonResponse(
        [
            {
                "id": w.id,
                "meaning": w.meaning
            }
            for w in options
        ],
        safe=False
    )



def api_books(request):
    data = []

    for b in Book.objects.all():
        data.append({
            "id": b.id,
            "name": b.title
        })

    return JsonResponse(data, safe=False)

def api_courses(request, book_id):
    courses = Course.objects.filter(book_id=book_id)
    data = [{"id": c.id, "name": c.name} for c in courses]   # ✅
    return JsonResponse(data, safe=False)


# ================= 页面：今日复习 =================

def today_review(request):
    today = date.today()
    mems = (
        WordMemory.objects
        .filter(next_review_date__lte=today)
        .select_related("word", "course")
        .order_by("next_review_date", "memory_level", "word_id")
    )
    # 模板如果只认 words，就把 word 抽出来
    words = [m.word for m in mems]
    return render(request, "library/today_review.html", {"words": words, "memories": mems})



def review_action(request, word_id, result):
    word = get_object_or_404(Word, id=word_id)
    mem, _ = WordMemory.objects.get_or_create(word=word, course=word.course)
    mem.update_memory(remembered=(result == "remember"))
    return redirect("today_review")


# ================= API：所有单词（干扰项算法用） =================

def api_all_words(request):
    qs = Word.objects.select_related("course").prefetch_related("audios")

    data = []
    for w in qs:
        audio_dict = {}
        for a in w.audios.all():
            if a.audio:
                audio_dict[a.language] = a.audio.url

        data.append({
            "id": w.id,
            "meaning": w.meaning or "",
            "spelling": w.spelling or "",
            "japanese": w.japanese or "",
            "korean": w.korean or "",
            "category": getattr(w, "category", ""),
            "memory_level": w.memory_level,
            "next_review_date": w.next_review_date,
            "audios": audio_dict,
        })

    return JsonResponse(data, safe=False)


# ================= API：记忆等级统计 =================

def api_memory_stats(request):
    levels = (
        Word.objects
        .values("memory_level")
        .annotate(count=Count("id"))
        .order_by("memory_level")
    )

    return JsonResponse({
        "levels": list(levels),
        "total": Word.objects.count(),
        "mastered": Word.objects.filter(memory_level__gte=4).count(),
        "due_today": Word.objects.filter(next_review_date=date.today()).count()
    })


# ================= API：遗忘风险 =================

def memory_risk_api(request):
    today = date.today()
    data = []

    for w in Word.objects.all():
        days_left = (w.next_review_date - today).days
        risk = max(0, 7 - days_left)

        data.append({
            "word": w.spelling,
            "memory_level": w.memory_level,
            "days_left": days_left,
            "risk": risk,
        })

    return JsonResponse(data, safe=False)


# ================= API：学习趋势 =================

def study_trend_api(request):
    logs = StudyLog.objects.order_by("date")
    data = []

    for log in logs:
        error_rate = (log.wrong_reviews / log.total_reviews) if log.total_reviews else 0
        data.append({
            "date": log.date.strftime("%m-%d"),
            "reviews": log.total_reviews,
            "errors": log.wrong_reviews,
            "error_rate": round(error_rate, 2),
        })

    return JsonResponse(data, safe=False)


# ================= API：下次复习时间 =================

def next_review_time_api(request):
    words = Word.objects.all()
    next_dates = [w.next_review_date for w in words if w.next_review_date]

    if not next_dates:
        return JsonResponse({"next_review": None})

    next_review = min(next_dates)
    return JsonResponse({"next_review": next_review.strftime("%Y-%m-%d")})


# ================= ⭐ API：课程进度（首页仪表盘） =================

def course_progress_api(request):
    today = date.today()
    data = []

    for c in Course.objects.all():
        words = Word.objects.filter(course=c)
        total = words.count()

        if total == 0:
            progress = 0
        else:
            mastered = words.filter(memory_level__gte=4).count()
            progress = int(mastered / total * 100)

        overdue_words = words.filter(next_review_date__lt=today)
        if overdue_words.exists():
            earliest = overdue_words.order_by("next_review_date").first()
            overdue_days = (today - earliest.next_review_date).days
        else:
            overdue_days = 0

        data.append({
            "course_id": c.id,
            "book_id": c.book_id,
            "book_title": c.book.title,
            "course": c.name,
            "progress": progress,
            "overdue_days": overdue_days
        })

    return JsonResponse(data, safe=False)

@csrf_exempt
def api_review(request, word_id):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"})

    try:
        word = Word.objects.get(id=word_id)
        remembered = request.GET.get("result") == "1"
        chosen_id = request.GET.get("chosen")

        word.update_memory(remembered=remembered)

        # ⭐ 记录“发音混淆绑定”
        if not remembered and chosen_id:
            chosen = Word.objects.get(id=chosen_id)

            pair, created = ConfusionPair.objects.get_or_create(
                word=word,
                confused_with=chosen
            )
            pair.weight += 1
            pair.save()

        return JsonResponse({"ok": True})
    except Word.DoesNotExist:
        return JsonResponse({"error": "not found"})
    
# ===== API：某课程的单词 =====
def api_course_words(request, course_id):
    words = Word.objects.filter(course_id=course_id)

    data = []

    for w in words:
        mp3_map = {}

        for m in w.audios.all():
            try:
                if m.audio and m.audio.name:
                    mp3_map[m.language] = m.audio.url
            except Exception as e:
                print("MP3 ERROR:", e)

        data.append({
            "id": w.id,
            "spelling": w.spelling or "",
            "meaning": w.meaning or "",
            "japanese": w.japanese or "",
            "korean": w.korean or "",
            "mp3_en": mp3_map.get("en"),
            "mp3_jp": mp3_map.get("jp"),
            "mp3_kr": mp3_map.get("kr"),
            "mp3_zh": mp3_map.get("zh"),
            "memory_level": w.memory_level,
        })

    return JsonResponse(data, safe=False)

def _pick_word_audio_url(word, lang="en"):
    """
    从 Word.audios (MP3 related_name) 里选一个语言对应的 url
    """
    try:
        qs = word.audios.all()
    except Exception:
        return None

    # 优先匹配 lang
    for a in qs:
        try:
            if a.language == lang and a.audio and a.audio.name:
                return a.audio.url
        except Exception:
            pass

    # 其次退化：随便拿一个
    for a in qs:
        try:
            if a.audio and a.audio.name:
                return a.audio.url
        except Exception:
            pass

    return None


def _build_options_for_word(target_word, limit=4):
    """
    复用你已有的“历史混淆 + 音似”思路。
    返回 options: List[Word]，保证包含 target_word，总数=limit（尽量）
    """
    # 1) 历史混淆词
    bound_confusions = ConfusionPair.objects.filter(word=target_word).order_by("-weight")
    bound_words = [c.confused_with for c in bound_confusions[: max(0, limit - 1)]]

    # 2) 音似词补齐
    all_words = Word.objects.exclude(id=target_word.id).exclude(id__in=[w.id for w in bound_words])

    candidates = []
    for w in all_words:
        score = phonetic_score(w.spelling, target_word.spelling)
        candidates.append((w, score))
    candidates.sort(key=lambda x: x[1], reverse=True)

    need = max(0, (limit - 1) - len(bound_words))
    extra = [w for w, _ in candidates[:need]]

    # 3) 合并 + 加上正确答案
    options = bound_words + extra + [target_word]

    # 4) 打乱
    random.shuffle(options)

    # 5) 如果仍不足（课程词太少），就原样返回
    return options


@require_GET
def train_next_api(request):
    """
    V2 调度优先的训练入口
    GET /api/train/next/?course_id=XX&lang=en&mode=choice
    """

    course_id = request.GET.get("course_id")
    lang = request.GET.get("lang", "en")

    if not course_id:
        return JsonResponse({"error": "course_id is required"}, status=400)

    course = Course.objects.filter(id=course_id).first()
    if not course:
        return JsonResponse({"error": "course not found"}, status=404)

    now = timezone.now()
    today = date.today()

    # ========== 模式映射 ==========
    mode_map = {
        "dictation": "listen",
        "choice": "choice",
        "fill": "fill",
        "recall": "write",
    }
    req_mode = request.GET.get("mode", "mix")
    v2_mode = mode_map.get(req_mode, req_mode)

    # ========== V2 TaskMemory 调度 ==========
    memory_v2 = (
        TaskMemory.objects
        .filter(
            user=request.user,
            mode=v2_mode,
            next_review__lte=now,
            word__course=course
        )
        .select_related("word")
        .order_by("next_review", "difficulty", "stability")
        .first()
    )

    if memory_v2:
        word = memory_v2.word
        legacy_memory = None
    else:
        # ========== 回退 V1 ==========
        legacy_qs = (
            WordMemory.objects
            .filter(course=course, next_review_date__lte=today)
            .select_related("word")
            .order_by("next_review_date", "memory_level", "word_id")
        )
        legacy_memory = legacy_qs.first()

        if not legacy_memory:
            return JsonResponse({"done": True, "message": "No due words today."}, safe=False)

        word = legacy_memory.word

    # ========== 构造题目 ==========
    options = _build_options_for_word(word, limit=4)
    audio_url = _pick_word_audio_url(word, lang=lang)

    # ========== 记忆信息兼容 V1/V2 ==========
    memory_level = legacy_memory.memory_level if legacy_memory else 0
    next_review_str = (
        legacy_memory.next_review_date.strftime("%Y-%m-%d")
        if legacy_memory else
        memory_v2.next_review.strftime("%Y-%m-%d")
    )

    payload = {
        "done": False,
        "course_id": course.id,
        "word_id": word.id,
        "audio_url": audio_url,
        "word": {
            "spelling": word.spelling or "",
            "meaning": word.meaning or "",
            "japanese": word.japanese or "",
            "korean": word.korean or "",
            "example": word.example or "",
            "category": getattr(word, "category", "") or "",
            "memory_level": memory_level,
            "next_review_date": next_review_str,
        },
        "options": [
            {"id": w.id, "spelling": w.spelling or "", "meaning": w.meaning or ""}
            for w in options
        ],
    }

    return JsonResponse(payload, safe=False)



@csrf_exempt
@require_POST
def train_submit_api(request):
    """
    POST /api/train/submit/
    JSON:
    {
      "course_id": 1,
      "word_id": 10,
      "mode": "dictation|choice|fill|recall",
      "answer_text": "hello",          // 听写/填空/默写
      "chosen_id": 123,               // 选择题：用户点的那个 option id
      "remembered": true|false        // 你前端也可以直接给最终判定结果
    }

    行为：
    - word.update_memory()
    - 记录 ConfusionPair（答错且有 chosen_id）
    - 累计 StudyLog（按今天）
    """
    try:
        body = request.body.decode("utf-8") if request.body else ""
        data = json.loads(body) if body else {}
    except Exception:
        return JsonResponse({"error": "invalid json"}, status=400)

    course_id = data.get("course_id")
    word_id = data.get("word_id")
    mode = data.get("mode", "dictation")
    answer_text = (data.get("answer_text") or "").strip()
    chosen_id = data.get("chosen_id")
    remembered = data.get("remembered")

    if not course_id or not word_id:
        return JsonResponse({"error": "course_id and word_id are required"}, status=400)

    course = Course.objects.filter(id=course_id).first()
    if not course:
        return JsonResponse({"error": "course not found"}, status=404)

    word = Word.objects.filter(id=word_id, course=course).first()
    if not word:
        return JsonResponse({"error": "word not found in course"}, status=404)

    # 如果前端没传 remembered，这里做一个最低限度的判定
    if remembered is None:
        if mode == "choice":
            remembered = (str(chosen_id) == str(word.id))
        else:
            # 听写/默写：先做严格匹配（后续再升级模糊匹配/相似度）
            remembered = (answer_text.lower() == (word.spelling or "").lower())

    # 更新记忆
    mem, _ = WordMemory.objects.get_or_create(word=word, course=course)
    mem.update_memory(remembered=bool(remembered))

    # ======== [BEGIN 新增：驱动 V2 TaskMemory 记忆引擎] ========
    mode_map = {
        "dictation": "listen",
        "choice": "choice",
        "fill": "fill",
        "recall": "write",
    }
    v2_mode = mode_map.get(mode, "mix")

    memory_obj, _ = TaskMemory.objects.get_or_create(
        user=request.user,
        word=word,
        mode=v2_mode,
        defaults={
            "next_review": timezone.now()
        }
    )

    # 转换结果
    if remembered:
        result_label = "good"
    else:
        result_label = "again"

    TaskMemoryScheduler.review(memory_obj, result_label)
    # ======== [END 新增：驱动 V2 TaskMemory 记忆引擎] ========


    # 记录 StudyLog（你的 date 是 auto_now_add=True，所以不能 create(date=today)）
    today = date.today()
    log = StudyLog.objects.filter(date=today).first()
    if not log:
        log = StudyLog.objects.create(total_reviews=0, wrong_reviews=0)

    log.total_reviews += 1
    if not remembered:
        log.wrong_reviews += 1
    log.save()

    # 记录混淆对（答错且有 chosen_id）
    wrong_word_id = None
    if not remembered and chosen_id:
        chosen = Word.objects.filter(id=chosen_id).first()
        if chosen and chosen.id != word.id:
            pair, created = ConfusionPair.objects.get_or_create(word=word, confused_with=chosen)
            pair.weight += 1
            pair.save()
            wrong_word_id = chosen.id

    return JsonResponse({
        "ok": True,
        "remembered": bool(remembered),
        "word_id": word.id,
        "wrong_word_id": wrong_word_id,
        "memory_level": mem.memory_level,
        "next_review_date": mem.next_review_date.strftime("%Y-%m-%d") if mem.next_review_date else None,
    }, safe=False)
# ========== [END 留存代码：Train APIs 追加] ==========

# ================= 初始化课程记忆（一次性） =================
@require_GET
def init_course_memory_api(request, course_id):
    """
    GET /api/init-memory/<course_id>/
    为该课程所有单词创建 WordMemory（如果不存在）
    """
    course = Course.objects.filter(id=course_id).first()
    if not course:
        return JsonResponse({"error": "course not found"}, status=404)

    words = Word.objects.filter(course=course)
    created = 0

    for w in words:
        obj, is_new = WordMemory.objects.get_or_create(word=w, course=course)
        if is_new:
            created += 1

    return JsonResponse({
        "ok": True,
        "course_id": course.id,
        "total_words": words.count(),
        "new_memories_created": created
    })

# ======== [BEGIN 复习调度面板页面] ========
@login_required
def review_dashboard(request):
    now = timezone.now()

    tasks = (
        TaskMemory.objects
        .filter(user=request.user)
        .select_related("word")
        .order_by("next_review")[:200]
    )

    return render(request, "library/review_dashboard.html", {
        "tasks": tasks,
        "now": now,
    })
# ======== [END 复习调度面板页面] ========