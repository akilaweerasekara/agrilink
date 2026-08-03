import { motion } from "framer-motion";
import { Sprout, Tag, Package, HandCoins, LogOut } from "lucide-react";
import { auth } from "../services/auth.js";

const TABS = [
  { id: "browse", label: "Browse Marketplace", icon: Sprout },
  { id: "secondary", label: "Secondary Market", icon: Tag },
  { id: "orders", label: "My Orders", icon: Package },
  { id: "invest", label: "Invest in Crops", icon: HandCoins },
];

export default function Sidebar({ activeTab, onTabChange, onLogout }) {
  const session = auth.getSession();

  return (
    <aside className="w-64 bg-forest-900 text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <Sprout size={18} className="text-white" />
          </div>
          <h1 className="font-display text-xl font-semibold">AgriLink AI</h1>
        </div>
        <p className="text-xs text-forest-100/50 mt-2 tracking-wide uppercase pl-0.5">Buyer Portal</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="buyer-sidebar-active"
                  className="absolute inset-0 bg-forest-600 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon size={17} className={`relative z-10 ${isActive ? "text-white" : "text-forest-100/70"}`} />
              <span className={`relative z-10 font-medium text-sm ${isActive ? "text-white" : "text-forest-100/70"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium truncate">{session?.user?.fullName}</p>
          <p className="text-xs text-forest-100/50 truncate">{session?.user?.email}</p>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg border border-white/15 text-forest-100/80 hover:bg-white/5 transition-colors"
        >
          <LogOut size={14} />
          Log out
        </button>
      </div>
    </aside>
  );
}
