import type { CSSProperties } from "react";

type Props = {
  level: number;
  risk: number;
};

export default function ProgressBars({ level, risk }: Props) {
  const levelPercent = Math.min(level * 20, 100);
  const riskPercent = Math.min((risk ?? 0) * 100, 100);

  return (
    <div style={wrap}>
      {/* 记忆等级�?*/}
      <div>
        <div style={track}>
          <div style={{
            ...bar,
            width: `${levelPercent}%`,
            background: "#7c9a7e"   // 柔抹茶色
          }} />
        </div>
        <div style={label}>记忆等级 Lv.{level}</div>
      </div>

      {/* 遗忘风险�?*/}
      <div style={{ marginTop: 8 }}>
        <div style={track}>
          <div style={{
            ...bar,
            width: `${riskPercent}%`,
            background:
              riskPercent < 40 ? "#9fb7c9" :
              riskPercent < 70 ? "#d6b98c" :
              "#d99a9a"
          }} />
        </div>
        <div style={subLabel}>遗忘风险 {Math.round(riskPercent)}%</div>
      </div>
    </div>
  );
}

/* ===== 日式风格样式 ===== */

const wrap: CSSProperties = {
  marginTop: 12,
  padding: "8px 4px"
};

const track: CSSProperties = {
  height: 8,
  width: "100%",
  background: "#e4e2dc",
  borderRadius: 8,
  overflow: "hidden"
};

const bar: CSSProperties = {
  height: "100%",
  transition: "width 0.4s ease"
};

const label: CSSProperties = {
  fontSize: 12,
  marginTop: 4,
  color: "#4b4b4b"
};

const subLabel: CSSProperties = {
  fontSize: 11,
  marginTop: 4,
  color: "#7a7a7a"
};
