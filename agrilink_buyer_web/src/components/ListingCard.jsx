import { motion } from "framer-motion";
import { MapPin, Calendar, Sparkles } from "lucide-react";
import { fadeSlideUp } from "../motion/variants.js";

export default function ListingCard({ listing, onOrder, onReject, actionsDisabled }) {
  const isSecondary = listing.tier === "secondary";
  const statusColors = {
    listed: "bg-forest-50 text-forest-600",
    reserved: "bg-clay-50 text-clay-600",
    sold: "bg-ink-900/5 text-ink-400",
  };

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
              LKR {listing.currentPricePerKg}
              <span className="text-sm font-normal text-ink-400">/kg</span>
            </p>
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
      </div>
    </motion.div>
  );
}
