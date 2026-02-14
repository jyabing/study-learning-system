const isDev = import.meta.env.DEV

export const API_BASE = isDev
  ? "http://127.0.0.1:8000/api"
  : "https://study-learning-system.onrender.com/api"
