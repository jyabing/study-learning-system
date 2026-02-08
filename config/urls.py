from django.contrib import admin
from django.urls import path, include
from library.views import today_review, review_action
from library.api import today_words_api
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # 页面逻辑
    path('review/today/', today_review, name='today_review'),
    path('review/<int:word_id>/<str:result>/', review_action, name='review_action'),

    # API 桥（只保留这一个）
    path('api/today-words/', today_words_api),

    # 其余 API 交给 library
    path("", include("library.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
