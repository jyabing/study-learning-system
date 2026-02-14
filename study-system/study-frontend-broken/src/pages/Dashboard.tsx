import type { WordCard } from "../contentTypes";

export default function Dashboard({ words }: { words: WordCard[] }) {
  const mastered = words.filter(w => (w.memory.level ?? 1) >= 4).length;
  const due = words.filter(w => w.memory.nextReview <= Date.now()).length;

  return (
    <div>
      <div>已掌�? {mastered}</div>
      <div>待复�? {due}</div>
    </div>
  );
}
