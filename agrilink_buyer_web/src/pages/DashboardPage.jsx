import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Search } from "lucide-react";
import Sidebar from "../components/Sidebar.jsx";
import ListingCard from "../components/ListingCard.jsx";
import RejectModal from "../components/RejectModal.jsx";
import InvestSection from "../components/InvestSection.jsx";
import { SkeletonGrid } from "../components/Skeleton.jsx";
import { staggerContainer, pageTransition } from "../motion/variants.js";
import { api } from "../services/api.js";
import { auth } from "../services/auth.js";

export default function DashboardPage() {
  const navigate = useNavigate();
  const session = auth.getSession();
  const buyerId = session?.user?.id;

  const [activeTab, setActiveTab] = useState("browse");
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cropFilter, setCropFilter] = useState("");
  const [toast, setToast] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionsDisabled, setActionsDisabled] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadListings = useCallback(async () => {
    if (activeTab === "invest") return;
    setIsLoading(true);
    let result;
    if (activeTab === "browse") {
      result = await api.getListings({ tier: "primary", status: "listed", cropType: cropFilter || undefined });
    } else if (activeTab === "secondary") {
      result = await api.getListings({ tier: "secondary", status: "listed", cropType: cropFilter || undefined });
    } else {
      result = await api.getListings({ orderedBy: buyerId });
    }
    setListings(result.success ? result.data : []);
    setIsLoading(false);
  }, [activeTab, cropFilter, buyerId]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  async function handleOrder(listing) {
    setActionsDisabled(true);
    const result = await api.confirmOrder(listing._id, buyerId);
    setActionsDisabled(false);
    if (result.success) {
      showToast(`Order confirmed for ${listing.cropType} (${listing.quantityKg}kg).`);
      loadListings();
    } else {
      showToast(result.message || "Could not confirm order.", "error");
    }
  }

  async function handleRejectConfirm({ reason, defectType }) {
    setActionsDisabled(true);
    const result = await api.rejectListing(rejectTarget._id, { rejectedBy: buyerId, reason, defectType });
    setActionsDisabled(false);
    setRejectTarget(null);
    if (result.success) {
      showToast(`Listing rejected and moved to the secondary market at a markdown.`);
      loadListings();
    } else {
      showToast(result.message || "Could not process rejection.", "error");
    }
  }

  function handleLogout() {
    auth.logout();
    navigate("/login");
  }

  const emptyStateCopy = {
    browse: "No primary listings match this filter yet. New harvests from farmers will appear here.",
    secondary: "No flash-sale listings right now. Items rejected by buyers for minor defects show up here at a discount.",
    orders: "You haven't placed any orders yet. Browse the marketplace to get started.",
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />

      <main className="flex-1 p-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            {activeTab === "invest" ? (
              <InvestSection buyerId={buyerId} showToast={showToast} />
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-ink-900">
                      {activeTab === "browse" && "Browse Marketplace"}
                      {activeTab === "secondary" && "Secondary Market — Flash Sale"}
                      {activeTab === "orders" && "My Orders"}
                    </h2>
                    <p className="text-sm text-ink-400 mt-1">
                      {activeTab === "browse" && "Fresh harvests listed directly by verified farmers."}
                      {activeTab === "secondary" && "Discounted crops redirected here after a primary buyer rejection — great for factories, restaurants, or compost use."}
                      {activeTab === "orders" && "Orders you've confirmed across primary and secondary markets."}
                    </p>
                  </div>

                  {activeTab !== "orders" && (
                    <div className="relative">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                      <input
                        value={cropFilter}
                        onChange={(e) => setCropFilter(e.target.value)}
                        placeholder="Filter by crop type…"
                        className="pl-9 pr-4 py-2 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white text-sm w-64"
                      />
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <SkeletonGrid />
                ) : listings.length === 0 ? (
                  <div className="text-center py-20 text-ink-400 max-w-md mx-auto">{emptyStateCopy[activeTab]}</div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {listings.map((listing) => (
                      <ListingCard
                        key={listing._id}
                        listing={listing}
                        onOrder={handleOrder}
                        onReject={(l) => setRejectTarget(l)}
                        actionsDisabled={actionsDisabled}
                      />
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <RejectModal
        listing={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        isSubmitting={actionsDisabled}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${
              toast.type === "error" ? "bg-clay-600" : "bg-forest-600"
            }`}
          >
            {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
