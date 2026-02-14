import type { Book } from "./contentTypes";

export const books: Book[] = [
  {
    id: "book-jlpt-n1",
    title: "JLPT N1 词汇",
    courses: [
      {
        id: "course-n1-day1",
        title: "Day 1 高频�?,
        words: [
          {
            id: "w1",
            zh: "苹果",
            en: "apple",
            jp: "りん�?,
            kr: "사과",
            audioEn: "/audio/en/apple.mp3",
            audioJp: "/audio/jp/ringo.mp3",
            audioKr: "/audio/kr/sagwa.mp3",
            memory: { level: 1, risk: 0.2, nextReview: Date.now() },
            stats: { mistakes: 0, lastAnswerAt: Date.now(), totalReviews: 0 }
          },
          {
            id: "w2",
            zh: "�?,
            en: "cat",
            jp: "ねこ",
            kr: "고양�?,
            audioEn: "/audio/en/cat.mp3",
            audioJp: "/audio/jp/nekko.mp3",
            audioKr: "/audio/kr/goyang-i.mp3",
            memory: { level: 1, risk: 0.2, nextReview: Date.now() },
            stats: { mistakes: 0, lastAnswerAt: Date.now(), totalReviews: 0 }
          },
    ]
          
  }
]     }
];
