/* ════════════════════════════════════════════════════════════
   ComTech Gold — Static UI  |  app.js
   All Redux / Axios / Socket.IO / Firebase calls replaced
   with local mock data constants and localStorage state.
   No external dependencies. Pure ES6.
════════════════════════════════════════════════════════════ */

// ══════════════════════════════════════
// MOCK DATA  (replaces all API calls)
// ══════════════════════════════════════

const MOCK_STATE = {
  user: {
    name: 'Ashwin Menon',
    initials: 'AM',
    unreadNotifications: 3,
  },

  // Replaces: dispatch(getBalance()) → api.get('/user/getbalance')
  fund: {
    fundTotal:           3500.21,
    goldTotal:           103.12,
    totalPurchaseGoldGm: 130.00,
    totalSoldGoldGm:      26.88,
    totalDeposited:      5200.00,
    totalWithdrawn:      1699.79,
  },

  // Replaces: socket.io price feed + api.get('/conversionRate')
  buyGm:          228.94,           // AED per gram (live price — hardcoded)
  conversionRate: [{ buyConversion: 3.6725 }], // 1 USD = 3.6725 AED

  // Replaces: dispatch(getBuyGoldHistory()) + dispatch(getSellGoldHistory())
  transactions: [
    { id: 1, type: 'buy',  amount: 500.00,  goldGm: 8.0100,  status: 'Completed', date: '2024-06-15', paymentMethod: 'My Deposit' },
    { id: 2, type: 'buy',  amount: 250.00,  goldGm: 4.0000,  status: 'Pending',   date: '2024-06-10', paymentMethod: 'Online Payment' },
    { id: 3, type: 'buy',  amount: 1000.00, goldGm: 16.0100, status: 'Completed', date: '2024-06-05', paymentMethod: 'My Deposit' },
    { id: 4, type: 'sell', amount: 300.00,  goldGm: 4.8000,  status: 'Completed', date: '2024-06-12', paymentMethod: 'Sell Gold' },
    { id: 5, type: 'sell', amount: 150.00,  goldGm: 2.4000,  status: 'Rejected',  date: '2024-06-08', paymentMethod: 'Sell Gold' },
    { id: 6, type: 'sell', amount: 450.00,  goldGm: 7.2000,  status: 'Completed', date: '2024-06-03', paymentMethod: 'Sell Gold' },
  ],

  // Replaces: dispatch(getFundHistory())
  walletDeposits: [
    { id: 1, amount: 3000.00, date: '2024-06-01', method: 'Bank Transfer',  status: 'Completed' },
    { id: 2, amount: 2200.00, date: '2024-05-18', method: 'Online Payment', status: 'Completed' },
  ],

  // Replaces: dispatch(getBuyGoldHistory()) gold send/receive
  goldHistory: [
    { id: 1, direction: 'receive', goldGm: 10.5000, from: 'Ali Hassan',   date: '2024-06-14', status: 'Completed' },
    { id: 2, direction: 'receive', goldGm:  5.2500, from: 'Priya Sharma', date: '2024-06-07', status: 'Completed' },
    { id: 3, direction: 'send',    goldGm:  8.0000, to:   'Omar Farouk',  date: '2024-06-10', status: 'Completed' },
    { id: 4, direction: 'send',    goldGm:  3.7500, to:   'Sara Ahmed',   date: '2024-06-04', status: 'Pending'   },
  ],

  // Replaces: dispatch(getSipList())
  sip: [
    {
      id: 1, name: 'Monthly Accumulator',
      amount: 200, goldGm: 3.2000, frequency: 'Monthly',
      nextDate: '2024-07-01', status: 'active',
      totalInvested: 1200, totalGold: 19.2000,
    },
    {
      id: 2, name: 'Weekly Gold Saver',
      amount: 50, goldGm: 0.8000, frequency: 'Weekly',
      nextDate: '2024-06-28', status: 'paused',
      totalInvested: 600, totalGold: 9.6000,
    },
  ],
};

