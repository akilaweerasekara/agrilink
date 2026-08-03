# AgriLink AI 2.0 — Buyer Web Portal (Step 4)

## Design choices (quick note)
Same forest-green brand as the farmer mobile app for consistency, plus a clay/amber accent used **only** on secondary-market (flash sale) content — so buyers instantly recognize "this listing was rejected and discounted" without reading anything. Prices are set in a monospace font (like a market ticker) since this is a data-dense B2B tool, not a marketing site.

## What's in this step
- **Login / Register** — real buyers (supermarket, hotel, exporter, factory, restaurant, compost hub) hitting your existing `/api/auth` endpoints
- **Browse Marketplace** — primary-tier listings from farmers, filterable by crop
- **Confirm Order** — reserves a listing for the buyer
- **Reject** — opens a reason/defect modal, calls your backend's auto reject-mitigation logic, and the listing visibly moves to the Secondary Market tab with a markdown price
- **Secondary Market** — the flash-sale tier, targeted at factories/restaurants/compost hubs
- **My Orders** — everything this buyer has confirmed

## Setup

1. Make sure your **backend is running** (`npm run dev` in `agrilink-backend`)
2. Extract this project, open a terminal inside it, run:
   ```bash
   npm install
   ```
3. Start it:
   ```bash
   npm run dev
   ```
4. Open the URL it prints (usually `http://localhost:5173`)

## Try it end-to-end

1. Register as a buyer (pick "Supermarket" as buyer type)
2. Go to **Browse Marketplace** — you should see any listings your farmer mobile app created
3. Click **Reject** on one, give a reason like "Minor bruising on batch," confirm
4. Switch to **Secondary Market** tab — that same listing now appears there, discounted
5. Click **Confirm Order** on any listing — check **My Orders** to see it show up

## What's next
- Admin dashboard (metrics, ad scheduler, transaction oversight)
- Logistics/truck tracking (optional — recommend keeping this as a roadmap slide, not a build, given your timeline)

## Invest in Crops (Step 7)
New "Invest in Crops" tab, available to any logged-in buyer account (in a full production build, "urban consumer investors" might be a separate role/app, but reusing buyer accounts keeps the demo simple). Browse open funding campaigns farmers have created from their timeline detail screen in the mobile app, pledge an amount, and track it under "My Investments." Pledges are capped automatically at whatever's left to reach the funding goal — no overfunding.

## UI Polish Pass (Step 11)
Real motion now, not just static Tailwind: Framer Motion powers page transitions between tabs, staggered card reveals on the marketplace grid, animated modal enter/exit (reject + pledge dialogs), an animated sidebar active-tab indicator, and skeleton loading states instead of plain "Loading…" text. Lucide icons replaced emoji throughout for a more premium, consistent look.

Run `npm install` after pulling this update — `framer-motion` and `lucide-react` are new dependencies.
