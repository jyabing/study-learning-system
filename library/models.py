from django.db import models
from datetime import date, timedelta
from .storages import R2MP3Storage

class Book(models.Model):
    title = models.CharField("书名", max_length=200)
    author = models.CharField("作者", max_length=100, blank=True)
    description = models.TextField("简介", blank=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    def __str__(self):
        return self.title


class Course(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="courses")
    name = models.CharField("课程名", max_length=200)
    order = models.PositiveIntegerField("顺序", default=1)

    def __str__(self):
        return f"{self.book.title} - {self.name}"


class Word(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="words")

    spelling = models.CharField("英文", max_length=100)
    meaning = models.CharField("中文", max_length=255)

    japanese = models.CharField("日语", max_length=255, blank=True, null=True)
    korean = models.CharField("韩语", max_length=255, blank=True, null=True)

    example = models.TextField("例句", blank=True)

    # ⭐ 新增这一行
    category = models.CharField("主题分类", max_length=50, blank=True, null=True)

    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    memory_level = models.IntegerField("记忆等级", default=0)
    next_review_date = models.DateField("下次复习日期", default=date.today)
    review_count = models.IntegerField("复习次数", default=0)

    def __str__(self):
        return self.spelling

    
    def update_memory(self, remembered=True):
        """
        remembered=True  表示用户记住了
        remembered=False 表示忘了
        """

        if remembered:
            self.memory_level += 1
            self.review_count += 1

            # 记忆间隔规则（可调整）
            intervals = [1, 2, 4, 7, 15, 30]
            index = min(self.memory_level - 1, len(intervals) - 1)
            self.next_review_date = date.today() + timedelta(days=intervals[index])

        else:
            # 忘记就重置
            self.memory_level = 0
            self.next_review_date = date.today() + timedelta(days=1)

        self.save()


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

class StudyLog(models.Model):
    date = models.DateField(auto_now_add=True)
    total_reviews = models.IntegerField(default=0)
    wrong_reviews = models.IntegerField(default=0)

class WordMemory(models.Model):
    word = models.ForeignKey(Word, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)

    memory_level = models.IntegerField(default=0)
    review_count = models.IntegerField(default=0)
    next_review_date = models.DateField(default=date.today)

    class Meta:
        unique_together = ("word", "course")

class ConfusionPair(models.Model):
    word = models.ForeignKey("Word", on_delete=models.CASCADE, related_name="confusions")
    confused_with = models.ForeignKey("Word", on_delete=models.CASCADE, related_name="confused_by")
    weight = models.IntegerField(default=1)  # 错误次数权重

    def __str__(self):
        return f"{self.word.spelling} ↔ {self.confused_with.spelling}"
