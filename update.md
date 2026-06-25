# update.md — Button Interactivity Implementation Notes
## For: Haiku (execution model)
## Task: Make Buy Gold, Sell Gold, Add Funds, Withdraw, and Create SIP buttons functional in `ship/design-b/`

---

## Summary of what is broken

Every major action button in `ship/design-b/index.html` currently just calls `showToast('... coming soon!')`. The original React Native app has full screens for each of these flows. The goal is to implement them as **HTML modals with mock logic** in `ship/design-b/app.js` and `ship/design-b/index.html`, using the existing `MOCK_STATE` data — no real API calls.

---

## Files to edit

- `ship/design-b/index.html` — add modal HTML at the bottom (before `</div><!-- /app -->`)
- `ship/design-b/app.js` — add modal open/close functions, calculation logic, and form handlers
- `ship/design-b/styles.css` — add modal styles (overlay, panel, inputs, etc.)

---

## Current broken buttons (location in index.html)

| Button label | Current onclick | Line approx |
|---|---|---|
| Add Funds | `showToast('Add Funds — coming soon!')` | ~66 |
| Buy Gold | `showToast('Buy Gold — coming soon!')` | ~73 |
| Withdraw | `showToast('Withdraw — coming soon!')` | ~87 |
| Sell Gold | `showToast('Sell Gold — coming soon!')` | ~94 |
| Create SIP | `showToast('Create SIP — coming soon!')` | ~333 |

---

## 1. BUY GOLD / SELL GOLD MODAL

### Trigger
- "Buy Gold" button → open modal with Buy tab pre-selected
- "Sell Gold" button → open modal with Sell tab pre-selected

### Modal structure (one shared modal, two tabs)

```
┌─────────────────────────────────┐
│  [×]  Buy / Sell Gold           │
│  [  Buy  ] [  Sell  ]  ← tabs  │
├─────────────────────────────────┤
│  Live price: AED 228.94/g       │
│  ┌───────────────────────────┐  │
│  │  Grams: [_________] g    │  │
│  │  = AED [calculated]      │  │
│  └───────────────────────────┘  │
│                                 │
│  Payment method (buy only):     │
│  ○ My Deposit  ○ Credit/Debit  │
│                                 │
│  ── Summary ──                  │
│  Available balance:  $ X        │
│  Gold held:          X g        │
│  You will get/spend: X g / $ X  │
│  Min buy: 0.02g  Min sell: 0.5g │
│                                 │
│  [   Proceed   ]                │
└─────────────────────────────────┘
```

### Logic (vanilla JS)

```
MOCK_STATE.buyGm = 228.94  // AED per gram (already in app.js)
conversionRate = 3.6725    // AED per USD (already in app.js)

// When user types grams:
aedAmount = grams * MOCK_STATE.buyGm
displayAmount = (currentCurrency === 'AED') ? aedAmount : aedAmount / 3.6725

// Validations before Proceed:
Buy:
  - grams < 0.02 → show error "Minimum purchase is 0.02g"
  - grams * buyGm > availableBalance (AED) → show error "Insufficient balance"
Sell:
  - grams < 0.5 → show error "Minimum sell is 0.5g"
  - grams > MOCK_STATE.fund.goldTotal → show error "Insufficient gold holdings"
```

### On "Proceed" click (success path)

**Buy:**
1. Deduct from `MOCK_STATE.fund.fundTotal` → `fundTotal -= (grams * buyGm / conversionRate)` (in USD)
2. Add to `MOCK_STATE.fund.goldTotal` → `goldTotal += grams`
3. Push to `MOCK_STATE.transactions` array: `{ id: Date.now(), type: 'buy', amount: displayAmount, goldGm: grams, status: 'Completed', date: today, paymentMethod: selectedPayment }`
4. Call `renderBalance()` to refresh the dashboard hero numbers
5. Close modal
6. Call `showToast('Buy order placed! ' + grams.toFixed(4) + 'g added to your holdings.')`

