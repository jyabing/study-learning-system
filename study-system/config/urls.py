from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from django.views.generic import TemplateView

from library.views import today_review, review_action, train_next_api
from library.api import today_words_api


urlpatterns = [
    # 管理后台
    path("admin/", admin.site.urls),

    # 页面逻辑
    path("review/today/", today_review, name="today_review"),
    path("review/<int:word_id>/<str:result>/", review_action, name="review_action"),

    # API
    path("api/today_words/", today_words_api),
    path("api/train/next/", train_next_api),
    path("api/", include("library.urls")),

    path("accounts/login/", auth_views.LoginView.as_view(), name="login"),
]

# ======== React 前端兜底路由（必须放最后） ========
urlpatterns += [
    path("", TemplateView.as_view(template_name="index.html")),
    path("<path:path>", TemplateView.as_view(template_name="index.html")),
]
