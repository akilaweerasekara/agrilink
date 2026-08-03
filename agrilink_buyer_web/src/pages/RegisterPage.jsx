import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../services/api.js";
import { auth } from "../services/auth.js";

const BUYER_TYPES = [
  { value: "supermarket", label: "Supermarket" },
  { value: "hotel", label: "Hotel" },
  { value: "exporter", label: "Exporter" },
  { value: "factory", label: "Factory" },
  { value: "restaurant", label: "Restaurant" },
  { value: "compost_hub", label: "Compost Hub" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    companyName: "",
    buyerType: "supermarket",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await api.register(form);
    setIsLoading(false);

    if (result.success) {
      auth.saveSession(result.data);
      navigate("/");
    } else {
      setError(result.message || "Registration failed.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-forest-900 to-forest-600 px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-semibold text-white">AgriLink AI</h1>
          <p className="text-forest-100/70 mt-2 font-body">Create your buyer account</p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-paper rounded-2xl p-8 shadow-2xl space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Contact person name</label>
            <input
              required
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Company name</label>
            <input
              required
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Buyer type</label>
            <select
              value={form.buyerType}
              onChange={(e) => update("buyerType", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
            >
              {BUYER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Phone</label>
            <input
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Password (min 6 characters)</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
            />
          </div>

          {error && (
            <div className="text-sm text-clay-600 bg-clay-50 border border-clay-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-forest-600 hover:bg-forest-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {isLoading ? "Creating account…" : "Create Account"}
          </button>

          <p className="text-center text-sm text-ink-400">
            Already have an account?{" "}
            <Link to="/login" className="text-forest-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
}
