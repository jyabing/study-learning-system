from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.contrib.auth import views as auth_views

from library.views import today_review, review_action, train_next_api
from library.api import today_words_api


# ========= 首页测试 =========
def home(request):
    return HttpResponse("学习系统已运行")


urlpatterns = [
    # 首页
    path("", home),

    # 管理后台
    path("admin/", admin.site.urls),

    # 页面逻辑
    path("review/today/", today_review, name="today_review"),
    path("review/<int:word_id>/<str:result>/", review_action, name="review_action"),

    # API 接口
    path("api/today_words/", today_words_api),
    path("api/train/next/", train_next_api),# 
    
    path("api/", include("library.urls")),
    path('accounts/login/', auth_views.LoginView.as_view(), name='login'),
    
]
