import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, HandCoins } from "lucide-react";
import { modalBackdrop, modalPanel } from "../motion/variants.js";

export default function PledgeModal({ campaign, onClose, onConfirm, isSubmitting }) {
  const [amount, setAmount] = useState("");

  const remaining = campaign ? campaign.fundingGoalLkr - campaign.amountRaisedLkr : 0;
  const parsedAmount = Number(amount) || 0;
  const expectedReturn = campaign ? Math.round(parsedAmount * (1 + campaign.returnPercentage / 100) * 100) / 100 : 0;

  return (
    <AnimatePresence>
      {campaign && (
        <motion.div
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 px-4"
        >
          <motion.div variants={modalPanel} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-start justify-between mb-1">
              <div className="w-10 h-10 rounded-full bg-forest-50 flex items-center justify-center">
                <HandCoins size={18} className="text-forest-600" />
              </div>
              <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
                <X size={18} />
              </button>
            </div>
            <h3 className="font-display text-xl font-semibold text-ink-900 mb-1 mt-2">
              Sponsor {campaign?.farmer?.fullName}'s {campaign?.cropType} crop
            </h3>
            <p className="text-sm text-ink-400 mb-5">
              LKR {remaining.toLocaleString()} still needed · {campaign?.returnPercentage}% return on repayment
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Amount to pledge (LKR)</label>
              <input
                type="number"
                min="1"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <AnimatePresence>
              {parsedAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 bg-forest-50 rounded-lg px-3 py-2 text-sm text-forest-600 font-mono overflow-hidden"
                >
                  Expected return if repaid: LKR {expectedReturn.toLocaleString()}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border border-forest-100 text-ink-700 font-medium py-2.5 rounded-lg hover:bg-forest-50 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => parsedAmount > 0 && onConfirm(parsedAmount)}
                disabled={isSubmitting || parsedAmount <= 0}
                className="flex-1 bg-forest-600 hover:bg-forest-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Processing…" : "Confirm Pledge"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