**Sell:**
1. Deduct from `MOCK_STATE.fund.goldTotal` → `goldTotal -= grams`
2. Add proceeds to `MOCK_STATE.fund.fundTotal` → `fundTotal += (grams * sellGm / conversionRate)` (use `MOCK_STATE.buyGm * 0.98` as sell price — 2% spread)
3. Push to `MOCK_STATE.transactions` with `type: 'sell'`
4. Call `renderBalance()`
5. Close modal
6. `showToast('Sell order placed! ' + grams.toFixed(4) + 'g sold.')`

### Payment method (buy tab only)
Show two radio-style option cards:
- "My Deposit" (wallet icon) — default selected
- "Credit/Debit" (card icon)
No payment method needed for sell tab.

---

## 2. ADD FUNDS MODAL

### Trigger
"Add Funds" button → open modal

### Modal structure

```
┌─────────────────────────────────┐
│  [×]  Add Funds                 │
├─────────────────────────────────┤
│  Current balance: $ X           │
│                                 │
│  Amount: [___________]          │
│  (in USD)                       │
│                                 │
│  Payment method:                │
│  ○ Credit/Debit  ○ Bank Transfer│
│                                 │
│  [   Add Funds   ]              │
└─────────────────────────────────┘
```

### Logic
- Minimum amount: $10
- On confirm:
  1. `MOCK_STATE.fund.fundTotal += amount`
  2. `MOCK_STATE.fund.totalDeposited += amount`
  3. Push to `MOCK_STATE.walletDeposits`: `{ id: Date.now(), amount, date: today, method: selectedMethod, status: 'Completed' }`
  4. `renderBalance()`
  5. Re-render wallet deposits: clear `wallet-deposits` list, call `renderWalletDeposits()`
  6. Close modal
  7. `showToast('$ ' + amount.toFixed(2) + ' added to your wallet!')`

---

## 3. WITHDRAW MODAL

### Trigger
"Withdraw" button → open modal

### Modal structure

```
┌─────────────────────────────────┐
│  [×]  Withdraw Funds            │
├─────────────────────────────────┤
│  Available: $ X                 │
│                                 │
│  Amount: [___________]          │
│                                 │
│  Destination:                   │
│  Bank Account (mock):           │
│  ████ ████ ████ 4242            │
│                                 │
│  [   Withdraw   ]               │
└─────────────────────────────────┘
```

### Logic
- Max amount: `MOCK_STATE.fund.fundTotal`
- Validation: amount > fundTotal → "Insufficient balance"
- On confirm:
  1. `MOCK_STATE.fund.fundTotal -= amount`
  2. `MOCK_STATE.fund.totalWithdrawn += amount`
  3. `renderBalance()`
  4. Close modal
  5. `showToast('Withdrawal of $ ' + amount.toFixed(2) + ' submitted!')`

---

## 4. CREATE SIP MODAL

### Trigger
"+ Create New SIP" button (inside tab-sip panel) → open modal

### Modal structure

```
┌─────────────────────────────────┐
│  [×]  Create SIP Plan           │
├─────────────────────────────────┤
│  Plan name:   [______________]  │
│  Amount/cycle:[$______________] │
│  Frequency:   [Monthly ▼]      │
│               (Monthly/Weekly)  │
│                                 │
│  Gold per cycle (calc'd):       │
│  X.XXXX g  @ AED 228.94/g      │
│                                 │
│  [   Create Plan   ]            │
└─────────────────────────────────┘
```

### Logic
- goldPerCycle = (amount / conversionRate) / buyGm   (convert USD → AED → grams)
- Minimum amount: $10
- On confirm:
  1. Push to `MOCK_STATE.sip`: `{ id: Date.now(), name, amount, goldGm: goldPerCycle, frequency, nextDate: nextMonth(), status: 'active', totalInvested: amount, totalGold: goldPerCycle }`
  2. Re-render SIP: clear `sip-list`, call `renderSIP()`
  3. Close modal
  4. `showToast('SIP plan created!')`

Helper: `nextMonth()` returns a date string 1 month from today.

---

## JS implementation structure (add to app.js)

