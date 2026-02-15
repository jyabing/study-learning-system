import math
from django.db import models
from datetime import date, timedelta
from .storages import R2MP3Storage
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver


# ================== 书籍 ==================
class Book(models.Model):
    title = models.CharField("书名", max_length=200)
    author = models.CharField("作者", max_length=100, blank=True)
    description = models.TextField("简介", blank=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    def __str__(self):
        return self.title


# ================== 课程 ==================
class Course(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="courses")
    name = models.CharField("课程名", max_length=200)
    order = models.PositiveIntegerField("顺序", default=1)

    def __str__(self):
        return f"{self.book.title} - {self.name}"


# ================== 单词 ==================
class Word(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="words")

    spelling = models.CharField("英文", max_length=100)
    meaning = models.CharField("中文", max_length=255)

    japanese = models.CharField("日语", max_length=255, blank=True, null=True)
    korean = models.CharField("韩语", max_length=255, blank=True, null=True)

    example = models.TextField("例句", blank=True)
    category = models.CharField("主题分类", max_length=50, blank=True, null=True)

    # ⭐⭐⭐ 新增记忆字段 ⭐⭐⭐
    memory_level = models.IntegerField(default=0)
    next_review_date = models.DateField(default=timezone.now)

    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    def __str__(self):
        return self.spelling
    

class WordProgress(models.Model):
    word = models.OneToOneField(
        Word,
        on_delete=models.CASCADE,
        related_name="progress"
    )

    memory_level = models.IntegerField(default=0)
    next_review_date = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.word.spelling} - Lv{self.memory_level}"


# ================== 单词记忆状态（核心SRS算法）==================
class WordMemory(models.Model):
    word = models.ForeignKey(Word, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)

    memory_level = models.IntegerField(default=0)
    review_count = models.IntegerField(default=0)
    next_review_date = models.DateField(default=date.today)

    class Meta:
        unique_together = ("word", "course")

    def update_memory(self, remembered=True):
        """
        remembered=True  表示记住
        remembered=False 表示忘记
        """
        if remembered:
            self.memory_level += 1
            self.review_count += 1

            intervals = [1, 2, 4, 7, 15, 30]
            index = min(self.memory_level - 1, len(intervals) - 1)
            self.next_review_date = date.today() + timedelta(days=intervals[index])
        else:
            self.memory_level = 0
            self.next_review_date = date.today() + timedelta(days=1)

        self.save()


# ================== 音频（Cloudflare R2）==================
class MP3(models.Model):
    LANG_CHOICES = [
        ("en", "English"),
        ("jp", "Japanese"),
        ("kr", "Korean"),
        ("zh", "Chinese"),
    ]

    word = models.ForeignKey(Word, on_delete=models.CASCADE, related_name="audios")
    language = models.CharField("语言", max_length=5, choices=LANG_CHOICES)
    audio = models.FileField("发音文件", upload_to="", storage=R2MP3Storage())
    uploaded_at = models.DateTimeField("上传时间", auto_now_add=True)

    def __str__(self):
        return f"{self.word.spelling} ({self.language})"


# ================== 学习日志（统计用）==================
class StudyLog(models.Model):
    date = models.DateField(auto_now_add=True)
    total_reviews = models.IntegerField(default=0)
    wrong_reviews = models.IntegerField(default=0)


# ================== 混淆词对（智能干扰项）==================
class ConfusionPair(models.Model):
    word = models.ForeignKey("Word", on_delete=models.CASCADE, related_name="confusions")
    confused_with = models.ForeignKey("Word", on_delete=models.CASCADE, related_name="confused_by")
    weight = models.IntegerField(default=1)  # 错误权重

    def __str__(self):
        return f"{self.word.spelling} ↔ {self.confused_with.spelling}"

# ======== [BEGIN 新增 V2 记忆引擎层（不影响现有系统）] ========

