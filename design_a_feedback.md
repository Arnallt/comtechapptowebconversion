# Design A — Bug Report & Fix Prompt for Claude Code

This document describes all bugs and UX issues found in **Design A** of the ComTech Gold prototype
(`https://arnallt.github.io/comtechapptowebconversion/`). Use this as a prompt for Claude Code to
locate and fix each issue in the source code.

---

## Context

Design A is a dark-themed gold investment app with the following main screens/components:
- **Home** — portfolio value, live gold price, price chart with time filters, gold holdings card, funds card
- **Buy Gold panel** — inline panel triggered by "Buy gold" button; has By Amount / By Grams toggle
- **Sell Gold panel** — triggered by "Sell gold" button; appears below the fold
- **Gift Gold panel** — triggered by Gift nav tab
- **Redeem panel** — triggered by Redeem nav tab
- **Profile dropdown** — triggered by the person icon in the top-right header

---

## Bug 1 — "By Amount" quick-select buttons use PHP (₱) but display no currency label

**Where:** Buy Gold panel → "By Amount" tab → quick-select buttons (100, 250, 500, 1,000)

**What happens:** Clicking "100" populates the input with $27.25 and shows ≈0.2099g received.
The amounts are in Philippine Pesos (₱), not USD. There is no label on the buttons indicating
this, so users believe they are spending $100 but are actually spending ₱100 (~$27.25).

**Expected behaviour:** Either:
- (Preferred) Label the buttons with their currency symbol: ₱100, ₱250, ₱500, ₱1,000
- OR convert the preset values to USD so "100" truly means $100

**Files to look for:** The component rendering the Buy Gold panel and its quick-select amount
buttons. Search for the values `100`, `250`, `500`, `1000` near "By Amount" or "buyAmount" logic.

---

## Bug 2 — "Confirm Buy" button does nothing

**Where:** Buy Gold panel → "Confirm Buy" button

**What happens:** Clicking "Confirm Buy" produces no response whatsoever — no success message,
no confirmation modal, no error, no loading state. The button appears interactive but is a dead end.

