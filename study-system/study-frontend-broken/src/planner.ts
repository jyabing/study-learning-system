import type { WordCard } from "./contentTypes";

export function getTodayTasks(words: WordCard[]) {
  const now = Date.now();
  return words.filter(w => w.memory.nextReview <= now);
}
