import type { WordCard } from "../contentTypes";
import type { AIQuestion } from "./aiTypes";

export function generateAIQuestions(card: WordCard): AIQuestion[] {
  const questions: AIQuestion[] = [];

  if (card.en) {
    questions.push({
      type: "example",
      text: `I saw a ${card.en} yesterday.`,
      answer: card.zh
    });
  }

  if (card.kr) {
    questions.push({
      type: "reverse",
      question: card.kr,
      answer: card.en
    });
  }

  return questions;
}
