export default function ProgressRing({ percent }: { percent: number }) {
  const radius = 36;
  const stroke = 6;
  const normalized = radius - stroke * 2;
  const circumference = normalized * 2 * Math.PI;
  const offset = circumference - percent / 100 * circumference;

  return (
    <svg height={radius * 2} width={radius * 2}>
      <circle
        stroke="#eee"
        fill="transparent"
        strokeWidth={stroke}
        r={normalized}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke="#1890ff"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + " " + circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        r={normalized}
        cx={radius}
        cy={radius}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
      >
        {percent}%
      </text>
    </svg>
  );
}

const card = {
  display: "flex",
  alignItems: "center",
  background: "#fff",
  borderRadius: 12,
  padding: "16px 20px",
  marginBottom: 12,
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
};
