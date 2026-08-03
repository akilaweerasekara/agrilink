import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout, Mail, Lock, AlertCircle } from "lucide-react";
import { api } from "../services/api.js";
import { auth } from "../services/auth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await api.login({ email, password });
    setIsLoading(false);

    if (result.success) {
      auth.saveSession(result.data);
      navigate("/");
    } else {
      setError(result.message || "Login failed. Check your credentials.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-forest-900 to-forest-600 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Sprout size={26} className="text-white" />
          </div>
          <h1 className="font-display text-4xl font-semibold text-white">AgriLink AI</h1>
          <p className="text-forest-100/70 mt-2 font-body">Corporate Buyer Portal</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          onSubmit={handleSubmit}
          className="bg-paper rounded-2xl p-8 shadow-2xl"
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                placeholder="buyer@company.com"
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-clay-600 bg-clay-50 border border-clay-100 rounded-lg px-3 py-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-forest-600 hover:bg-forest-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {isLoading ? "Signing in…" : "Sign In"}
          </motion.button>

          <p className="text-center text-sm text-ink-400 mt-5">
            New buyer?{" "}
            <Link to="/register" className="text-forest-600 font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
}