class TaskMemory(models.Model):
    """
    V2 记忆状态机
    用户 × 内容 × 训练模式
    不替代 WordMemory，而是升级层
    """

    MODE_CHOICES = [
        ("listen", "听写"),
        ("choice", "选择"),
        ("fill", "填词"),
        ("write", "默写"),
        ("speak", "语音"),
        ("mix", "组合训练"),
    ]

    user = models.ForeignKey("auth.User", on_delete=models.CASCADE)

    # 当前阶段先支持 Word，未来可扩展 sentence/phrase
    word = models.ForeignKey(Word, on_delete=models.CASCADE)

    mode = models.CharField(max_length=20, choices=MODE_CHOICES)

    # === 记忆参数（FSRS思想）===
    memory_strength = models.FloatField(default=0.0)
    stability = models.FloatField(default=1.0)
    difficulty = models.FloatField(default=0.30)

    next_review = models.DateTimeField()
    last_review = models.DateTimeField(null=True, blank=True)

    review_count = models.IntegerField(default=0)
    lapse_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "word", "mode")
        indexes = [
            models.Index(fields=["user", "next_review"]),
        ]

    def __str__(self):
        return f"{self.user_id}-{self.word.spelling}-{self.mode}"


class TaskReviewLog(models.Model):
    """
    每次训练行为日志（AI调参用）
    """

    RESULT_CHOICES = [
        ("again", "不会"),
        ("hard", "困难"),
        ("good", "记住"),
        ("easy", "简单"),
    ]

    memory = models.ForeignKey(TaskMemory, on_delete=models.CASCADE, related_name="logs")
    result = models.CharField(max_length=10, choices=RESULT_CHOICES)
    response_time = models.FloatField(null=True, blank=True)

    reviewed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.memory_id}-{self.result}"

# ======== [END 新增 V2 记忆引擎层] ========



def _clamp(v, lo, hi):
    return max(lo, min(hi, v))


class TaskMemoryScheduler:
    """
    记忆调度引擎（简化版 FSRS 思想）
    不依赖外部文件，直接被 view 或训练逻辑调用
    """

    @staticmethod
    def review(memory: TaskMemory, result: str, response_time: float | None = None):
        """
        result: again / hard / good / easy
        """

        now = timezone.now()

        # === 1. 日志记录 ===
        TaskReviewLog.objects.create(
            memory=memory,
            result=result,
            response_time=response_time,
        )

        memory.review_count += 1
        memory.last_review = now

        # === 2. 失败（遗忘）===
        if result == "again":
            memory.lapse_count += 1
            memory.memory_strength *= 0.5
            memory.stability *= 0.7
            memory.next_review = now + timedelta(hours=12)

        # === 3. 困难 ===
        elif result == "hard":
            memory.memory_strength += 0.2
            memory.stability *= 1.1
            interval_days = 1.2 * memory.stability

            memory.next_review = now + timedelta(days=interval_days)

        # === 4. 正常记住 ===
        elif result == "good":
            memory.memory_strength += 0.5
            memory.stability *= 1.4

            interval_days = memory.stability * (1 + memory.memory_strength * 0.3)
            memory.next_review = now + timedelta(days=interval_days)

        # === 5. 非常简单 ===
        elif result == "easy":
            memory.memory_strength += 0.8
            memory.stability *= 1.8

            interval_days = memory.stability * (1 + memory.memory_strength * 0.5)
            memory.next_review = now + timedelta(days=interval_days)

        # === 6. 难度自适应（根据错误率）===
        fail_ratio = memory.lapse_count / max(1, memory.review_count)
        memory.difficulty = _clamp(memory.difficulty + (fail_ratio - 0.2) * 0.05, 0.1, 0.9)

        # === 7. 限制参数范围 ===
        memory.memory_strength = _clamp(memory.memory_strength, 0.0, 10.0)
        memory.stability = _clamp(memory.stability, 0.5, 30.0)

        memory.save()

        return memory.next_review

# ======== [END 新增 V2 调度算法核心函数] ========

@receiver(post_save, sender=Word)
def create_word_progress(sender, instance, created, **kwargs):
    if created:
        WordProgress.objects.create(word=instance)