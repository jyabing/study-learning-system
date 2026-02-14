import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: 40 }}>
      <h1>📘 学习系统</h1>
      <Link to="/train">
        <button>开始训练</button>
      </Link>
    </div>
  );
}