**Expected behaviour:** On click, the button should:
1. Show a loading/processing state
2. On success: display a confirmation message (e.g. "Purchase confirmed! X grams added to your
   holdings.") or navigate to a success screen
3. On error: display an error message

**Files to look for:** The onClick handler for the Confirm Buy button. It may be an empty function,
a `console.log`, or a `TODO`. Search for `confirmBuy`, `handleBuy`, `onConfirm`, or the button's
`onClick` prop in the Buy Gold component.

---

## Bug 3 — Sell Gold panel is hidden below the fold with no visual cue

**Where:** Home screen → "Sell gold" button in the Gold Holdings card

**What happens:** Clicking "Sell gold" activates the Sell nav tab at the bottom but the Sell Gold
panel only appears after the user manually scrolls down — there is no animation, scroll trigger,
or indicator that anything happened. In contrast, "Buy gold" correctly opens its panel in-place
(replacing the holdings card content).

**Expected behaviour:** Clicking "Sell gold" should behave consistently with "Buy gold":
- Either scroll automatically to the Sell panel
- Or open the Sell panel in-place (replacing the holdings card), matching the Buy Gold behaviour

**Files to look for:** The onClick handler for the "Sell gold" button. Compare its implementation
to the "Buy gold" button handler. The fix is likely adding `scrollIntoView()` on the sell panel
element, or mirroring the in-place swap logic used by Buy Gold.

---

## Bug 4 — Sell Gold "By Amount" tab shows gram presets instead of currency presets

**Where:** Sell Gold panel → "By Amount" tab → quick-select buttons

**What happens:** With "By Amount" selected, the quick-select buttons show gram values (0.5g, 1g,
2g, 5g) instead of currency amounts. This is the opposite of what "By Amount" implies and is
inconsistent with the Buy Gold panel, where "By Amount" shows currency presets (100, 250, 500,
1,000) and "By Grams" shows gram presets (0.5g, 1g, 2g, 5g).

**Expected behaviour:** The Sell Gold panel's "By Amount" tab should show currency amount presets
(e.g. $50, $100, $250, $500), and "By Grams" should show gram presets (0.5g, 1g, 2g, 5g) —
mirroring Buy Gold exactly.

**Files to look for:** The Sell Gold panel component. Look for the array/list of preset values
rendered under each toggle tab. The By Amount and By Grams preset arrays appear to be swapped.

---

## Bug 5 — Profile dropdown menu items (Prices, History, Settings) are non-functional

**Where:** Top-right header → person/profile icon → dropdown menu → Prices / History / Settings

**What happens:** Clicking any of the three menu items (Prices, History, Settings) does nothing.
The dropdown stays open and no navigation or action occurs. The items visually highlight on hover
but have no working onClick handlers.

**Expected behaviour:**
- **Home** → navigate to / scroll to the Home screen (or close the dropdown)
- **Prices** → navigate to a gold price/market screen, or scroll to the price chart
- **History** → navigate to a transaction history screen
- **Settings** → navigate to a settings screen

If these screens are not yet built, at minimum the dropdown should close on click and display a
"Coming soon" toast or placeholder. Currently the menu stays open indefinitely with no response.

**Files to look for:** The profile dropdown component. Search for the menu item list — likely an
array of `{ label: 'History', onClick: ... }` objects or JSX `<li>` / `<button>` elements. The
onClick handlers are either missing, empty (`() => {}`), or pointing to unimplemented functions.

---

## Bug 6 (UX) — "Confirm Sell" has the same dead-button issue as Confirm Buy

**Where:** Sell Gold panel → "Confirm Sell" button

**What happens:** Same issue as Bug 2 — clicking produces no response.

**Expected behaviour:** Same as Bug 2 but for selling: loading state → confirmation message showing
how much gold was sold and the updated balance.

---

## Summary of fixes needed

| # | Location | Issue | Severity |
|---|----------|--------|----------|
| 1 | Buy Gold panel — By Amount presets | Unlabelled PHP amounts mislead users | High |
| 2 | Buy Gold panel — Confirm Buy | Button click does nothing | Critical |
| 3 | Home — Sell gold button | Sell panel hidden below fold, no scroll/animation | High |
| 4 | Sell Gold panel — By Amount presets | Gram and currency presets are swapped | Medium |
| 5 | Profile dropdown | Prices, History, Settings links are dead | Medium |
| 6 | Sell Gold panel — Confirm Sell | Button click does nothing | Critical |

---

## Suggested prompt for Claude Code

Paste the following into Claude Code:

```
I have a gold investment web app prototype (Design A). Please fix the following bugs:

1. In the Buy Gold panel, the "By Amount" quick-select buttons (100, 250, 500, 1000) are in
   Philippine Pesos but show no currency label. Add a ₱ symbol to each button label so users
   know the denomination.

2. The "Confirm Buy" button in the Buy Gold panel has no onClick handler — clicking it does
   nothing. Implement a confirmation flow: show a success message or modal after the button
   is clicked (mock data is fine since this is a prototype).

3. Clicking "Sell gold" on the home screen activates the Sell tab but the Sell panel is hidden
   below the fold. Add an automatic scroll to the Sell panel on click, or open it in-place
   like the Buy Gold panel does.

4. In the Sell Gold panel, the "By Amount" tab shows gram presets (0.5g, 1g, 2g, 5g) and
   "By Grams" shows currency presets — they are swapped. Fix them to match the Buy Gold panel
   convention: By Amount = currency amounts, By Grams = gram amounts.

5. The profile dropdown menu items (Prices, History, Settings) have no onClick handlers and
   do nothing when clicked. Add at minimum a close-dropdown behaviour, and if those screens
   don't exist yet, show a "Coming soon" toast notification.

6. The "Confirm Sell" button in the Sell Gold panel has the same dead-click issue as Confirm
   Buy. Apply the same fix — a confirmation message or modal on click.
```
