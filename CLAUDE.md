# ComTech Gold — Project Reference (CLAUDE.md)

> Reference notes for future sessions. This repo is a **mobile-app design-review prototype**
> for ComTech Gold (a gold investment app). It is an A/B test harness that shows two design
> variants and collects feedback. Everything is **static HTML/CSS/JS with mock data** — no
> backend, no build step, no dependencies. Open `index.html` in a browser to run it.

---

## Repository layout

```
ship/
├── index.html                         # A/B TEST SHELL (entry point)
├── CLAUDE.md                          # this file
├── update.md                          # impl notes: design-b interactive modals (Buy/Sell/Funds/SIP)
├── design_a_feedback.md               # bug report + fix prompt for Design A
├── design-a/
│   └── comtech-gold-dashboard-v4.html # DESIGN A — "New Redesign" (single self-contained file)
├── design-b/
│   ├── index.html                     # DESIGN B — "Current Demo" markup
│   ├── styles.css                     # Design B styles
│   └── app.js                         # Design B logic + MOCK_STATE + modals
└── assets/                            # fonts, icons, images, pdf (shared)
```

### What each piece is

- **`index.html` (the shell)** — A self-contained A/B review flow with four screens:
  `choice → viewer (iframe) → feedback overlay → thank-you`. Loads each variant in an
  `<iframe>`. Tracks which variants have been "seen"; unlocks a feedback button once both
  are viewed. The Submit Feedback button currently redirects to a Google Form
  (`https://forms.gle/oUNLctkgnK64Wd1A6`). State is reset on every load (stale localStorage
  is cleared in `DOMContentLoaded`). Design A is rendered as a 1080×1920 fixed frame that is
  **scaled to fit** the viewport (`applyVariantAScale`); Design B is responsive 100%×100%.

- **Design A** (`design-a/comtech-gold-dashboard-v4.html`) — labelled **"New Redesign"** in
  the shell's feedback form. Single self-contained file (HTML+CSS+JS inline). Dark, premium
  theme (`bg #0B0805`, Fraunces + Plus Jakarta Sans fonts, parchment/gold/emerald palette).
  Screens/components: Home (portfolio value, live price, price chart with time filters, gold
  holdings card, funds card), **Buy Gold panel** (By Amount / By Grams toggle), **Sell Gold
  panel**, **Gift Gold panel**, **Redeem panel**, **Profile dropdown** (Prices/History/
  Settings). This is the file `design_a_feedback.md` targets.

- **Design B** (`design-b/`) — labelled **"Current Demo"**. A faithful static conversion of
  the original React Native app. All Redux/Axios/Socket.IO/Firebase calls were replaced with
  a single `MOCK_STATE` object in `app.js`. Tabs: `dashboard`, `transaction`, `wallet`,
  `gold-history`, `sip`. Has functional bottom-sheet **modals** (Buy/Sell, Add Funds,
  Withdraw, Create SIP) added per `update.md` — all mutate `MOCK_STATE` and re-render live.

> ⚠️ **Naming gotcha:** "Design A" and "Design B" are just slots in the shell. In the feedback
> form, Design A = "New Redesign", Design B = "Current Demo". Don't assume A is older.

---

## Design B internals (`design-b/app.js`)

- `MOCK_STATE` holds everything: `user`, `fund` (fundTotal/goldTotal/etc.), `buyGm` (228.94
  AED/g live price), `conversionRate` (1 USD = 3.6725 AED), `transactions`, `walletDeposits`,
  `goldHistory`, `sip`.
- Currency toggle (USD ⇄ AED) via `currentCurrency`; helpers `toAED()`, `toUSD()`, `fmt2()`.
- Renderers: `renderBalance()`, `renderTransactions()`, `renderWalletDeposits()`,
  `renderSIP()`, `drawLineChart()`. Call these to refresh — don't reach into the DOM directly.
