import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, TrendingUp } from "lucide-react";
import { api } from "../services/api.js";
import PledgeModal from "./PledgeModal.jsx";
import { SkeletonGrid } from "./Skeleton.jsx";
import { staggerContainer, fadeSlideUp } from "../motion/variants.js";

export default function InvestSection({ buyerId, showToast }) {
  const [view, setView] = useState("browse");
  const [campaigns, setCampaigns] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pledgeTarget, setPledgeTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBrowse = useCallback(async () => {
    setIsLoading(true);
    const result = await api.getCampaigns({ status: "open" });
    setCampaigns(result.success ? result.data : []);
    setIsLoading(false);
  }, []);

  const loadMine = useCallback(async () => {
    setIsLoading(true);
    const result = await api.getMyInvestments(buyerId);
    setMyInvestments(result.success ? result.data : []);
    setIsLoading(false);
  }, [buyerId]);

  useEffect(() => {
    if (view === "browse") loadBrowse();
    else loadMine();
  }, [view, loadBrowse, loadMine]);

  async function handlePledge(amount) {
    setIsSubmitting(true);
    const result = await api.pledgeToCampaign(pledgeTarget._id, { investor: buyerId, amountLkr: amount });
    setIsSubmitting(false);
    setPledgeTarget(null);
    if (result.success) {
      showToast(`Pledged LKR ${amount.toLocaleString()} to ${pledgeTarget.cropType} campaign.`);
      loadBrowse();
    } else {
      showToast(result.message || "Pledge failed.", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink-900">Invest in Crops</h2>
          <p className="text-sm text-ink-400 mt-1">
            Sponsor a farmer's up-front seed and input costs. Get repaid with a return once their harvest sells.
          </p>
        </div>
        <div className="flex gap-2 bg-forest-50 rounded-lg p-1">
          <button
            onClick={() => setView("browse")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === "browse" ? "bg-white shadow-sm text-forest-600" : "text-ink-400"
            }`}
          >
            Browse Campaigns
          </button>
          <button
            onClick={() => setView("mine")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === "mine" ? "bg-white shadow-sm text-forest-600" : "text-ink-400"
            }`}
          >
            My Investments
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonGrid count={3} />
      ) : view === "browse" ? (
        campaigns.length === 0 ? (
          <div className="text-center py-20 text-ink-400">No open funding campaigns right now.</div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((c) => {
              const progress = Math.min((c.amountRaisedLkr / c.fundingGoalLkr) * 100, 100);
              return (
                <motion.div
                  key={c._id}
                  variants={fadeSlideUp}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-xl border border-forest-100 p-5 hover:shadow-lg hover:border-forest-200 transition-shadow"
                >
                  <h3 className="font-display text-lg font-semibold text-ink-900">{c.cropType}</h3>
                  <p className="text-xs text-ink-400 mb-3 flex items-center gap-1">
                    <MapPin size={11} />
                    {c.farmer?.fullName} · {c.farmer?.farmerProfile?.district || "Sri Lanka"}
                  </p>
                  <p className="text-sm text-ink-700 mb-4 line-clamp-3">{c.description}</p>

                  <div className="w-full bg-forest-50 rounded-full h-2 mb-2 overflow-hidden">
                    <motion.div
                      className="bg-forest-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-ink-400 mb-4">
                    <span>LKR {c.amountRaisedLkr.toLocaleString()} raised</span>
                    <span>of LKR {c.fundingGoalLkr.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="flex items-center gap-1 text-xs bg-forest-50 text-forest-600 px-2 py-1 rounded-full font-medium">
                      <TrendingUp size={11} />
                      {c.returnPercentage}% return
                    </span>
                    <span className="flex items-center gap-1 text-xs text-ink-400">
                      <Calendar size={11} />
                      {new Date(c.deadline).toLocaleDateString()}
                    </span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPledgeTarget(c)}
                    className="w-full bg-forest-600 hover:bg-forest-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    Sponsor This Crop
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        )
      ) : myInvestments.length === 0 ? (
        <div className="text-center py-20 text-ink-400">You haven't sponsored any crops yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-forest-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-400 border-b border-forest-50 bg-forest-50/50">
                <th className="px-5 py-3 font-medium">Crop</th>
                <th className="px-5 py-3 font-medium">Farmer</th>
                <th className="px-5 py-3 font-medium">Pledged</th>
                <th className="px-5 py-3 font-medium">Expected Return</th>
                <th className="px-5 py-3 font-medium">Campaign Status</th>
                <th className="px-5 py-3 font-medium">Pledge Status</th>
              </tr>
            </thead>
            <tbody>
              {myInvestments.map((inv, i) => (
                <tr key={i} className="border-b border-forest-50/60">
                  <td className="px-5 py-3 font-medium">{inv.cropType}</td>
                  <td className="px-5 py-3 text-ink-400">{inv.farmerName}</td>
                  <td className="px-5 py-3 font-mono">LKR {inv.amountLkr.toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-forest-600">LKR {inv.expectedReturnLkr.toLocaleString()}</td>
                  <td className="px-5 py-3 capitalize">{inv.campaignStatus}</td>
                  <td className="px-5 py-3 capitalize">{inv.pledgeStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PledgeModal
        campaign={pledgeTarget}
        onClose={() => setPledgeTarget(null)}
        onConfirm={handlePledge}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
