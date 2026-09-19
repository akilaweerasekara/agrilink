import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, Clock, Phone, PackageCheck } from "lucide-react";
import { api } from "../services/api.js";
import { SkeletonGrid } from "./Skeleton.jsx";
import { staggerContainer, fadeSlideUp } from "../motion/variants.js";

function closesIn(iso) {
  const hours = (new Date(iso).getTime() - Date.now()) / 36e5;
  if (hours <= 0) return "Closed";
  const days = Math.ceil(hours / 24);
  return days <= 1 ? "Closes today" : `Closes in ${days} days`;
}

const money = (n) => `LKR ${Math.round(n).toLocaleString()}`;

export default function BulkLotsSection({ showToast }) {
  const [view, setView] = useState("browse");
  const [lots, setLots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [claimResult, setClaimResult] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result =
      view === "browse"
        ? await api.getGroupLots()
        : await api.getGroupLots({ status: "claimed", claimedByMe: true });
    setLots(result.success ? result.data : []);
    setIsLoading(false);
  }, [view]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleClaim(lot) {
    if (!confirm(`Claim the whole ${lot.targetKg} kg ${lot.cropType} lot at LKR ${lot.pricePerKg}/kg (${money(lot.totalValueLkr)})?`)) return;
    setClaimingId(lot._id);
    const result = await api.claimGroupLot(lot._id);
    setClaimingId(null);
    if (result.success) {
      setClaimResult(result.data);
      showToast(`Lot claimed: ${lot.targetKg} kg of ${lot.cropType}.`);
      load();
    } else {
      showToast(result.message || "Could not claim this lot.", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink-900">Group Lots</h2>
          <p className="text-sm text-ink-400 mt-1 max-w-xl">
            Small farmers pool their harvest into one bulk lot. Once a lot is full you can claim the whole quantity in one step — one
            price, one pickup, one contact person.
          </p>
        </div>
        <div className="flex gap-2 bg-forest-50 rounded-lg p-1">
          {[
            ["browse", "Available Lots"],
            ["claimed", "My Claims"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === id ? "bg-white shadow-sm text-forest-600" : "text-ink-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {claimResult && (
        <div className="bg-forest-50 border border-forest-100 rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-lg font-semibold text-ink-900">
                You claimed {claimResult.targetKg} kg of {claimResult.cropType}
              </p>
              <p className="text-sm text-ink-700 mt-1">
                Total {money(claimResult.totalValueLkr)}. Contact the organiser to arrange collection and payment. Each farmer is paid for
                the kg they contributed.
              </p>
              {claimResult.organizerPhone && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-forest-600 mt-2">
                  <Phone size={14} /> Organiser ({claimResult.organizer}): {claimResult.organizerPhone}
                </p>
              )}
              {claimResult.pickupNote && <p className="text-xs text-ink-400 mt-1">Pickup: {claimResult.pickupNote}</p>}
            </div>
            <button onClick={() => setClaimResult(null)} className="text-xs text-ink-400 hover:text-ink-700">
              Dismiss
            </button>
          </div>
          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="text-left text-ink-400">
                <th className="py-1 font-medium">Farmer</th>
                <th className="py-1 font-medium">Contributed</th>
                <th className="py-1 font-medium">Share of payment</th>
              </tr>
            </thead>
            <tbody>
              {claimResult.shares.map((s, i) => (
                <tr key={i} className="border-t border-forest-100">
                  <td className="py-1.5">{s.name}</td>
                  <td className="py-1.5 font-mono">{s.quantityKg} kg</td>
                  <td className="py-1.5 font-mono text-forest-600">{money(s.amountLkr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isLoading ? (
        <SkeletonGrid count={3} />
      ) : lots.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          {view === "browse" ? "No group lots are open right now." : "You haven't claimed any lots yet."}
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lots.map((lot) => (
            <motion.div
              key={lot._id}
              variants={fadeSlideUp}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl border border-forest-100 p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-display text-lg font-semibold text-ink-900">{lot.cropType}</h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${
                    lot.status === "full" ? "bg-clay-50 text-clay-600" : lot.status === "claimed" ? "bg-ink-900/5 text-ink-400" : "bg-forest-50 text-forest-600"
                  }`}
                >
                  {lot.status === "full" ? "Full · ready" : lot.status}
                </span>
              </div>
              <p className="text-xs text-ink-400 mb-4 flex items-center gap-1">
                <MapPin size={11} /> {lot.district} · organised by {lot.organizer}
              </p>

              <p className="font-mono text-2xl font-semibold text-ink-900">
                LKR {lot.pricePerKg}
                <span className="text-sm font-normal text-ink-400">/kg</span>
              </p>
              <p className="text-xs text-ink-400 mb-3 font-mono">Whole lot: {money(lot.totalValueLkr)}</p>

              <div className="w-full bg-forest-50 rounded-full h-2 mb-2 overflow-hidden">
                <motion.div
                  className={`h-2 rounded-full ${lot.status === "full" ? "bg-clay-500" : "bg-forest-600"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${lot.progressPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-ink-400 mb-4">
                <span>
                  {lot.committedKg} / {lot.targetKg} kg
                </span>
                <span className="flex items-center gap-1">
                  <Users size={11} /> {lot.memberCount} farmer{lot.memberCount === 1 ? "" : "s"}
                </span>
              </div>

              {lot.status === "open" && (
                <p className="flex items-center gap-1 text-xs text-ink-400 mb-3">
                  <Clock size={11} /> {closesIn(lot.closesAt)} · {lot.remainingKg} kg still needed
                </p>
              )}
              {lot.pickupNote && <p className="text-xs text-ink-400 mb-3">Pickup: {lot.pickupNote}</p>}

              {lot.status === "full" ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleClaim(lot)}
                  disabled={claimingId === lot._id}
                  className="w-full flex items-center justify-center gap-1.5 bg-forest-600 hover:bg-forest-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <PackageCheck size={15} />
                  {claimingId === lot._id ? "Claiming…" : "Claim this lot"}
                </motion.button>
              ) : lot.status === "open" ? (
                <p className="text-xs text-ink-400 text-center py-2 bg-forest-50 rounded-lg">Waiting for farmers to fill the lot</p>
              ) : null}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