```js
// ══════════════════════════════════
// MODAL SYSTEM
// ══════════════════════════════════

function openModal(id) {
  document.getElementById(id).classList.add('modal-open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('modal-open');
}

// Close modal when clicking the backdrop
function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('modal-open');
    });
  });
}

// ── Buy/Sell Gold ──
function openBuySellModal(tab) {
  // tab = 'buy' or 'sell'
  // set active tab, clear inputs, recalculate
  openModal('modal-buysell');
}

// ── Add Funds ──
function openAddFundsModal() {
  openModal('modal-addfunds');
}

// ── Withdraw ──
function openWithdrawModal() {
  openModal('modal-withdraw');
}

// ── Create SIP ──
function openCreateSIPModal() {
  openModal('modal-createsip');
}
```

---

## CSS requirements (add to styles.css)

```css
/* Modal overlay */
.modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 200;
  align-items: flex-end;   /* slide up from bottom like a mobile sheet */
  justify-content: center;
}
.modal-overlay.modal-open {
  display: flex;
}

/* Modal panel */
.modal-panel {
  background: #fff;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 480px;
  padding: 24px 20px 36px;
  max-height: 85vh;
  overflow-y: auto;
}

/* Modal header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.modal-title {
  font-size: 18px;
  font-weight: 700;
  font-family: 'Onest', sans-serif;
}
.modal-close {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #666;
}

/* Tab buttons inside modal */
.modal-tabs {
  display: flex;
  background: #f0f0f0;
  border-radius: 20px;
  padding: 3px;
  margin-bottom: 20px;
}
.modal-tab {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: #666;
  transition: all 0.2s;
}
.modal-tab.active {
  background: #CE9214;
  color: #fff;
}

/* Input fields */
.modal-input-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}
.modal-input {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 16px;
  font-family: 'Onest', sans-serif;
  margin-bottom: 14px;
  box-sizing: border-box;
  outline: none;
}
.modal-input:focus {
  border-color: #CE9214;
}

/* Calculated display line */
.modal-calc-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #555;
  margin-bottom: 8px;
  padding: 4px 0;
}
.modal-calc-row.highlight {
  font-weight: 700;
  color: #CE9214;
  font-size: 15px;
}

/* Payment method radio cards */
.payment-options {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.payment-option {
  flex: 1;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 10px 8px;
  text-align: center;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  transition: all 0.2s;
}
.payment-option.selected {
  border-color: #CE9214;
  background: #FFF8E8;
  color: #CE9214;
}

/* Proceed button */
.modal-proceed-btn {
  width: 100%;
  background: #CE9214;
  color: #fff;
  border: none;
  border-radius: 25px;
  padding: 15px;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Onest', sans-serif;
  cursor: pointer;
  margin-top: 8px;
}
.modal-proceed-btn:hover {
  background: #b8800f;
}

/* Error text inside modal */
.modal-error {
  color: #e53935;
  font-size: 12px;
  margin-bottom: 8px;
  min-height: 16px;
}

/* Divider */
.modal-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 14px 0;
}
```

---

## HTML modal markup (add just before `</div><!-- /app -->` in index.html)

### Modal 1: Buy/Sell Gold

```html
<div class="modal-overlay" id="modal-buysell">
  <div class="modal-panel">
    <div class="modal-header">
      <span class="modal-title">Buy / Sell Gold</span>
      <button class="modal-close" onclick="closeModal('modal-buysell')">&times;</button>
    </div>
    <div class="modal-tabs">
      <button class="modal-tab active" id="bs-tab-buy" onclick="setBSTab('buy')">Buy</button>
      <button class="modal-tab" id="bs-tab-sell" onclick="setBSTab('sell')">Sell</button>
    </div>
    <div class="modal-calc-row">
      <span>Live price</span><span id="bs-live-price">AED 228.94 / g</span>
    </div>
    <div class="modal-divider"></div>
    <label class="modal-input-label">Gold amount (grams)</label>
    <input class="modal-input" id="bs-gram-input" type="number" min="0" step="0.01" placeholder="e.g. 1.00" oninput="bsRecalc()">
    <div class="modal-calc-row highlight">
      <span id="bs-amount-label">You pay</span>
      <span id="bs-amount-display">—</span>
    </div>
    <div id="bs-payment-section">
      <div class="modal-divider"></div>
      <label class="modal-input-label">Payment method</label>
      <div class="payment-options">
        <div class="payment-option selected" id="pay-deposit" onclick="selectBSPayment('My Deposit')">💰 My Deposit</div>
        <div class="payment-option" id="pay-card" onclick="selectBSPayment('Credit/Debit')">💳 Credit/Debit</div>
      </div>
    </div>
    <div class="modal-divider"></div>
    <div class="modal-calc-row"><span id="bs-balance-label">Available balance</span><span id="bs-balance-value">—</span></div>
    <div class="modal-calc-row"><span>Gold held</span><span id="bs-gold-held">—</span></div>
    <div class="modal-calc-row"><span id="bs-min-label">Min: 0.02g</span></div>
    <div class="modal-error" id="bs-error"></div>
    <button class="modal-proceed-btn" onclick="bsProceed()">Proceed</button>
  </div>
</div>
```

