import type { WordCard } from "./contentTypes";

/**
 * 记忆算法主入口（V1 旧算法，仍可用作 fallback�?
 */
export function updateMemory(card: WordCard, correct: boolean): WordCard {
  const now = Date.now();

  const memory = card.memory ?? {
    level: 1,
    risk: 0.5,
    nextReview: now
  };

  // �?关键修复：给可选字段默认�?
  let level = memory.level ?? 1;
  let risk = memory.risk ?? 0.5;

  if (correct) {
    level = Math.min(level + 1, 5);
    risk = Math.max(risk - 0.15, 0);
  } else {
    level = Math.max(level - 1, 1);
    risk = Math.min(risk + 0.25, 1);
  }

  const nextReview = now + getInterval(level);

  return {
    ...card,
    memory: {
      ...memory,
      level,
      risk,
      nextReview
    },
    stats: {
      mistakes: correct
        ? card.stats.mistakes
        : card.stats.mistakes + 1,
      lastAnswerAt: now,
      totalReviews: card.stats.totalReviews + 1
    }
  };
}

/**
 * 根据记忆等级计算下次复习间隔
 */
function getInterval(level: number) {
  switch (level) {
    case 1: return 1000 * 60 * 10;        // 10分钟
    case 2: return 1000 * 60 * 60;        // 1小时
    case 3: return 1000 * 60 * 60 * 6;    // 6小时
    case 4: return 1000 * 60 * 60 * 24;   // 1�?
    case 5: return 1000 * 60 * 60 * 24 * 3; // 3�?
    default: return 1000 * 60 * 10;
  }
}
