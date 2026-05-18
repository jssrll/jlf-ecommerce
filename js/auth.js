// ============================================================
// auth.js — Authentication: login / register / logout
//            Session survives page refresh via localStorage
// ============================================================

// Modal helpers
function openAccountModal() {
  document.getElementById("accountModal").classList.add("show");
  switchTab("login");
}

function closeAccountModal() {
  document.getElementById("accountModal").classList.remove("show");
}

function openProfileModal() {
  populateProfile();
  if (typeof generateUserQRCode === "function") generateUserQRCode();
  if (typeof loadUserLoyalty === "function") loadUserLoyalty();
  document.getElementById("profileModal").classList.add("show");
}

function closeProfileModal() {
  document.getElementById("profileModal").classList.remove("show");
}

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  
  if (tab === "login") {
    document.querySelector('.tab-btn:first-child')?.classList.add("active");
    document.getElementById("loginTab")?.classList.add("active");
  } else {
    document.querySelector('.tab-btn:last-child')?.classList.add("active");
    document.getElementById("registerTab")?.classList.add("active");
  }
}

// Login
async function handleLogin(e) {
  e.preventDefault();
  const phone = document.getElementById("loginPhone").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const btn = document.getElementById("loginBtn");

  if (!phone || !password) {
    showToast("Please fill all fields");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

  // Admin shortcut
  if (phone === ADMIN_PHONE && password === ADMIN_PASSWORD) {
    try {
      const r = await fetch(`${GOOGLE_SHEETS_URL}?action=request2FA&phone=${phone}&password=${password}`);
      const data = await r.json();
      
      if (data.success) {
        closeAccountModal();
        const code = prompt("Enter the 2FA code sent to Telegram:");
        if (!code) {
          btn.disabled = false;
          btn.innerHTML = "Login";
          return;
        }
        
        const verifyRes = await fetch(`${GOOGLE_SHEETS_URL}?action=verify2FA&phone=${phone}&code=${code}`);
        const verifyData = await verifyRes.json();
        
        if (verifyData.success) {
          setAdminMode(true);
          currentUser = { id: "ADMIN", name: "Admin", phone: "101007101007", balance: 0 };
          saveSession(currentUser);
          onLoginSuccess();
          showToast("Admin access granted!");
          if (typeof switchPage === "function") switchPage("admin");
        } else {
          showToast(verifyData.message || "Invalid 2FA code");
        }
      } else {
        showToast(data.message || "2FA failed");
      }
    } catch (err) {
      showToast("2FA error. Try again.");
    }
    btn.disabled = false;
    btn.innerHTML = "Login";
    return;
  }

  // Normal user login
  try {
    const res = await fetch(`${GOOGLE_SHEETS_URL}?action=loginUser&phone=${phone}&password=${password}`);
    const data = await res.json();

    if (data.success) {
      currentUser = {
        id: data.user.accountId,
        name: data.user.name,
        phone: data.user.phone,
        balance: data.user.balance || 0,
        joined: new Date().toLocaleDateString()
      };
      saveSession(currentUser);
      closeAccountModal();
      onLoginSuccess();
      showToast("Welcome back, " + currentUser.name + "!");
    } else {
      showToast(data.message || "Invalid credentials");
    }
  } catch (err) {
    showToast("Login failed. Please try again.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Login";
  }
}

// Register
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regFullName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const pass = document.getElementById("regPassword").value.trim();
  const confirm = document.getElementById("regConfirmPassword").value.trim();
  const btn = document.getElementById("registerBtn");
  const loading = document.getElementById("registerLoading");

  if (!name || !phone || !pass) {
    showToast("Please fill all fields");
    return;
  }
  if (pass !== confirm) {
    showToast("Passwords do not match");
    return;
  }
  if (pass.length < 6) {
    showToast("Password must be at least 6 characters");
    return;
  }

  btn.style.display = "none";
  loading.style.display = "block";

  const accountId = "JLF" + Math.floor(100000000 + Math.random() * 900000000);

  try {
    const formData = new URLSearchParams();
    formData.append("action", "addUser");
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("password", pass);
    formData.append("accountId", accountId);
    formData.append("timestamp", new Date().toISOString());

    const res = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const data = await res.json();

    if (data.success) {
      currentUser = {
        id: accountId,
        name: name,
        phone: phone,
        balance: 0,
        joined: new Date().toLocaleDateString()
      };
      saveSession(currentUser);
      closeAccountModal();
      onLoginSuccess();
      showToast("Account created! Welcome " + name + "!");
    } else {
      showToast(data.message || "Registration failed");
    }
  } catch (err) {
    showToast("Registration failed. Please try again.");
  } finally {
    btn.style.display = "block";
    loading.style.display = "none";
  }
}

// Logout
function logout() {
  stopRealtimeSync();
  if (typeof stopRealTimeBalanceCheck === "function") stopRealTimeBalanceCheck();
  
  currentUser = null;
  setAdminMode(false);
  clearSession();
  cart = [];
  saveCartToLocal();
  closeProfileModal();
  onLogout();
  showToast("Logged out successfully");
}

// Post-login / post-logout UI updates
function onLoginSuccess() {
  updateNavUI();
  updateBalanceDisplay();
  startRealtimeSync();
  if (typeof startRealTimeBalanceCheck === "function") startRealTimeBalanceCheck();
  if (typeof loadUserLoyalty === "function") loadUserLoyalty();
  if (typeof loadTransactionHistory === "function" && document.getElementById("ordersPage")?.classList.contains("active")) {
    loadTransactionHistory();
  }
  if (typeof renderCartUI === "function") renderCartUI();
  if (typeof updateCartBadge === "function") updateCartBadge();
}

function onLogout() {
  updateNavUI();
  if (typeof clearTransactionHistory === "function") clearTransactionHistory();
  if (typeof updateCartBadge === "function") updateCartBadge();
  if (typeof renderCartUI === "function") renderCartUI();
}

// Profile population
function populateProfile() {
  if (!currentUser) return;
  document.getElementById("profileName").textContent = currentUser.name || "-";
  document.getElementById("profileId").textContent = currentUser.id || "-";
  document.getElementById("profilePhone").textContent = currentUser.phone || "-";
  document.getElementById("profileJoined").textContent = currentUser.joined || "N/A";
  document.getElementById("profileBalance").textContent = "₱" + (currentUser.balance || 0).toLocaleString();
}

function updateBalanceDisplay() {
  if (!currentUser) return;
  const balanceEl = document.getElementById("profileBalance");
  if (balanceEl) balanceEl.textContent = "₱" + (currentUser.balance || 0).toLocaleString();
  if (typeof updateAllBalanceDisplays === "function") updateAllBalanceDisplays();
}

// Nav UI
function updateNavUI() {
  const nameEl = document.getElementById("userNameDisplay");
  if (currentUser && !isAdmin) {
    if (nameEl) nameEl.textContent = currentUser.name.split(" ")[0];
    document.querySelectorAll('.nav-link').forEach(link => {
      link.style.display = 'block';
    });
    const adminLink = document.querySelector('[data-page="admin"]');
    if (adminLink) adminLink.style.display = "none";
  } else if (isAdmin) {
    if (nameEl) nameEl.textContent = "";
    document.querySelectorAll('.nav-link').forEach(link => {
      link.style.display = 'none';
    });
  } else {
    if (nameEl) nameEl.textContent = "";
    document.querySelectorAll('.nav-link').forEach(link => {
      link.style.display = 'block';
    });
  }
}

// Restore session on page load
function restoreSession() {
  const savedUser = loadSession();
  if (savedUser) {
    currentUser = savedUser;
    isAdmin = loadAdminFlag();
    updateNavUI();
    updateBalanceDisplay();
    startRealtimeSync();
    if (typeof startRealTimeBalanceCheck === "function") startRealTimeBalanceCheck();
    console.log("Session restored for:", currentUser.name);
    return true;
  }
  return false;
}

// Account icon click handler
document.addEventListener("DOMContentLoaded", function() {
  const accountIcon = document.getElementById("accountIcon");
  if (accountIcon) {
    accountIcon.addEventListener("click", function() {
      if (currentUser && !isAdmin) openProfileModal();
      else if (isAdmin) {
        if (typeof switchPage === "function") switchPage("admin");
      } else openAccountModal();
    });
  }
  
  // Restore session on load
  restoreSession();
});

// Make functions global
window.openAccountModal = openAccountModal;
window.closeAccountModal = closeAccountModal;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.switchTab = switchTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.restoreSession = restoreSession;
window.populateProfile = populateProfile;
window.updateBalanceDisplay = updateBalanceDisplay;
window.updateNavUI = updateNavUI;