# study_system/library/services/srs_scheduler.py

from datetime import timedelta
from django.utils import timezone


def schedule_next(memory, quality: int):
    """
    quality:
    0 = wrong
    1 = hard
    2 = good
    3 = easy
    """

    now = timezone.now()

    if memory.interval is None:
        memory.interval = 0

    if memory.ease_factor is None:
        memory.ease_factor = 2.5

    if quality == 0:
        memory.interval = 0
        memory.repetitions = 0
        next_days = 0

    else:
        memory.repetitions += 1

        if memory.repetitions == 1:
            next_days = 1
        elif memory.repetitions == 2:
            next_days = 3
        else:
            next_days = int(memory.interval * memory.ease_factor)

        memory.ease_factor = max(
            1.3,
            memory.ease_factor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02))
        )

        memory.interval = next_days

    memory.next_review = now + timedelta(days=next_days)
    memory.last_review = now

    return memory
