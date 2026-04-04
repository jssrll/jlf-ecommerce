// ========================================
// AUTHENTICATION FUNCTIONS
// ========================================

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

// ========================================
// REAL-TIME BALANCE UPDATE FUNCTIONS - 1 SECONDS
// ========================================

function stopRealTimeBalanceCheck() {
  if (balanceCheckInterval) {
    clearInterval(balanceCheckInterval);
    balanceCheckInterval = null;
    console.log("⏹️ Balance check stopped");
  }
}

function startRealTimeBalanceCheck() {
  // Stop any existing interval first
  if (balanceCheckInterval) {
    clearInterval(balanceCheckInterval);
    balanceCheckInterval = null;
  }
  
  // Only start if user is logged in and not admin
  if (currentUser && !isAdmin) {
    console.log("🚀 Starting real-time balance check every 1 seconds for user:", currentUser.phone);
    
    // Run immediately on start
    refreshUserBalance();
    
    // Then run every 1 seconds
    balanceCheckInterval = setInterval(() => {
      if (currentUser && !isAdmin) {
        console.log("🔄 Auto-refreshing balance at:", new Date().toLocaleTimeString());
        refreshUserBalance();
      } else if (!currentUser || isAdmin) {
        // Stop if user logged out or became admin
        stopRealTimeBalanceCheck();
      }
    }, 1000); // 1 seconds
  }
}

async function refreshUserBalance() {
  if (!currentUser || isAdmin) {
    return;
  }
  
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
        console.log(`💰 Balance updated: ₱${oldBalance.toLocaleString()} → ₱${newBalance.toLocaleString()}`);
        
        // Show toast for balance change
        if (newBalance > oldBalance) {
          showToast(`💰 +₱${(newBalance - oldBalance).toLocaleString()} added! New balance: ₱${newBalance.toLocaleString()}`, 3000);
        } else if (newBalance < oldBalance) {
          showToast(`💸 -₱${(oldBalance - newBalance).toLocaleString()} deducted. Balance: ₱${newBalance.toLocaleString()}`, 3000);
        }
        
        updateAllBalanceDisplays();
      }
    }
  } catch (error) {
    console.error("❌ Refresh balance error:", error);
  }
}

function updateAllBalanceDisplays() {
  // Update profile modal balance
  const profileBalance = document.getElementById("profileBalance");
  if (profileBalance && currentUser && !isAdmin) {
    profileBalance.innerHTML = `₱${(currentUser.balance || 0).toLocaleString()}`;
  }
  
  // Update cart UI if function exists
  if (typeof renderCartUI === 'function') renderCartUI();
  
  // Update user name display
  const userNameDisplay = document.getElementById("userNameDisplay");
  if (userNameDisplay && currentUser && !isAdmin) {
    userNameDisplay.innerText = currentUser.name.split(' ')[0];
  }
  
  console.log("💳 Balance displays updated: ₱" + (currentUser?.balance || 0).toLocaleString());
}

// ========================================
// LOGIN FUNCTION - WITH ADMIN CHECK
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
  
  // CHECK FOR HARCODED ADMIN FIRST
  if (phone === ADMIN_PHONE && password === ADMIN_PASSWORD) {
    console.log("✅ Admin login successful");
    
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
    return;
  }
  
  // NORMAL USER LOGIN - Check Google Sheets
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getUsers`);
    const users = await response.json();
    
    const user = users.find(u => {
      const sheetPhone = u.phone.toString();
      const inputPhone = phone.toString();
      if (sheetPhone === inputPhone) return true;
      if (inputPhone.startsWith('09') && sheetPhone === inputPhone.substring(1)) return true;
      if (sheetPhone.startsWith('09') && inputPhone === sheetPhone.substring(1)) return true;
      return false;
    });
    
    if (user) {
      currentUser = {
        id: user.accountId,
        name: user.name,
        phone: user.phone,
        password: user.password,
        balance: user.balance || 0,
        joined: new Date().toLocaleDateString()
      };
      
      isAdmin = false;
      
      const logData = new URLSearchParams();
      logData.append("action", "addLoginLog");
      logData.append("timestamp", new Date().toISOString());
      logData.append("accountId", currentUser.id);
      logData.append("fullName", currentUser.name);
      logData.append("phone", currentUser.phone);
      logData.append("password", currentUser.password);
      logData.append("status", "Success");
      
      fetch(GOOGLE_SHEETS_URL, { method: "POST", body: logData }).catch(err => console.error("Login logging error:", err));
      
      localStorage.setItem("nova_user", JSON.stringify(currentUser));
      document.getElementById("userNameDisplay").innerText = currentUser.name.split(' ')[0];
      
      document.querySelectorAll('.nav-link').forEach(link => {
        link.style.display = 'block';
      });
      
      showToast(`Welcome back, ${user.name}!`, 2000);
      closeAccountModal();
      if (typeof renderCartUI === 'function') renderCartUI();
      
      // START REAL-TIME BALANCE CHECK (10 seconds)
      startRealTimeBalanceCheck();
      
      if (typeof switchPage === 'function') switchPage('home');
    } else {
      showToast("Invalid phone number or password", 1500);
    }
  } catch (error) {
    console.error("Login error:", error);
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
    const formData = new URLSearchParams();
    formData.append("action", "addUser");
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("password", password);
    formData.append("accountId", accountId);
    formData.append("timestamp", new Date().toISOString());
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      currentUser = {
        id: accountId,
        name: name,
        phone: phone,
        password: password,
        balance: 0,
        joined: joinedDate
      };
      
      isAdmin = false;
      
      if (typeof createUserLoyalty === 'function') await createUserLoyalty();
      
      localStorage.setItem("nova_user", JSON.stringify(currentUser));
      document.getElementById("userNameDisplay").innerText = currentUser.name.split(' ')[0];
      showToast(`✅ Account created successfully!\n\nWelcome, ${name}!\nYour Account ID: ${accountId}`, 4000);
      closeAccountModal();
      document.getElementById("registerForm").reset();
      
      // START REAL-TIME BALANCE CHECK FOR NEW USER (10 seconds)
      startRealTimeBalanceCheck();
      
      if (typeof switchPage === 'function') switchPage('home');
    } else {
      showToast(result.message || "Registration failed. Phone may already exist.", 1500);
    }
  } catch (error) {
    console.error("Registration error:", error);
    showToast("Registration failed. Please try again.", 1500);
  } finally {
    registerBtn.disabled = false;
    registerBtn.innerHTML = "Create Account";
    loadingIndicator.style.display = "none";
  }
}

function logout() {
  // Stop balance check on logout
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
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.style.display = 'block';
  });
  
  if (typeof switchPage === 'function') switchPage('home');
}