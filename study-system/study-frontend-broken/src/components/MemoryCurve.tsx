export default function MemoryCurve({ level }: {level:number}) {
  return (
    <div style={wrap}>
      <div style={{...dot, left:`${level*20}%`}} />
    </div>
  );
}

const wrap = {
  height: 60,
  background: "#f1f1ef",
  borderRadius: 12,
  position: "relative" as const
};

const dot = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  background: "#2f2f2f",
  position: "absolute" as const,
  top: 24
};
