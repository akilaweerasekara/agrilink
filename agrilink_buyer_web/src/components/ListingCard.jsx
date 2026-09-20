import { motion } from "framer-motion";
import { MapPin, Calendar, Sparkles, PackageCheck, Timer } from "lucide-react";
import { fadeSlideUp } from "../motion/variants.js";

const BADGE = { top: ["Top rated", "bg-clay-50 text-clay-600"], trusted: ["Trusted", "bg-forest-50 text-forest-600"], rising: ["Rising", "bg-ink-900/5 text-ink-700"], new: ["New seller", "bg-ink-900/5 text-ink-400"] };

export default function ListingCard({ listing, onOrder, onReject, onCompleteSale, actionsDisabled, trust }) {
  const isSecondary = listing.tier === "secondary";
  const statusColors = {
    listed: "bg-forest-50 text-forest-600",
    reserved: "bg-clay-50 text-clay-600",
    sold: "bg-ink-900/5 text-ink-400",
  };

  // FRESHNESS CLOCK: the server sends how fresh the produce is right now and
  // the live price that results (the price eases down as freshness runs out).
  const fresh = listing.freshness;
  const livePrice = fresh && listing.status === "listed" ? fresh.effectivePricePerKg : listing.currentPricePerKg;
  const priceEased = fresh && listing.status === "listed" && livePrice < listing.currentPricePerKg - 0.05;
  const freshStyles = {
    fresh: "bg-forest-50 text-forest-600",
    aging: "bg-clay-50 text-clay-600",
    urgent: "bg-clay-100 text-clay-600",
    expired: "bg-clay-100 text-clay-600",
    not_harvested: "bg-ink-900/5 text-ink-700",
  };
  const freshText = !fresh
    ? null
    : fresh.label === "not_harvested"
    ? `Harvest in ${fresh.daysUntilHarvest} day${fresh.daysUntilHarvest === 1 ? "" : "s"}`
    : fresh.label === "expired"
    ? "Freshness window ended"
    : `${fresh.label === "fresh" ? "Fresh" : fresh.label === "aging" ? "Ageing" : "Sell soon"} · ${fresh.daysLeft} day${fresh.daysLeft === 1 ? "" : "s"} left`;

  return (
    <motion.div
      variants={fadeSlideUp}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="bg-white rounded-xl border border-forest-100 overflow-hidden hover:shadow-lg hover:border-forest-200 transition-shadow"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900">{listing.cropType}</h3>
            <p className="text-xs text-ink-400 mt-0.5 flex items-center gap-1">
              <MapPin size={11} />
              {listing.farmer?.fullName || "Farmer"} · {listing.farmer?.farmerProfile?.district || "Sri Lanka"}
              {trust && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full font-semibold ${(BADGE[trust.badge] || BADGE.new)[1]}`}>
                  {trust.ratingCount > 0 ? `${trust.average}★ · ` : ""}{(BADGE[trust.badge] || BADGE.new)[0]}
                </span>
              )}
            </p>
          </div>
          <span
            className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${
              isSecondary ? "bg-clay-50 text-clay-600" : "bg-forest-50 text-forest-600"
            }`}
          >
            {isSecondary && <Sparkles size={10} />}
            {isSecondary ? "Flash Sale" : "Primary"}
          </span>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="font-mono text-2xl font-semibold text-ink-900">
              LKR {livePrice}
              <span className="text-sm font-normal text-ink-400">/kg</span>
            </p>
            {priceEased && (
              <p className="text-xs text-ink-400 font-mono mt-0.5">
                <span className="line-through">LKR {listing.currentPricePerKg}</span> · eases with freshness
              </p>
            )}
            {listing.markdownPercentApplied > 0 && (
              <p className="text-xs text-clay-500 font-mono mt-0.5">
                {listing.markdownPercentApplied}% off original LKR {listing.originalPricePerKg}/kg
              </p>
            )}
          </div>
          <p className="font-mono text-sm text-ink-700">{listing.quantityKg} kg</p>
        </div>

        <div className="flex items-center justify-between text-xs text-ink-400 mb-4">
          <span>Grade {listing.qualityGrade}</span>
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {new Date(listing.harvestDate).toLocaleDateString()}
          </span>
          <span className={`px-2 py-0.5 rounded-full font-medium ${statusColors[listing.status] || "bg-ink-900/5"}`}>
            {listing.status}
          </span>
        </div>

        {fresh && freshText && listing.status === "listed" && (
          <div className="mb-4">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${freshStyles[fresh.label] || "bg-ink-900/5"}`}
            >
              <Timer size={12} />
              {freshText}
            </span>
            {fresh.label !== "not_harvested" && (
              <div className="w-full bg-forest-50 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${fresh.label === "fresh" ? "bg-forest-600" : "bg-clay-500"}`}
                  style={{ width: `${fresh.percentRemaining}%` }}
                />
              </div>
            )}
          </div>
        )}

        {listing.status === "listed" && (
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onOrder(listing)}
              disabled={actionsDisabled}
              className="flex-1 bg-forest-600 hover:bg-forest-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Confirm Order
            </motion.button>
            {!isSecondary && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onReject(listing)}
                disabled={actionsDisabled}
                className="flex-1 border border-clay-500 text-clay-600 hover:bg-clay-50 text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Reject
              </motion.button>
            )}
          </div>
        )}

        {listing.status === "reserved" && onCompleteSale && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onCompleteSale(listing)}
            disabled={actionsDisabled}
            className="w-full flex items-center justify-center gap-1.5 bg-forest-600 hover:bg-forest-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <PackageCheck size={15} />
            Mark Order Complete
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