### Modal 2: Add Funds

```html
<div class="modal-overlay" id="modal-addfunds">
  <div class="modal-panel">
    <div class="modal-header">
      <span class="modal-title">Add Funds</span>
      <button class="modal-close" onclick="closeModal('modal-addfunds')">&times;</button>
    </div>
    <div class="modal-calc-row">
      <span>Current balance</span><span id="af-balance">—</span>
    </div>
    <div class="modal-divider"></div>
    <label class="modal-input-label">Amount (USD)</label>
    <input class="modal-input" id="af-amount-input" type="number" min="0" step="1" placeholder="e.g. 500">
    <label class="modal-input-label">Payment method</label>
    <div class="payment-options">
      <div class="payment-option selected" id="af-pay-card" onclick="selectAFPayment('Credit/Debit')">💳 Credit/Debit</div>
      <div class="payment-option" id="af-pay-bank" onclick="selectAFPayment('Bank Transfer')">🏦 Bank Transfer</div>
    </div>
    <div class="modal-error" id="af-error"></div>
    <button class="modal-proceed-btn" onclick="afProceed()">Add Funds</button>
  </div>
</div>
```

### Modal 3: Withdraw

```html
<div class="modal-overlay" id="modal-withdraw">
  <div class="modal-panel">
    <div class="modal-header">
      <span class="modal-title">Withdraw Funds</span>
      <button class="modal-close" onclick="closeModal('modal-withdraw')">&times;</button>
    </div>
    <div class="modal-calc-row">
      <span>Available to withdraw</span><span id="wd-available">—</span>
    </div>
    <div class="modal-divider"></div>
    <label class="modal-input-label">Amount (USD)</label>
    <input class="modal-input" id="wd-amount-input" type="number" min="0" step="1" placeholder="e.g. 200">
    <div class="modal-divider"></div>
    <div class="modal-calc-row"><span>Destination</span></div>
    <div style="background:#f8f8f8;border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:13px;color:#555;">
      🏦 Bank Account ending ••••4242
    </div>
    <div class="modal-error" id="wd-error"></div>
    <button class="modal-proceed-btn" onclick="wdProceed()">Withdraw</button>
  </div>
</div>
```

### Modal 4: Create SIP

```html
<div class="modal-overlay" id="modal-createsip">
  <div class="modal-panel">
    <div class="modal-header">
      <span class="modal-title">Create SIP Plan</span>
      <button class="modal-close" onclick="closeModal('modal-createsip')">&times;</button>
    </div>
    <label class="modal-input-label">Plan name</label>
    <input class="modal-input" id="sip-name-input" type="text" placeholder="e.g. Monthly Gold Saver">
    <label class="modal-input-label">Amount per cycle (USD)</label>
    <input class="modal-input" id="sip-amount-input" type="number" min="10" step="1" placeholder="e.g. 100" oninput="sipRecalc()">
    <label class="modal-input-label">Frequency</label>
    <select class="modal-input" id="sip-freq-select">
      <option value="Monthly">Monthly</option>
      <option value="Weekly">Weekly</option>
    </select>
    <div class="modal-calc-row highlight">
      <span>Gold per cycle</span><span id="sip-gold-calc">—</span>
    </div>
    <div class="modal-error" id="sip-error"></div>
    <button class="modal-proceed-btn" onclick="sipProceed()">Create Plan</button>
  </div>
</div>
```

