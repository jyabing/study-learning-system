import { useEffect, useState, useRef } from "react";
import type { CSSProperties } from "react";
import QuestionCard from "../components/QuestionCard";
import ChoicePanel from "../components/ChoicePanel";
import DictationPanel from "../components/DictationInput";


// ================= 调度逻辑层（不改UI结构�?=================

type LangKey = "spelling" | "japanese" | "korean" | "meaning";
type ModeKey = "choice" | "dictation" | "recall";

type Question = {
  word: Word;
  from: LangKey;   // 题目语言
  to: LangKey;     // 作答语言
  mode: ModeKey;   // 表现形式：choice / dictation / recall
};

const LANGS: LangKey[] = ["spelling", "japanese", "korean", "meaning"];
const MODES: ModeKey[] = ["choice", "dictation", "recall"];

// 洗牌
function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => Math.random() - 0.5);
}

// 轻量相似度（用于混淆项）
function levenshtein(a: string, b: string): number {
  const dp = Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        prev + 1,
        dp[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
    dp[0] = i;
  }
  return dp[b.length];
}

// 混淆项生�?
function makeOptions(words: Word[], correct: Word, lang: LangKey) {
  const base = (correct[lang] || "").trim();
  if (!base) return [];   // 🔴 没有该语言，直接跳�?

  const pool = words
    .filter(w => w.id !== correct.id)
    .map(w => (w[lang] || "").trim())
    .filter(v => v.length > 0)   // 🔴 过滤空词
    .map(text => ({
      text,
      score: levenshtein(text, base)
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(w => w.text);

  return shuffle([base, ...pool]);
}


// 调度�?
function buildSchedule(words: Word[]): Question[] {
  const arr: Question[] = [];

  words.forEach(w => {
    LANGS.forEach(from => {
      if (!(w[from] || "").trim()) return;

      LANGS.forEach(to => {
        if (from === to) return;
        if (!(w[to] || "").trim()) return;

        MODES.forEach(mode => {
          arr.push({ word: w, from, to, mode });
        });
      });
    });
  });

  return shuffle(arr);
}



// ================= 发音：SpeechSynthesis（dictation 用） =================
// 注意：浏览器通常要求“用户点击”后才能播放声音（自动播放会被拦截）
function speak(text: string, langCode: string) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = langCode;
  window.speechSynthesis.cancel(); // 防叠�?
  window.speechSynthesis.speak(u);
}

// ================= 播放单词发音（优�?MP3�?=================
function playWordAudio(word: Word, lang: LangKey, audioRef: React.RefObject<HTMLAudioElement>) {
  if (!audioRef.current) return;

  const mp3Map: Record<LangKey, string | undefined> = {
    spelling: word.mp3_en,
    japanese: word.mp3_jp,
    korean: word.mp3_kr,
  };

  const src = mp3Map[lang] ? `https://study-learning-system.onrender.com${mp3Map[lang]}` : undefined;

  if (src) {
    console.log("使用 MP3 发音�?, src);
    audioRef.current.src = src;
    audioRef.current.play();
  } else {
    console.log("没有 MP3，使用浏览器语音");
    speak(
      word[lang],
      lang === "spelling" ? "en-US" : lang === "japanese" ? "ja-JP" : "ko-KR"
    );
  }
}



export default function TrainPage({ course, index, setIndex, setFinished }: Props) {
  const [words, setWords] = useState<Word[]>([]);
  const [input, setInput] = useState("");

  // 👇👇👇 必须在组件函数内�?
  const langNameMap: Record<LangKey, string> = {
    spelling: "英语",
    japanese: "日语",
    korean: "韩语",
    meaning: "中文"
  };

  const [resultState, setResultState] = useState<"idle" | "correct" | "wrong">("idle");

  const [options, setOptions] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const languages = ["spelling", "japanese", "korean"] as const;
  const modes = ["choice", "dictation", "recall"] as const;


  const [schedule, setSchedule] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);

  const question = schedule[qIndex];
  const word = question?.word;


  useEffect(() => {
    console.log("开始请求课程单词，course.id =", course.id);

    fetch(`https://study-learning-system.onrender.com/api/course-words/${course.id}/`)
      .then(res => {
        console.log("收到响应状态：", res.status);
        return res.json();
      })
      .then(data => {
        console.log("后端返回单词数据�?, data[0]);
        setWords(data);
        setSchedule(buildSchedule(data));
        setQIndex(0);
      })
      .catch(err => {
        console.log("请求失败�?, err);
      });

  }, [course.id]);


  // 题目切换时清空输入框
  useEffect(() => {
    setInput("");
  }, [qIndex]);


  useEffect(() => {
    if (!question || question.mode !== "choice") return;

    // 1️⃣ 可作为选项语言的集�?= 除题干语言外的其它语言
    const candidateLangs: LangKey[] = LANGS.filter(l => l !== question.from);

    // 2️⃣ 只保留该单词确实有值的语言
    const validLangs = candidateLangs.filter(l => (question.word[l] || "").trim());

    if (validLangs.length === 0) return;

    // 3️⃣ 随机抽一种语言作为本题选项语言
    const randomTo = validLangs[Math.floor(Math.random() * validLangs.length)];

    console.log("Choice 题随机目标语言�?, randomTo);

    // 4️⃣ 生成选项
    setOptions(makeOptions(words, question.word, question.to));

  }, [question, words]);



  if (!question || !word) return <div style={center}>加载�?..</div>;


  return (
    <div style={wrap}>
      <button style={modeBtn}>
        当前模式：{question.mode}
      </button>

      <QuestionCard
        word={word}
        from={question.from}
        to={question.to}
        dictationMode={question.mode === "dictation"}
      />



      {question.mode === "choice" && options.length > 0 && (
        <ChoicePanel
          options={options}
          word={word}
          review={(correct: boolean) => {
            if (qIndex + 1 >= schedule.length) {
              setFinished(true);
            } else {
              setQIndex(qIndex + 1);
            }
          }}
        />
      )}

      {question.mode === "dictation" && (
        <>
          <button
            style={{ marginBottom: 10 }}
            onClick={() =>
              playWordAudio(word, question.to, audioRef)
            }
          >
            🔊 播放发音
          </button>

          <input
            style={{
              padding: 10,
              width: "100%",
              borderRadius: 8,
              border: "1px solid #ccc"
            }}
            placeholder="请输入听到的内容"
            value={input}
            onChange={e => setInput(e.target.value)}
          />

          {resultState === "correct" && (
            <div style={{ color: "green", marginTop: 8 }}>�?正确</div>
          )}

          {resultState === "wrong" && (
            <div style={{ color: "red", marginTop: 8 }}>
              �?错误，正确答案：{word[question.to]}
            </div>
          )}


          <button
            style={{ marginTop: 10 }}
            onClick={() => {
              const answer = word[question.to]?.trim();
              const userInput = input.trim();
              const correct = userInput === answer;

              setResultState(correct ? "correct" : "wrong");

              setTimeout(() => {
                setResultState("idle");
                if (qIndex + 1 >= schedule.length) {
                  setFinished(true);
                } else {
                  setInput("");
                  setQIndex(qIndex + 1);
                }
              }, correct ? 600 : 1500);
            }}


          >
            提交
          </button>
        </>
      )}



      {question.mode === "recall" && (
        <div style={{ marginTop: 20 }}>
          <input
            style={{
              padding: 10,
              width: "100%",
              borderRadius: 8,
              border: "1px solid #ccc"
            }}
            placeholder={`根据${langNameMap[question.from]}写出${langNameMap[question.to]}`}
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            style={{ marginTop: 10 }}
            onClick={() => {
              const correct = input.trim() === word[question.to];
              if (qIndex + 1 >= schedule.length) setFinished(true);
              else setQIndex(qIndex + 1);
            }}
          >
            提交
          </button>
        </div>
      )}


      <audio ref={audioRef} />
    </div>
  );
}


/* ================= 样式 ================= */

const wrap: CSSProperties = {
  padding: 20,
};

const center: CSSProperties = {
  padding: 40,
  textAlign: "center",
  fontSize: 18,
};

const modeBtn: CSSProperties = {
  marginBottom: 12,
  padding: "8px 16px",
  borderRadius: 8,
  background: "#f0f0f0",
  cursor: "pointer",
};
