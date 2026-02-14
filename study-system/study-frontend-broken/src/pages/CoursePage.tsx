import type { Course } from "../contentTypes";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

type Props = {
  bookId: number;
  bookTitle: string;
  onSelectCourse: (course: Course) => void;
  onBack: () => void;
  onAddCourse: () => void;
};

export default function CoursePage({
  bookId,
  bookTitle,
  onSelectCourse,
  onBack,
  onAddCourse,
}: Props) {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch(`https://study-learning-system.onrender.com/api/courses/${bookId}/`)
      .then(res => res.json())
      .then(setCourses)
      .catch(err => console.error("课程加载失败:", err));
  }, [bookId]);

  if (courses.length === 0) {
    return (
      <div style={emptyWrap}>
        <div style={emptyCard}>
          <div style={icon}>📖</div>
          <h2>この書冊にはまだコースがありませ�?/h2>
          <button style={btn} onClick={onAddCourse}>�?添加课程</button>
          <br /><br />
          <button onClick={onBack}>�?返回书册</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <button onClick={onBack}>�?返回书册</button>
      <h2>{bookTitle}</h2>

      {courses.map(course => (
        <div key={course.id} style={{ marginBottom: 12 }}>
          <button style={btn} onClick={() => onSelectCourse(course)}>
            {course.name}
          </button>
        </div>
      ))}
    </div>
  );
}

const emptyWrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f7f6f2",
};

const emptyCard: CSSProperties = {
  background: "#fff",
  padding: 50,
  borderRadius: 20,
  textAlign: "center",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
};

const icon = { fontSize: 48, marginBottom: 10 };

const btn = {
  background: "#2f2f2f",
  color: "#fff",
  padding: "10px 22px",
  borderRadius: 10,
  cursor: "pointer",
};
