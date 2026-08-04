// Points to the permanently hosted backend on Vercel — same live backend
// the farmer mobile app uses (see agrilink_mobile/lib/services/api_service.dart).
// If you're doing local backend development and want this portal to hit
// your own machine instead, comment the line below out and uncomment the
// localhost one — just remember to switch it back before deploying/demoing.
export const BASE_URL = "https://agrilink-backend.vercel.app/api";
// export const BASE_URL = "http://localhost:5000/api";

async function handleResponse(response) {
  try {
    return await response.json();
  } catch {
    return { success: false, message: `Server returned status ${response.status}.` };
  }
}

function authHeaders(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export const api = {
  async register({ fullName, email, phone, password }) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, phone, password, role: "admin" }),
    });
    return handleResponse(response);
  },

  async login({ email, password }) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async getMetrics(token) {
    const response = await fetch(`${BASE_URL}/admin/metrics`, { headers: authHeaders(token) });
    return handleResponse(response);
  },

  async getAllListings() {
    const response = await fetch(`${BASE_URL}/marketplace/listings`);
    return handleResponse(response);
  },

  async getAds() {
    const response = await fetch(`${BASE_URL}/ads`);
    return handleResponse(response);
  },

  async createAd(token, adData) {
    const response = await fetch(`${BASE_URL}/ads`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(adData),
    });
    return handleResponse(response);
  },

  async updateAd(token, id, updates) {
    const response = await fetch(`${BASE_URL}/ads/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  async deleteAd(token, id) {
    const response = await fetch(`${BASE_URL}/ads/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return handleResponse(response);
  },
};
