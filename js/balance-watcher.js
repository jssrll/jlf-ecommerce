// ========================================
// BALANCE WATCHER SYSTEM
// Optimized for Google Sheets quota (5-second intervals)
// ========================================

let balanceWatcherActive = false;
let balanceWatcherIntervalId = null;
let lastBalance = 0;

// Start watching balance for changes
function startBalanceWatcher() {
    if (balanceWatcherActive) return;
    
    if (!currentUser || isAdmin) {
        console.log("Balance watcher: No user logged in");
        return;
    }
    
    balanceWatcherActive = true;
    lastBalance = currentUser.balance || 0;
    
    // Initial check
    checkBalanceChange();
    
    // Set interval every 5 seconds (optimized for sheets quota)
    balanceWatcherIntervalId = setInterval(() => {
        checkBalanceChange();
    }, 5000); // 5 seconds
    
    console.log("Balance watcher started (5s interval)");
}

// Stop watching balance
function stopBalanceWatcher() {
    if (balanceWatcherIntervalId) {
        clearInterval(balanceWatcherIntervalId);
        balanceWatcherIntervalId = null;
    }
    balanceWatcherActive = false;
    console.log("Balance watcher stopped");
}

// Check for balance changes
async function checkBalanceChange() {
    if (!currentUser || isAdmin) {
        stopBalanceWatcher();
        return;
    }
    
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getUsers`);
        const users = await response.json();
        const updatedUser = users.find(u => u.phone === currentUser.phone);
        
        if (updatedUser) {
            const newBalance = updatedUser.balance || 0;
            
            if (lastBalance !== newBalance) {
                const difference = newBalance - lastBalance;
                lastBalance = newBalance;
                
                // Update current user balance
                currentUser.balance = newBalance;
                localStorage.setItem("nova_user", JSON.stringify(currentUser));
                
                // Update UI displays
                updateBalanceDisplays();
                
                // Show notification for balance change
                if (difference > 0) {
                    showBalanceNotification(`+₱${difference.toLocaleString()}`, 'credit');
                    // Haptic feedback for positive balance change
                    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
                } else if (difference < 0) {
                    showBalanceNotification(`-₱${Math.abs(difference).toLocaleString()}`, 'debit');
                }
                
                // Refresh transaction history if on orders page
                const ordersPage = document.getElementById("ordersPage");
                if (ordersPage && ordersPage.classList.contains("active") && typeof loadTransactionHistory === 'function') {
                    loadTransactionHistory();
                }
                
                // Show indicator that balance updated
                showBalanceWatcherIndicator();
            }
        }
    } catch (error) {
        console.error("Balance watcher error:", error);
    }
}

// Update all balance displays
function updateBalanceDisplays() {
    // Update profile modal balance
    const profileBalance = document.getElementById("profileBalance");
    if (profileBalance && currentUser) {
        profileBalance.innerHTML = `₱${(currentUser.balance || 0).toLocaleString()}`;
    }
    
    // Update cart UI if function exists
    if (typeof renderCartUI === 'function') renderCartUI();
    
    // Update any other balance displays
    const balanceElements = document.querySelectorAll('.balance-display');
    balanceElements.forEach(el => {
        if (currentUser) {
            el.textContent = `₱${(currentUser.balance || 0).toLocaleString()}`;
        }
    });
}

// Show toast notification for balance change
function showBalanceNotification(message, type) {
    const toast = document.getElementById("toastMsg");
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add("show", type);
    
    setTimeout(() => {
        toast.classList.remove("show", type);
    }, 3000);
}

// Show brief indicator that balance was checked
let indicatorTimeout = null;
function showBalanceWatcherIndicator() {
    let indicator = document.getElementById('balanceWatcherIndicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'balanceWatcherIndicator';
        indicator.className = 'balance-watcher-indicator';
        indicator.innerHTML = '<i class="fas fa-sync-alt"></i> Balance updated';
        document.body.appendChild(indicator);
    }
    
    indicator.classList.add('show');
    
    if (indicatorTimeout) clearTimeout(indicatorTimeout);
    indicatorTimeout = setTimeout(() => {
        indicator.classList.remove('show');
    }, 2000);
}

// Manual balance refresh (can be called from UI)
async function manualBalanceRefresh() {
    if (!currentUser || isAdmin) {
        showToast("Please login first", 1500);
        return;
    }
    
    showToast("Checking balance...", 1000);
    
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getUsers`);
        const users = await response.json();
        const updatedUser = users.find(u => u.phone === currentUser.phone);
        
        if (updatedUser) {
            const oldBalance = currentUser.balance || 0;
            const newBalance = updatedUser.balance || 0;
            
            currentUser.balance = newBalance;
            localStorage.setItem("nova_user", JSON.stringify(currentUser));
            updateBalanceDisplays();
            lastBalance = newBalance;
            
            if (oldBalance !== newBalance) {
                showToast(`Balance updated: ₱${newBalance.toLocaleString()}`, 2000);
                if (navigator.vibrate) navigator.vibrate(50);
            } else {
                showToast(`Balance: ₱${newBalance.toLocaleString()}`, 1500);
            }
        } else {
            showToast("User not found", 1500);
        }
    } catch (error) {
        console.error("Manual refresh error:", error);
        showToast("Failed to refresh balance", 1500);
    }
}

// Initialize balance watcher on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in (from state.js)
    setTimeout(() => {
        if (currentUser && !isAdmin) {
            startBalanceWatcher();
        }
    }, 1000);
});