// ========================================
// TRANSACTION HISTORY FUNCTIONS
// ========================================

// Load all transaction histories
async function loadTransactionHistory() {
  if (!currentUser || isAdmin) return;
  
  const container = document.getElementById("ordersContainer");
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading transaction history...</div>';
  
  try {
    // Fetch all histories in parallel
    const [orders, investments, redemptions, recharges, withdrawals] = await Promise.all([
      fetchUserOrders(),
      fetchUserInvestments(),
      fetchUserRedemptions(),
      fetchUserRecharges(),
      fetchUserWithdrawals()
    ]);
    
    // Combine all transactions
    let allTransactions = [];
    
    // Add orders
    orders.forEach(order => {
      allTransactions.push({
        type: 'order',
        typeIcon: '📦',
        typeLabel: 'Order',
        typeColor: '#4caf50',
        timestamp: order.timestamp,
        date: new Date(order.timestamp).toLocaleString(),
        title: `Order #${order.orderId || order.timestamp.substring(0, 8)}`,
        details: order.orderList,
        amount: order.totalPrice,
        status: order.status,
        statusClass: getStatusClass(order.status)
      });
    });
    
    // Add investments
    investments.forEach(inv => {
      allTransactions.push({
        type: 'investment',
        typeIcon: '📈',
        typeLabel: 'Investment',
        typeColor: '#9c27b0',
        timestamp: inv.timestamp,
        date: new Date(inv.timestamp).toLocaleString(),
        title: inv.investmentType,
        details: `Expected Return: ₱${parseFloat(inv.expectedReturn).toLocaleString()} | Matures: ${inv.maturityDate ? new Date(inv.maturityDate).toLocaleDateString() : 'N/A'}`,
        amount: `-₱${parseFloat(inv.amount).toLocaleString()}`,
        status: inv.status,
        statusClass: getInvestmentStatusClass(inv.status, inv.maturityDate)
      });
    });
    
    // Add redemptions
    redemptions.forEach(red => {
      allTransactions.push({
        type: 'redemption',
        typeIcon: '🎫',
        typeLabel: 'Code Redemption',
        typeColor: '#ff9800',
        timestamp: red.timestamp,
        date: new Date(red.timestamp).toLocaleString(),
        title: `Code: ${red.codeInput}`,
        details: red.reward,
        amount: `+₱${extractAmountFromReward(red.reward)}`,
        status: 'Completed',
        statusClass: 'status-completed'
      });
    });
    
    // Add recharges
    recharges.forEach(rec => {
      let amountDisplay = rec.status === 'Approved' ? `+₱${parseFloat(rec.amount).toLocaleString()}` : `₱${parseFloat(rec.amount).toLocaleString()}`;
      allTransactions.push({
        type: 'recharge',
        typeIcon: '💰',
        typeLabel: 'Recharge',
        typeColor: '#2196f3',
        timestamp: rec.timestamp,
        date: new Date(rec.timestamp).toLocaleString(),
        title: `${rec.method} Recharge`,
        details: rec.reference ? `Reference: ${rec.reference}` : '',
        amount: amountDisplay,
        status: rec.status,
        statusClass: getRechargeStatusClass(rec.status)
      });
    });
    
    // Add withdrawals
    withdrawals.forEach(wd => {
      let amountDisplay = wd.status === 'Completed' || wd.status === 'Approved' ? `-₱${parseFloat(wd.amount).toLocaleString()}` : `₱${parseFloat(wd.amount).toLocaleString()}`;
      allTransactions.push({
        type: 'withdrawal',
        typeIcon: '💸',
        typeLabel: 'Withdrawal',
        typeColor: '#f44336',
        timestamp: wd.timestamp,
        date: new Date(wd.timestamp).toLocaleString(),
        title: `${wd.method} Withdrawal`,
        details: wd.receiverName ? `To: ${wd.receiverName} (${wd.receiverNumber})` : '',
        amount: amountDisplay,
        status: wd.status,
        statusClass: getWithdrawalStatusClass(wd.status)
      });
    });
    
    // Sort by timestamp (newest first)
    allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (allTransactions.length === 0) {
      container.innerHTML = `
        <div class="empty-orders">
          <i class="fas fa-receipt" style="font-size: 4rem; color: #e63946; margin-bottom: 20px;"></i>
          <p>No transactions yet. Start shopping!</p>
          <button class="btn-primary-apple" onclick="switchPage('shop')" style="margin-top: 20px;">Shop Now</button>
        </div>
      `;
      return;
    }
    
    // Render all transactions
    container.innerHTML = `
      <div class="transaction-filters">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="order">📦 Orders</button>
        <button class="filter-btn" data-filter="investment">📈 Investments</button>
        <button class="filter-btn" data-filter="redemption">🎫 Redemptions</button>
        <button class="filter-btn" data-filter="recharge">💰 Recharges</button>
        <button class="filter-btn" data-filter="withdrawal">💸 Withdrawals</button>
      </div>
      <div id="transactionsList" class="transactions-list">
        ${allTransactions.map(t => renderTransactionCard(t)).join('')}
      </div>
    `;
    
    // Add filter functionality
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        filterTransactions(filter);
      });
    });
    
  } catch (error) {
    console.error("Load transaction history error:", error);
    container.innerHTML = `<div class="empty-orders"><i class="fas fa-exclamation-circle" style="font-size: 4rem; color: #e63946;"></i><p>Failed to load transactions. Please try again.</p><button class="btn-primary-apple" onclick="loadTransactionHistory()">Try Again</button></div>`;
  }
}

