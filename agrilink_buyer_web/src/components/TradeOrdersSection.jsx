import { useState, useEffect, useCallback } from "react";
import { PackageCheck, Truck, Phone } from "lucide-react";
import RejectModal from "./RejectModal.jsx";
import { api } from "../services/api.js";
import { auth } from "../services/auth.js";

const STEPS = ["placed", "accepted", "dispatched", "delivered", "paid"];
const STEP_LABEL = { placed: "Ordered", accepted: "Accepted", dispatched: "On the way", delivered: "Delivered", paid: "Paid", cancelled: "Cancelled" };
const TAGS = { on_time: "On time", good_quality: "Good quality", fair_price: "Fair price", honest_weight: "Honest weight", easy_to_deal_with: "Easy to deal with", paid_promptly: "Paid promptly", late: "Late", poor_quality: "Poor quality", hard_to_reach: "Hard to reach" };
const BADGE = { top: "Top rated", trusted: "Trusted", rising: "Rising", new: "New seller" };

function RatingBox({ order, onDone, showToast }) {
  const [stars, setStars] = useState(5);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState("");
  async function submit() {
    const r = await api.rateOrder(order.id, stars, tags, comment);
    if (r.success) { showToast("Thanks for rating!"); onDone(); } else showToast(r.message || "Could not save the rating.", "error");
  }
  return (
    <div className="mt-3 rounded-lg bg-forest-50/50 p-3">
      <p className="text-sm font-medium text-ink-900 mb-2">Rate {order.other.name}</p>
      <div className="flex gap-1 mb-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setStars(n)} className={`text-2xl ${n <= stars ? "text-amber-500" : "text-ink-400/40"}`}>★</button>)}</div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {Object.entries(TAGS).map(([k, label]) => (
          <button key={k} onClick={() => setTags(tags.includes(k) ? tags.filter((t) => t !== k) : [...tags, k])} className={`text-xs px-2.5 py-1 rounded-full border ${tags.includes(k) ? "bg-forest-600 text-white border-forest-600" : "border-forest-100 text-ink-700"}`}>{label}</button>
        ))}
      </div>
      <input value={comment} maxLength={200} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment (no phone numbers)" className="w-full px-3 py-2 rounded-lg border border-forest-100 text-sm mb-2" />
      <button onClick={submit} className="bg-forest-600 hover:bg-forest-700 text-white text-sm px-4 py-2 rounded-lg">Submit rating</button>
    </div>
  );
}

