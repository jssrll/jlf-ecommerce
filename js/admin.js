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