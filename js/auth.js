let pendingCheckout = false; // Track if checkout was waiting for login

function openAccountModal() {
  const modal = document.getElementById("accountModal");
  modal.classList.add("show");
  document.getElementById("loginForm").reset();
  document.getElementById("registerForm").reset();
  const registerBtn = document.getElementById("registerBtn");
  if (registerBtn) {
    registerBtn.disabled = false;
    registerBtn.innerHTML = "Create Account";
  }
  const loadingIndicator = document.getElementById("registerLoading");
  if (loadingIndicator) loadingIndicator.style.display = "none";
}

function closeAccountModal() {
  pendingCheckout = false; // Clear pending checkout when modal closed manually
  const modal = document.getElementById("accountModal");
  modal.classList.remove("show");
}

function openProfileModal() {
  if (!currentUser || isAdmin) {
    if (!currentUser) openAccountModal();
    return;
  }
  
  document.getElementById("profileName").innerText = currentUser.name;
  document.getElementById("profileId").innerText = currentUser.id;
  document.getElementById("profilePhone").innerText = currentUser.phone;
  document.getElementById("profileJoined").innerText = currentUser.joined || new Date().toLocaleDateString();
  document.getElementById("profileBalance").innerHTML = `₱${(currentUser.balance || 0).toLocaleString()}`;
  
  if (typeof generateUserQRCode === 'function') generateUserQRCode();
  if (typeof loadUserLoyalty === 'function') loadUserLoyalty();
  
  const modal = document.getElementById("profileModal");
  modal.classList.add("show");
}

function closeProfileModal() {
  const modal = document.getElementById("profileModal");
  modal.classList.remove("show");
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  if (tabName === 'login') {
    document.querySelector('.tab-btn:first-child').classList.add('active');
    document.getElementById('loginTab').classList.add('active');
  } else {
    document.querySelector('.tab-btn:last-child').classList.add('active');
    document.getElementById('registerTab').classList.add('active');
  }
}

function stopRealTimeBalanceCheck() {
  if (balanceCheckInterval) {
    clearInterval(balanceCheckInterval);
    balanceCheckInterval = null;
  }
}

function startRealTimeBalanceCheck() {
  if (balanceCheckInterval) {
    clearInterval(balanceCheckInterval);
    balanceCheckInterval = null;
  }
  
  if (currentUser && !isAdmin) {
    refreshUserBalance();
    balanceCheckInterval = setInterval(() => {
      if (currentUser && !isAdmin) {
        refreshUserBalance();
      } else if (!currentUser || isAdmin) {
        stopRealTimeBalanceCheck();
      }
    }, 5000);
  }
}