function renderTransactionCard(t) {
  let amountClass = t.amount.startsWith('+') ? 'amount-positive' : (t.amount.startsWith('-') ? 'amount-negative' : '');
  
  return `
    <div class="transaction-card" data-type="${t.type}">
      <div class="transaction-icon" style="background: ${t.typeColor}20; color: ${t.typeColor};">
        ${t.typeIcon}
      </div>
      <div class="transaction-details">
        <div class="transaction-header">
          <span class="transaction-type">${t.typeLabel}</span>
          <span class="transaction-date">${t.date}</span>
        </div>
        <div class="transaction-title">${escapeHtml(t.title)}</div>
        ${t.details ? `<div class="transaction-info">${escapeHtml(t.details)}</div>` : ''}
        <div class="transaction-footer">
          <span class="transaction-amount ${amountClass}">${t.amount}</span>
          <span class="transaction-status ${t.statusClass}">${t.status || 'Pending'}</span>
        </div>
      </div>
    </div>
  `;
}

function filterTransactions(type) {
  const cards = document.querySelectorAll('.transaction-card');
  if (type === 'all') {
    cards.forEach(card => card.style.display = 'flex');
  } else {
    cards.forEach(card => {
      if (card.getAttribute('data-type') === type) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }
}

// Fetch functions
async function fetchUserOrders() {
  const formData = new URLSearchParams();
  formData.append("action", "getUserOrders");
  formData.append("phone", currentUser.phone);
  const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
  return await response.json();
}

async function fetchUserInvestments() {
  const formData = new URLSearchParams();
  formData.append("action", "getUserCreditInvestments");
  formData.append("phone", currentUser.phone);
  const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
  return await response.json();
}

async function fetchUserRedemptions() {
  const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getUserRedemptions&phone=${currentUser.phone}`);
  return await response.json();
}

async function fetchUserRecharges() {
  const formData = new URLSearchParams();
  formData.append("action", "getUserRecharges");
  formData.append("phone", currentUser.phone);
  const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
  return await response.json();
}

async function fetchUserWithdrawals() {
  const formData = new URLSearchParams();
  formData.append("action", "getUserWithdrawals");
  formData.append("phone", currentUser.phone);
  const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
  return await response.json();
}

// Helper functions
function getStatusClass(status) {
  const s = (status || "Pending").toLowerCase();
  if (s === 'pending') return 'status-pending';
  if (s === 'approved') return 'status-approved';
  if (s === 'completed') return 'status-completed';
  if (s === 'cancelled') return 'status-cancelled';
  return 'status-pending';
}

function getInvestmentStatusClass(status, maturityDate) {
  if (status === 'Completed' || status === 'Matured') return 'status-completed';
  if (maturityDate && new Date(maturityDate) <= new Date()) return 'status-completed';
  return 'status-approved';
}

function getRechargeStatusClass(status) {
  const s = (status || "Pending").toLowerCase();
  if (s === 'pending') return 'status-pending';
  if (s === 'approved') return 'status-approved';
  if (s === 'cancelled') return 'status-cancelled';
  return 'status-pending';
}

function getWithdrawalStatusClass(status) {
  const s = (status || "Pending").toLowerCase();
  if (s === 'pending') return 'status-pending';
  if (s === 'processing') return 'status-processing';
  if (s === 'completed') return 'status-completed';
  if (s === 'rejected') return 'status-cancelled';
  return 'status-pending';
}

function extractAmountFromReward(reward) {
  const match = reward.match(/₱(\d+)/);
  return match ? match[1] : '0';
}