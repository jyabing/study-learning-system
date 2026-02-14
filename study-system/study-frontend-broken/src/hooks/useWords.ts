import { useEffect, useState } from "react";

export function useWords() {
  const [words, setWords] = useState<any[]>([]);

  useEffect(() => {
    fetch("https://study-learning-system.onrender.com/api/today-words/")
      .then(r => r.json())
      .then(data => {
        const formatted = data.map((w: any) => ({
          id: String(w.id),
          zh: w.meaning,
          en: w.spelling,
          jp: w.japanese ?? "",
          kr: w.korean ?? "",
          audios: w.audios ?? {}
        }));
        setWords(formatted);
      });
  }, []);

  return words;
}
