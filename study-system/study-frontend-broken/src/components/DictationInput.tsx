import type { CSSProperties } from "react";

export default function DictationPanel({ input, setInput, word, answerLang, review }: any) {
  return (
    <div style={wrap}>
      <input
        style={inp}
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="输入你听到的内容"
      />
      <button
        style={btn}
        onClick={() => {
          const a = (input ?? "").trim().toLowerCase();
          const b = (word?.[answerLang] ?? "").trim().toLowerCase();
          review(a === b);
          setInput("");
        }}
      >
        提交
      </button>
    </div>
  );
}

const wrap: CSSProperties = { display: "flex", gap: 10 };
const inp: CSSProperties = { flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #ccc" };
const btn: CSSProperties = { padding: "10px 14px", borderRadius: 10, border: "1px solid #ccc", background: "#fff" };
