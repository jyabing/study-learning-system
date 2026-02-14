export function loadBooks() {
  try {
    const raw = localStorage.getItem("books");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveBooks(books) {
  try {
    localStorage.setItem("books", JSON.stringify(books));
  } catch {}
}
