from datetime import date
from django.shortcuts import get_object_or_404, redirect, render
from django.http import JsonResponse
from django.db.models import Count
from django.views.decorators.csrf import csrf_exempt
from .models import Word, Course, StudyLog, Book, ConfusionPair
from difflib import SequenceMatcher
import random, re


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
    words = Word.objects.filter(next_review_date__lte=today).order_by("memory_level")
    return render(request, "library/today_review.html", {"words": words})


def review_action(request, word_id, result):
    word = get_object_or_404(Word, id=word_id)
    word.update_memory(result == "remember")
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
