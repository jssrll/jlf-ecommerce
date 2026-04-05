// ========================================
// ADMIN MAIN FUNCTIONS
// ========================================

function switchAdminTab(tabName) {
    if (!isAdmin) return;
    
    console.log("🔄 Switching to admin tab:", tabName);
    
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        const buttons = document.querySelectorAll('.admin-tab-btn');
        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const onclickAttr = btn.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes(tabName)) {
                btn.classList.add('active');
                break;
            }
        }
    }
    
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    const tabId = `admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`;
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        targetTab.style.display = 'block';
        console.log(`✅ Activated tab: ${tabId}`);
    } else {
        console.log(`❌ Tab not found: ${tabId}`);
    }
    
    if (tabName === 'orders') loadAdminOrders();
    else if (tabName === 'logs') loadAdminLogs();
    else if (tabName === 'users') loadAdminUsers();
    else if (tabName === 'redemptions') loadAdminRedemptions();
    else if (tabName === 'recharges') loadAdminRecharges();
    else if (tabName === 'withdrawals') loadAdminWithdrawals();
    else if (tabName === 'investments') loadAdminCreditInvestments();
    else if (tabName === 'qrscanner') {
        console.log("📷 Loading QR Scanner...");
        loadRecentScans();
    } else if (tabName === 'announcements') {
        console.log("📢 Loading Announcements...");
        loadRecentAnnouncements();
    } else if (tabName === 'promocodes') {
        console.log("🎫 Loading Promo Codes...");
        loadPromoCodes();
    }
}

async function loadAdminData() {
  if (!isAdmin) return;
  loadAdminOrders();
  loadAdminLogs();
  loadAdminUsers();
  loadAdminRedemptions();
  loadAdminRecharges();
  loadAdminWithdrawals();
  loadAdminCreditInvestments();
}

async function loadAdminRedemptions() {
  if (!isAdmin) return;
  const container = document.getElementById("adminRedemptionsContainer");
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading redemptions...</div>';
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getRedemptions`);
    const redemptions = await response.json();
    if (!redemptions || redemptions.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No code redemptions found.</div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr><th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Code Input</th><th>Reward</th></tr></thead><tbody>';
    redemptions.forEach(redemption => {
      html += `<tr><td style="white-space: nowrap;">${new Date(redemption.timestamp).toLocaleString()}</td><td>${redemption.accountId || '-'}</td><td>${redemption.fullName || '-'}</td><td>${redemption.phone || '-'}</td><td><code>${redemption.codeInput || '-'}</code></td><td>${redemption.reward || '-'}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load redemptions. <button class="btn-secondary-apple" onclick="loadAdminRedemptions()">Try Again</button></div>';
  }
}

function refreshAdminRedemptions() { if(isAdmin) loadAdminRedemptions(); }

// ========================================
// PROMO CODES ADMIN FUNCTIONS
// ========================================

async function loadPromoCodes() {
  if (!isAdmin) return;
  
  const container = document.getElementById("promoCodesContainer");
  if (!container) return;
  
  container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAllPromoCodes`);
    const codes = await response.json();
    
    if (!codes || codes.length === 0) {
      container.innerHTML = '<div class="empty-state">No promo codes found. Create your first one!</div>';
      return;
    }
    
    let html = '<table class="admin-table"><thead><tr><th>Code</th><th>Reward</th><th>Status</th><th>Redeemed By</th><th>Expiry</th><th>Action</th></tr></thead><tbody>';
    
    codes.forEach(code => {
      const statusClass = code.status === 'used' ? 'status-completed' : 'status-pending';
      html += `
        <tr>
          <td><code>${code.code}</code></td>
          <td>₱${code.reward}</td>
          <td><span class="status-badge ${statusClass}">${code.status}</span></td>
          <td>${code.redeemedBy || '-'}<br><small>${code.redeemedByPhone || ''}</small></td>
          <td>${code.expiryDate || 'No expiry'}</td>
          <td>
            ${code.status === 'unused' ? `<button class="btn-secondary-apple" onclick="deletePromoCode('${code.code}')" style="background:#dc2626;color:white;">Delete</button>` : '-'}
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error("Load promo codes error:", error);
    container.innerHTML = '<div class="empty-state">Failed to load codes</div>';
  }
}

async function createPromoCode() {
  const code = document.getElementById("newPromoCode").value.trim().toUpperCase();
  const reward = document.getElementById("newPromoReward").value;
  const expiryDate = document.getElementById("newPromoExpiry").value;
  const description = document.getElementById("newPromoDesc").value;
  
  if (!code || !reward) {
    showToast("Please enter code and reward amount", 1500);
    return;
  }
  
  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "addPromoCode");
    formData.append("code", code);
    formData.append("reward", reward);
    formData.append("expiryDate", expiryDate);
    formData.append("description", description);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      showToast(`✅ Promo code "${code}" created! One-time use only.`, 2000);
      document.getElementById("newPromoCode").value = "";
      document.getElementById("newPromoReward").value = "";
      document.getElementById("newPromoExpiry").value = "";
      document.getElementById("newPromoDesc").value = "";
      loadPromoCodes();
    } else {
      showToast(result.message, 1500);
    }
  } catch (error) {
    showToast("Failed to create code", 1500);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

async function deletePromoCode(code) {
  if (!confirm(`Delete promo code "${code}"? This cannot be undone.`)) return;
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "deletePromoCode");
    formData.append("code", code);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      showToast("Promo code deleted", 1500);
      loadPromoCodes();
    } else {
      showToast(result.message, 1500);
    }
  } catch (error) {
    showToast("Failed to delete", 1500);
  }
}