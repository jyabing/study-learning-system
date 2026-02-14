export type AIQuestion =
  | { type: "example"; text: string; answer: string }
  | { type: "reverse"; question: string; answer: string };
