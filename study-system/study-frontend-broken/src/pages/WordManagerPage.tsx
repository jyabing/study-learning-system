import { useState } from "react";
import type { Course, WordCard } from "../contentTypes";
import type { CSSProperties } from "react";


type Props = {
  course: Course;
  onUpdateCourse: (course: Course) => void;
  onStartTrain: () => void;
  onBack: () => void;
};

export default function WordManagerPage({
  course,
  onUpdateCourse,
  onStartTrain,
  onBack
}: Props) {

  const [words, setWords] = useState<WordCard[]>(course.words);

  const emptyWord = (): WordCard => ({
    id: crypto.randomUUID(),
    zh: "",
    en: "",
    jp: "",
    kr: "",
    memory: { level: 1, risk: 0.2, nextReview: Date.now() },
    stats: { mistakes: 0, lastAnswerAt: Date.now(), totalReviews: 0 },
  });

  const [editing, setEditing] = useState<WordCard | null>(null);

  /* 🎧 音频上传处理 */
  const handleAudioUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    lang: "en" | "jp" | "kr"
  ) => {
    if (!editing) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setEditing({ ...editing, [`audio${lang.toUpperCase()}`]: url } as WordCard);
  };

  const saveWord = () => {
    if (!editing) return;
    const updated = words.some(w => w.id === editing.id)
      ? words.map(w => (w.id === editing.id ? editing : w))
      : [...words, editing];

    setWords(updated);
    onUpdateCourse({ ...course, words: updated });
    setEditing(null);
  };

  const removeWord = (id: string) => {
    const updated = words.filter(w => w.id !== id);
    setWords(updated);
    onUpdateCourse({ ...course, words: updated });
  };

  return (
    <div style={center}>
      <div style={card}>
        <h2>📘 {course.title}</h2>

        {words.length === 0 && (
          <div style={emptyBox}>
            まだ単語がありません<br />
            请添加单词开始学�?
          </div>
        )}

        {words.map(w => (
          <div key={w.id} style={wordRow}>
            <span>{w.zh} / {w.en} / {w.jp} / {w.kr}</span>
            <div>
              <button onClick={() => setEditing(w)}>编辑</button>
              <button onClick={() => removeWord(w.id)}>删除</button>
            </div>
          </div>
        ))}

        <button style={addBtn} onClick={() => setEditing(emptyWord())}>
          �?添加单词
        </button>

        {editing && (
          <div style={editorBox}>
            <h3>单词编辑</h3>
            <input placeholder="中文" value={editing.zh}
              onChange={e => setEditing({ ...editing, zh: e.target.value })} />
            <input placeholder="English" value={editing.en}
              onChange={e => setEditing({ ...editing, en: e.target.value })} />
            <input placeholder="日本�? value={editing.jp}
              onChange={e => setEditing({ ...editing, jp: e.target.value })} />
            <input placeholder="한국�? value={editing.kr}
              onChange={e => setEditing({ ...editing, kr: e.target.value })} />

            <div style={audioBox}>
              EN音频 <input type="file" accept="audio/*" onChange={e => handleAudioUpload(e, "en")} />
              JP音频 <input type="file" accept="audio/*" onChange={e => handleAudioUpload(e, "jp")} />
              KR音频 <input type="file" accept="audio/*" onChange={e => handleAudioUpload(e, "kr")} />
            </div>

            <button onClick={saveWord}>保存</button>
          </div>
        )}

        <div style={bottomBar}>
          <button onClick={onBack}>返回课程</button>
          {words.length > 0 && (
            <button style={trainBtn} onClick={onStartTrain}>
              �?开始训�?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* 🎨 日式UI */
const center = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(180deg, #f7f6f2, #ecebe6)"
};

const card = {
  background: "#fbfbf9",
  padding: 40,
  borderRadius: 16,
  boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  width: 500
};

const emptyBox: CSSProperties = {
  padding: 20,
  color: "#777",
  textAlign: "center"
};

const wordRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10
};

const editorBox = {
  marginTop: 20,
  padding: 15,
  border: "1px solid #ddd",
  borderRadius: 8
};

const audioBox = {
  marginTop: 10,
  fontSize: 12
};

const addBtn = {
  marginTop: 10
};

const bottomBar = {
  marginTop: 20,
  display: "flex",
  justifyContent: "space-between"
};

const trainBtn = {
  background: "#2f2f2f",
  color: "#fff",
  padding: "8px 18px",
  borderRadius: 8
};
