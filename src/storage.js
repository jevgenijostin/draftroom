export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(`draftroom:${key}`);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
export function write(key, value) {
  try {
    localStorage.setItem(`draftroom:${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
