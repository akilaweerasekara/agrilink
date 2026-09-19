import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Phone, Star } from "lucide-react";
import { api } from "../services/api.js";
import { SkeletonGrid } from "./Skeleton.jsx";

const money = (n) => `LKR ${Math.round(n).toLocaleString()}`;

const statusStyle = {
  open: "bg-forest-50 text-forest-600",
  fulfilled: "bg-forest-600 text-white",
  cancelled: "bg-ink-900/5 text-ink-400",
  expired: "bg-ink-900/5 text-ink-400",
};

const offerStyle = {
  offered: "bg-clay-50 text-clay-600",
  accepted: "bg-forest-50 text-forest-600",
  declined: "bg-ink-900/5 text-ink-400",
  withdrawn: "bg-ink-900/5 text-ink-400",
};

function tomorrow(days = 7) {
  const d = new Date(Date.now() + days * 864e5);
  return d.toISOString().slice(0, 10);
}

const EMPTY_FORM = { cropType: "", quantityKg: "", maxPricePerKg: "", neededBy: tomorrow(), district: "", note: "" };

export default function DemandBoardSection({ showToast }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyOffer, setBusyOffer] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await api.getMyDemandRequests();
    setRequests(result.success ? result.data : []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleCreate(e) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await api.createDemandRequest({
      cropType: form.cropType.trim(),
      quantityKg: Number(form.quantityKg),
      maxPricePerKg: Number(form.maxPricePerKg),
      // Needed by the END of the chosen day.
      neededBy: new Date(`${form.neededBy}T23:59:00`).toISOString(),
      district: form.district.trim(),
      note: form.note.trim(),
    });
    setIsSubmitting(false);
    if (result.success) {
      showToast(`Request posted: ${form.quantityKg} kg of ${form.cropType}. Farmers can now send offers.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } else {
      showToast(result.message || "Could not post the request.", "error");
    }
  }

  async function handleOffer(request, offer, action) {
    setBusyOffer(offer._id);
    const result = await api.respondToOffer(request._id, offer._id, action);
    setBusyOffer(null);
    if (result.success) {
      showToast(result.message || (action === "accept" ? "Offer accepted." : "Offer declined."));
      load();
    } else {
      showToast(result.message || "Could not update the offer.", "error");
    }
  }

  async function handleCancel(request) {
    if (!confirm(`Cancel your request for ${request.cropType}?`)) return;
    const result = await api.cancelDemandRequest(request._id);
    if (result.success) {
      showToast("Request cancelled.");
      load();
    } else {
      showToast(result.message || "Could not cancel.", "error");
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white text-sm";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink-900">Demand Board</h2>
          <p className="text-sm text-ink-400 mt-1 max-w-xl">
            Tell farmers what you need before they harvest. Post a request with your maximum price; farmers send offers and you choose
            which to accept.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 bg-forest-600 hover:bg-forest-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} /> {showForm ? "Close" : "Post a request"}
        </motion.button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-forest-100 p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm text-ink-700">
            Crop
            <input required value={form.cropType} onChange={set("cropType")} placeholder="e.g. Beans (Bush)" className={`${inputClass} mt-1`} />
          </label>
          <label className="text-sm text-ink-700">
            Quantity needed (kg)
            <input required type="number" min="1" value={form.quantityKg} onChange={set("quantityKg")} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-sm text-ink-700">
            Maximum price (LKR per kg)
            <input required type="number" min="1" value={form.maxPricePerKg} onChange={set("maxPricePerKg")} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-sm text-ink-700">
            Needed by
            <input required type="date" min={tomorrow(1)} value={form.neededBy} onChange={set("neededBy")} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-sm text-ink-700">
            Delivery district (optional)
            <input value={form.district} onChange={set("district")} placeholder="Leave empty for any district" className={`${inputClass} mt-1`} />
          </label>
          <label className="text-sm text-ink-700">
            Note (optional)
            <input value={form.note} onChange={set("note")} maxLength={300} placeholder="Grade, packaging, delivery…" className={`${inputClass} mt-1`} />
          </label>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-forest-600 hover:bg-forest-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Posting…" : "Post request"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <SkeletonGrid count={2} />
      ) : requests.length === 0 ? (
        <div className="text-center py-20 text-ink-400">You haven't posted any requests yet.</div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r._id} className="bg-white rounded-xl border border-forest-100 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink-900">{r.cropType}</h3>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Needed by {new Date(r.neededBy).toLocaleDateString()} · {r.district || "Any district"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${statusStyle[r.status] || "bg-ink-900/5"}`}>
                    {r.status}
                  </span>
                  {r.status === "open" && (
                    <button onClick={() => handleCancel(r)} className="text-xs text-clay-600 hover:underline">
                      Cancel request
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 my-4 text-sm">
                <div className="bg-forest-50 rounded-lg p-3">
                  <p className="font-mono font-semibold text-ink-900">{r.fulfilledKg} / {r.quantityKg} kg</p>
                  <p className="text-xs text-ink-400">Covered so far</p>
                </div>
                <div className="bg-forest-50 rounded-lg p-3">
                  <p className="font-mono font-semibold text-ink-900">{money(r.maxPricePerKg)}/kg</p>
                  <p className="text-xs text-ink-400">Your maximum</p>
                </div>
                <div className="bg-forest-50 rounded-lg p-3">
                  <p className="font-mono font-semibold text-ink-900">{r.offers.length}</p>
                  <p className="text-xs text-ink-400">Offers received</p>
                </div>
              </div>
              {r.note && <p className="text-xs text-ink-400 mb-3">Note: {r.note}</p>}

              {r.offers.length === 0 ? (
                <p className="text-sm text-ink-400">No offers yet. Farmers will see your request in their app.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink-400 border-b border-forest-50">
                      <th className="py-2 font-medium">Farmer</th>
                      <th className="py-2 font-medium">Offer</th>
                      <th className="py-2 font-medium">Status</th>
                      <th className="py-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.offers.map((o) => (
                      <tr key={o._id} className="border-b border-forest-50/60 align-top">
                        <td className="py-3">
                          <p className="font-medium">{o.farmerName}</p>
                          <p className="text-xs text-ink-400">
                            {o.district || "—"}
                            {o.creditScore ? (
                              <span className="inline-flex items-center gap-0.5 ml-2 text-forest-600">
                                <Star size={10} /> score {o.creditScore}
                              </span>
                            ) : null}
                          </p>
                        </td>
                        <td className="py-3">
                          <p className="font-mono">
                            {o.quantityKg} kg @ {money(o.pricePerKg)}
                          </p>
                          {o.message && <p className="text-xs text-ink-400 mt-0.5 max-w-xs">“{o.message}”</p>}
                          {o.status === "accepted" && o.farmerPhone && (
                            <p className="flex items-center gap-1 text-xs text-forest-600 mt-1">
                              <Phone size={11} /> {o.farmerPhone} · accepted {o.acceptedKg} kg
                            </p>
                          )}
                        </td>
                        <td className="py-3">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${offerStyle[o.status] || ""}`}>{o.status}</span>
                        </td>
                        <td className="py-3 text-right">
                          {o.status === "offered" && r.status === "open" && (
                            <div className="flex gap-2 justify-end">
                              <button
                                disabled={busyOffer === o._id}
                                onClick={() => handleOffer(r, o, "accept")}
                                className="bg-forest-600 hover:bg-forest-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
                              >
                                Accept
                              </button>
                              <button
                                disabled={busyOffer === o._id}
                                onClick={() => handleOffer(r, o, "decline")}
                                className="border border-clay-500 text-clay-600 hover:bg-clay-50 text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