---

## JavaScript functions to add to app.js

Add these after the existing `renderSIP()` function.

### Modal open helpers

```js
function openModal(id) {
  document.getElementById(id).classList.add('modal-open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('modal-open');
}
function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('modal-open');
    });
  });
}
```

### Buy/Sell Gold modal

```js
var bsActiveTab = 'buy';
var bsSelectedPayment = 'My Deposit';

function openBuySellModal(tab) {
  bsActiveTab = tab || 'buy';
  bsSelectedPayment = 'My Deposit';
  document.getElementById('bs-gram-input').value = '';
  document.getElementById('bs-error').textContent = '';
  document.getElementById('bs-amount-display').textContent = '—';
  setBSTab(bsActiveTab);
  updateBSBalance();
  openModal('modal-buysell');
}

function setBSTab(tab) {
  bsActiveTab = tab;
  document.getElementById('bs-tab-buy').classList.toggle('active', tab === 'buy');
  document.getElementById('bs-tab-sell').classList.toggle('active', tab === 'sell');
  document.getElementById('bs-payment-section').style.display = tab === 'buy' ? '' : 'none';
  document.getElementById('bs-amount-label').textContent  = tab === 'buy' ? 'You pay' : 'You receive';
  document.getElementById('bs-min-label').textContent     = tab === 'buy' ? 'Min: 0.02g' : 'Min: 0.5g';
  document.getElementById('bs-balance-label').textContent = tab === 'buy' ? 'Available balance' : 'Gold held';
  updateBSBalance();
  bsRecalc();
}

function updateBSBalance() {
  var isAED = currentCurrency === 'AED';
  var sym   = isAED ? 'AED ' : '$ ';
  var avail = MOCK_STATE.fund.fundTotal - (isAED ? 0 : 0); // just USD for simplicity
  if (bsActiveTab === 'buy') {
    var disp = isAED ? toAED(avail) : avail;
    document.getElementById('bs-balance-value').textContent = sym + fmt2(disp);
  } else {
    document.getElementById('bs-balance-value').textContent = fmt2(MOCK_STATE.fund.goldTotal) + ' g';
  }
  document.getElementById('bs-gold-held').textContent = fmt2(MOCK_STATE.fund.goldTotal) + ' g';
}

function bsRecalc() {
  var grams = parseFloat(document.getElementById('bs-gram-input').value) || 0;
  if (grams <= 0) {
    document.getElementById('bs-amount-display').textContent = '—';
    return;
  }
  var aedAmount = grams * MOCK_STATE.buyGm;
  var isAED = currentCurrency === 'AED';
  var displayAmt = isAED ? aedAmount : toUSD(aedAmount);
  var sym = isAED ? 'AED ' : '$ ';
  document.getElementById('bs-amount-display').textContent = sym + fmt2(displayAmt);
}

function selectBSPayment(method) {
  bsSelectedPayment = method;
  document.getElementById('pay-deposit').classList.toggle('selected', method === 'My Deposit');
  document.getElementById('pay-card').classList.toggle('selected',   method === 'Credit/Debit');
}

function bsProceed() {
  var errEl = document.getElementById('bs-error');
  errEl.textContent = '';
  var grams = parseFloat(document.getElementById('bs-gram-input').value) || 0;

  if (bsActiveTab === 'buy') {
    if (grams < 0.02) { errEl.textContent = 'Minimum purchase is 0.02g'; return; }
    var cost = grams * MOCK_STATE.buyGm; // AED
    var costUSD = toUSD(cost);
    if (costUSD > MOCK_STATE.fund.fundTotal) { errEl.textContent = 'Insufficient balance'; return; }
    MOCK_STATE.fund.fundTotal  -= costUSD;
    MOCK_STATE.fund.goldTotal  += grams;
    MOCK_STATE.transactions.unshift({ id: Date.now(), type: 'buy',
      amount: costUSD, goldGm: grams, status: 'Completed',
      date: new Date().toISOString().slice(0,10), paymentMethod: bsSelectedPayment });
    closeModal('modal-buysell');
    renderBalance();
    refreshTransactionList();
    showToast('Buy order placed! ' + grams.toFixed(4) + 'g added to your holdings.');

  } else {
    if (grams < 0.5) { errEl.textContent = 'Minimum sell is 0.5g'; return; }
    if (grams > MOCK_STATE.fund.goldTotal) { errEl.textContent = 'Insufficient gold holdings'; return; }
    var revenue = grams * MOCK_STATE.buyGm * 0.98; // 2% spread
    var revenueUSD = toUSD(revenue);
    MOCK_STATE.fund.goldTotal  -= grams;
    MOCK_STATE.fund.fundTotal  += revenueUSD;
    MOCK_STATE.transactions.unshift({ id: Date.now(), type: 'sell',
      amount: revenueUSD, goldGm: grams, status: 'Completed',
      date: new Date().toISOString().slice(0,10), paymentMethod: 'Sell Gold' });
    closeModal('modal-buysell');
    renderBalance();
    refreshTransactionList();
    showToast('Sell order placed! ' + grams.toFixed(4) + 'g sold.');
  }
}

function refreshTransactionList() {
  var buyList  = document.getElementById('fund-buy');
  var sellList = document.getElementById('fund-sell');
  if (buyList)  buyList.innerHTML  = '';
  if (sellList) sellList.innerHTML = '';
  renderTransactions();
}
```

