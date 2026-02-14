import { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "../utils/helpers";
import { pickTwoLangs, shuffle } from "../utils/helpers";

type TrainWord = {
  id: string;
  zh: string;
  en: string;
  jp: string;
  kr: string;
  category?: string;
  memory_level?: number;
  next_review_date?: string;   // �?必须�?
  audios?: Record<string, string>;
};

// ====== 音似度算法（核心�?======
const phoneticMap: Record<string, string> = {
  c: "k", k: "k", q: "k",
  s: "s", z: "s",
  f: "f", ph: "f",
  g: "g", j: "g",
  r: "r", l: "r",
};

const normalize = (w: string) =>
  w.toLowerCase().replace(/ph/g, "f").replace(/[cqksz]/g, "k");

const phoneticSimilarity = (a: string, b: string) => {
  a = normalize(a);
  b = normalize(b);
  let score = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) score++;
  }
  return score;
};


export function useTrainer() {
  const [words, setWords] = useState<TrainWord[]>([]);
  const [allWords, setAllWords] = useState<TrainWord[]>([]);
  const [index, setIndex] = useState(0);

  const [dictationMode, setDictationMode] = useState(false);
  const [input, setInput] = useState("");

  const [wrongQueue, setWrongQueue] = useState<string[]>([]);
  const [confuseMap, setConfuseMap] = useState<Record<string, string[]>>({});
  const [errorStats, setErrorStats] = useState<Record<string, number>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ===== 拉今日词 =====
  useEffect(() => {
    fetch("https://study-learning-system.onrender.com/api/today-words/")
      .then(res => res.json())
      .then(data => {
        const formatted: TrainWord[] = data.map((w: any) => ({
          id: String(w.id),
          zh: w.meaning ?? "",
          en: w.spelling ?? "",
          jp: w.japanese ?? "",
          kr: w.korean ?? "",
          category: w.category ?? "",
          memory_level: w.memory_level ?? 0,
          audios: w.audios ?? {},
        }));
        setWords(formatted);
      });
  }, []);

  // ===== 全词�?=====
  useEffect(() => {
    fetch("https://study-learning-system.onrender.com/api/all-words/")
      .then(res => res.json())
      .then(data => {
        const formatted: TrainWord[] = data.map((w: any) => ({
          id: String(w.id),
          zh: w.meaning ?? "",
          en: w.spelling ?? "",
          jp: w.japanese ?? "",
          kr: w.korean ?? "",
          category: w.category ?? "",
          memory_level: w.memory_level ?? 0,
          audios: w.audios ?? {},
        }));
        setAllWords(formatted);
      });
  }, []);

  const [askLang, answerLang] = useMemo<[Lang, Lang]>(() => pickTwoLangs(), [index]);

  const word = useMemo(() => {
    if (!words.length) return undefined;

    const today = new Date().toISOString().split("T")[0];

    if (wrongQueue.length > 0 && index % 2 === 1) {
      const wid = wrongQueue[0];
      const w = words.find(w => w.id === wid);
      if (w) return w;
    }

    const dueWords = words.filter(w => w.next_review_date && w.next_review_date <= today);

    if (dueWords.length > 0) {
      const sorted = dueWords.sort((a, b) => (a.memory_level ?? 0) - (b.memory_level ?? 0));
      return sorted[index % sorted.length];
    }

    const newWords = words.filter(w => (w.memory_level ?? 0) === 0);
    if (newWords.length > 0) {
      return newWords[Math.floor(Math.random() * newWords.length)];
    }

    return words[Math.floor(Math.random() * words.length)];
  }, [words, wrongQueue, index]);



  // ===== 自动播放音频 =====
  useEffect(() => {
    if (!word?.audios) return;
    const url = word.audios[askLang];
    if (!url) return;

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
    }
  }, [word, askLang]);

  // ===== 相似度函�?=====
  function similarityScore(a: string, b: string) {
    let score = 0;
    score -= Math.abs(a.length - b.length);
    if (a[0] === b[0]) score += 2;
    for (const ch of a) if (b.includes(ch)) score += 1;
    return score;
  }

  function phoneticScore(a: string, b: string) {
    let score = 0;
    const strip = (s: string) => s.toLowerCase().replace(/[aeiou]/g, "");
    if (strip(a) === strip(b)) score += 5;
    if (a.slice(0, 3) === b.slice(0, 3)) score += 3;
    if (a.slice(-2) === b.slice(-2)) score += 2;
    return score;
  }

  // ===== 混淆算法 =====
  const options = useMemo(() => {
    if (!allWords.length || !word) return [];

    const level = word.memory_level ?? 0;

    const sameLangPool = allWords.filter(w =>
      w.id !== word.id && w[answerLang]
    );

    const sameCategoryPool = sameLangPool.filter(w =>
      w.category && w.category === word.category
    );

    const confusedIds = confuseMap[word.id] || [];
    const confusedWords = allWords.filter(w =>
      confusedIds.includes(w.id) && w[answerLang]
    );

    let basePool: TrainWord[] = [];

    if (confusedWords.length >= 3) {
      basePool = confusedWords;
    } else if (level <= 1) {
      basePool = sameLangPool;
    } else if (level <= 3) {
      basePool = sameCategoryPool.length ? sameCategoryPool : sameLangPool;
    } else {
      basePool = sameCategoryPool.length ? sameCategoryPool : sameLangPool;
    }

    const poolWithScore = basePool.map(w => ({
      word: w,
      score:
        phoneticSimilarity(w[answerLang], word[answerLang]) * 2 +
        similarityScore(w[answerLang], word[answerLang]),
    }));

    poolWithScore.sort((a, b) => b.score - a.score);

    const distractors = poolWithScore.slice(0, 3).map(p => p.word);

    return shuffle([word, ...distractors]);
  }, [allWords, word, answerLang, confuseMap]);

  // ===== AI记忆节奏调整 =====
  const review = (correct: boolean, chosen?: TrainWord) => {
    if (!word) return;

    // ⭐⭐�?在这里插�?↓↓�?
    fetch(`https://study-learning-system.onrender.com/api/review/${word.id}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correct }),
    });
    // ⭐⭐�?插入结束 ↑↑�?

    if (!correct && chosen) {
      setWrongQueue(q => (q.includes(word.id) ? q : [...q, word.id]));

      setConfuseMap(map => {
        const list = map[word.id] || [];
        if (!list.includes(chosen.id)) list.push(chosen.id);
        return { ...map, [word.id]: list };
      });

      // �?关键修正：错误统�?& 节奏惩罚同步计算
      setErrorStats(stats => {
        const newCount = (stats[word.id] || 0) + 1;
        const penalty = Math.min(newCount, 3);

        setIndex(i => i + 1 - penalty);

        return { ...stats, [word.id]: newCount };
      });

    } else {
      setWrongQueue(q => q.filter(id => id !== word.id));
      setIndex(i => i + 1);
    }

    setInput("");
  };

  const sessionDone = useMemo(() => {
    if (!allWords.length) return false;

    const today = new Date().toISOString().split("T")[0];

    const dueWords = allWords.filter(w => w.next_review_date <= today);
    const newWords = allWords.filter(w => (w.memory_level ?? 0) === 0);

    // 今天只要每个词练过一次就算完�?
    return (
        index >= (dueWords.length + newWords.length) &&
        wrongQueue.length === 0
    );
  }, [allWords, wrongQueue]);



  return {
    words,
    word,
    options,
    askLang,
    answerLang,

    dictationMode,
    setDictationMode,
    input,
    setInput,

    review,
    audioRef,

    sessionDone,   // �?新增

  };
}
