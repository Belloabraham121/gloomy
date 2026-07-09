const SESSION_STORAGE_KEY = "gloomy.sessionId";

/** No auth (see root README's session-vs-account discussion) - just an id
 * kept in localStorage so apps/api can group progress rows. apps/api
 * creates one server-side on first use if this is null. */
export function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

export function storeSessionId(sessionId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
}
