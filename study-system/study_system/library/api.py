from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import date
from .models import Word, StudyLog

@api_view(['GET'])
def today_words_api(request):
    today = date.today()
    words = Word.objects.filter(next_review_date__lte=today)

    data = []
    for w in words:
        data.append({
            "id": w.id,
            "spelling": w.spelling,      # 英文
            "meaning": w.meaning,        # 中文
            "japanese": w.japanese,      # 新增
            "korean": w.korean,          # 新增
            "memory_level": w.memory_level,
            "example": w.example,
            "audios": {
                a.language: request.build_absolute_uri(a.audio.url)
                for a in w.audios.all()
            }
        })

    return Response(data)

def review_word_api(request, word_id):
    import json
    data = json.loads(request.body)
    correct = data.get("correct", False)

    word = Word.objects.get(id=word_id)
    word.update_memory(remembered=correct)

    # 记录学习日志
    log, _ = StudyLog.objects.get_or_create(date=date.today())
    log.total_reviews += 1
    if not correct:
        log.wrong_reviews += 1
    log.save()

    return JsonResponse({"status": "ok"})