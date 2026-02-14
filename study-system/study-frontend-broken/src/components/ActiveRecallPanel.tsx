import { useState } from "react";

export default function ActiveRecallPanel({ word, askLang, answerLang, review }: any) {
  const [input, setInput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  if (!word) return null;

  const correctAnswer = word[answerLang] || "";

  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/[.,!?]/g, "");

  const autoCorrect = normalize(input) === normalize(correctAnswer);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 提示�?*/}
      <div style={{ fontSize: 20, fontWeight: 600 }}>
        提示：{word[askLang]}
      </div>

      {/* 输入�?*/}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="请回忆并输入答案..."
        style={{ padding: 10, fontSize: 16 }}
      />

      {!showAnswer ? (
        <button onClick={() => setShowAnswer(true)}>显示答案</button>
      ) : (
        <>
          <div style={{ fontSize: 18 }}>
            正确答案�?b>{correctAnswer}</b>
          </div>

          <button onClick={() => review(true, word)}>我答对了</button>
          <button onClick={() => review(false, word)}>我答错了</button>
        </>
      )}

      {showAnswer && (
        <div style={{ color: autoCorrect ? "green" : "red" }}>
          系统判断：{autoCorrect ? "匹配" : "不匹�?}（可自行决定�?
        </div>
      )}
    </div>
  );
}
