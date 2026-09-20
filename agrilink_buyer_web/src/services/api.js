// Points to the permanently hosted backend on Vercel — same live backend
// the farmer mobile app uses (see agrilink_mobile/lib/services/api_service.dart).
// If you're doing local backend development and want this portal to hit
// your own machine instead, comment the line below out and uncomment the
// localhost one — just remember to switch it back before deploying/demoing.
export const BASE_URL = "https://agrilink-backend.vercel.app/api";
// export const BASE_URL = "http://localhost:5000/api";

import { auth } from "./auth.js";

// Every request carries the login token automatically (the server now requires it).
const _nativeFetch = window.fetch.bind(window);
function fetch(url, options = {}) {
  const token = auth.getSession()?.token;
  const headers = { ...(options.headers || {}) };
  if (token && !headers.Authorization && !/\/auth\/(login|register)/.test(String(url))) headers.Authorization = `Bearer ${token}`;
  return _nativeFetch(url, { ...options, headers });
}

// The newer endpoints (group lots, buyer requests) identify the buyer from
// their login token — never from anything typed into the request body.
function authHeaders(json = false) {
  const token = auth.getSession()?.token;
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(response) {
  try {
    return await response.json();
  } catch {
    return { success: false, message: `Server returned status ${response.status}.` };
  }
}

export const api = {
  async register({ fullName, email, phone, password, companyName, buyerType }) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        password,
        role: "buyer",
        buyerProfile: { companyName, buyerType },
      }),
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

  async getListings({ tier, cropType, status, orderedBy } = {}) {
    const params = new URLSearchParams();
    if (tier) params.set("tier", tier);
    if (cropType) params.set("cropType", cropType);
    if (status) params.set("status", status);
    if (orderedBy) params.set("orderedBy", orderedBy);
    const response = await fetch(`${BASE_URL}/marketplace/listings?${params.toString()}`);
    return handleResponse(response);
  },

  // ---- Orders (new flow): the server knows who you are from the login token ----
  async placeOrder(listingId) {
    const response = await fetch(`${BASE_URL}/orders`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ listingId }) });
    return handleResponse(response);
  },
  async myOrders() {
    return handleResponse(await fetch(`${BASE_URL}/orders/mine`, { headers: authHeaders() }));
  },
  async payOrder(id, method) {
    return handleResponse(await fetch(`${BASE_URL}/orders/${id}/pay`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ method }) }));
  },
  async newDeliveryCode(id) {
    return handleResponse(await fetch(`${BASE_URL}/orders/${id}/new-code`, { method: "POST", headers: authHeaders(true), body: "{}" }));
  },
  async cancelOrder(id, reason, qualityRejected = false) {
    return handleResponse(await fetch(`${BASE_URL}/orders/${id}/cancel`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ reason, qualityRejected }) }));
  },
  async rateOrder(orderId, stars, tags, comment) {
    return handleResponse(await fetch(`${BASE_URL}/ratings`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ orderId, stars, tags, comment }) }));
  },
  async trustBatch(ids) {
    return handleResponse(await fetch(`${BASE_URL}/ratings/trust`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ ids }) }));
  },

  async confirmOrder(listingId, buyerId) {
    const response = await fetch(`${BASE_URL}/marketplace/listings/${listingId}/confirm-order`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerId }),
    });
    return handleResponse(response);
  },

  async rejectListing(listingId, { rejectedBy, reason, defectType }) {
    const response = await fetch(`${BASE_URL}/marketplace/listings/${listingId}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectedBy, reason, defectType }),
    });
    return handleResponse(response);
  },

  // Marks a reserved order as actually completed (paid/received). Was
  // missing entirely before — a reserved order had no way to ever become
  // "sold" from the buyer's side, which is one of two reasons AI price
  // prediction was stuck at a flat baseline (see backend
  // pricePredictionEngine.js and marketplaceController.completeSale).
  async completeSale(listingId, confirmedByUserId) {
    const response = await fetch(`${BASE_URL}/marketplace/listings/${listingId}/complete-sale`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmedBy: confirmedByUserId }),
    });
    return handleResponse(response);
  },

  async getPricePrediction(cropType) {
    const response = await fetch(`${BASE_URL}/price-predict/${encodeURIComponent(cropType)}`);
    return handleResponse(response);
  },

  async getCampaigns({ status, cropType } = {}) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (cropType) params.set("cropType", cropType);
    const response = await fetch(`${BASE_URL}/crowdfunding/campaigns?${params.toString()}`);
    return handleResponse(response);
  },

  async pledgeToCampaign(campaignId, { investor, amountLkr }) {
    const response = await fetch(`${BASE_URL}/crowdfunding/campaigns/${campaignId}/pledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ investor, amountLkr }),
    });
    return handleResponse(response);
  },

  async getMyInvestments(investorId) {
    const response = await fetch(`${BASE_URL}/crowdfunding/investments?investorId=${investorId}`);
    return handleResponse(response);
  },

  // ---------- Group lots (bulk buying from pooled farmers) ----------
  async getGroupLots({ status, claimedByMe } = {}) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (claimedByMe) params.set("claimedByMe", "true");
    const response = await fetch(`${BASE_URL}/group-lots?${params.toString()}`, { headers: authHeaders() });
    return handleResponse(response);
  },

  async claimGroupLot(lotId) {
    const response = await fetch(`${BASE_URL}/group-lots/${lotId}/claim`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({}),
    });
    return handleResponse(response);
  },

  // ---------- Demand board (buyer requests) ----------
  async getMyDemandRequests() {
    const response = await fetch(`${BASE_URL}/demand?mine=true`, { headers: authHeaders() });
    return handleResponse(response);
  },

  async createDemandRequest({ cropType, quantityKg, maxPricePerKg, neededBy, district, note }) {
    const response = await fetch(`${BASE_URL}/demand`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ cropType, quantityKg, maxPricePerKg, neededBy, district, note }),
    });
    return handleResponse(response);
  },

  async respondToOffer(requestId, offerId, action) {
    // action is "accept" or "decline"
    const response = await fetch(`${BASE_URL}/demand/${requestId}/offers/${offerId}/${action}`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({}),
    });
    return handleResponse(response);
  },

  async cancelDemandRequest(requestId) {
    const response = await fetch(`${BASE_URL}/demand/${requestId}/cancel`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({}),
    });
    return handleResponse(response);
  },

  // ---- generic call + private photos (payment QR, order photos) ----
  async call(token, method, path, body) {
    const r = await fetch(`${BASE_URL}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
    try { return await r.json(); } catch { return { success: false, message: `Server returned status ${r.status}.` }; }
  },
  async photoBlobUrl(token, id) {
    const r = await fetch(`${BASE_URL}/photos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    return r.ok ? URL.createObjectURL(await r.blob()) : null;
  },
};
