export function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export type Lang = "zh" | "en" | "jp" | "kr";
export const langs: Lang[] = ["zh", "en", "jp", "kr"];

export function pickTwoLangs(): [Lang, Lang] {
  const a = langs[Math.floor(Math.random() * langs.length)];
  let b = langs[Math.floor(Math.random() * langs.length)];
  while (a === b) b = langs[Math.floor(Math.random() * langs.length)];
  return [a, b];
}
