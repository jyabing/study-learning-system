import type { CSSProperties } from "react";

export default function QuestionCard({
  word,
  from,
  to,
  dictationMode
}: any) {
  const questionFrom = from;
  const questionTo = to;

  return (
    <div style={card}>
      <div style={meta}>
        {questionFrom.toUpperCase()} �?{questionTo.toUpperCase()}
      </div>

      {!dictationMode && <div style={wordText}>{word[questionFrom]}</div>}
      {dictationMode && <div style={hint}>🎧 正在播放发音，请输入你听到的内容</div>}
    </div>
  );
}

const card: CSSProperties = {
  padding: 20,
  borderRadius: 14,
  textAlign: "center",
  border: "1px solid #ddd",
};

const meta: CSSProperties = { opacity: 0.8, marginBottom: 8 };

const wordText: CSSProperties = { fontSize: 28, fontWeight: 700 };

const hint: CSSProperties = { padding: 8, opacity: 0.8 };
