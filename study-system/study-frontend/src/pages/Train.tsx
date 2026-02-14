import { useEffect, useState } from "react";
import { api } from "../api";

export default function Train() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api("/api/train/next/?course_id=1").then(setData);
  }, []);

  if (!data) return <div>加载中...</div>;
  if (data.done) return <div>今天没有复习任务 🎉</div>;

  return (
    <div style={{ padding: 40 }}>
      <h2>{data.word.spelling}</h2>
      <button onClick={() => alert("答题逻辑后续扩展")}>
        记住了
      </button>
    </div>
  );
}
