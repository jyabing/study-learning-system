export type WordCard = {
  id: string;

  zh: string;
  en: string;
  jp: string;
  kr: string;

  audioEn?: string;
  audioJp?: string;
  audioKr?: string;

  /* ================== 记忆引擎核心（V2 SM-2 兼容�?================== */
  memory: {
    /* ---- V1（旧字段，保留兼容） ---- */
    level?: number;        // 旧等级制（废弃中�?
    risk?: number;         // 旧风险制（仍可用于排序）
    nextReview: number;    // 下次复习时间戳（两代共用�?

    /* ---- V2（SM-2 新字段） ---- */
    repetitions?: number;  // 连续答对次数
    interval?: number;     // 间隔天数
    ef?: number;           // Easiness Factor �?.3
  };

  /* ================== 行为统计 ================== */
  stats: {
    mistakes: number;
    lastAnswerAt: number;
    totalReviews: number;
  };

  /* ================== AI 内容�?================== */
  examples?: Array<{
    lang: "zh" | "en" | "jp" | "kr";
    text: string;
    translate?: string;
  }>;
};

export type Course = {
  id: string;
  title: string;
  words: WordCard[];
};

export type Book = {
  id: string;
  title: string;
  courses: Course[];
};

console.log("THIS IS THE RIGHT FILE");