async function refreshUserBalance() {
  if (!currentUser || isAdmin) return;
  
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getUsers`);
    const users = await response.json();
    const updatedUser = users.find(u => u.phone === currentUser.phone);
    
    if (updatedUser) {
      const oldBalance = currentUser.balance || 0;
      const newBalance = updatedUser.balance || 0;
      
      if (oldBalance !== newBalance) {
        currentUser.balance = newBalance;
        localStorage.setItem("nova_user", JSON.stringify(currentUser));
        
        if (newBalance > oldBalance) {
          showToast(`💰 +₱${(newBalance - oldBalance).toLocaleString()} added!`, 3000);
        } else if (newBalance < oldBalance) {
          showToast(`💸 -₱${(oldBalance - newBalance).toLocaleString()} deducted.`, 3000);
        }
        
        updateAllBalanceDisplays();
      }
    }
  } catch (error) {}
}

function updateAllBalanceDisplays() {
  const profileBalance = document.getElementById("profileBalance");
  if (profileBalance && currentUser && !isAdmin) {
    profileBalance.innerHTML = `₱${(currentUser.balance || 0).toLocaleString()}`;
  }
  
  if (typeof renderCartUI === 'function') renderCartUI();
  
  const userNameDisplay = document.getElementById("userNameDisplay");
  if (userNameDisplay && currentUser && !isAdmin) {
    userNameDisplay.innerText = currentUser.name.split(' ')[0];
  }
}

// ========================================
// ADMIN 2FA LOGIN HELPER
// ========================================
function doAdminLogin(loginBtn) {
  stopRealTimeBalanceCheck();
  isAdmin = true;
  currentUser = null;
  localStorage.removeItem("nova_user");
  cart = [];
  if (typeof updateCartBadge === 'function') updateCartBadge();
  if (typeof saveCartToLocal === 'function') saveCartToLocal();
  if (typeof renderCartUI === 'function') renderCartUI();
  
  showToast("Welcome Admin! 👑", 2000);
  closeAccountModal();
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.style.display = 'none';
  });
  document.getElementById("userNameDisplay").innerText = "";
  
  if (typeof loadAdminData === 'function') loadAdminData();
  if (typeof switchPage === 'function') switchPage('admin');
  
  loginBtn.disabled = false;
  loginBtn.innerHTML = "Login";
}

// ========================================
// LOGIN FUNCTION - WITH ADMIN 2FA
// ========================================
async function handleLogin(event) {
  event.preventDefault();
  let phone = document.getElementById("loginPhone").value.trim();
  const password = document.getElementById("loginPassword").value;
  const loginBtn = document.getElementById("loginBtn");
  
  if (!phone || !password) {
    showToast("Please fill in all fields", 1500);
    return;
  }
  
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
  
  // ========================================
  // ADMIN LOGIN WITH 2FA
  // ========================================
  if (phone === ADMIN_PHONE && password === ADMIN_PASSWORD) {
    try {
      const res = await fetch(`${GOOGLE_SHEETS_URL}?action=request2FA&phone=${encodeURIComponent(phone)}&password=${encodeURIComponent(password)}`);
      const data = await res.json();
      
      if (data.success) {
        const otpCode = prompt("🔐 Admin 2FA Verification\n\nA 6-digit code has been sent to your Telegram.\nPlease enter the code below:");
        
        if (!otpCode) {
          showToast("2FA cancelled", 1500);
          loginBtn.disabled = false;
          loginBtn.innerHTML = "Login";
          return;
        }
        
        const verifyRes = await fetch(`${GOOGLE_SHEETS_URL}?action=verify2FA&phone=${encodeURIComponent(phone)}&code=${encodeURIComponent(otpCode)}`);
        const verifyData = await verifyRes.json();
        
        if (verifyData.success) {
          doAdminLogin(loginBtn);
        } else {
          showToast(verifyData.message || "Invalid code", 2000);
          loginBtn.disabled = false;
          loginBtn.innerHTML = "Login";
        }
      } else {
        showToast("2FA failed. Try again.", 1500);
        loginBtn.disabled = false;
        loginBtn.innerHTML = "Login";
      }
    } catch(e) {
      showToast("2FA error. Check connection.", 1500);
      loginBtn.disabled = false;
      loginBtn.innerHTML = "Login";
    }
    return;
  }
  
  // ========================================
  // NORMAL USER LOGIN - via hashed endpoint
  // ========================================
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=loginUser&phone=${encodeURIComponent(phone)}&password=${encodeURIComponent(password)}`);
    const result = await response.json();
    
    if (result.success) {
      const user = result.user;
      currentUser = {
        id: user.accountId,
        name: user.name,
        phone: user.phone,
        password: password,
        balance: user.balance || 0,
        joined: new Date().toLocaleDateString()
      };
      
      isAdmin = false;
      
      localStorage.setItem("nova_user", JSON.stringify(currentUser));
      document.getElementById("userNameDisplay").innerText = currentUser.name.split(' ')[0];
      
      document.querySelectorAll('.nav-link').forEach(link => {
        link.style.display = 'block';
      });
      
      showToast(`Welcome back, ${user.name}!`, 2000);
      closeAccountModal();
      if (typeof renderCartUI === 'function') renderCartUI();
      
      // CHECK PENDING CHECKOUT AFTER LOGIN
      if (typeof checkPendingCheckout === 'function') checkPendingCheckout();
      
      startRealTimeBalanceCheck();
      
      if (typeof switchPage === 'function') switchPage('home');
    } else {
      showToast(result.message || "Invalid phone number or password", 1500);
    }
  } catch (error) {
    showToast("Login failed. Please try again.", 1500);
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = "Login";
  }
}

