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
};
