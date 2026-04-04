// ========================================
// TRANSACTION HISTORY FUNCTIONS - FIXED
// ========================================

// Load all transaction histories
async function loadTransactionHistory() {
  if (!currentUser || isAdmin) return;
  
  const container = document.getElementById("ordersContainer");
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading transaction history...</div>';
  
  try {
    // Fetch all histories
    const orders = await safeFetch('getUserOrders', currentUser.phone);
    const investments = await safeFetch('getUserCreditInvestments', currentUser.phone);
    const redemptions = await safeFetch('getUserRedemptions', currentUser.phone);
    const recharges = await safeFetch('getUserRecharges', currentUser.phone);
    const withdrawals = await safeFetch('getUserWithdrawals', currentUser.phone);
    
    console.log("Orders:", orders);
    console.log("Investments:", investments);
    console.log("Redemptions:", redemptions);
    console.log("Recharges:", recharges);
    console.log("Withdrawals:", withdrawals);
    
    // Combine all transactions
    let allTransactions = [];
    
    // Add orders
    if (orders && orders.length) {
      orders.forEach(order => {
        allTransactions.push({
          type: 'order',
          typeIcon: '📦',
          typeLabel: 'Order',
          typeColor: '#4caf50',
          timestamp: order.timestamp,
          date: order.timestamp ? new Date(order.timestamp).toLocaleString() : new Date().toLocaleString(),
          title: `Order #${(order.timestamp || '').substring(0, 8)}`,
          details: order.orderList || '',
          amount: order.totalPrice ? `₱${parseFloat(order.totalPrice).toLocaleString()}` : '₱0',
          status: order.status || 'Pending',
          statusClass: getStatusClass(order.status)
        });
      });
    }
    
    // Add investments
    if (investments && investments.length) {
      investments.forEach(inv => {
        allTransactions.push({
          type: 'investment',
          typeIcon: '📈',
          typeLabel: 'Investment',
          typeColor: '#9c27b0',
          timestamp: inv.timestamp,
          date: inv.timestamp ? new Date(inv.timestamp).toLocaleString() : new Date().toLocaleString(),
          title: inv.investmentType || 'Investment',
          details: `Expected Return: ₱${parseFloat(inv.expectedReturn || 0).toLocaleString()}`,
          amount: `-₱${parseFloat(inv.amount || 0).toLocaleString()}`,
          status: inv.status || 'Active',
          statusClass: 'status-approved'
        });
      });
    }
    
    // Add redemptions
    if (redemptions && redemptions.length) {
      redemptions.forEach(red => {
        allTransactions.push({
          type: 'redemption',
          typeIcon: '🎫',
          typeLabel: 'Code Redemption',
          typeColor: '#ff9800',
          timestamp: red.timestamp,
          date: red.timestamp ? new Date(red.timestamp).toLocaleString() : new Date().toLocaleString(),
          title: `Code: ${red.codeInput || 'N/A'}`,
          details: red.reward || '',
          amount: '+₱' + (red.reward ? red.reward.match(/\d+/) || '0' : '0'),
          status: 'Completed',
          statusClass: 'status-completed'
        });
      });
    }
    
    // Add recharges
    if (recharges && recharges.length) {
      recharges.forEach(rec => {
        let amountDisplay = rec.status === 'Approved' ? `+₱${parseFloat(rec.amount || 0).toLocaleString()}` : `₱${parseFloat(rec.amount || 0).toLocaleString()}`;
        allTransactions.push({
          type: 'recharge',
          typeIcon: '💰',
          typeLabel: 'Recharge',
          typeColor: '#2196f3',
          timestamp: rec.timestamp,
          date: rec.timestamp ? new Date(rec.timestamp).toLocaleString() : new Date().toLocaleString(),
          title: `${rec.method || 'Unknown'} Recharge`,
          details: rec.reference ? `Reference: ${rec.reference}` : '',
          amount: amountDisplay,
          status: rec.status || 'Pending',
          statusClass: rec.status === 'Approved' ? 'status-approved' : 'status-pending'
        });
      });
    }
    
    // Add withdrawals
    if (withdrawals && withdrawals.length) {
      withdrawals.forEach(wd => {
        let amountDisplay = (wd.status === 'Completed' || wd.status === 'Approved') ? `-₱${parseFloat(wd.amount || 0).toLocaleString()}` : `₱${parseFloat(wd.amount || 0).toLocaleString()}`;
        allTransactions.push({
          type: 'withdrawal',
          typeIcon: '💸',
          typeLabel: 'Withdrawal',
          typeColor: '#f44336',
          timestamp: wd.timestamp,
          date: wd.timestamp ? new Date(wd.timestamp).toLocaleString() : new Date().toLocaleString(),
          title: `${wd.method || 'Unknown'} Withdrawal`,
          details: wd.receiverName ? `To: ${wd.receiverName}` : '',
          amount: amountDisplay,
          status: wd.status || 'Pending',
          statusClass: wd.status === 'Completed' ? 'status-completed' : 'status-pending'
        });
      });
    }
    
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
    container.innerHTML = `<div class="empty-orders"><i class="fas fa-exclamation-circle" style="font-size: 4rem; color: #e63946;"></i><p>Failed to load transactions. Error: ${error.message}</p><button class="btn-primary-apple" onclick="loadTransactionHistory()">Try Again</button></div>`;
  }
}

// Safe fetch function with POST support
async function safeFetch(action, phone) {
  try {
    let url = `${GOOGLE_SHEETS_URL}?action=${action}&phone=${encodeURIComponent(phone)}`;
    const response = await fetch(url);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching ${action}:`, error);
    return [];
  }
}

function renderTransactionCard(t) {
  let amountClass = t.amount.toString().startsWith('+') ? 'amount-positive' : (t.amount.toString().startsWith('-') ? 'amount-negative' : '');
  
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

function getStatusClass(status) {
  const s = (status || "Pending").toLowerCase();
  if (s === 'pending') return 'status-pending';
  if (s === 'approved') return 'status-approved';
  if (s === 'completed') return 'status-completed';
  if (s === 'cancelled') return 'status-cancelled';
  return 'status-pending';
}