import { useState } from "react";
import "./flip.css";

export default function FlipCard({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={`flip-card ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)}>
      <div className="flip-inner">
        <div className="flip-front card">{front}</div>
        <div className="flip-back card">{back}</div>
      </div>
    </div>
  );
}
