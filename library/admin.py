from django.contrib import admin
from .models import Book, Course, Word, MP3

admin.site.register(Book)
admin.site.register(Course)

class MP3Inline(admin.TabularInline):
    model = MP3
    extra = 1

@admin.register(Word)
class WordAdmin(admin.ModelAdmin):
    inlines = [MP3Inline]

admin.site.register(MP3)
