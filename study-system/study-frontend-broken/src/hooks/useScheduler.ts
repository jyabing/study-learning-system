import { useMemo, useState } from "react";

type Lang = "zh" | "en" | "jp" | "kr";
const langs: Lang[] = ["zh", "en", "jp", "kr"];

function pickTwoLangs(): [Lang, Lang] {
  const a = langs[Math.floor(Math.random() * langs.length)];
  let b = langs[Math.floor(Math.random() * langs.length)];
  while (a === b) b = langs[Math.floor(Math.random() * langs.length)];
  return [a, b];
}

export function useScheduler(words: any[]) {
  const [index, setIndex] = useState(0);
  const [wrongQueue, setWrongQueue] = useState<string[]>([]);

  const [askLang, answerLang] = useMemo(() => pickTwoLangs(), [index]);

  const word = useMemo(() => {
    if (!words.length) return null;

    const useWrong = wrongQueue.length > 0 && index % 3 === 2;
    if (useWrong) {
      const wid = wrongQueue[0];
      return words.find(w => w.id === wid) ?? words[index % words.length];
    }
    return words[index % words.length];
  }, [words, wrongQueue, index]);

  const review = (correct: boolean) => {
    if (!word) return;

    if (!correct) {
      setWrongQueue(q => (q.includes(word.id) ? q : [...q, word.id]));
    } else {
      setWrongQueue(q => q.filter(id => id !== word.id));
    }
    setIndex(i => i + 1);
  };

  return { word, askLang, answerLang, review };
}
