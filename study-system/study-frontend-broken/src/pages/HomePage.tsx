import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Book = {
  id: number;
  name: string;
};

type Props = {
  goToCourse: (bookId: number, courseId: number, courseName: string) => void;
};

export default function HomePage({ goToCourse }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [courses, setCourses] = useState([]);

  // ===== 读取书列�?=====
  useEffect(() => {
    fetch("https://study-learning-system.onrender.com/api/books/")
      .then(res => res.json())
      .then(setBooks);
  }, []);

  // ===== 读取课程进度（用于首页任务卡片）=====
  useEffect(() => {
    fetch("https://study-learning-system.onrender.com/api/course-progress/")
      .then(res => res.json())
      .then(setCourses);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      {/* ===== 仪表�?===== */}
      <div style={dashCard}>
        <h2>今日记忆状�?/h2>
        <h1 style={{ fontSize: 36 }}>0%</h1>
        <div style={{ color: "#aaa" }}>整体记忆稳定�?/div>
      </div>
      {/* ===== 今日学习任务 ===== */}
      <h3 style={{ marginTop: 20 }}>今日学习任务</h3>

      <div style={taskWrap}>
        {courses.map(c => (
          <div
            key={c.course_id}
            style={taskCard}
            onClick={() => goToCourse(c.book_id, c.course_id, c.course)}
          >
            <div style={left}>
              <div style={title}>{c.course}</div>
              <div style={sub}>{c.book_title}</div>

              <div style={meta}>
                <span style={dot} />
                {c.overdue_days} 日未复习
              </div>
            </div>

            <ProgressRing percent={c.progress} />
          </div>
        ))}
      </div>

    </div>
  );
}

/* ===== 样式 ===== */

const dashCard: CSSProperties = {
  background: "linear-gradient(135deg,#0f172a,#1e293b)",
  color: "#fff",
  padding: 30,
  borderRadius: 16,
  textAlign: "center"
};

const card: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 16,
  marginTop: 12,
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  cursor: "pointer"
};

const taskWrap: CSSProperties = {
  display: "grid",
  gap: 14
};

const taskCard: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: 16,
  background: "#fff",
  borderRadius: 14,
  boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
  cursor: "pointer"
};

const left = { display: "flex", flexDirection: "column" };
const title = { fontSize: 16, fontWeight: 600 };
const sub = { fontSize: 12, color: "#888" };
const meta = { marginTop: 8, fontSize: 12, color: "#999" };
const dot = {
  width: 6,
  height: 6,
  borderRadius: 6,
  background: "red",
  display: "inline-block",
  marginRight: 6
};

// ===== 进度环组�?=====
function ProgressRing({ percent }: { percent: number }) {
  const radius = 28;
  const stroke = 6;
  const norm = radius - stroke * 2;
  const circ = norm * 2 * Math.PI;
  const offset = circ - (percent / 100) * circ;

  return (
    <svg height={radius * 2} width={radius * 2}>
      <circle
        stroke="#eee"
        fill="transparent"
        strokeWidth={stroke}
        r={norm}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke="#1677ff"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={`${circ} ${circ}`}
        style={{ strokeDashoffset: offset }}
        r={norm}
        cx={radius}
        cy={radius}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fontSize="12"
        fill="#1677ff"
      >
        {percent}%
      </text>
    </svg>
  );
}
