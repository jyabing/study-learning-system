import type { CSSProperties } from "react";

export default function ChoicePanel({ options, word, review }: any) {

  const choose = async (opt: string) => {
    const correct = opt === word.spelling || opt === word.japanese || opt === word.korean;

    // 如果后端暂时不用，可以先注释
    await fetch(
      `https://study-learning-system.onrender.com/api/review/${word.id}/?result=${correct ? 1 : 0}`,
      { method: "POST" }
    );

    review(correct);
  };

  return (
    <div style={choices}>
      {options.map((opt: string, i: number) => (
        <button
          key={i}
          style={btn}
          onClick={() => choose(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const choices: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10
};

const btn: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer"
};
