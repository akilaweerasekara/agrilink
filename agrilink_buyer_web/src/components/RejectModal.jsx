import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, PackageX } from "lucide-react";
import { modalBackdrop, modalPanel } from "../motion/variants.js";

const DEFECT_TYPES = [
  { value: "visual_defect", label: "Visual defect" },
  { value: "bruising", label: "Bruising" },
  { value: "size_mismatch", label: "Size mismatch" },
  { value: "underripe", label: "Underripe" },
  { value: "overripe", label: "Overripe" },
  { value: "other", label: "Other" },
];

export default function RejectModal({ listing, onClose, onConfirm, isSubmitting }) {
  const [reason, setReason] = useState("");
  const [defectType, setDefectType] = useState("visual_defect");

  return (
    <AnimatePresence>
      {listing && (
        <motion.div
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 px-4"
        >
          <motion.div variants={modalPanel} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-start justify-between mb-1">
              <div className="w-10 h-10 rounded-full bg-clay-50 flex items-center justify-center">
                <PackageX size={18} className="text-clay-600" />
              </div>
              <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
                <X size={18} />
              </button>
            </div>
            <h3 className="font-display text-xl font-semibold text-ink-900 mb-1 mt-2">Reject listing</h3>
            <p className="text-sm text-ink-400 mb-5">
              {listing?.cropType} — {listing?.quantityKg}kg. Rejecting will automatically move this listing to the
              secondary flash-sale market with a price markdown, instead of discarding it.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Defect type</label>
              <select
                value={defectType}
                onChange={(e) => setDefectType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
              >
                {DEFECT_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
                placeholder="e.g. Minor bruising found on 15% of the batch during inspection"
                className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border border-forest-100 text-ink-700 font-medium py-2.5 rounded-lg hover:bg-forest-50 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => reason.trim() && onConfirm({ reason, defectType })}
                disabled={isSubmitting || !reason.trim()}
                className="flex-1 bg-clay-500 hover:bg-clay-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Processing…" : "Reject & Redirect"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
