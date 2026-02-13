from django.contrib import admin
from django.utils import timezone
from .models import Book, Course, Word, MP3


# ================= Book =================
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("title",)
    search_fields = ("title",)


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

    list_display = ("spelling", "course", "memory_level", "next_review_date")
    list_filter = ("course",)
    search_fields = ("spelling", "meaning", "japanese", "korean")
    inlines = [MP3Inline]

    readonly_fields = ("memory_level", "next_review_date")

    fields = (
        "course",
        "spelling",
        "meaning",
        "japanese",
        "korean",
        "example",
        "category",
        "memory_level",
        "next_review_date",
    )

    def save_model(self, request, obj, form, change):
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