// Chart data for each period selector option
// Replaces: api price-history endpoints
const CHART_DATA = {
  Daily: [
    { label: 'Mon', value: 58 }, { label: 'Tue', value: 61 },
    { label: 'Wed', value: 59 }, { label: 'Thu', value: 63 },
    { label: 'Fri', value: 65 }, { label: 'Sat', value: 62 },
  ],
  Weekly: [
    { label: 'W1', value: 55 }, { label: 'W2', value: 60 },
    { label: 'W3', value: 57 }, { label: 'W4', value: 68 },
  ],
  Monthly: [
    { label: 'Jan', value: 30 }, { label: 'Feb', value: 50 },
    { label: 'Mar', value: 40 }, { label: 'Apr', value: 60 },
    { label: 'May', value: 55 }, { label: 'Jun', value: 75 },
  ],
  Yearly: [
    { label: '2020', value: 40 }, { label: '2021', value: 55 },
    { label: '2022', value: 48 }, { label: '2023', value: 70 },
    { label: '2024', value: 80 },
  ],
};

// ══════════════════════════════════════
// SESSION STATE  (persisted to localStorage)
// ══════════════════════════════════════

// Replaces: api.auth.updateCurrency() → api.post('/user/currency', {currency})
let currentCurrency = localStorage.getItem('cgold_currency') || 'USD';
// Replaces: selectedPeriod state in Dashboard.jsx
let currentPeriod   = localStorage.getItem('cgold_period')   || 'Monthly';

// ══════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════

function fmt2(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toAED(usd) {
  return usd * MOCK_STATE.conversionRate[0].buyConversion;
}

function toUSD(aed) {
  return aed / MOCK_STATE.conversionRate[0].buyConversion;
}

// ══════════════════════════════════════
// BALANCE RENDERING
// Replaces: GoldValueComponent currency display logic
// ══════════════════════════════════════

function renderBalance() {
  const { fundTotal, goldTotal, totalDeposited, totalWithdrawn } = MOCK_STATE.fund;
  const isAED = currentCurrency === 'AED';
  const sym   = isAED ? 'AED ' : '$ ';

  // Hero cash balance
  const displayBalance = isAED ? toAED(fundTotal) : fundTotal;
  document.getElementById('hero-symbol').textContent        = isAED ? 'AED' : '$';
  document.getElementById('hero-balance').textContent       = fmt2(displayBalance);
  document.getElementById('hero-currency-name').textContent = currentCurrency;
  document.getElementById('currency-label').textContent     = currentCurrency;

  // Gold holding value: weight × buyGm (AED/g) → display currency
  const goldValueAED     = goldTotal * MOCK_STATE.buyGm;
  const goldValueDisplay = isAED ? goldValueAED : toUSD(goldValueAED);
  const fiatSymbol       = isAED ? 'AED' : '$';

  const [intPart, decPart] = goldTotal.toFixed(2).split('.');
  document.getElementById('h-int').textContent  = intPart;
  document.getElementById('h-dec').textContent  = '.' + decPart + 'g';
  document.getElementById('h-fiat').textContent = fiatSymbol + ' ' + fmt2(goldValueDisplay);

  // Wallet tab — keep in sync with currency
  var walletBal = document.getElementById('wallet-balance-display');
  if (walletBal) walletBal.textContent = sym + fmt2(displayBalance);

  var walletDep = document.getElementById('wallet-deposited');
  if (walletDep) walletDep.textContent = sym + fmt2(isAED ? toAED(totalDeposited) : totalDeposited);

  var walletWith = document.getElementById('wallet-withdrawn');
  if (walletWith) walletWith.textContent = sym + fmt2(isAED ? toAED(totalWithdrawn) : totalWithdrawn);
}

// ══════════════════════════════════════
// SVG LINE CHART
// Replaces: react-native-gifted-charts UniversalChart
// ══════════════════════════════════════

function getCurvedPath(pts) {
  if (pts.length < 2) return '';
  let d = 'M' + pts[0].x.toFixed(1) + ',' + pts[0].y.toFixed(1);
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const mx = ((p.x + c.x) / 2).toFixed(1);
    d += ' C' + mx + ',' + p.y.toFixed(1) + ' ' + mx + ',' + c.y.toFixed(1) + ' ' + c.x.toFixed(1) + ',' + c.y.toFixed(1);
  }
  return d;
}

