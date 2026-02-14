import type { WordCard } from "../contentTypes";

/**
 * SM-2 更新
 */
export function sm2Update(
  memory: WordCard["memory"],
  quality: number,
  nowMs: number
) {
  let ef = memory.ef ?? 2.5;
  let reps = memory.repetitions ?? memory.level ?? 0;
  let interval = memory.interval ?? 0;

  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ef < 1.3) ef = 1.3;

  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = interval * ef;
  }

  return {
    ...memory,
    ef,
    repetitions: reps,
    interval,
    nextReview: nowMs + interval * 86400000,
    risk: Math.min(100, Math.max(0, (memory.risk ?? 0) + (quality < 3 ? 20 : -10)))
  };
}
