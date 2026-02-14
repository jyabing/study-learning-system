import type { WordCard } from "../contentTypes";

export function generateListenSpell(card: WordCard, lang: "en"|"jp"|"kr") {
  const audioMap = {
    en: card.audioEn,
    jp: card.audioJp,
    kr: card.audioKr
  };

  const answerMap = {
    en: card.en,
    jp: card.jp,
    kr: card.kr
  };

  return {
    audio: audioMap[lang],
    answer: answerMap[lang]
  };
}
