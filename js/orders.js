// ========================================
// TRANSACTION HISTORY FUNCTIONS - WITH TRANSACTION IDs & VIRTUAL SCROLLING
// ========================================

// Store all transactions for virtual scrolling
let allTransactionsCache = [];
let currentFilteredTransactions = [];

// ========================================
// TRANSACTION ID HELPER (must be first)
// ========================================

function generateTransactionId(type, timestamp) {
    const date = timestamp ? new Date(timestamp) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const sequential = `${year}${month}${day}${hours}${minutes}${seconds}`;
    
    let prefix = '';
    switch(type) {
        case 'order': prefix = 'JLF-ORDER'; break;
        case 'withdrawal': prefix = 'JLF-WITHDRAW'; break;
        case 'recharge': prefix = 'JLF-RECHARGE'; break;
        case 'investment': prefix = 'JLF-INVESTMENT'; break;
        case 'redemption': prefix = 'JLF-REDEEM'; break;
        default: prefix = 'JLF-TXN';
    }
    
    return `${prefix}#${sequential}${randomNum.slice(0, 2)}`;
}

// ========================================
// LOAD TRANSACTION HISTORY
// ========================================

async function loadTransactionHistory() {
    if (!currentUser || isAdmin) {
        // Clear transactions when logged out
        const container = document.getElementById("ordersContainer");
        if (container) {
            container.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-receipt" style="font-size: 4rem; color: #e63946; margin-bottom: 20px;"></i>
                    <p>Please login to view your transactions.</p>
                    <button class="btn-primary-apple" onclick="openAccountModal()" style="margin-top: 20px;">Login / Register</button>
                </div>
            `;
        }
        return;
    }
    
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
        
        // Combine all transactions
        let allTransactions = [];
        
        // Add orders with transaction IDs
        if (orders && orders.length) {
            orders.forEach((order) => {
                const txId = generateTransactionId('order', order.timestamp);
                allTransactions.push({
                    type: 'order',
                    typeIcon: '📦',
                    typeLabel: 'Order',
                    typeColor: '#4caf50',
                    timestamp: order.timestamp,
                    date: order.timestamp ? new Date(order.timestamp).toLocaleString() : new Date().toLocaleString(),
                    title: `${txId}`,
                    details: order.orderList || '',
                    amount: order.totalPrice ? `₱${parseFloat(order.totalPrice).toLocaleString()}` : '₱0',
                    status: order.status || 'Pending',
                    statusClass: getStatusClass(order.status),
                    orderList: order.orderList,
                    transactionId: txId,
                    rawAmount: order.totalPrice || 0
                });
            });
        }
        
        // Add investments with transaction IDs
        if (investments && investments.length) {
            investments.forEach((inv) => {
                const txId = generateTransactionId('investment', inv.timestamp);
                allTransactions.push({
                    type: 'investment',
                    typeIcon: '📈',
                    typeLabel: 'Investment',
                    typeColor: '#9c27b0',
                    timestamp: inv.timestamp,
                    date: inv.timestamp ? new Date(inv.timestamp).toLocaleString() : new Date().toLocaleString(),
                    title: `${txId}`,
                    details: `${inv.investmentType || 'Investment'} | Expected Return: ₱${parseFloat(inv.expectedReturn || 0).toLocaleString()}`,
                    amount: `-₱${parseFloat(inv.amount || 0).toLocaleString()}`,
                    status: inv.status || 'Active',
                    statusClass: 'status-approved',
                    transactionId: txId
                });
            });
        }
        
        // Add redemptions with transaction IDs
        if (redemptions && redemptions.length) {
            redemptions.forEach((red) => {
                const txId = generateTransactionId('redemption', red.timestamp);
                const rewardAmount = red.reward ? (red.reward.match(/\d+/) || ['0'])[0] : '0';
                allTransactions.push({
                    type: 'redemption',
                    typeIcon: '🎫',
                    typeLabel: 'Code Redemption',
                    typeColor: '#ff9800',
                    timestamp: red.timestamp,
                    date: red.timestamp ? new Date(red.timestamp).toLocaleString() : new Date().toLocaleString(),
                    title: `${txId}`,
                    details: `Code: ${red.codeInput || 'N/A'} | Reward: ${red.reward || ''}`,
                    amount: `+₱${rewardAmount}`,
                    status: 'Completed',
                    statusClass: 'status-completed',
                    transactionId: txId
                });
            });
        }
        
        // Add recharges with transaction IDs
        if (recharges && recharges.length) {
            recharges.forEach((rec) => {
                const txId = generateTransactionId('recharge', rec.timestamp);
                let amountDisplay = rec.status === 'Approved' ? `+₱${parseFloat(rec.amount || 0).toLocaleString()}` : `₱${parseFloat(rec.amount || 0).toLocaleString()}`;
                allTransactions.push({
                    type: 'recharge',
                    typeIcon: '💰',
                    typeLabel: 'Recharge',
                    typeColor: '#2196f3',
                    timestamp: rec.timestamp,
                    date: rec.timestamp ? new Date(rec.timestamp).toLocaleString() : new Date().toLocaleString(),
                    title: `${txId}`,
                    details: `${rec.method || 'Unknown'} Recharge | Ref: ${rec.reference || 'N/A'}`,
                    amount: amountDisplay,
                    status: rec.status || 'Pending',
                    statusClass: rec.status === 'Approved' ? 'status-approved' : 'status-pending',
                    transactionId: txId
                });
            });
        }
        
        // Add withdrawals with transaction IDs
        if (withdrawals && withdrawals.length) {
            withdrawals.forEach((wd) => {
                const txId = generateTransactionId('withdrawal', wd.timestamp);
                let amountDisplay = (wd.status === 'Completed' || wd.status === 'Approved') ? `-₱${parseFloat(wd.amount || 0).toLocaleString()}` : `₱${parseFloat(wd.amount || 0).toLocaleString()}`;
                allTransactions.push({
                    type: 'withdrawal',
                    typeIcon: '💸',
                    typeLabel: 'Withdrawal',
                    typeColor: '#f44336',
                    timestamp: wd.timestamp,
                    date: wd.timestamp ? new Date(wd.timestamp).toLocaleString() : new Date().toLocaleString(),
                    title: `${txId}`,
                    details: `${wd.method || 'Unknown'} Withdrawal | To: ${wd.receiverName || 'N/A'}`,
                    amount: amountDisplay,
                    status: wd.status || 'Pending',
                    statusClass: wd.status === 'Completed' ? 'status-completed' : 'status-pending',
                    transactionId: txId
                });
            });
        }
        
        // Sort by timestamp (newest first)
        allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        allTransactionsCache = allTransactions;
        currentFilteredTransactions = [...allTransactions];
        
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
        
        // Render with filter buttons
        container.innerHTML = `
            <div class="transaction-filters">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="order">📦 Orders</button>
                <button class="filter-btn" data-filter="investment">📈 Investments</button>
                <button class="filter-btn" data-filter="redemption">🎫 Redemptions</button>
                <button class="filter-btn" data-filter="recharge">💰 Recharges</button>
                <button class="filter-btn" data-filter="withdrawal">💸 Withdrawals</button>
            </div>
            <div id="transactionsList" class="transactions-list"></div>
        `;
        
        // Initialize virtual scrolling
        initVirtualScroll(currentFilteredTransactions);
        
        // Add filter functionality
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.removeEventListener('click', handleFilterClick);
            btn.addEventListener('click', handleFilterClick);
        });
        
    } catch (error) {
        console.error("Load transaction history error:", error);
        container.innerHTML = `<div class="empty-orders"><i class="fas fa-exclamation-circle" style="font-size: 4rem; color: #e63946;"></i><p>Failed to load transactions. Error: ${error.message}</p><button class="btn-primary-apple" onclick="loadTransactionHistory()">Try Again</button></div>`;
    }
}

function handleFilterClick(e) {
    const btn = e.currentTarget;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.getAttribute('data-filter');
    filterTransactions(filter);
}

// Initialize virtual scrolling for transactions
function initVirtualScroll(transactions) {
    const container = document.getElementById('transactionsList');
    if (!container) return;
    
    // Simple virtual scrolling implementation
    let visibleCount = 20;
    let startIndex = 0;
    let isLoading = false;
    
    function renderVisibleTransactions() {
        const endIndex = Math.min(startIndex + visibleCount, transactions.length);
        const visibleTransactions = transactions.slice(startIndex, endIndex);
        
        container.innerHTML = visibleTransactions.map(t => renderTransactionCard(t)).join('');
        
        // Add scroll event listener for lazy loading
        if (transactions.length > visibleCount) {
            container.removeEventListener('scroll', handleScroll);
            container.addEventListener('scroll', handleScroll);
        }
    }
    
    function handleScroll() {
        if (isLoading) return;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        
        if (scrollTop + clientHeight >= scrollHeight - 200) {
            isLoading = true;
            if (startIndex + visibleCount < transactions.length) {
                startIndex += visibleCount;
                renderVisibleTransactions();
            }
            isLoading = false;
        }
    }
    
    renderVisibleTransactions();
}

// Render transaction card with Order Again button and Copy ID
function renderTransactionCard(t) {
    let amountClass = t.amount.toString().startsWith('+') ? 'amount-positive' : (t.amount.toString().startsWith('-') ? 'amount-negative' : '');
    
    // Add Order Again button for completed orders
    let orderAgainHtml = '';
    if (t.type === 'order' && t.status === 'Completed' && t.orderList) {
        const orderListEscaped = (t.orderList || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        orderAgainHtml = `
            <button class="order-again-btn" onclick="orderAgainFromHistory('${orderListEscaped}', ${t.rawAmount || 0})">
                <i class="fas fa-redo-alt"></i> Order Again
            </button>
        `;
    }
    
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
                <div class="transaction-title">
                    <span class="transaction-id-badge" onclick="copyTransactionId('${t.transactionId}', this)" style="cursor: pointer;">
                        <i class="fas fa-copy"></i>
                        <span style="font-family: monospace; font-size: 0.7rem;">${t.transactionId}</span>
                    </span>
                </div>
                ${t.details ? `<div class="transaction-info">${escapeHtml(t.details)}</div>` : ''}
                <div class="transaction-footer">
                    <span class="transaction-amount ${amountClass}">${t.amount}</span>
                    <span class="transaction-status ${t.statusClass}">${t.status || 'Pending'}</span>
                    ${orderAgainHtml}
                </div>
            </div>
        </div>
    `;
}

// Order again from transaction history
async function orderAgainFromHistory(orderListStr, totalAmount) {
    if (!currentUser || isAdmin) {
        if (typeof showToast === 'function') showToast("Please login to reorder", 1500);
        if (typeof openAccountModal === 'function') openAccountModal();
        return;
    }
    
    if (!orderListStr) {
        if (typeof showToast === 'function') showToast("Cannot reorder: Order data missing", 1500);
        return;
    }
    
    // Parse the order list string back to cart items
    let itemsToAdd = [];
    
    try {
        // Try to parse as JSON first
        if (orderListStr.startsWith('[')) {
            itemsToAdd = JSON.parse(orderListStr);
        } else {
            // Parse from formatted string (e.g., "Product x1, Product2 x2")
            const parts = orderListStr.split(',');
            for (const part of parts) {
                const match = part.trim().match(/(.+?)\s*x(\d+)$/i);
                if (match) {
                    const productName = match[1].trim();
                    const quantity = parseInt(match[2]);
                    
                    // Find product by name
                    const product = products.find(p => p.name === productName);
                    if (product && quantity > 0) {
                        itemsToAdd.push({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: quantity,
                            image: product.image || '🎆'
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error parsing order list:", e);
        if (typeof showToast === 'function') showToast("Cannot reorder: Invalid order format", 1500);
        return;
    }
    
    if (itemsToAdd.length === 0) {
        if (typeof showToast === 'function') showToast("No items found to reorder", 1500);
        return;
    }
    
    // Add items to cart
    let addedCount = 0;
    for (const item of itemsToAdd) {
        const existingItem = cart.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image || '🎆',
                category: item.category || 'Others'
            });
        }
        addedCount += item.quantity;
    }
    
    // Save cart
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof saveCartToLocal === 'function') saveCartToLocal();
    if (typeof renderCartUI === 'function') renderCartUI();
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    
    if (typeof showToast === 'function') showToast(`✅ Added ${addedCount} item(s) to cart!`, 2000);
    
    // Open cart drawer to show items
    setTimeout(() => {
        if (typeof openCartDrawer === 'function') openCartDrawer();
        else {
            const drawer = document.getElementById('cartDrawer');
            const overlay = document.getElementById('cartOverlay');
            if (drawer) drawer.classList.add('open');
            if (overlay) overlay.classList.add('open');
        }
    }, 500);
}

function filterTransactions(type) {
    if (type === 'all') {
        currentFilteredTransactions = [...allTransactionsCache];
    } else {
        currentFilteredTransactions = allTransactionsCache.filter(t => t.type === type);
    }
    
    // Re-render with virtual scrolling for filtered results
    const container = document.getElementById('transactionsList');
    if (!container) return;
    
    if (currentFilteredTransactions.length === 0) {
        container.innerHTML = '<div class="empty-state">No transactions found for this filter.</div>';
        return;
    }
    
    initVirtualScroll(currentFilteredTransactions);
}

// Clear transaction history on logout
function clearTransactionHistory() {
    allTransactionsCache = [];
    currentFilteredTransactions = [];
    const container = document.getElementById("ordersContainer");
    if (container) {
        container.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-receipt" style="font-size: 4rem; color: #e63946; margin-bottom: 20px;"></i>
                <p>Please login to view your transactions.</p>
                <button class="btn-primary-apple" onclick="openAccountModal()" style="margin-top: 20px;">Login / Register</button>
            </div>
        `;
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

function getStatusClass(status) {
    const s = (status || "Pending").toLowerCase();
    if (s === 'pending') return 'status-pending';
    if (s === 'approved') return 'status-approved';
    if (s === 'completed') return 'status-completed';
    if (s === 'cancelled') return 'status-cancelled';
    if (s === 'processing') return 'status-processing';
    return 'status-pending';
}

// Helper function to escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Make functions global
window.loadTransactionHistory = loadTransactionHistory;
window.clearTransactionHistory = clearTransactionHistory;
window.orderAgainFromHistory = orderAgainFromHistory;
window.filterTransactions = filterTransactions;
window.generateTransactionId = generateTransactionId;