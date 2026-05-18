// ============================================================
// realtime.js — Polling-based "real-time" sync every 5 seconds
// ============================================================

let _syncTimer = null;
let _lastBalance = null;
let _lastMarks = null;

function startRealtimeSync() {
  stopRealtimeSync();
  if (!currentUser || isAdmin) return;
  _syncTimer = setInterval(syncUserData, 5000);
  syncUserData();
}

function stopRealtimeSync() {
  if (_syncTimer) {
    clearInterval(_syncTimer);
    _syncTimer = null;
  }
}

async function syncUserData() {
  if (!currentUser || isAdmin) return;
  
  try {
    // Fetch fresh user balance
    const res = await fetch(`${GOOGLE_SHEETS_URL}?action=getUsers`);
    const users = await res.json();
    
    if (!Array.isArray(users)) return;
    
    const me = users.find(u => 
      u.phone === currentUser.phone || 
      u.accountId === currentUser.id
    );
    
    if (!me) return;
    
    const newBalance = Number(me.balance) || 0;
    
    if (_lastBalance !== null && newBalance !== _lastBalance) {
      currentUser.balance = newBalance;
      saveSession(currentUser);
      if (typeof updateBalanceDisplay === "function") updateBalanceDisplay();
      showToast("💰 Balance updated: ₱" + newBalance.toLocaleString(), 2500);
      if (typeof loadTransactionHistory === "function") loadTransactionHistory();
    } else {
      currentUser.balance = newBalance;
      saveSession(currentUser);
      if (typeof updateBalanceDisplay === "function") updateBalanceDisplay();
    }
    _lastBalance = newBalance;
    
  } catch (e) {
    console.error("Balance sync error:", e);
  }
  
  // Sync loyalty marks
  try {
    const lr = await fetch(`${GOOGLE_SHEETS_URL}?action=getUserLoyalty&phone=${currentUser.phone}`);
    const data = await lr.json();
    
    if (data.success) {
      const newMarks = Number(data.marks) || 0;
      if (_lastMarks !== null && newMarks !== _lastMarks) {
        if (typeof renderLoyaltyMarks === "function") renderLoyaltyMarks(newMarks);
        showToast("⭐ Loyalty marks updated: " + newMarks + "/12", 2500);
      } else {
        if (typeof renderLoyaltyMarks === "function") renderLoyaltyMarks(newMarks);
      }
      _lastMarks = newMarks;
    }
  } catch (e) {
    console.error("Loyalty sync error:", e);
  }
}

function triggerSync() {
  if (currentUser && !isAdmin) {
    setTimeout(syncUserData, 800);
  }
}

function updateBalanceDisplay() {
  if (!currentUser) return;
  const balanceEl = document.getElementById("profileBalance");
  if (balanceEl) balanceEl.textContent = "₱" + (currentUser.balance || 0).toLocaleString();
}

function renderLoyaltyMarks(marks) {
  const marksContainer = document.getElementById("loyaltyMarksContainer");
  if (!marksContainer) return;
  
  let html = '';
  for (let i = 1; i <= 12; i++) {
    const earned = i <= marks;
    html += `<div class="loyalty-mark ${earned ? 'earned' : 'empty'}">${earned ? '✓' : i}</div>`;
  }
  marksContainer.innerHTML = html;
  
  const marksCount = document.getElementById("loyaltyMarksCount");
  if (marksCount) marksCount.innerText = marks;
  
  const rewardMsg = document.getElementById("loyaltyRewardMessage");
  if (rewardMsg) {
    if (marks >= 12) {
      rewardMsg.innerHTML = '<i class="fas fa-gift"></i> 🎉 You reached 12 marks! Claim your ₱99 reward! 🎉';
    } else {
      rewardMsg.innerHTML = '<i class="fas fa-qrcode"></i> Need ' + (12 - marks) + ' more scan(s) for ₱99 reward!';
    }
  }
}

// Make functions global
window.startRealtimeSync = startRealtimeSync;
window.stopRealtimeSync = stopRealtimeSync;
window.syncUserData = syncUserData;
window.triggerSync = triggerSync;
window.updateBalanceDisplay = updateBalanceDisplay;
window.renderLoyaltyMarks = renderLoyaltyMarks;