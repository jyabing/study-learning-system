import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer
} from "recharts";

export default function StatsPage() {
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const [confuseStats, setConfuseStats] = useState<any>({});
  const [errorStats, setErrorStats] = useState<any>({});
  const [riskData, setRiskData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<any[]>([]);

  useEffect(() => {
    fetch("https://study-learning-system.onrender.com/api/memory-stats/")
      .then(res => res.json())
      .then(setMemoryStats);

    fetch("https://study-learning-system.onrender.com/api/memory-risk/")
      .then(res => res.json())
      .then(setRiskData);

    fetch("https://study-learning-system.onrender.com/api/study-trend/")
      .then(res => res.json())
      .then(setTrendData);

    fetch("https://study-learning-system.onrender.com/api/memory-countdown/")
      .then(res => res.json())
      .then(setCountdown);

    const localConfuse = localStorage.getItem("confuseMap");
    const localErrors = localStorage.getItem("errorStats");

    if (localConfuse) setConfuseStats(JSON.parse(localConfuse));
    if (localErrors) setErrorStats(JSON.parse(localErrors));
  }, []);

  if (!memoryStats) return <div style={{ padding: 40 }}>加载�?..</div>;

  // �?计算记忆等级统计
  const levelStats: Record<number, number> = {};
  riskData.forEach(w => {
    levelStats[w.memory_level] = (levelStats[w.memory_level] || 0) + 1;
  });

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 30 }}>

      {/* ================= 记忆等级分布 ================= */}
      <h2>📈 记忆掌握分布（艾宾浩斯）</h2>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={memoryStats.levels}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="memory_level" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ================= 遗忘风险预测 ================= */}
      <h2>🧠 记忆遗忘风险预测</h2>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={riskData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="word" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="risk" stroke="#ff4d4f" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ================= 学习趋势 ================= */}
      <h2>📈 学习强度趋势</h2>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="reviews" stroke="#1890ff" />
            <Line type="monotone" dataKey="error_rate" stroke="#ff4d4f" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ================= 单词风险�?================= */}
      <h2>🧠 单词记忆风险</h2>
      {riskData.map(w => (
        <div key={w.word} style={{ marginBottom: 8 }}>
          <span style={{ width: 80, display: "inline-block" }}>{w.word}</span>
          <div style={{ display: "inline-block", width: 150, height: 10, background: "#eee", marginLeft: 10, borderRadius: 5 }}>
            <div style={{
              width: `${Math.min(w.risk * 15, 100)}%`,
              background: w.risk > 5 ? "#ff4d4f" : w.risk > 2 ? "#faad14" : "#52c41a",
              height: "100%"
            }} />
          </div>
        </div>
      ))}

      {/* ================= 遗忘倒计�?================= */}
      <h2>�?遗忘倒计�?/h2>
      {countdown.map(w => (
        <div key={w.word}>
          {w.word}�?
          {w.days_left <= 0 ? " 已到遗忘�?⚠️" : ` ${w.days_left} 天安全`}
        </div>
      ))}

      {/* ================= 等级统计�?================= */}
      <h2>🧠 记忆等级分布</h2>
      <div style={{ display: "flex", gap: 10 }}>
        {Object.entries(levelStats).map(([level, count]: any) => (
          <div key={level}>
            Lv{level}
            <div style={{
              width: 40,
              height: count * 10,
              background: "#1890ff",
              marginTop: 5
            }} />
          </div>
        ))}
      </div>

      <h3>📅 今日应复习：{memoryStats.due_today} �?/h3>
      <h3>🎯 已掌握词汇：{memoryStats.mastered} / {memoryStats.total}</h3>

      {/* ================= 混淆�?================= */}
      <h2>🧠 理解盲区（费曼混淆图�?/h2>
      {Object.entries(confuseStats).length === 0 ? (
        <p>暂无混淆数据</p>
      ) : (
        Object.entries(confuseStats).map(([wid, confused]: any) => (
          <div key={wid}>
            词ID {wid} �?{confused.join(", ")}
          </div>
        ))
      )}

      {/* ================= 错误�?================= */}
      <h2>�?错误最多的�?/h2>
      {Object.entries(errorStats)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5)
        .map(([wid, count]: any) => (
          <div key={wid}>词ID {wid}：{count} 次错�?/div>
        ))}
    </div>
  );
}