export default function TradeOrdersSection({ showToast }) {
  const buyerId = auth.getSession()?.user?.id;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await api.myOrders();
    setOrders(r.success ? r.data : []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  async function run(fn, okText) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r.success) { if (okText) showToast(okText); load(); } else showToast(r.message || "Something went wrong.", "error");
  }

  // Refusing goods with a quality problem keeps the flash-sale redirect: the produce moves to the secondary market at a markdown.
  async function rejectForQuality({ reason, defectType }) {
    const order = rejecting;
    setRejecting(null);
    setBusy(true);
    const moved = await api.rejectListing(order.listingId, { rejectedBy: buyerId, reason, defectType });
    if (!moved.success) { setBusy(false); return showToast(moved.message || "Could not reject the produce.", "error"); }
    await api.cancelOrder(order.id, reason, true);
    setBusy(false);
    showToast("Refused. The produce moved to the flash-sale market and the order is closed.");
    load();
  }

  if (loading) return <p className="text-ink-400">Loading your orders…</p>;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink-900">My Orders</h2>
      <p className="text-sm text-ink-400 mt-1 mb-6">Track each order. When the goods are on the way you'll get a 4-digit delivery code — give it to the driver only after you have received and checked the produce.</p>
      {orders.length === 0 && <div className="text-center py-20 text-ink-400">No orders yet. Browse the marketplace and press Order.</div>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {orders.map((o) => {
          const idx = STEPS.indexOf(o.status);
          return (
            <div key={o.id} className="bg-white rounded-xl border border-forest-100 p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink-900">{o.cropType} · {o.quantityKg} kg</h3>
                  <p className="font-mono text-sm text-ink-700">LKR {o.totalLkr.toLocaleString()} <span className="text-ink-400">(LKR {o.pricePerKg}/kg)</span></p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full uppercase ${o.status === "cancelled" ? "bg-clay-50 text-clay-600" : "bg-forest-50 text-forest-600"}`}>{STEP_LABEL[o.status]}</span>
              </div>
              <p className="text-xs text-ink-400 mt-2">
                Farmer: <b className="text-ink-700">{o.other.name}</b>{o.other.district ? ` · ${o.other.district}` : ""}
                {o.other.trust && <span className="ml-1 font-semibold text-forest-600">{o.other.trust.ratingCount > 0 ? `${o.other.trust.average}★ · ` : ""}{BADGE[o.other.trust.badge]}</span>}
              </p>
              {o.other.phone && <a href={`tel:${o.other.phone}`} className="inline-flex items-center gap-1 text-xs text-forest-600 mt-1"><Phone size={12} />{o.other.phone}</a>}

              {o.status !== "cancelled" && (
                <div className="flex items-center gap-1 mt-4">
                  {STEPS.map((s, i) => (<div key={s} className="flex-1"><div className={`h-1.5 rounded ${i <= idx ? "bg-forest-600" : "bg-ink-900/10"}`} /><p className={`text-[10px] mt-1 ${i <= idx ? "text-forest-600" : "text-ink-400"}`}>{STEP_LABEL[s]}</p></div>))}
                </div>
              )}

              {o.status === "dispatched" && o.deliveryCode && (
                <div className="mt-4 rounded-xl bg-forest-50 border border-forest-100 p-4 text-center">
                  <p className="text-xs text-ink-700 flex items-center justify-center gap-1"><Truck size={14} /> Your delivery code</p>
                  <p className="font-mono text-4xl font-bold tracking-[0.3em] text-forest-700 my-2">{o.deliveryCode}</p>
                  <p className="text-[11px] text-ink-400">Give this code only AFTER you have received and checked the goods.</p>
                  {o.delivery.codeLocked && <p className="text-xs text-clay-600 mt-2">Too many wrong codes were tried. Generate a new code below.</p>}
                  <div className="flex gap-2 justify-center mt-3">
                    <button disabled={busy} onClick={() => run(() => api.newDeliveryCode(o.id), "New code created.")} className="text-xs border border-forest-100 rounded-lg px-3 py-1.5">New code</button>
                    <button disabled={busy} onClick={() => setRejecting({ ...o, _id: o.listingId })} className="text-xs border border-clay-100 text-clay-600 rounded-lg px-3 py-1.5">Refuse — quality problem</button>
                  </div>
                </div>
              )}

              {o.status === "delivered" && !o.payment?.buyerMarkedAt && (
                <div className="mt-4 flex gap-2 items-center">
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="px-3 py-2 rounded-lg border border-forest-100 text-sm">
                    <option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="mobile_wallet">Mobile wallet</option>
                  </select>
                  <button disabled={busy} onClick={() => run(() => api.payOrder(o.id, payMethod), "Payment marked. The farmer will confirm.")} className="flex-1 bg-forest-600 hover:bg-forest-700 text-white text-sm py-2 rounded-lg flex items-center justify-center gap-1"><PackageCheck size={15} /> I have paid</button>
                </div>
              )}
              {o.status === "delivered" && o.payment?.buyerMarkedAt && <p className="text-sm text-ink-700 mt-3">Payment marked — waiting for the farmer to confirm.</p>}
              {["placed", "accepted"].includes(o.status) && <button disabled={busy} onClick={() => run(() => api.cancelOrder(o.id, "Cancelled by buyer"), "Order cancelled.")} className="mt-3 text-xs text-clay-600">Cancel order</button>}
              {o.status === "cancelled" && o.cancelReason && <p className="text-xs text-ink-400 mt-3">{o.cancelReason}</p>}
              {o.canRate && <RatingBox order={o} onDone={load} showToast={showToast} />}
              {o.myRating && <p className="text-xs text-amber-600 mt-2">You rated: {"★".repeat(o.myRating)}</p>}
            </div>
          );
        })}
      </div>
      <RejectModal listing={rejecting} onClose={() => setRejecting(null)} onConfirm={rejectForQuality} isSubmitting={busy} />
    </div>
  );
}
