type Props = {
  page: string;
  setPage: (p: any) => void;
};

export default function BottomNav({ page, setPage }: Props) {
  return (
    <div style={navWrap}>
      <button style={btn(page==="books")} onClick={() => setPage("books")}>书册</button>
      <button style={btn(page==="train")} onClick={() => setPage("train")}>学习</button>
      <button style={btn(page==="words")} onClick={() => setPage("words")}>单词</button>
    </div>
  );
}

const navWrap = {
  position: "fixed" as const,
  bottom: 0,
  left: 0,
  right: 0,
  background: "#fbfbf9",
  borderTop: "1px solid #e4e2dc",
  display: "flex",
  justifyContent: "space-around",
  padding: "8px 0"
};

const btn = (active:boolean) => ({
  background: "none",
  border: "none",
  fontSize: 14,
  color: active ? "#2f2f2f" : "#9b9b9b"
});
