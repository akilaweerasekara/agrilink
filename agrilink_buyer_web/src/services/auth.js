const SESSION_KEY = "agrilink_buyer_session";

export const auth = {
  saveSession({ token, user }) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
  },

  getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return auth.getSession() !== null;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
};