function drawLineChart(period) {
  const svg = document.getElementById('chart-svg');
  if (!svg) return;

  const data = CHART_DATA[period] || CHART_DATA.Monthly;
  const W = 320, H = 120;
  const padL = 10, padR = 10, padT = 12, padB = 28;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const values = data.map(function(d) { return d.value; });
  const minV = Math.min.apply(null, values);
  const maxV = Math.max.apply(null, values);
  const range = maxV - minV || 1;

  const pts = data.map(function(d, i) {
    return {
      x: padL + (i / (data.length - 1)) * cW,
      y: padT + cH - ((d.value - minV) / range) * cH,
      label: d.label,
    };
  });

  const linePath = getCurvedPath(pts);
  const last  = pts[pts.length - 1];
  const first = pts[0];
  const areaPath = linePath
    + ' L' + last.x.toFixed(1)  + ',' + (padT + cH).toFixed(1)
    + ' L' + first.x.toFixed(1) + ',' + (padT + cH).toFixed(1)
    + ' Z';

  const dots = pts.map(function(p) {
    return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3.5" fill="#F9D58C" stroke="#fff" stroke-width="1.5"/>';
  }).join('');

  const labels = pts.map(function(p) {
    return '<text x="' + p.x.toFixed(1) + '" y="' + (H - 5).toFixed(1) + '" text-anchor="middle" font-size="9.5" fill="#737373" font-family="sans-serif">' + p.label + '</text>';
  }).join('');

  svg.innerHTML =
    '<defs>' +
      '<linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#F9D58C" stop-opacity="0.55"/>' +
        '<stop offset="100%" stop-color="#FFF9EB" stop-opacity="0.05"/>' +
      '</linearGradient>' +
    '</defs>' +
    '<path d="' + areaPath + '" fill="url(#cg)"/>' +
    '<path d="' + linePath + '" fill="none" stroke="#F9D58C" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
    dots + labels;
}

// ══════════════════════════════════════
// TAB NAVIGATION
// Replaces: React Navigation bottom tab navigator
// ══════════════════════════════════════

function initTabs() {
  var navItems = document.querySelectorAll('.nav-item');
  var panels   = document.querySelectorAll('.tab-panel');

  navItems.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var target = btn.getAttribute('data-tab');
      panels.forEach(function(p) { p.classList.remove('active'); });
      navItems.forEach(function(n) { n.classList.remove('active'); });
      var panel = document.getElementById(target);
      if (panel) panel.classList.add('active');
      btn.classList.add('active');
    });
  });
}

// ── Sub-tabs (Buy/Sell, Receive/Send) ──
function initSubTabs() {
  document.querySelectorAll('.sub-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var target = btn.getAttribute('data-sub');
      var group  = btn.closest('.sub-tabs').getAttribute('data-group');

      document.querySelectorAll('.sub-panel[data-group="' + group + '"]').forEach(function(p) {
        p.classList.remove('active');
      });
      btn.closest('.sub-tabs').querySelectorAll('.sub-tab-btn').forEach(function(b) {
        b.classList.remove('active');
      });

      var panel = document.getElementById(target);
      if (panel) panel.classList.add('active');
      btn.classList.add('active');
    });
  });
}

// ══════════════════════════════════════
// CURRENCY TOGGLE
// Replaces: api.auth.updateCurrency() → persists to localStorage only
// ══════════════════════════════════════

function initCurrencyToggle() {
  document.getElementById('currency-toggle').addEventListener('click', function() {
    currentCurrency = currentCurrency === 'USD' ? 'AED' : 'USD';
    localStorage.setItem('cgold_currency', currentCurrency);
    renderBalance();
    // Re-render currency-sensitive card lists
    var buyList  = document.getElementById('fund-buy');
    var sellList = document.getElementById('fund-sell');
    var depList  = document.getElementById('wallet-deposits');
    if (buyList)  buyList.innerHTML  = '';
    if (sellList) sellList.innerHTML = '';
    if (depList)  depList.innerHTML  = '';
    renderTransactions();
    renderWalletDeposits();
  });
}

// ══════════════════════════════════════
// PERIOD DROPDOWN
// Replaces: CustomDropdown + selectedPeriod state
// ══════════════════════════════════════

