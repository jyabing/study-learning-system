import { useState } from "react";
import type { Book, Course, WordCard } from "./contentTypes";

import HomePage from "./pages/HomePage";
import CoursePage from "./pages/CoursePage";
import TrainPage from "./pages/TrainPage";
import BottomNav from "./components/BottomNav";

export default function App() {
  // ===== 当前页面 =====
  const [page, setPage] = useState<"home" | "courses" | "train">("home");

  // ===== 当前选中的书、课�?=====
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);

  // ===== 单词训练状�?=====
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const cards: WordCard[] = currentCourse?.words ?? [];
  const current = cards[index];

  let pageContent = null;

  // ================= 首页：书列表 =================
  if (page === "home") {
    pageContent = (
      <HomePage
        goToCourse={(bookId, courseId, courseName) => {
          setCurrentBook({ id: bookId } as Book);
          setCurrentCourse({ id: courseId, name: courseName } as Course);
          setPage("train");
        }}
      />

    );
  }

  // ================= 课程�?=================
  else if (page === "courses" && currentBook) {
    pageContent = (
      <CoursePage
        bookId={currentBook.id}
        bookTitle={currentBook.title}
        onSelectCourse={(course) => {
          setCurrentCourse(course);
          setPage("train");
        }}
        onBack={() => setPage("home")}
        onAddCourse={() => alert("添加课程功能以后再做")}
      />
    );
  }

  // ================= 训练�?=================
  else if (page === "train" && currentCourse) {
    if (finished) {
      pageContent = (
        <div style={finishCenter}>
          <div style={finishCard}>
            <h2>训练完成 🎉</h2>
            <button style={btn} onClick={() => {
              setFinished(false);
              setIndex(0);
              setCurrentCourse(null);   // �?清训练上下文
              setCurrentBook(null);     // �?清书上下�?              setPage("home");
            }}>
              返回书册
            </button>
          </div>
        </div>
      );
    } else {
      pageContent = (
        <TrainPage
          course={currentCourse}
          index={index}
          setIndex={setIndex}
          setFinished={setFinished}
        />
      );
    }
  }


  return (
    <div className="app-shell">
      {pageContent}
      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}


/* ================= 完成页样�?================= */

const finishCenter: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(180deg, #f7f6f2, #ecebe6)",
};

const finishCard: CSSProperties = {
  background: "#fbfbf9",
  padding: "50px 40px",
  borderRadius: 16,
  boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  width: 360,
  textAlign: "center",
};

const btn: CSSProperties = {
  background: "#2f2f2f",
  color: "#fff",
  padding: "12px 26px",
  borderRadius: 10,
  marginTop: 10,
  border: "none",
  cursor: "pointer",
};
