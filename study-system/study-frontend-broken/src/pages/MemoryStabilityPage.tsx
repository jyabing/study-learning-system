import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { WordCard } from "../contentTypes";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

/* ========= 工具 ========= */

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function estimateHalfLifeDays(w: WordCard): number {
  const mem = w.memory;
  const interval = mem.interval ?? 0;
  const ef = mem.ef ?? 2.5;
  const reps = mem.repetitions ?? mem.level ?? 0;

  if (interval > 0 || mem.ef != null || mem.repetitions != null) {
    const base = Math.max(0.3, interval);
    const repBoost = 1 + reps * 0.35;
    const efBoost = clamp(ef / 2.5, 0.6, 1.6);
    return clamp(base * repBoost * efBoost, 0.2, 120);
  }

  const level = mem.level ?? 1;
  return [0.2, 0.6, 1.5, 4, 9][clamp(level, 1, 5) - 1];
}

function recallProb(w: WordCard, tDays: number) {
  return Math.exp(-tDays / Math.max(0.0001, estimateHalfLifeDays(w)));
}

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}-${d.getDate()}`;
}

/* ========= 页面 ========= */

export default function MemoryStabilityPage({ words }: { words: WordCard[] }) {

  /* ===== 未来复习预测 ===== */
  const dueForecast = useMemo(() => {
    const now = Date.now();
    const end = now + 30 * 86400000;
    const map = new Map<string, number>();

    words.forEach(w => {
      const t = w.memory.nextReview ?? now;
      if (t >= now && t <= end) map.set(dayKey(t), (map.get(dayKey(t)) ?? 0) + 1);
    });

    return Array.from({ length: 31 }, (_, i) => {
      const k = dayKey(now + i * 86400000);
      return { day: k, count: map.get(k) ?? 0 };
    });
  }, [words]);

  /* ===== 稳定度分�?===== */
  const stabilityBuckets = useMemo(() => {
    const bins = [
      { label: "<1d", a: 0, b: 1, v: 0 },
      { label: "1-3d", a: 1, b: 3, v: 0 },
      { label: "3-7d", a: 3, b: 7, v: 0 },
      { label: "7-14d", a: 7, b: 14, v: 0 },
      { label: "14-30d", a: 14, b: 30, v: 0 },
      { label: "30d+", a: 30, b: Infinity, v: 0 },
    ];
    words.forEach(w => {
      const hl = estimateHalfLifeDays(w);
      const bin = bins.find(b => hl >= b.a && hl < b.b);
      if (bin) bin.v++;
    });
    return bins.map(b => ({ bucket: b.label, count: b.v }));
  }, [words]);

  /* ===== 遗忘曲线（中位词�?===== */
  const forgettingCurve = useMemo(() => {
    if (!words.length) return [];
    const midWord = words[Math.floor(words.length / 2)];
    return Array.from({ length: 31 }, (_, d) => ({
      day: d,
      recall: Math.round(recallProb(midWord, d) * 1000) / 10
    }));
  }, [words]);

  /* ===== 危险�?===== */
  const dangerWords = useMemo(() =>
    [...words]
      .map(w => ({
        word: w,
        danger: Math.round((1 - recallProb(w, 7)) * 100)
      }))
      .sort((a, b) => b.danger - a.danger)
      .slice(0, 20)
  , [words]);

  /* ===== 雷达数据 ===== */
  const radarData = useMemo(() => {
    if (!dangerWords.length) return [];
    const avg = dangerWords.reduce(
      (acc, d) => acc + d.danger,
      0
    ) / dangerWords.length;

    return [
      { axis: "7天遗忘风�?, value: avg },
      { axis: "稳定性不�?, value: avg * 0.8 },
      { axis: "学习压力", value: avg * 0.6 },
      { axis: "错误敏感�?, value: avg * 0.7 }
    ];
  }, [dangerWords]);

  function startRescueMode() {
    const ids = dangerWords.map(d => d.word.id);
    sessionStorage.setItem("rescue_words", JSON.stringify(ids));
    window.location.href = "/train";
  }

  return (
    <div style={wrap}>
      <h2 style={title}>记忆稳定度仪表盘</h2>

      <div style={panel}>
        <div style={panelTitle}>遗忘曲线</div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={forgettingCurve}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="recall" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={panel}>
        <div style={panelTitle}>未来复习预测</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dueForecast}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={panel}>
        <div style={panelTitle}>稳定度分�?/div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stabilityBuckets}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={panel}>
        <div style={panelTitle}>危险词雷达图（Top20�?/div>
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="axis" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar dataKey="value" stroke="#ef4444" fill="#fecaca" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>

        <button onClick={startRescueMode} style={rescueBtn}>
          🚨 进入救火模式
        </button>

        <ol>
          {dangerWords.slice(0, 5).map(d => (
            <li key={d.word.id}>{d.word.en || d.word.jp || d.word.zh}（{d.danger}�?/li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ========= 样式 ========= */

const wrap: CSSProperties = { padding: 16, display: "flex", flexDirection: "column", gap: 16 };
const title: CSSProperties = { margin: 0, fontSize: 22 };
const panel: CSSProperties = { padding: 12, borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff" };
const panelTitle: CSSProperties = { fontSize: 14, fontWeight: 800, marginBottom: 6 };
const rescueBtn: CSSProperties = { marginTop: 10, padding: "6px 10px", background: "#ef4444", color: "#fff", borderRadius: 8 };