function initPeriodDropdown() {
  var btn  = document.getElementById('period-btn');
  var menu = document.getElementById('period-menu');

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });

  menu.querySelectorAll('.dropdown-item').forEach(function(item) {
    item.addEventListener('click', function() {
      currentPeriod = item.getAttribute('data-value');
      localStorage.setItem('cgold_period', currentPeriod);
      document.getElementById('period-label').textContent = currentPeriod;
      menu.querySelectorAll('.dropdown-item').forEach(function(i) { i.classList.remove('selected'); });
      item.classList.add('selected');
      menu.hidden = true;
      drawLineChart(currentPeriod);
    });
  });

  document.addEventListener('click', function() { menu.hidden = true; });
}

// ══════════════════════════════════════
// RENDER TRANSACTION CARDS
// Replaces: dispatch(getBuyGoldHistory()) / getSellGoldHistory()
// ══════════════════════════════════════

function renderTransactions() {
  var buyList  = document.getElementById('fund-buy');
  var sellList = document.getElementById('fund-sell');
  if (!buyList || !sellList) return;

  MOCK_STATE.transactions.forEach(function(tx) {
    var el = buildTxCard(tx);
    if (tx.type === 'buy') buyList.appendChild(el);
    else                   sellList.appendChild(el);
  });
}

function buildTxCard(tx) {
  var statusClass = { Completed: 'status-completed', Pending: 'status-pending', Rejected: 'status-rejected' }[tx.status] || '';
  var isBuy       = tx.type === 'buy';
  var amtColor    = isBuy ? '#000' : '#00A245';
  var amtPrefix   = isBuy ? '-' : '+';
  var iconStroke  = isBuy ? '#CE9214' : '#00A245';
  var iconPath    = isBuy
    ? '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'
    : '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>';

  var isAED      = currentCurrency === 'AED';
  var displayAmt = isAED ? toAED(tx.amount) : tx.amount;
  var sym        = isAED ? 'AED ' : '$ ';

  var div = document.createElement('div');
  div.className = 'tx-card';
  div.innerHTML =
    '<div class="tx-icon-wrap">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' + iconStroke + '" stroke-width="2">' + iconPath + '</svg>' +
    '</div>' +
    '<div class="tx-details">' +
      '<div class="tx-method">' + tx.paymentMethod + '</div>' +
      '<div class="tx-date">' + tx.date + '</div>' +
    '</div>' +
    '<div class="tx-right">' +
      '<div class="tx-amount" style="color:' + amtColor + '">' + amtPrefix + sym + fmt2(displayAmt) + '</div>' +
      '<div class="tx-gold">' + tx.goldGm.toFixed(4) + ' g</div>' +
      '<span class="tx-status ' + statusClass + '">' + tx.status + '</span>' +
    '</div>';
  return div;
}

// ══════════════════════════════════════
// RENDER WALLET DEPOSITS
// Replaces: dispatch(getFundHistory())
// ══════════════════════════════════════

function renderWalletDeposits() {
  var list = document.getElementById('wallet-deposits');
  if (!list) return;

  var isAED = currentCurrency === 'AED';
  var sym   = isAED ? 'AED ' : '$ ';

  MOCK_STATE.walletDeposits.forEach(function(dep) {
    var displayAmt = isAED ? toAED(dep.amount) : dep.amount;
    var div = document.createElement('div');
    div.className = 'tx-card';
    div.innerHTML =
      '<div class="tx-icon-wrap">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CE9214" stroke-width="2">' +
          '<line x1="12" y1="1" x2="12" y2="23"/>' +
          '<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' +
        '</svg>' +
      '</div>' +
      '<div class="tx-details">' +
        '<div class="tx-method">' + dep.method + '</div>' +
        '<div class="tx-date">' + dep.date + '</div>' +
      '</div>' +
      '<div class="tx-right">' +
        '<div class="tx-amount" style="color:#00A245">+' + sym + fmt2(displayAmt) + '</div>' +
        '<span class="tx-status status-completed">' + dep.status + '</span>' +
      '</div>';
    list.appendChild(div);
  });
}

// ══════════════════════════════════════
// RENDER GOLD HISTORY
// Replaces: dispatch(getGoldHistory()) (send/receive)
// ══════════════════════════════════════

