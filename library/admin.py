from django.contrib import admin
from django.utils import timezone
from .models import Book, Course, Word, MP3


# ================= Book =================
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


# ================= Course =================
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("name", "book")
    list_filter = ("book",)
    search_fields = ("name",)


# ================= MP3 Inline =================
class MP3Inline(admin.TabularInline):
    model = MP3
    extra = 1


# ================= Word =================
@admin.register(Word)
class WordAdmin(admin.ModelAdmin):

    # 列表页显示
    list_display = ("spelling", "course", "memory_level", "next_review_date")

    list_filter = ("course",)
    search_fields = ("spelling", "meaning", "japanese", "korean")
    inlines = [MP3Inline]

    # ⭐⭐ 关键 ⭐⭐
    # 在编辑页面显示
    readonly_fields = ("memory_level", "next_review_date")

    fields = (
        "course",
        "spelling",
        "meaning",
        "japanese",
        "korean",
        "example",
        "theme",
        "memory_level",        # ← 现在会显示
        "next_review_date",    # ← 现在会显示
    )

    def save_model(self, request, obj, form, change):
        """
        新单词创建时自动初始化
        """
        if not change:
            obj.memory_level = 0
            obj.next_review_date = timezone.now().date()

        super().save_model(request, obj, form, change)


# ================= MP3 =================
@admin.register(MP3)
class MP3Admin(admin.ModelAdmin):
    list_display = ("word", "language")
    list_filter = ("language",)
    search_fields = ("word__spelling",)
