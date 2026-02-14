export const API_BASE = "https://study-learning-system.onrender.com";

export async function api(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  return res.json();
}