function renderGoldHistory() {
  var receiveList = document.getElementById('gold-receive');
  var sendList    = document.getElementById('gold-send');
  if (!receiveList || !sendList) return;

  MOCK_STATE.goldHistory.forEach(function(entry) {
    var isReceive  = entry.direction === 'receive';
    var party      = isReceive ? 'From: ' + entry.from : 'To: ' + entry.to;
    var statusCls  = entry.status === 'Completed' ? 'status-completed' : 'status-pending';
    var iconColor  = isReceive ? '#00A245' : '#CE9214';
    var iconArrow  = isReceive
      ? '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>'
      : '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>';

    var div = document.createElement('div');
    div.className = 'tx-card';
    div.innerHTML =
      '<div class="tx-icon-wrap">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' + iconColor + '" stroke-width="2">' + iconArrow + '</svg>' +
      '</div>' +
      '<div class="tx-details">' +
        '<div class="tx-method">' + party + '</div>' +
        '<div class="tx-date">' + entry.date + '</div>' +
      '</div>' +
      '<div class="tx-right">' +
        '<div class="tx-amount">' + (isReceive ? '+' : '-') + entry.goldGm.toFixed(4) + ' g</div>' +
        '<span class="tx-status ' + statusCls + '">' + entry.status + '</span>' +
      '</div>';

    if (isReceive) receiveList.appendChild(div);
    else           sendList.appendChild(div);
  });
}

// ══════════════════════════════════════
// RENDER SIP PLANS
// Replaces: dispatch(getSipList())
// ══════════════════════════════════════

function renderSIP() {
  var list = document.getElementById('sip-list');
  if (!list) return;

  MOCK_STATE.sip.forEach(function(plan) {
    var statusCls   = plan.status === 'active' ? 'sip-active' : 'sip-paused';
    var statusLabel = plan.status === 'active' ? 'Active' : 'Paused';

    var div = document.createElement('div');
    div.className = 'sip-card';
    div.innerHTML =
      '<div class="sip-card-header">' +
        '<span class="sip-card-name">' + plan.name + '</span>' +
        '<span class="sip-status-badge ' + statusCls + '">' + statusLabel + '</span>' +
      '</div>' +
      '<div class="sip-row">' +
        '<div class="sip-cell"><span class="sip-label">Amount</span><span class="sip-value">$ ' + fmt2(plan.amount) + '</span></div>' +
        '<div class="sip-cell"><span class="sip-label">Gold / cycle</span><span class="sip-value">' + plan.goldGm.toFixed(4) + ' g</span></div>' +
        '<div class="sip-cell"><span class="sip-label">Frequency</span><span class="sip-value">' + plan.frequency + '</span></div>' +
      '</div>' +
      '<div class="sip-row" style="margin-top:10px">' +
        '<div class="sip-cell"><span class="sip-label">Total Invested</span><span class="sip-value">$ ' + fmt2(plan.totalInvested) + '</span></div>' +
        '<div class="sip-cell"><span class="sip-label">Total Gold</span><span class="sip-value">' + plan.totalGold.toFixed(4) + ' g</span></div>' +
        '<div class="sip-cell"><span class="sip-label">Next Date</span><span class="sip-value">' + plan.nextDate + '</span></div>' +
      '</div>';
    list.appendChild(div);
  });
}

// ══════════════════════════════════════
// TOAST NOTIFICATION
// Replaces: react-native-toast-message
// ══════════════════════════════════════

var toastTimer;
function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2800);
}

// ══════════════════════════════════════
// INITIALISE
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {

  // Restore period dropdown to saved value
  var periodItems = document.querySelectorAll('#period-menu .dropdown-item');
  periodItems.forEach(function(item) {
    item.classList.toggle('selected', item.getAttribute('data-value') === currentPeriod);
  });
  var periodLbl = document.getElementById('period-label');
  if (periodLbl) periodLbl.textContent = currentPeriod;

  renderBalance();
  drawLineChart(currentPeriod);
  initTabs();
  initSubTabs();
  initCurrencyToggle();
  initPeriodDropdown();
  renderTransactions();
  renderWalletDeposits();
  renderGoldHistory();
  renderSIP();
});
