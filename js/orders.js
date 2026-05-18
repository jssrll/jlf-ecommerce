// ========================================
// TRANSACTION HISTORY - FULL REWRITE
// Virtual scrolling, Transaction IDs, Order Again, Haptic
// ========================================

const VIRTUAL_SCROLL_PAGE = 20;
let allTransactionsCache = [];
let virtualPage = 0;
let currentFilter = 'all';

function stableTransactionId(type, timestamp) {
  const ts = new Date(timestamp).getTime();
  const seed = String(Math.abs(ts % 90000000) + 10000000);
  const map = {
    order:      `JLF-ORDER#${seed}`,
    withdrawal: `JLF-Withdraw#${seed}`,
    recharge:   `JLF-Recharge#${seed}`,
    investment: `JLF-Investment#${seed}`,
    redemption: `JLF-Redeem#${seed}`
  };
  return map[type] || `JLF-TXN#${seed}`;
}

function hapticFeedback(type) {
  if (!navigator.vibrate) return;
  const p = { light:[30], medium:[50], success:[30,50,30], error:[100,50,100] };
  navigator.vibrate(p[type] || p.light);
}

function copyAccountId() {
  if (!currentUser) return;
  const id = currentUser.id;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(id).then(() => {
      hapticFeedback('success');
      showToast('✅ Account ID copied!', 1500);
    });
  } else {
    const ta = document.createElement('textarea');
    ta.value = id;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    hapticFeedback('success');
    showToast('✅ Account ID copied!', 1500);
  }
}

function orderAgain(orderListEncoded) {
  if (!currentUser || isAdmin) { showToast("Please login first", 1500); openAccountModal(); return; }
  const orderList = orderListEncoded;
  if (!orderList) return;
  const items = orderList.split(', ');
  let added = 0;
  items.forEach(itemStr => {
    const match = itemStr.match(/^(.+?) x(\d+)/);
    if (match) {
      const name = match[1].trim();
      const qty = parseInt(match[2]);
      const product = products.find(p => p.name === name);
      if (product) {
        const existing = cart.find(c => c.id === product.id);
        if (existing) existing.quantity += qty;
        else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: qty });
        added++;
      }
    }
  });
  if (added > 0) {
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof saveCartToLocal === 'function') saveCartToLocal();
    if (typeof renderCartUI === 'function') renderCartUI();
    hapticFeedback('success');
    showToast(`🛒 ${added} item(s) re-added to cart!`, 2000);
  } else {
    showToast('Could not find items to re-add.', 1500);
  }
}

