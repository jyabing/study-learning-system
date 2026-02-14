import type { CSSProperties } from "react";

type Props = {
  onBack?: () => void;
};

export default function BookPage({ onBack }: Props) {
  const onCreateBook = () => {
    console.log("create book");
  };

  return (
    <div style={page}>
      <div style={emptyCard}>
        <div style={icon}>📘</div>
        <h2 style={title}>ブックがまだありませ�?/h2>
        <p style={desc}>まずはブックを作成して、問題を整理しましょう�?/p>

        <div style={actions}>
          <button style={btn} onClick={onCreateBook}>
            �?ブックを作成
          </button>

          {onBack && (
            <button style={btnSecondary} onClick={onBack}>
              �?戻る
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 16,
  background: "linear-gradient(180deg, #f7f6f2, #ecebe6)",
};

const emptyCard: CSSProperties = {
  background: "#fff",
  padding: 24,
  borderRadius: 12,
  textAlign: "center",
  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  width: 360,
  maxWidth: "100%",
  border: "1px solid #e4e2dc",
};

const icon: CSSProperties = {
  fontSize: 48,
  marginBottom: 12,
};

const title: CSSProperties = {
  fontSize: 18,
  margin: "0 0 8px 0",
  color: "#2f2f2f",
};

const desc: CSSProperties = {
  fontSize: 14,
  margin: "0 0 16px 0",
  color: "#7b7b7b",
};

const actions: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const btn: CSSProperties = {
  background: "#2f2f2f",
  color: "#fff",
  border: "none",
  padding: "12px 16px",
  borderRadius: 10,
  fontSize: 14,
  cursor: "pointer",
  width: "100%",
};

const btnSecondary: CSSProperties = {
  background: "#f1f1ef",
  color: "#2f2f2f",
  border: "1px solid #dcdad4",
  padding: "12px 16px",
  borderRadius: 10,
  fontSize: 14,
  cursor: "pointer",
  width: "100%",
};