### Add Funds modal

```js
var afSelectedPayment = 'Credit/Debit';

function openAddFundsModal() {
  var isAED = currentCurrency === 'AED';
  var sym   = isAED ? 'AED ' : '$ ';
  var bal   = isAED ? toAED(MOCK_STATE.fund.fundTotal) : MOCK_STATE.fund.fundTotal;
  document.getElementById('af-balance').textContent      = sym + fmt2(bal);
  document.getElementById('af-amount-input').value       = '';
  document.getElementById('af-error').textContent        = '';
  afSelectedPayment = 'Credit/Debit';
  document.getElementById('af-pay-card').classList.add('selected');
  document.getElementById('af-pay-bank').classList.remove('selected');
  openModal('modal-addfunds');
}

function selectAFPayment(method) {
  afSelectedPayment = method;
  document.getElementById('af-pay-card').classList.toggle('selected', method === 'Credit/Debit');
  document.getElementById('af-pay-bank').classList.toggle('selected', method === 'Bank Transfer');
}

function afProceed() {
  var errEl  = document.getElementById('af-error');
  errEl.textContent = '';
  var amount = parseFloat(document.getElementById('af-amount-input').value) || 0;
  if (amount < 10) { errEl.textContent = 'Minimum deposit is $10'; return; }
  MOCK_STATE.fund.fundTotal      += amount;
  MOCK_STATE.fund.totalDeposited += amount;
  MOCK_STATE.walletDeposits.unshift({ id: Date.now(), amount, method: afSelectedPayment,
    date: new Date().toISOString().slice(0,10), status: 'Completed' });
  closeModal('modal-addfunds');
  renderBalance();
  var depList = document.getElementById('wallet-deposits');
  if (depList) { depList.innerHTML = ''; renderWalletDeposits(); }
  showToast('$ ' + fmt2(amount) + ' added to your wallet!');
}
```

### Withdraw modal

```js
function openWithdrawModal() {
  var isAED = currentCurrency === 'AED';
  var sym   = isAED ? 'AED ' : '$ ';
  var avail = isAED ? toAED(MOCK_STATE.fund.fundTotal) : MOCK_STATE.fund.fundTotal;
  document.getElementById('wd-available').textContent   = sym + fmt2(avail);
  document.getElementById('wd-amount-input').value      = '';
  document.getElementById('wd-error').textContent       = '';
  openModal('modal-withdraw');
}

function wdProceed() {
  var errEl  = document.getElementById('wd-error');
  errEl.textContent = '';
  var amount = parseFloat(document.getElementById('wd-amount-input').value) || 0;
  if (amount <= 0) { errEl.textContent = 'Enter a valid amount'; return; }
  if (amount > MOCK_STATE.fund.fundTotal) { errEl.textContent = 'Insufficient balance'; return; }
  MOCK_STATE.fund.fundTotal     -= amount;
  MOCK_STATE.fund.totalWithdrawn += amount;
  closeModal('modal-withdraw');
  renderBalance();
  showToast('Withdrawal of $ ' + fmt2(amount) + ' submitted!');
}
```

