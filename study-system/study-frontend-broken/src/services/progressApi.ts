type SyncItem = {
  wordId: string;
  quality: number;
  answeredAt: number;
  askLang: string;
  answerLang: string;
  correct: boolean;
};

export async function syncProgressBatch(items: SyncItem[]) {
  // 你可以换�?axios，这里用 fetch
  const res = await fetch("/api/progress/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ items })
  });

  if (!res.ok) {
    throw new Error("sync failed");
  }
  return res.json();
}
