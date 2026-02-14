import type { Card } from "../types";
import type { CSSProperties } from "react";


type Props = {
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  onBack: () => void;
};

export default function LibraryPage({ cards, setCards, onBack }: Props) {
  return (
    <div style={center}>
      <div style={cardStyle}>
        <h2>📚 三语题库管理</h2>

        {cards.map((c, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div>{c.zh} / {c.en} / {c.jp || "（无日文�?}</div>
            <button onClick={() => {
              const updated = cards.filter((_, idx) => idx !== i);
              setCards(updated);
            }}>
              删除
            </button>
          </div>
        ))}

        <hr />

        <input id="zh" placeholder="中文" />
        <input id="en" placeholder="英文" />
        <input id="jp" placeholder="日文（可选）" />

        <button onClick={() => {
          const zh = (document.getElementById("zh") as HTMLInputElement).value;
          const en = (document.getElementById("en") as HTMLInputElement).value;
          const jp = (document.getElementById("jp") as HTMLInputElement).value;

          if (!zh || !en) {
            alert("中文和英文必�?);
            return;
          }

          setCards([...cards, { zh, en, jp, level: 0, nextReview: 0 }]);
        }}>
          添加词条
        </button>

        <button style={{ marginTop: 10 }} onClick={onBack}>
          返回首页
        </button>
      </div>
    </div>
  );
}

const center = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#e2e8f0"
};

const cardStyle: CSSProperties = {
  background: "#02070e",
  padding: 40,
  borderRadius: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  width: 320,
  textAlign: "center"
};