### Create SIP modal

```js
function openCreateSIPModal() {
  document.getElementById('sip-name-input').value   = '';
  document.getElementById('sip-amount-input').value = '';
  document.getElementById('sip-freq-select').value  = 'Monthly';
  document.getElementById('sip-gold-calc').textContent = '—';
  document.getElementById('sip-error').textContent  = '';
  openModal('modal-createsip');
}

function sipRecalc() {
  var amount = parseFloat(document.getElementById('sip-amount-input').value) || 0;
  if (amount <= 0) { document.getElementById('sip-gold-calc').textContent = '—'; return; }
  var aedAmount   = amount * MOCK_STATE.conversionRate[0].buyConversion;
  var goldPerCycle = aedAmount / MOCK_STATE.buyGm;
  document.getElementById('sip-gold-calc').textContent = goldPerCycle.toFixed(4) + ' g';
}

function sipProceed() {
  var errEl  = document.getElementById('sip-error');
  errEl.textContent = '';
  var name   = document.getElementById('sip-name-input').value.trim();
  var amount = parseFloat(document.getElementById('sip-amount-input').value) || 0;
  var freq   = document.getElementById('sip-freq-select').value;
  if (!name)        { errEl.textContent = 'Enter a plan name'; return; }
  if (amount < 10)  { errEl.textContent = 'Minimum SIP amount is $10'; return; }
  var aedAmount    = amount * MOCK_STATE.conversionRate[0].buyConversion;
  var goldPerCycle = aedAmount / MOCK_STATE.buyGm;
  var nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + 1);
  MOCK_STATE.sip.push({
    id: Date.now(), name, amount, goldGm: goldPerCycle, frequency: freq,
    nextDate: nextDate.toISOString().slice(0,10), status: 'active',
    totalInvested: amount, totalGold: goldPerCycle,
  });
  var sipList = document.getElementById('sip-list');
  if (sipList) { sipList.innerHTML = ''; renderSIP(); }
  closeModal('modal-createsip');
  showToast('SIP plan "' + name + '" created!');
}
```

---

## Changes to button onclick attributes in index.html

Replace these existing `onclick` values:

| Old onclick | New onclick |
|---|---|
| `showToast('Add Funds — coming soon!')` | `openAddFundsModal()` |
| `showToast('Buy Gold — coming soon!')` | `openBuySellModal('buy')` |
| `showToast('Withdraw — coming soon!')` | `openWithdrawModal()` |
| `showToast('Sell Gold — coming soon!')` | `openBuySellModal('sell')` |
| `showToast('Create SIP — coming soon!')` | `openCreateSIPModal()` |

---

## Add to DOMContentLoaded in app.js

At the bottom of the `document.addEventListener('DOMContentLoaded', ...)` block, add:

```js
initModals();
```

---

## Quality checks before finishing

1. Modal closes when clicking the backdrop (dark overlay outside the panel)
2. Gram input in Buy/Sell modal updates amount display in real time (`oninput="bsRecalc()"`)
3. SIP amount input updates gold calc in real time (`oninput="sipRecalc()"`)
4. After Buy/Sell: hero balance and gold holdings update immediately (because `renderBalance()` is called)
5. After Add Funds: wallet tab balance updates
6. Currency toggle still works after modal transactions (all values stored in USD in MOCK_STATE)
7. Transaction list in Fund History tab updates after buy/sell (new entry appears at top)
8. No console errors on page load or button clicks

---

## What NOT to change

- Do not modify the tab navigation system (`initTabs`, `initSubTabs`)
- Do not change `renderBalance()`, `drawLineChart()`, or `renderSIP()` — just call them
- Do not add new `<script>` tags — all JS stays in `app.js`
- Do not change `styles.css` font-face declarations or existing layout classes
- Do not change anything in `design-a/` or `index.html` (the A/B shell)
