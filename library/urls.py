from django.urls import path
from . import views
from .views import (
 api_all_words, api_memory_stats, memory_risk_api, 
 study_trend_api, next_review_time_api, 
 course_progress_api, api_course_words,
 api_review,
)

urlpatterns = [
    path("api/books/", views.api_books),
    path("api/all-words/", api_all_words),
    path("api/memory-stats/", api_memory_stats),
    path("api/memory-risk/", memory_risk_api),
    path("api/study-trend/", study_trend_api),
    path("api/next-review-time/", next_review_time_api),
    path("api/courses/<int:book_id>/", views.api_courses),  # ⭐ 新增
    path("api/course-progress/", course_progress_api),
    path("api/course-words/<int:course_id>/", api_course_words),
    path("api/smart-options/<int:word_id>/", views.smart_options_api),
    path("api/review/<int:word_id>/", api_review),


]
