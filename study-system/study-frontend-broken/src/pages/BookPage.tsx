import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Book = {
  id: number;
  title: string;
};

type Props = {
  onSelectBook: (book: Book) => void;
};

export default function BookPage({ onSelectBook }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://study-learning-system.onrender.com/api/books/")
      .then(res => res.json())
      .then(data => {
        setBooks(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: 40 }}>加载书册�?..</div>;

  if (books.length === 0) {
    return (
      <div style={emptyWrap}>
        <div style={emptyCard}>
          <div style={icon}>📚</div>
          <h2>まだ書冊がありません</h2>
          <p>请先在后台创建书�?/p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>📚 我的书册</h2>
      {books.map(book => (
        <div key={book.id} style={{ marginBottom: 10 }}>
          <button style={btn} onClick={() => onSelectBook(book)}>
            {book.title}
          </button>
        </div>
      ))}
    </div>
  );
}

const emptyWrap: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f7f6f2"
};

const emptyCard: CSSProperties = {
  background: "#fff",
  padding: 50,
  borderRadius: 20,
  textAlign: "center",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
};

const icon: CSSProperties = { fontSize: 48, marginBottom: 10 };

const btn: CSSProperties = {
  background: "#2f2f2f",
  color: "#fff",
  padding: "10px 22px",
  borderRadius: 10,
  cursor: "pointer"
};