async function loadTransactionHistory() {
  const container = document.getElementById("ordersContainer");
  if (!container) return;

  if (!currentUser || isAdmin) {
    container.innerHTML = `
      <div class="empty-orders">
        <i class="fas fa-receipt" style="font-size:4rem;color:#e63946;margin-bottom:20px;"></i>
        <p>Please login to view your transactions.</p>
        <button class="btn-primary-apple" onclick="openAccountModal()" style="margin-top:20px;">Login</button>
      </div>`;
    return;
  }

  container.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin"></i> Loading transactions...</div>';

  try {
    const [orders, investments, redemptions, recharges, withdrawals] = await Promise.all([
      safeFetch('getUserOrders', currentUser.phone),
      safeFetch('getUserCreditInvestments', currentUser.phone),
      safeFetch('getUserRedemptions', currentUser.phone),
      safeFetch('getUserRecharges', currentUser.phone),
      safeFetch('getUserWithdrawals', currentUser.phone)
    ]);

    allTransactionsCache = [];

    (orders || []).forEach(order => {
      allTransactionsCache.push({
        type: 'order', typeIcon: '📦', typeLabel: 'Order', typeColor: '#4caf50',
        timestamp: order.timestamp,
        date: order.timestamp ? new Date(order.timestamp).toLocaleString() : '',
        txnId: stableTransactionId('order', order.timestamp),
        details: order.orderList || '',
        orderList: order.orderList || '',
        amount: order.totalPrice ? `₱${parseFloat(order.totalPrice).toLocaleString()}` : '₱0',
        status: order.status || 'Pending',
        statusClass: getStatusClass(order.status)
      });
    });

    (investments || []).forEach(inv => {
      allTransactionsCache.push({
        type: 'investment', typeIcon: '📈', typeLabel: 'Investment', typeColor: '#9c27b0',
        timestamp: inv.timestamp,
        date: inv.timestamp ? new Date(inv.timestamp).toLocaleString() : '',
        txnId: stableTransactionId('investment', inv.timestamp),
        details: `${inv.investmentType || 'Investment'} · Expected Return: ₱${parseFloat(inv.expectedReturn || 0).toLocaleString()}`,
        orderList: '',
        amount: `-₱${parseFloat(inv.amount || 0).toLocaleString()}`,
        status: inv.status || 'Active',
        statusClass: 'status-approved'
      });
    });

    (redemptions || []).forEach(red => {
      const rewardNum = red.reward ? (red.reward.match(/\d+/) || ['0'])[0] : '0';
      allTransactionsCache.push({
        type: 'redemption', typeIcon: '🎫', typeLabel: 'Code Redemption', typeColor: '#ff9800',
        timestamp: red.timestamp,
        date: red.timestamp ? new Date(red.timestamp).toLocaleString() : '',
        txnId: stableTransactionId('redemption', red.timestamp),
        details: `Code: ${red.codeInput || 'N/A'} · ${red.reward || ''}`,
        orderList: '',
        amount: `+₱${rewardNum}`,
        status: 'Completed',
        statusClass: 'status-completed'
      });
    });

    (recharges || []).forEach(rec => {
      const amountDisplay = rec.status === 'Approved'
        ? `+₱${parseFloat(rec.amount || 0).toLocaleString()}`
        : `₱${parseFloat(rec.amount || 0).toLocaleString()}`;
      allTransactionsCache.push({
        type: 'recharge', typeIcon: '💰', typeLabel: 'Recharge', typeColor: '#2196f3',
        timestamp: rec.timestamp,
        date: rec.timestamp ? new Date(rec.timestamp).toLocaleString() : '',
        txnId: stableTransactionId('recharge', rec.timestamp),
        details: `${rec.method || 'Unknown'}${rec.reference ? ' · Ref: ' + rec.reference : ''}`,
        orderList: '',
        amount: amountDisplay,
        status: rec.status || 'Pending',
        statusClass: rec.status === 'Approved' ? 'status-approved' : 'status-pending'
      });
    });

    (withdrawals || []).forEach(wd => {
      const done = wd.status === 'Completed' || wd.status === 'Approved';
      allTransactionsCache.push({
        type: 'withdrawal', typeIcon: '💸', typeLabel: 'Withdrawal', typeColor: '#f44336',
        timestamp: wd.timestamp,
        date: wd.timestamp ? new Date(wd.timestamp).toLocaleString() : '',
        txnId: stableTransactionId('withdrawal', wd.timestamp),
        details: `${wd.method || 'Unknown'}${wd.receiverName ? ' · To: ' + wd.receiverName : ''}`,
        orderList: '',
        amount: done ? `-₱${parseFloat(wd.amount || 0).toLocaleString()}` : `₱${parseFloat(wd.amount || 0).toLocaleString()}`,
        status: wd.status || 'Pending',
        statusClass: wd.status === 'Completed' ? 'status-completed' : 'status-pending'
      });
    });

    allTransactionsCache.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (allTransactionsCache.length === 0) {
      container.innerHTML = `
        <div class="empty-orders">
          <i class="fas fa-receipt" style="font-size:4rem;color:#e63946;margin-bottom:20px;"></i>
          <p>No transactions yet. Start shopping!</p>
          <button class="btn-primary-apple" onclick="switchPage('shop')" style="margin-top:20px;">Shop Now</button>
        </div>`;
      return;
    }

    virtualPage = 0;
    currentFilter = 'all';
    renderTransactionPage(container);

  } catch (error) {
    console.error("Transaction load error:", error);
    container.innerHTML = `
      <div class="empty-orders">
        <i class="fas fa-exclamation-circle" style="font-size:4rem;color:#e63946;"></i>
        <p>Failed to load. ${error.message}</p>
        <button class="btn-primary-apple" onclick="loadTransactionHistory()">Try Again</button>
      </div>`;
  }
}

