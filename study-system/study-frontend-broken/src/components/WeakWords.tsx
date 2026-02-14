import type { WordCard } from "../contentTypes";

export default function WeakWords({ words }: { words: WordCard[] }) {
  const weak = words.filter(w => (w.stats?.mistakes ?? 0) > 2);

  return (
    <div>
      <h3>薄弱�?/h3>
      {weak.map(w => <div key={w.id}>{w.zh}</div>)}
    </div>
  );
}
