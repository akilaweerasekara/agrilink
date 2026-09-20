import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { auth } from "../services/auth.js";

const REASONS = [["quality", "Bad quality"], ["quantity", "Wrong amount"], ["not_delivered", "Not delivered"], ["wrong_price", "Wrong price"], ["other", "Something else"]];

// Photos must stay small (server limit 300 KB): shrink to 900 px JPEG in the browser first.
function shrink(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.6).split(",")[1]);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/** How to pay the farmer (after dispatch), photo proof, and "there is a problem" for one order. */
export default function OrderExtras({ order }) {
  const token = auth.getSession().token;
  const [qr, setQr] = useState(null);
  const [msg, setMsg] = useState("");
  const fp = order.farmerPayment;

  useEffect(() => {
    if (fp?.qrPhotoId) api.photoBlobUrl(token, fp.qrPhotoId).then(setQr);
  }, [fp?.qrPhotoId, token]);

  const addPhoto = async (e, label) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const r = await api.call(token, "POST", `/orders/${order.id}/photos`, { imageBase64: await shrink(file), label });
      setMsg(r.success ? "Photo saved with this order." : r.message);
    } catch { setMsg("Could not read that photo."); }
  };

  const problem = async () => {
    const pick = window.prompt(REASONS.map((r, i) => `${i + 1} = ${r[1]}`).join("\n") + "\n\nType the number:");
    const reason = REASONS[Number(pick) - 1]?.[0]; if (!reason) return;
    const description = window.prompt("Tell us what happened (optional):") || "";
    const r = await api.call(token, "POST", `/orders/${order.id}/dispute`, { reason, description });
    setMsg(r.success ? "Problem sent. The farmer and the AgriLink team can see it." : r.message);
  };

  const report = async () => {
    const r = await api.call(token, "POST", "/reports", { reportedId: order.other.id, reason: "scam", context: "order", contextId: order.id, note: window.prompt("Optional note:") || "" });
    setMsg(r.message || (r.success ? "Reported." : "Failed."));
  };

  const active = !["placed", "cancelled"].includes(order.status);
  return (
    <div className="mt-4 space-y-3">
      {fp && (fp.instructions || fp.qrPhotoId) && (
        <div className="rounded-xl bg-forest-50 p-3 text-sm">
          <p className="font-semibold text-forest-700">How to pay the farmer</p>
          {fp.instructions && <p className="text-ink-700 mt-1">{fp.instructions}</p>}
          {qr && <img src={qr} alt="Payment QR" className="mt-2 w-40 rounded-lg border bg-white" />}
          <p className="text-[11px] text-ink-400 mt-2">Check the name shown in your bank app before you pay. Pay only after you have received and checked the goods.</p>
        </div>
      )}
      {active && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="cursor-pointer border border-ink-900/10 rounded-lg px-3 py-1.5">Add photo<input type="file" accept="image/*" capture="environment" hidden onChange={(e) => addPhoto(e, "goods")} /></label>
          <button onClick={problem} className="border border-ink-900/10 rounded-lg px-3 py-1.5">Report a problem</button>
          <button onClick={report} className="text-ink-400 underline">Report this seller</button>
        </div>
      )}
      {msg && <p className="text-xs text-ink-700">{msg}</p>}
    </div>
  );
}
