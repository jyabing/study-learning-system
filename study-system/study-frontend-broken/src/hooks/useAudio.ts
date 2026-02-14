import { useEffect, useRef } from "react";

export function useAudio(word: any, lang: string) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!word?.audios) return;
    const url = word.audios[lang];
    if (!url) return;

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
    }
  }, [word, lang]);

  return audioRef;
}
