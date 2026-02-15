from django.urls import path
from . import views
from .views import (
 api_all_words, api_memory_stats, memory_risk_api, 
 study_trend_api, next_review_time_api, 
 course_progress_api, api_course_words,
 api_review, init_course_memory_api, train_next_api, 
 train_submit_api, review_dashboard,
)

urlpatterns = [
    path("books/", views.api_books),
    path("all-words/", api_all_words),
    path("memory-stats/", api_memory_stats),
    path("memory-risk/", memory_risk_api),
    path("study-trend/", study_trend_api),
    path("next-review-time/", next_review_time_api),
    path("courses/<int:book_id>/", views.api_courses),  # ⭐ 新增
    path("course-progress/", course_progress_api),
    path("course-words/<int:course_id>/", api_course_words),
    path("smart-options/<int:word_id>/", views.smart_options_api),
    path("review/<int:word_id>/", api_review),
    # ===== Train APIs =====
    path("train/next/", train_next_api),
    path("train/submit/", train_submit_api),
    path("init-memory/<int:course_id>/", init_course_memory_api),
    path("review/dashboard/", review_dashboard, name="review_dashboard"),


]
