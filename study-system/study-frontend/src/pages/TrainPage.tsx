import { useEffect, useState } from "react";
import { API_BASE } from "../config";

type WordPayload = {
  spelling: string;
  meaning: string;
  japanese?: string;
  korean?: string;
  example?: string;
  memory_level?: number;
  next_review_date?: string;
};

type Option = { id: number; spelling: string; meaning: string };

type Question = {
  word_id: number;
  audio_url: string; // 可能是绝对URL，也可能是相对路径
  word: WordPayload;
  options: Option[];
};

type DonePayload = {
  done: true;
  message?: string;
};

function normalizeAudioUrl(audioUrl: string) {
  if (!audioUrl) return "";
  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) return audioUrl;
  // 相对路径（如 /media/... 或 /mp3/...）就补上域名
  if (audioUrl.startsWith("/")) return `${API_BASE}${audioUrl}`;
  return `${API_BASE}/${audioUrl}`;
}

export default function TrainPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [doneMsg, setDoneMsg] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [error, setError] = useState<string>("");

  const [mode, setMode] = useState<"dictation" | "choice" | "fill" | "recall">("choice")

  useEffect(() => {
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNext = async () => {
    setLoading(true);
    setSelected(null);
    setResult(null);
    setError("");

    try {
      const modePool = ["dictation", "choice", "fill", "recall"] as const;
      type Mode = typeof modePool[number];

      const nextMode: Mode = modePool[Math.floor(Math.random() * modePool.length)];
      setMode(nextMode);


      const url = `${API_BASE}/api/train/next/?course_id=1&mode=${nextMode}`; // ✅ 注意：base不带 /api，这里加 /api
      const res = await fetch(url, { credentials: "include" });

      // 非 200 直接把文本吐出来，避免“黑屏”
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status} ${res.statusText} :: ${t}`);
      }

      const data: Question | DonePayload = await res.json();

      if ((data as DonePayload).done) {
        setQuestion(null);
        setDoneMsg((data as DonePayload).message || "🎉 今日任务完成");
      } else {
        setDoneMsg("");
        setQuestion(data as Question);
      }
    } catch (e: any) {
      console.error(e);
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const choose = (optId: number) => {
    if (!question || result) return;

    setSelected(optId);
    setResult(optId === question.word_id ? "correct" : "wrong");

    // ====== [BEGIN 修改 choose 提交逻辑] ======
    setTimeout(async () => {
      try {
        await fetch(`${API_BASE}/api/train/submit/`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: 1,
            word_id: question.word_id,
            mode: mode,
            chosen_id: optId,
            remembered: optId === question.word_id
          })
        });
      } catch (e) {
        console.error(e);
      }

      loadNext();
    }, 500);
    // ====== [END 修改 choose 提交逻辑] ======
  };

  const play = () => {
    if (!question) return;
    const src = normalizeAudioUrl(question.audio_url);
    if (!src) return;
    const audio = new Audio(src);
    audio.play().catch(console.error);
  };

  if (loading) return <div style={wrap}>加载中...</div>;

  if (error)
    return (
      <div style={wrap}>
        <div style={{ maxWidth: 560, lineHeight: 1.6 }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>❌ 请求失败</div>
          <pre style={errBox}>{error}</pre>
          <button style={playBtn} onClick={loadNext}>
            重新加载
          </button>
        </div>
      </div>
    );

  if (!question) return <div style={wrap}>{doneMsg || "🎉 今日任务完成"}</div>;

  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={wrap}>
      <h2 style={title}>听音选词</h2>

      <button style={playBtn} onClick={play}>
        🔊 播放发音
      </button>

      <div style={optionsWrap}>
        {isMobile ? (
          // 📱 手机卡片
          question.options.map((opt) => {
            const isRight = opt.id === question.word_id;
            const isSelected = selected === opt.id;

            let bg = "#222";
            if (result && isSelected) bg = isRight ? "#16a34a" : "#dc2626";

            return (
              <div
                key={opt.id}
                style={{ ...option, background: bg }}
                onClick={() => choose(opt.id)}
              >
                <div style={{ fontSize: 20 }}>{opt.spelling}</div>
                <div style={{ fontSize: 14, opacity: 0.7 }}>{opt.meaning}</div>
              </div>
            );
          })
        ) : (
          // 🖥 桌面表格
          <table style={{ width: 400 }}>
            <tbody>
              {question.options.map((opt) => {
                const isRight = opt.id === question.word_id;
                const isSelected = selected === opt.id;

                let bg = "#222";
                if (result && isSelected) bg = isRight ? "#16a34a" : "#dc2626";

                return (
                  <tr
                    key={opt.id}
                    style={{ background: bg, cursor: "pointer" }}
                    onClick={() => choose(opt.id)}
                  >
                    <td style={{ padding: 10 }}>{opt.spelling}</td>
                    <td style={{ padding: 10 }}>{opt.meaning}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

/* 样式 */
const wrap: React.CSSProperties = {
  height: "100vh",
  background: "#111",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 20,
  padding: 16,
};

const title: React.CSSProperties = { fontSize: 28, margin: 0 };

const playBtn: React.CSSProperties = {
  padding: "10px 20px",
  fontSize: 18,
  background: "#2563eb",
  color: "#fff",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const optionsWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  width: 320,
  maxWidth: "90vw",
};

const option: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  cursor: "pointer",
  textAlign: "center",
  fontSize: 18,
  userSelect: "none",
};

const errBox: React.CSSProperties = {
  background: "#1f2937",
  padding: 12,
  borderRadius: 10,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
};