// ========================================
// REGISTER FUNCTION
// ========================================
async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById("regFullName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;
  const registerBtn = document.getElementById("registerBtn");
  const loadingIndicator = document.getElementById("registerLoading");
  
  if (!name || !phone || !password) {
    showToast("Please fill in all fields", 1500);
    return;
  }
  
  if (password !== confirmPassword) {
    showToast("Passwords do not match", 1500);
    return;
  }
  
  if (!/^09\d{9}$/.test(phone) && !/^\d{10}$/.test(phone)) {
    showToast("Please enter a valid phone number (09XXXXXXXXX)", 1500);
    return;
  }
  
  const accountId = Math.floor(100000000 + Math.random() * 900000000).toString();
  const joinedDate = new Date().toLocaleDateString();
  
  registerBtn.disabled = true;
  registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
  loadingIndicator.style.display = "block";
  
  try {
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action: "addUser",
        name: name,
        phone: phone,
        password: password,
        accountId: accountId,
        timestamp: new Date().toISOString()
      })
    });
    const result = await response.json();
    
    if (result.success) {
      currentUser = {
        id: accountId, name: name, phone: phone,
        password: password, balance: 0, joined: joinedDate
      };
      
      isAdmin = false;
      
      if (typeof createUserLoyalty === 'function') await createUserLoyalty();
      
      localStorage.setItem("nova_user", JSON.stringify(currentUser));
      document.getElementById("userNameDisplay").innerText = currentUser.name.split(' ')[0];
      showToast(`✅ Account created!\n\nWelcome, ${name}!\nYour Account ID: ${accountId}`, 4000);
      closeAccountModal();
      document.getElementById("registerForm").reset();
      
      // CHECK PENDING CHECKOUT AFTER REGISTRATION
      if (typeof checkPendingCheckout === 'function') checkPendingCheckout();
      
      startRealTimeBalanceCheck();
      
      if (typeof switchPage === 'function') switchPage('home');
    } else {
      showToast(result.message || "Registration failed.", 1500);
    }
  } catch (error) {
    showToast("Registration failed. Please try again.", 1500);
  } finally {
    registerBtn.disabled = false;
    registerBtn.innerHTML = "Create Account";
    loadingIndicator.style.display = "none";
  }
}

// Check if a checkout was pending (after login/register)
function checkPendingCheckout() {
  if (pendingCheckout && currentUser && !isAdmin && cart.length > 0) {
    pendingCheckout = false;
    setTimeout(() => {
      if (typeof placeOrder === 'function') placeOrder();
    }, 300);
  }
}

function logout() {
  stopRealTimeBalanceCheck();
  currentUser = null;
  isAdmin = false;
  localStorage.removeItem("nova_user");
  document.getElementById("userNameDisplay").innerText = "";
  closeProfileModal();
  showToast("Logged out successfully", 1500);
  cart = [];
  if (typeof updateCartBadge === 'function') updateCartBadge();
  if (typeof saveCartToLocal === 'function') saveCartToLocal();
  if (typeof renderCartUI === 'function') renderCartUI();
  
  // Clear transaction page immediately so no data is left visible
  const ordersContainer = document.getElementById("ordersContainer");
  if (ordersContainer) {
    ordersContainer.innerHTML = `
      <div class="empty-orders">
        <i class="fas fa-receipt" style="font-size: 4rem; color: #e63946; margin-bottom: 20px;"></i>
        <p>Please login to view your transactions.</p>
        <button class="btn-primary-apple" onclick="openAccountModal()" style="margin-top: 20px;">Login</button>
      </div>`;
  }
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.style.display = 'block';
  });
  
  if (typeof switchPage === 'function') switchPage('home');
}