- Modals (`initModals`, `openBuySellModal`, `openAddFundsModal`, `openWithdrawModal`,
  `openCreateSIPModal`, `bsProceed`, etc.) live near the bottom of `app.js`; markup is at the
  bottom of `design-b/index.html` (ids `modal-buysell`, `modal-addfunds`, `modal-withdraw`,
  `modal-createsip`); styles in `styles.css`. Sell price uses a 2% spread (`buyGm * 0.98`).

See **`update.md`** for the full modal spec (structure, validation rules, USD/AED handling).

---

## Design A bug backlog (`design_a_feedback.md`) — STATUS

The report was written against an older hosted build. The local `comtech-gold-dashboard-v4.html`
had already resolved several items via its panel-slider rewrite. All six are now addressed
(fixed 2026-06-26):

1. **(High) ✅ Fixed** Buy "By Amount" presets were unlabelled foreign-currency values.
   Presets are now denominated in the *displayed* currency and labelled with its symbol
   (`$ 100` / `AED 100`). `updateBuyPresetLabels()` + currency-toggle re-label.
2. **(Critical) ✅ Already working in v4** "Confirm Buy" flashes "✓ Order Placed" and returns
   home; now also shows a "Purchase confirmed — X g added" toast.
3. **(High) ✅ Resolved by v4** Sell is its own slide-in panel (`data-goto="sell"`), not below-fold.
4. **(Medium) ✅ Fixed** Sell presets are now mode-aware (`updateSellPresetLabels()`): currency
   amounts in "By Amount", grams in "By Grams". Removed the forced-grams-mode hack.
5. **(Medium) ✅ Fixed** Profile dropdown items (Home/Prices/History/Settings) now have handlers
   (`runMenuAction`): close menu, navigate, or show a placeholder toast. Added a lightweight
   `showToast()` to Design A.
6. **(Critical) ✅ Already working in v4** "Confirm Sell" flashes "✓ Sale Placed"; now also shows
   a "Sale confirmed — X g sold" toast.

---

## Conventions & gotchas

- **No build tooling.** Edit HTML/CSS/JS directly; reload the browser. No npm/bundler.
- **Mock data only.** Never add real API calls. Persist to `MOCK_STATE` and re-render.
- Keep all of a variant's code self-contained: Design A is one file; Design B is its three files.
- The shell scales Design A as a fixed 1080×1920 frame — design at that canvas size.
- Brand gold is `#CE9214` (shell/B) / `--gold-500 #C99A35` (A). Keep the gold accent consistent.
- Don't edit the shell when changing a variant, and vice-versa.

---

## Changelog of agent work

- **2024-06 (Haiku):** Implemented Design B interactive modals per `update.md`.
- Shell iterations: Google Form redirect, safe-area support, fresh-state-on-refresh,
  centered back button, prominent prototype disclaimer.
- **2026-06-26:** Added this `CLAUDE.md`; began implementing `design_a_feedback.md` fixes in Design A.
- **2026-06-26:** Gave Design A a live mock-state model (like Design B's `MOCK_STATE`). Replaced
  the `GRAMS_HELD`/`WALLET_USD` constants with a mutable `state = { gramsHeld, walletUSD }`
  (`walletUSD` always stored in USD). All actions now commit to `state` and call
  `updateDisplays()` → `renderState()` so changes propagate everywhere (portfolio, holdings
  card, wallet card, sell/gift/redeem availability, redeem max + "All" preset):
  **Buy** (debits wallet, adds grams, rejects if funds short), **Sell** (adds proceeds, removes
  grams, rejects if over holdings), **Redeem**/**Gift** (remove grams, no cash movement),
  **Add funds**/**Withdraw** (prompt-based, in displayed currency; withdraw checks balance).
  No spread on sell (Design B uses 2%). `EPS = 1e-6` tolerance so "sell/spend all" doesn't
  trip rounding.
</content>
</invoke>
