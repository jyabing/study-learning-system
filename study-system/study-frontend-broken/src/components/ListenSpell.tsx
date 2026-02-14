import { useState, useRef } from "react";
import type { WordCard } from "../contentTypes";

export default function ListenSpell({ card }: { card: WordCard }) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"ok"|"ng"|null>(null);
  const audioRef = useRef<HTMLAudioElement|null>(null);

  const play = () => {
    if (!card.audioEn) return;
    if (!audioRef.current) audioRef.current = new Audio(card.audioEn);
    else audioRef.current.src = card.audioEn;
    audioRef.current.play();
  };

  const submit = () => {
    if (input.trim().toLowerCase() === card.en.toLowerCase()) {
      setFeedback("ok");
    } else {
      setFeedback("ng");
    }
    setTimeout(() => setFeedback(null), 800);
  };

  return (
    <div style={{textAlign:"center"}}>
      <button onClick={play}>🔊 播放</button>
      <input
        value={input}
        onChange={e=>setInput(e.target.value)}
        placeholder="输入听到的单�?
        style={{marginTop:12, padding:8}}
      />
      <button onClick={submit}>提交</button>
      {feedback && <div>{feedback==="ok"?"�?正确":"�?错误"}</div>}
    </div>
  );
}
