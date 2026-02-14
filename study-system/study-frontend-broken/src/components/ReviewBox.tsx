export default function ReviewBox({ words }: any) {
  const riskWords = words.filter((w:any)=>w.risk>0.6);

  return (
    <div className="card">
      <h3>需要复�?/h3>
      {riskWords.length===0 ? "暂无高风险词" :
        riskWords.map((w:any)=><div key={w.id}>{w.zh}</div>)
      }
    </div>
  );
}