function getVisibleTransactions() {
  if (currentFilter === 'all') return allTransactionsCache;
  return allTransactionsCache.filter(t => t.type === currentFilter);
}

function renderTransactionPage(container) {
  const visible = getVisibleTransactions();
  const end = (virtualPage + 1) * VIRTUAL_SCROLL_PAGE;
  const slice = visible.slice(0, end);

  const filterBtns = ['all','order','investment','redemption','recharge','withdrawal'];
  const filterLabels = { all:'All', order:'📦 Orders', investment:'📈 Investments', redemption:'🎫 Redemptions', recharge:'💰 Recharges', withdrawal:'💸 Withdrawals' };

  container.innerHTML = `
    <div class="transaction-filters">
      ${filterBtns.map(f => `<button class="filter-btn ${currentFilter===f?'active':''}" data-filter="${f}">${filterLabels[f]}</button>`).join('')}
    </div>
    <div id="transactionsList" class="transactions-list">
      ${slice.map(t => renderTransactionCard(t)).join('')}
    </div>
    ${end < visible.length ? `
    <div style="text-align:center;padding:16px;">
      <button class="btn-secondary-apple" onclick="loadMoreTransactions()">
        <i class="fas fa-chevron-down"></i> Load More (${visible.length - end} remaining)
      </button>
    </div>` : ''}
    <div style="text-align:center;padding:8px 0 16px;color:#8e8e93;font-size:0.75rem;">
      Showing ${Math.min(end, visible.length)} of ${visible.length} transactions
    </div>
  `;

  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.getAttribute('data-filter');
      virtualPage = 0;
      renderTransactionPage(container);
    });
  });
}

function loadMoreTransactions() {
  virtualPage++;
  const container = document.getElementById("ordersContainer");
  if (container) renderTransactionPage(container);
}

async function safeFetch(action, phone) {
  try {
    const url = `${GOOGLE_SHEETS_URL}?action=${action}&phone=${encodeURIComponent(phone)}`;
    const response = await fetch(url);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching ${action}:`, error);
    return [];
  }
}

function renderTransactionCard(t) {
  const amountClass = t.amount.toString().startsWith('+') ? 'amount-positive'
    : (t.amount.toString().startsWith('-') ? 'amount-negative' : '');

  // Escape orderList for use in onclick attribute
  const safeOrderList = (t.orderList || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const orderAgainBtn = (t.type === 'order' && t.orderList)
    ? `<button class="btn-order-again" onclick="orderAgain('${safeOrderList}')"><i class="fas fa-redo"></i> Order Again</button>`
    : '';

  return `
    <div class="transaction-card" data-type="${t.type}">
      <div class="transaction-icon" style="background:${t.typeColor}20;color:${t.typeColor};">${t.typeIcon}</div>
      <div class="transaction-details">
        <div class="transaction-header">
          <span class="transaction-type">${t.typeLabel}</span>
          <span class="transaction-date">${t.date}</span>
        </div>
        <div class="transaction-title" style="font-size:0.78rem;font-family:monospace;color:#3a3a3c;margin-bottom:2px;">${escapeHtml(t.txnId)}</div>
        ${t.details ? `<div class="transaction-info">${escapeHtml(t.details)}</div>` : ''}
        <div class="transaction-footer">
          <span class="transaction-amount ${amountClass}">${t.amount}</span>
          <span class="transaction-status ${t.statusClass}">${t.status || 'Pending'}</span>
        </div>
        ${orderAgainBtn}
      </div>
    </div>
  `;
}

function getStatusClass(status) {
  const s = (status || "Pending").toLowerCase();
  if (s === 'pending') return 'status-pending';
  if (s === 'approved') return 'status-approved';
  if (s === 'completed') return 'status-completed';
  if (s === 'cancelled') return 'status-cancelled';
  return 'status-pending';
}