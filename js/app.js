// ========================================
// APPLICATION STATE
// ========================================
let cart = [];
let currentCategory = "all";
let searchQuery = "";
let currentPage = "home";
let currentUser = null;
let isAdminMode = false;
let xcoinBalance = 0;
let balanceCheckInterval = null;
const ADMIN_PASSWORD = "jssrll101007";

// Your Google Sheets Web App URL
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbwn-bHANJqAGharH7XxJbqUN6Lq3CRRaQpLpfsJK2j1UrTj4OJLkCTBJ2lxSB9_IA6B/exec";

// ========================================
// HELPER FUNCTIONS
// ========================================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function showToast(message, duration = 1800) {
  const toast = document.getElementById("toastMsg");
  if (!toast) return;
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => { toast.classList.remove("show"); }, duration);
}

// ========================================
// REAL-TIME BALANCE UPDATE FUNCTIONS
// ========================================

// Force refresh user balance from Google Sheets with loading indicator
async function refreshUserBalance() {
  if (!currentUser) return;
  
  // Get the refresh button
  const refreshBtn = document.querySelector('.refresh-balance-btn');
  const originalBtnText = refreshBtn ? refreshBtn.innerHTML : '';
  
  // Disable button and show loading indicator
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
  }
  
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getUsers`);
    const users = await response.json();
    
    const updatedUser = users.find(u => u.phone === currentUser.phone);
    
    if (updatedUser) {
      const oldBalance = currentUser.balance;
      currentUser.balance = updatedUser.balance || 0;
      
      if (oldBalance !== currentUser.balance) {
        localStorage.setItem("nova_user", JSON.stringify(currentUser));
        showToast(`💰 Balance updated: ₱${currentUser.balance.toLocaleString()}`, 2000);
        
        // Update all UI elements showing balance
        updateAllBalanceDisplays();
      } else {
        showToast(`💰 Balance is up to date: ₱${currentUser.balance.toLocaleString()}`, 1500);
      }
    } else {
      showToast("Failed to refresh balance. Please try again.", 1500);
    }
  } catch (error) {
    console.error("Refresh balance error:", error);
    showToast("Failed to refresh balance. Please check your connection.", 1500);
  } finally {
    // Re-enable button and restore original text
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = originalBtnText;
    }
  }
}

// Update all balance displays in the UI
function updateAllBalanceDisplays() {
  // Update profile balance
  const profileBalance = document.getElementById("profileBalance");
  if (profileBalance) {
    profileBalance.innerHTML = `₱${(currentUser.balance || 0).toLocaleString()}`;
  }
  
  // Update cart total display (to reflect credit availability)
  renderCartUI();
  
  // Update any other balance displays
  const userNameDisplay = document.getElementById("userNameDisplay");
  if (userNameDisplay && currentUser) {
    userNameDisplay.innerText = currentUser.name.split(' ')[0];
  }
}

// Real-time balance check function (can be called periodically)
function startRealTimeBalanceCheck() {
  // Clear existing interval if any
  if (balanceCheckInterval) {
    clearInterval(balanceCheckInterval);
  }
  
  // Check balance every 30 seconds
  balanceCheckInterval = setInterval(() => {
    if (currentUser) {
      refreshUserBalance();
    }
  }, 30000); // 30 seconds
}

function stopRealTimeBalanceCheck() {
  if (balanceCheckInterval) {
    clearInterval(balanceCheckInterval);
    balanceCheckInterval = null;
  }
}

// ========================================
// ACCOUNT MODAL FUNCTIONS
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
  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }
}

function closeAccountModal() {
  const modal = document.getElementById("accountModal");
  modal.classList.remove("show");
}

function openProfileModal() {
  if (!currentUser) {
    openAccountModal();
    return;
  }
  
  document.getElementById("profileName").innerText = currentUser.name;
  document.getElementById("profileId").innerText = currentUser.id;
  document.getElementById("profilePhone").innerText = currentUser.phone;
  document.getElementById("profileJoined").innerText = currentUser.joined || new Date().toLocaleDateString();
  document.getElementById("profileBalance").innerHTML = `₱${(currentUser.balance || 0).toLocaleString()}`;
  
  // Add XCoin balance to profile
  const profileInfo = document.querySelector('.profile-info');
  let xcoinRow = document.querySelector('.xcoin-profile-row');
  if (!xcoinRow) {
    xcoinRow = document.createElement('div');
    xcoinRow.className = 'info-row xcoin-profile-row';
    xcoinRow.innerHTML = `
      <span class="info-label"><i class="fas fa-chart-line"></i> XCoin Balance:</span>
      <span class="info-value" id="profileXCoinBalance">0 XCoin</span>
    `;
    profileInfo.appendChild(xcoinRow);
  }
  document.getElementById("profileXCoinBalance").innerHTML = `${xcoinBalance.toLocaleString()} XCoin`;
  
  const modal = document.getElementById("profileModal");
  modal.classList.add("show");
}

function closeProfileModal() {
  const modal = document.getElementById("profileModal");
  modal.classList.remove("show");
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  if (tabName === 'login') {
    document.querySelector('.tab-btn:first-child').classList.add('active');
  } else {
    document.querySelector('.tab-btn:last-child').classList.add('active');
  }
  
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  if (tabName === 'login') {
    document.getElementById('loginTab').classList.add('active');
  } else {
    document.getElementById('registerTab').classList.add('active');
  }
}

// ========================================
// LOGIN FUNCTION
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
      
      // Load XCoin balance
      await loadXCoinBalance();
      
      // Log successful login
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
      showToast(`Welcome back, ${user.name}!`, 2000);
      closeAccountModal();
      renderCartUI();
      
      // Start real-time balance checking
      startRealTimeBalanceCheck();
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
      
      // Initialize XCoin balance to 0
      await updateXCoinBalance(0);
      
      localStorage.setItem("nova_user", JSON.stringify(currentUser));
      document.getElementById("userNameDisplay").innerText = currentUser.name.split(' ')[0];
      showToast(`✅ Account created successfully!\n\nWelcome, ${name}!\nYour Account ID: ${accountId}`, 4000);
      closeAccountModal();
      document.getElementById("registerForm").reset();
      
      // Start real-time balance checking
      startRealTimeBalanceCheck();
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
  currentUser = null;
  xcoinBalance = 0;
  localStorage.removeItem("nova_user");
  document.getElementById("userNameDisplay").innerText = "";
  closeProfileModal();
  showToast("Logged out successfully", 1500);
  cart = [];
  updateCartBadge();
  saveCartToLocal();
  renderCartUI();
  
  // Stop real-time balance checking
  stopRealTimeBalanceCheck();
}

// ========================================
// CREDIT FUNCTIONS
// ========================================
function loadUserCredit() {
  if (currentUser) {
    return currentUser.balance || 0;
  }
  return 0;
}

function saveUserCredit() {
  if (currentUser) {
    localStorage.setItem("nova_user", JSON.stringify(currentUser));
  }
}

async function addUserCredit(amount) {
  if (!currentUser) return 0;
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateBalance");
    formData.append("phone", currentUser.phone);
    formData.append("amount", amount);
    formData.append("operation", "add");
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      currentUser.balance = result.newBalance;
      localStorage.setItem("nova_user", JSON.stringify(currentUser));
      showToast(`₱${amount} added to your credit balance! Current balance: ₱${currentUser.balance}`, 2500);
      updateAllBalanceDisplays();
      return currentUser.balance;
    } else {
      showToast(result.message || "Failed to add credit", 1500);
      return 0;
    }
  } catch (error) {
    console.error("Credit error:", error);
    showToast("Failed to add credit. Please try again.", 1500);
    return 0;
  }
}

// ========================================
// XCOIN FUNCTIONS
// ========================================

async function loadXCoinBalance() {
  if (!currentUser) return 0;
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "getUserXCoinBalance");
    formData.append("phone", currentUser.phone);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      xcoinBalance = result.balance || 0;
      return xcoinBalance;
    }
    return 0;
  } catch (error) {
    console.error("Load XCoin balance error:", error);
    return 0;
  }
}

async function updateXCoinBalance(newBalance) {
  if (!currentUser) return false;
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateXCoinBalance");
    formData.append("phone", currentUser.phone);
    formData.append("accountId", currentUser.id);
    formData.append("fullName", currentUser.name);
    formData.append("balance", newBalance);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      xcoinBalance = result.balance;
      return true;
    }
    return false;
  } catch (error) {
    console.error("Update XCoin balance error:", error);
    return false;
  }
}

async function convertPesoToXCoin() {
  if (!currentUser) {
    showToast("Please login first", 1500);
    openAccountModal();
    return;
  }
  
  const pesoAmount = parseFloat(document.getElementById("pesoToXCoin").value);
  
  if (isNaN(pesoAmount) || pesoAmount < 50) {
    showToast("Minimum conversion is ₱50", 1500);
    return;
  }
  
  if (pesoAmount > currentUser.balance) {
    showToast("Insufficient balance", 1500);
    return;
  }
  
  const xcoinAmount = pesoAmount / 1000;
  
  const confirmMsg = confirm(`Convert ₱${pesoAmount.toLocaleString()} to ${xcoinAmount} XCoin?`);
  if (!confirmMsg) return;
  
  const convertBtn = document.querySelector('#marketPage .conversion-box button');
  const originalText = convertBtn?.innerHTML;
  if (convertBtn) {
    convertBtn.disabled = true;
    convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
  }
  
  try {
    // Deduct peso balance
    const deductData = new URLSearchParams();
    deductData.append("action", "updateBalance");
    deductData.append("phone", currentUser.phone);
    deductData.append("amount", pesoAmount);
    deductData.append("operation", "deduct");
    
    const deductResponse = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: deductData });
    const deductResult = await deductResponse.json();
    
    if (!deductResult.success) {
      showToast(deductResult.message || "Failed to convert", 1500);
      return;
    }
    
    // Add XCoin balance
    const newXCoinBalance = xcoinBalance + xcoinAmount;
    await updateXCoinBalance(newXCoinBalance);
    
    // Update user balance
    currentUser.balance = deductResult.newBalance;
    localStorage.setItem("nova_user", JSON.stringify(currentUser));
    
    // Log conversion
    const logData = new URLSearchParams();
    logData.append("action", "addXCoinConversion");
    logData.append("timestamp", new Date().toISOString());
    logData.append("accountId", currentUser.id);
    logData.append("fullName", currentUser.name);
    logData.append("phone", currentUser.phone);
    logData.append("type", "Peso to XCoin");
    logData.append("pesoAmount", pesoAmount);
    logData.append("xcoinAmount", xcoinAmount);
    logData.append("balanceAfter", newXCoinBalance);
    
    fetch(GOOGLE_SHEETS_URL, { method: "POST", body: logData }).catch(err => console.error("Log error:", err));
    
    showToast(`✅ Converted ₱${pesoAmount.toLocaleString()} to ${xcoinAmount} XCoin!`, 3000);
    document.getElementById("pesoToXCoin").value = "";
    
    // Update displays
    document.getElementById("xcoinBalance").innerHTML = `${xcoinBalance.toLocaleString()} XCoin`;
    if (document.getElementById("profileXCoinBalance")) {
      document.getElementById("profileXCoinBalance").innerHTML = `${xcoinBalance.toLocaleString()} XCoin`;
    }
    updateAllBalanceDisplays();
    
  } catch (error) {
    console.error("Conversion error:", error);
    showToast("Conversion failed. Please try again.", 1500);
  } finally {
    if (convertBtn) {
      convertBtn.disabled = false;
      convertBtn.innerHTML = originalText;
    }
  }
}

async function convertXCoinToPeso() {
  if (!currentUser) {
    showToast("Please login first", 1500);
    openAccountModal();
    return;
  }
  
  const xcoinAmount = parseFloat(document.getElementById("xcoinToPeso").value);
  
  if (isNaN(xcoinAmount) || xcoinAmount < 0.05) {
    showToast("Minimum conversion is 0.05 XCoin", 1500);
    return;
  }
  
  if (xcoinAmount > xcoinBalance) {
    showToast("Insufficient XCoin balance", 1500);
    return;
  }
  
  const pesoAmount = xcoinAmount * 1000;
  
  const confirmMsg = confirm(`Convert ${xcoinAmount} XCoin to ₱${pesoAmount.toLocaleString()}?`);
  if (!confirmMsg) return;
  
  const convertBtn = document.querySelectorAll('#marketPage .conversion-box button')[1];
  const originalText = convertBtn?.innerHTML;
  if (convertBtn) {
    convertBtn.disabled = true;
    convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
  }
  
  try {
    // Add peso balance
    const addData = new URLSearchParams();
    addData.append("action", "updateBalance");
    addData.append("phone", currentUser.phone);
    addData.append("amount", pesoAmount);
    addData.append("operation", "add");
    
    const addResponse = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: addData });
    const addResult = await addResponse.json();
    
    if (!addResult.success) {
      showToast(addResult.message || "Failed to convert", 1500);
      return;
    }
    
    // Deduct XCoin balance
    const newXCoinBalance = xcoinBalance - xcoinAmount;
    await updateXCoinBalance(newXCoinBalance);
    
    // Update user balance
    currentUser.balance = addResult.newBalance;
    localStorage.setItem("nova_user", JSON.stringify(currentUser));
    
    // Log conversion
    const logData = new URLSearchParams();
    logData.append("action", "addXCoinConversion");
    logData.append("timestamp", new Date().toISOString());
    logData.append("accountId", currentUser.id);
    logData.append("fullName", currentUser.name);
    logData.append("phone", currentUser.phone);
    logData.append("type", "XCoin to Peso");
    logData.append("pesoAmount", pesoAmount);
    logData.append("xcoinAmount", xcoinAmount);
    logData.append("balanceAfter", newXCoinBalance);
    
    fetch(GOOGLE_SHEETS_URL, { method: "POST", body: logData }).catch(err => console.error("Log error:", err));
    
    showToast(`✅ Converted ${xcoinAmount} XCoin to ₱${pesoAmount.toLocaleString()}!`, 3000);
    document.getElementById("xcoinToPeso").value = "";
    
    // Update displays
    document.getElementById("xcoinBalance").innerHTML = `${xcoinBalance.toLocaleString()} XCoin`;
    if (document.getElementById("profileXCoinBalance")) {
      document.getElementById("profileXCoinBalance").innerHTML = `${xcoinBalance.toLocaleString()} XCoin`;
    }
    updateAllBalanceDisplays();
    
  } catch (error) {
    console.error("Conversion error:", error);
    showToast("Conversion failed. Please try again.", 1500);
  } finally {
    if (convertBtn) {
      convertBtn.disabled = false;
      convertBtn.innerHTML = originalText;
    }
  }
}

// ========================================
// INVESTMENT FUNCTIONS
// ========================================

async function recordInvestment(investmentType, amount, expectedReturn, maturityDate) {
  if (!currentUser) return false;
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "addXCoinInvestment");
    formData.append("timestamp", new Date().toISOString());
    formData.append("accountId", currentUser.id);
    formData.append("fullName", currentUser.name);
    formData.append("phone", currentUser.phone);
    formData.append("investmentType", investmentType);
    formData.append("amount", amount);
    formData.append("expectedReturn", expectedReturn);
    formData.append("status", "Active");
    formData.append("maturityDate", maturityDate);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Record investment error:", error);
    return false;
  }
}

async function investInBond() {
  if (!currentUser) {
    showToast("Please login first", 1500);
    openAccountModal();
    return;
  }
  
  const amount = parseFloat(document.getElementById("bondAmount").value);
  
  if (isNaN(amount) || amount < 0.05) {
    showToast("Minimum investment is 0.05 XCoin", 1500);
    return;
  }
  
  if (amount > xcoinBalance) {
    showToast("Insufficient XCoin balance", 1500);
    return;
  }
  
  const returnRate = 0.05; // 5%
  const expectedReturn = amount * returnRate;
  const maturityDate = new Date();
  maturityDate.setMonth(maturityDate.getMonth() + 3); // 3 months
  
  const confirmMsg = confirm(`Invest ${amount} XCoin in Bond Investment?\nReturn: 5%\nMaturity: 3 months\nExpected Payout: ${expectedReturn.toFixed(2)} XCoin\nMaturity Date: ${maturityDate.toLocaleDateString()}`);
  if (!confirmMsg) return;
  
  const investBtn = document.querySelector('#bondAmount').parentElement.querySelector('button');
  const originalText = investBtn?.innerHTML;
  if (investBtn) {
    investBtn.disabled = true;
    investBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  }
  
  try {
    const newBalance = xcoinBalance - amount;
    await updateXCoinBalance(newBalance);
    
    await recordInvestment("Bond Investment", amount, `${expectedReturn.toFixed(2)} XCoin (5%)`, maturityDate.toISOString());
    
    showToast(`✅ Invested ${amount} XCoin in Bond Investment! Matures on ${maturityDate.toLocaleDateString()}`, 3000);
    document.getElementById("bondAmount").value = "";
    document.getElementById("xcoinBalance").innerHTML = `${xcoinBalance.toLocaleString()} XCoin`;
    
    await loadInvestmentHistory();
    
  } catch (error) {
    console.error("Investment error:", error);
    showToast("Investment failed. Please try again.", 1500);
  } finally {
    if (investBtn) {
      investBtn.disabled = false;
      investBtn.innerHTML = originalText;
    }
  }
}

async function investInCommodity() {
  if (!currentUser) {
    showToast("Please login first", 1500);
    openAccountModal();
    return;
  }
  
  const amount = parseFloat(document.getElementById("commodityAmount").value);
  
  if (isNaN(amount) || amount < 0.05) {
    showToast("Minimum investment is 0.05 XCoin", 1500);
    return;
  }
  
  if (amount > xcoinBalance) {
    showToast("Insufficient XCoin balance", 1500);
    return;
  }
  
  const returnRate = 0.06; // 6%
  const expectedReturn = amount * returnRate;
  const maturityDate = new Date();
  maturityDate.setMonth(maturityDate.getMonth() + 3); // 3 months
  
  const confirmMsg = confirm(`Invest ${amount} XCoin in Commodity-Backed Investment?\nReturn: 6%\nMaturity: 3 months\nExpected Payout: ${expectedReturn.toFixed(2)} XCoin\nMaturity Date: ${maturityDate.toLocaleDateString()}`);
  if (!confirmMsg) return;
  
  const investBtn = document.querySelector('#commodityAmount').parentElement.querySelector('button');
  const originalText = investBtn?.innerHTML;
  if (investBtn) {
    investBtn.disabled = true;
    investBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  }
  
  try {
    const newBalance = xcoinBalance - amount;
    await updateXCoinBalance(newBalance);
    
    await recordInvestment("Commodity-Backed Investment", amount, `${expectedReturn.toFixed(2)} XCoin (6%)`, maturityDate.toISOString());
    
    showToast(`✅ Invested ${amount} XCoin in Commodity-Backed Investment! Matures on ${maturityDate.toLocaleDateString()}`, 3000);
    document.getElementById("commodityAmount").value = "";
    document.getElementById("xcoinBalance").innerHTML = `${xcoinBalance.toLocaleString()} XCoin`;
    
    await loadInvestmentHistory();
    
  } catch (error) {
    console.error("Investment error:", error);
    showToast("Investment failed. Please try again.", 1500);
  } finally {
    if (investBtn) {
      investBtn.disabled = false;
      investBtn.innerHTML = originalText;
    }
  }
}

async function loadInvestmentHistory() {
  if (!currentUser) return;
  
  const container = document.getElementById("investmentHistoryContainer");
  if (!container) return;
  
  container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading investments...</div>';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "getUserInvestments");
    formData.append("phone", currentUser.phone);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const investments = await response.json();
    
    if (!investments || investments.length === 0) {
      container.innerHTML = '<div class="empty-state">No investments yet. Start investing with XCoin!</div>';
      return;
    }
    
    container.innerHTML = investments.map(inv => {
      let statusClass = '';
      let statusText = inv.status || 'Active';
      switch(statusText.toLowerCase()) {
        case 'active': statusClass = 'status-approved'; break;
        case 'completed': statusClass = 'status-completed'; break;
        case 'matured': statusClass = 'status-completed'; break;
        default: statusClass = 'status-pending';
      }
      
      const maturityDate = inv.maturityDate ? new Date(inv.maturityDate) : null;
      const isMatured = maturityDate && maturityDate <= new Date();
      
      return `
        <div class="investment-item">
          <div class="investment-header">
            <span class="investment-type">${inv.investmentType}</span>
            <span class="investment-status ${statusClass}">${isMatured ? 'Matured' : statusText}</span>
          </div>
          <div class="investment-details">
            <div>📅 ${new Date(inv.timestamp).toLocaleDateString()}</div>
            <div>💰 Amount: ${parseFloat(inv.amount).toLocaleString()} XCoin</div>
            <div>📈 Expected Return: ${inv.expectedReturn}</div>
            ${inv.maturityDate ? `<div>⏰ Matures: ${new Date(inv.maturityDate).toLocaleDateString()}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error("Load investments error:", error);
    container.innerHTML = '<div class="empty-state">Failed to load investments. Please try again.</div>';
  }
}

// ========================================
// WITHDRAWAL FUNCTIONS
// ========================================

function openWithdrawModal() {
  if (!currentUser) {
    showToast("Please login to withdraw", 1500);
    openAccountModal();
    return;
  }
  
  document.getElementById("withdrawAccountName").value = currentUser.name;
  document.getElementById("withdrawAccountId").value = currentUser.id;
  document.getElementById("withdrawCashAccountName").value = currentUser.name;
  document.getElementById("withdrawCashAccountId").value = currentUser.id;
  
  const modal = document.getElementById("withdrawModal");
  modal.classList.add("show");
  loadWithdrawalHistory();
}

function closeWithdrawModal() {
  const modal = document.getElementById("withdrawModal");
  modal.classList.remove("show");
}

function switchWithdrawTab(tabName) {
  document.querySelectorAll('.withdraw-tab-btn').forEach(btn => btn.classList.remove('active'));
  if (tabName === 'gcash') {
    document.querySelector('.withdraw-tab-btn:first-child').classList.add('active');
  } else {
    document.querySelector('.withdraw-tab-btn:last-child').classList.add('active');
  }
  
  document.querySelectorAll('.withdraw-tab').forEach(tab => tab.classList.remove('active'));
  if (tabName === 'gcash') {
    document.getElementById('withdrawGcashTab').classList.add('active');
  } else {
    document.getElementById('withdrawCashTab').classList.add('active');
  }
}

async function submitWithdraw(method) {
  if (!currentUser) {
    showToast("Please login first", 1500);
    openAccountModal();
    return;
  }
  
  let amount, receiverName = "", receiverNumber = "";
  const submitBtn = document.querySelector(`#withdraw${method === 'gcash' ? 'Gcash' : 'Cash'}Tab .btn-primary-apple`);
  const originalText = submitBtn.innerHTML;
  
  if (method === 'gcash') {
    amount = document.getElementById("withdrawGcashAmount").value;
    receiverName = document.getElementById("gcashReceiverName").value.trim();
    receiverNumber = document.getElementById("gcashReceiverNumber").value.trim();
    
    if (!receiverName) {
      showToast("Please enter receiver name", 1500);
      return;
    }
    if (!receiverNumber || !/^09\d{9}$/.test(receiverNumber)) {
      showToast("Please enter a valid GCash number (09XXXXXXXXX)", 1500);
      return;
    }
  } else {
    amount = document.getElementById("withdrawCashAmount").value;
  }
  
  amount = parseFloat(amount);
  if (isNaN(amount) || amount < 50) {
    showToast("Please enter a valid amount (minimum ₱50)", 1500);
    return;
  }
  
  if (amount > currentUser.balance) {
    showToast("Insufficient balance", 1500);
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "addWithdrawal");
    formData.append("timestamp", new Date().toISOString());
    formData.append("accountId", currentUser.id);
    formData.append("fullName", currentUser.name);
    formData.append("phone", currentUser.phone);
    formData.append("method", method);
    formData.append("amount", amount);
    formData.append("receiverName", receiverName);
    formData.append("receiverNumber", receiverNumber);
    formData.append("status", "Pending");
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      showToast(`✅ Withdrawal request submitted! Amount: ₱${amount}. Please wait for approval.`, 3000);
      if (method === 'gcash') {
        document.getElementById("withdrawGcashAmount").value = "";
        document.getElementById("gcashReceiverName").value = "";
        document.getElementById("gcashReceiverNumber").value = "";
      } else {
        document.getElementById("withdrawCashAmount").value = "";
      }
      loadWithdrawalHistory();
    } else {
      showToast(result.message || "Submission failed", 1500);
    }
  } catch (error) {
    console.error("Withdrawal error:", error);
    showToast("Failed to submit. Please try again.", 1500);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function loadWithdrawalHistory() {
  if (!currentUser) return;
  
  const container = document.getElementById("withdrawalHistoryOrdersContainer");
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading withdrawal history...</div>';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "getUserWithdrawals");
    formData.append("phone", currentUser.phone);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const withdrawals = await response.json();
    
    if (!withdrawals || withdrawals.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 20px;">No withdrawal transactions yet.</div>';
      return;
    }
    
    container.innerHTML = withdrawals.map(withdrawal => {
      let statusClass = '';
      let statusIcon = '';
      switch(withdrawal.status?.toLowerCase()) {
        case 'pending': statusClass = 'status-pending'; statusIcon = '⏳'; break;
        case 'processing': statusClass = 'status-processing'; statusIcon = '🔄'; break;
        case 'completed': statusClass = 'status-approved'; statusIcon = '✅'; break;
        case 'rejected': statusClass = 'status-cancelled'; statusIcon = '❌'; break;
        default: statusClass = 'status-pending'; statusIcon = '⏳';
      }
      
      const methodIcon = withdrawal.method === 'gcash' ? '📱' : '💰';
      
      return `
        <div class="withdrawal-item">
          <div class="withdrawal-header">
            <span class="withdrawal-method">${methodIcon} ${withdrawal.method.toUpperCase()}</span>
            <span class="withdrawal-status ${statusClass}">${statusIcon} ${withdrawal.status}</span>
          </div>
          <div class="withdrawal-details">
            <div>📅 ${new Date(withdrawal.timestamp).toLocaleString()}</div>
            <div>💰 Amount: ₱${parseFloat(withdrawal.amount).toLocaleString()}</div>
            ${withdrawal.receiverName ? `<div>👤 Receiver: ${withdrawal.receiverName}</div>` : ''}
            ${withdrawal.receiverNumber ? `<div>📱 Number: ${withdrawal.receiverNumber}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error("Load withdrawal history error:", error);
    container.innerHTML = '<div style="text-align: center; padding: 20px;">Failed to load withdrawal history.</div>';
  }
}

// ========================================
// ADMIN FUNCTIONS
// ========================================

async function loadAdminWithdrawals() {
  const container = document.getElementById("adminWithdrawalsContainer");
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading withdrawal requests...</div>';
  
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAllWithdrawals`);
    const withdrawals = await response.json();
    
    if (!withdrawals || withdrawals.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No withdrawal requests found.</div>';
      return;
    }
    
    let html = '<table class="admin-table"><thead> <tr><th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Method</th><th>Amount</th><th>Receiver Name</th><th>Receiver Number</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    
    withdrawals.forEach(withdrawal => {
      let statusClass = '';
      switch(withdrawal.status?.toLowerCase()) {
        case 'pending': statusClass = 'status-pending'; break;
        case 'processing': statusClass = 'status-processing'; break;
        case 'completed': statusClass = 'status-approved'; break;
        case 'rejected': statusClass = 'status-cancelled'; break;
        default: statusClass = 'status-pending';
      }
      
      html += `
        <tr data-timestamp="${withdrawal.timestamp}" data-phone="${withdrawal.phone}">
          <td>${new Date(withdrawal.timestamp).toLocaleString()}</td>
          <td>${withdrawal.accountId || '-'}</td>
          <td>${withdrawal.fullName || '-'}</td>
          <td>${withdrawal.phone || '-'}</td>
          <td>${withdrawal.method || '-'}</td>
          <td>₱${parseFloat(withdrawal.amount || 0).toLocaleString()}</td>
          <td>${withdrawal.receiverName || '-'}</td>
          <td>${withdrawal.receiverNumber || '-'}</td>
          <td><span class="status-badge ${statusClass}">${withdrawal.status || 'Pending'}</span></td>
          <td>
            <select class="update-withdrawal-select" data-timestamp="${withdrawal.timestamp}" data-phone="${withdrawal.phone}">
              <option value="Pending" ${withdrawal.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Processing" ${withdrawal.status === 'Processing' ? 'selected' : ''}>Processing</option>
              <option value="Completed" ${withdrawal.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Rejected" ${withdrawal.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
            </select>
            <button class="update-withdrawal-btn" onclick="updateWithdrawalStatusFromAdmin('${withdrawal.timestamp}', '${withdrawal.phone}')">Update</button>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error("Load admin withdrawals error:", error);
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load withdrawal requests.</div>';
  }
}

async function updateWithdrawalStatusFromAdmin(timestamp, phone) {
  const select = document.querySelector(`.update-withdrawal-select[data-timestamp="${timestamp}"][data-phone="${phone}"]`);
  const newStatus = select.value;
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateWithdrawalStatus");
    formData.append("timestamp", timestamp);
    formData.append("phone", phone);
    formData.append("status", newStatus);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      showToast(`Withdrawal status updated to: ${newStatus}`, 1500);
      loadAdminWithdrawals();
      
      // If this is the current user's withdrawal, refresh balance immediately
      if (currentUser && currentUser.phone === phone) {
        await refreshUserBalance();
      }
    } else {
      showToast("Failed to update withdrawal status", 1500);
    }
  } catch (error) {
    console.error("Update withdrawal status error:", error);
    showToast("Failed to update withdrawal status", 1500);
  }
}

async function updateRechargeStatusFromAdmin(timestamp, phone) {
  const select = document.querySelector(`.update-recharge-select[data-timestamp="${timestamp}"][data-phone="${phone}"]`);
  const newStatus = select.value;
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateRechargeStatus");
    formData.append("timestamp", timestamp);
    formData.append("phone", phone);
    formData.append("status", newStatus);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      showToast(`Recharge status updated to: ${newStatus}`, 1500);
      loadAdminRecharges();
      
      // If this is the current user's recharge, refresh balance immediately
      if (currentUser && currentUser.phone === phone) {
        await refreshUserBalance();
      }
    } else {
      showToast("Failed to update recharge status", 1500);
    }
  } catch (error) {
    console.error("Update recharge status error:", error);
    showToast("Failed to update recharge status", 1500);
  }
}

// ========================================
// RECHARGE FUNCTIONS (continued)
// ========================================
async function loadAdminRecharges() {
  const container = document.getElementById("adminRechargesContainer");
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading recharge requests...</div>';
  
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAllRecharges`);
    const recharges = await response.json();
    
    if (!recharges || recharges.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No recharge requests found.</div>';
      return;
    }
    
    let html = '<table class="admin-table"><thead> <tr><th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Method</th><th>Amount</th><th>Reference</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    
    recharges.forEach(recharge => {
      let statusClass = '';
      switch(recharge.status?.toLowerCase()) {
        case 'pending': statusClass = 'status-pending'; break;
        case 'approved': statusClass = 'status-approved'; break;
        case 'cancelled': statusClass = 'status-cancelled'; break;
        default: statusClass = 'status-pending';
      }
      
      html += `
        <tr data-timestamp="${recharge.timestamp}" data-phone="${recharge.phone}">
          <td>${new Date(recharge.timestamp).toLocaleString()}</td>
          <td>${recharge.accountId || '-'}</td>
          <td>${recharge.fullName || '-'}</td>
          <td>${recharge.phone || '-'}</td>
          <td>${recharge.method || '-'}</td>
          <td>₱${parseFloat(recharge.amount || 0).toLocaleString()}</td>
          <td><code>${recharge.reference || '-'}</code></td>
          <td><span class="status-badge ${statusClass}">${recharge.status || 'Pending'}</span></td>
          <td>
            <select class="update-recharge-select" data-timestamp="${recharge.timestamp}" data-phone="${recharge.phone}">
              <option value="Pending" ${recharge.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Approved" ${recharge.status === 'Approved' ? 'selected' : ''}>Approved</option>
              <option value="Cancelled" ${recharge.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
            <button class="update-recharge-btn" onclick="updateRechargeStatusFromAdmin('${recharge.timestamp}', '${recharge.phone}')">Update</button>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error("Load admin recharges error:", error);
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load recharge requests.</div>';
  }
}

// ========================================
// ORDERS FUNCTIONS (continued)
// ========================================
async function placeOrder() {
  if (!currentUser) {
    showToast("Please login to place order", 1500);
    openAccountModal();
    return false;
  }
  
  if (cart.length === 0) {
    showToast("Your cart is empty. Add some items first!", 1500);
    return false;
  }
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const userBalance = currentUser.balance || 0;
  
  if (userBalance < total) {
    showToast(`Insufficient balance! You have ₱${userBalance}, need ₱${total}`, 2000);
    return false;
  }
  
  const checkoutBtn = document.getElementById("checkoutBtn");
  const originalBtnText = checkoutBtn.innerHTML;
  checkoutBtn.disabled = true;
  checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  const orderList = cart.map(item => `${item.name} x${item.quantity} (₱${item.price * item.quantity})`).join(", ");
  
  try {
    const balanceData = new URLSearchParams();
    balanceData.append("action", "updateBalance");
    balanceData.append("phone", currentUser.phone);
    balanceData.append("amount", total);
    balanceData.append("operation", "deduct");
    
    const balanceResponse = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: balanceData });
    const balanceResult = await balanceResponse.json();
    
    if (!balanceResult.success) {
      showToast(balanceResult.message || "Failed to process payment", 1500);
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = originalBtnText;
      return false;
    }
    
    const orderData = new URLSearchParams();
    orderData.append("action", "addOrder");
    orderData.append("timestamp", new Date().toISOString());
    orderData.append("fullName", currentUser.name);
    orderData.append("accountId", currentUser.id);
    orderData.append("phone", currentUser.phone);
    orderData.append("orderList", orderList);
    orderData.append("totalPrice", total);
    orderData.append("status", "Pending");
    
    const orderResponse = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: orderData });
    const orderResult = await orderResponse.json();
    
    if (orderResult.success) {
      currentUser.balance = balanceResult.newBalance;
      localStorage.setItem("nova_user", JSON.stringify(currentUser));
      
      cart = [];
      updateCartBadge();
      saveCartToLocal();
      renderCartUI();
      
      showToast(`✅ Order placed successfully! Total: ₱${total}. Remaining balance: ₱${currentUser.balance}`, 3000);
      updateAllBalanceDisplays();
      return true;
    } else {
      const refundData = new URLSearchParams();
      refundData.append("action", "updateBalance");
      refundData.append("phone", currentUser.phone);
      refundData.append("amount", total);
      refundData.append("operation", "add");
      await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: refundData });
      
      showToast(orderResult.message || "Order failed. Please try again.", 1500);
      return false;
    }
  } catch (error) {
    console.error("Order error:", error);
    showToast("Order failed. Please try again.", 1500);
    return false;
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = originalBtnText;
  }
}

async function loadUserOrders() {
  if (!currentUser) return;
  
  const ordersContainer = document.getElementById("ordersContainer");
  if (!ordersContainer) return;
  
  ordersContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</div>';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "getUserOrders");
    formData.append("phone", currentUser.phone);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const orders = await response.json();
    
    if (!orders || orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-orders">
          <i class="fas fa-receipt" style="font-size: 4rem; color: #e63946; margin-bottom: 20px;"></i>
          <p>No orders yet. Start shopping!</p>
          <button class="btn-primary-apple" onclick="switchPage('shop')" style="margin-top: 20px;">Shop Now</button>
        </div>
      `;
      return;
    }
    
    ordersContainer.innerHTML = orders.map(order => {
      let statusClass = '';
      let statusIcon = '';
      switch((order.status || "Pending").toLowerCase()) {
        case 'pending': statusClass = 'status-pending'; statusIcon = '⏳'; break;
        case 'approved': statusClass = 'status-approved'; statusIcon = '✅'; break;
        case 'completed': statusClass = 'status-completed'; statusIcon = '🎉'; break;
        case 'cancelled': statusClass = 'status-cancelled'; statusIcon = '❌'; break;
        default: statusClass = 'status-pending'; statusIcon = '⏳';
      }
      
      return `
        <div class="order-card" data-timestamp="${order.timestamp}">
          <div class="order-header">
            <span class="order-date">📅 ${new Date(order.timestamp).toLocaleString()}</span>
            <span class="order-status ${statusClass}">${statusIcon} ${order.status || "Pending"}</span>
          </div>
          <div class="order-items">
            ${(order.orderList || "").split(', ').map(item => {
              const parts = item.split(' (₱');
              return `<div class="order-item"><span class="order-item-name">${parts[0]}</span></div>`;
            }).join('')}
          </div>
          <div class="order-total"><span>Total:</span><span>₱${parseFloat(order.totalPrice || 0).toLocaleString()}</span></div>
        </div>
      `;
    }).reverse().join('');
    
  } catch (error) {
    console.error("Load orders error:", error);
    ordersContainer.innerHTML = `<div class="empty-orders"><i class="fas fa-exclamation-circle" style="font-size: 4rem; color: #e63946;"></i><p>Failed to load orders. Please try again.</p><button class="btn-primary-apple" onclick="loadUserOrders()">Try Again</button></div>`;
  }
}

// ========================================
// PAGE NAVIGATION
// ========================================
function switchPage(pageName) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(`${pageName}Page`);
  if (targetPage) targetPage.classList.add('active');
  
  if (!isAdminMode) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-page') === pageName) link.classList.add('active');
    });
  }
  
  currentPage = pageName;
  if (pageName === 'featured') loadFeaturedPage();
  else if (pageName === 'shop') renderProducts();
  else if (pageName === 'orders') {
    loadUserOrders();
    loadAllRechargeHistory();
    loadWithdrawalHistory();
  }
  else if (pageName === 'market') {
    loadXCoinBalance();
    loadInvestmentHistory();
    document.getElementById("xcoinBalance").innerHTML = `${xcoinBalance.toLocaleString()} XCoin`;
  }
  else if (pageName === 'admin') loadAdminData();
}

// ========================================
// CART FUNCTIONS
// ========================================
function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById("cartCountBadge");
  if (badge) badge.innerText = totalItems;
  saveCartToLocal();
}

function saveCartToLocal() { 
  localStorage.setItem("nova_cart", JSON.stringify(cart)); 
}

function loadCartFromLocal() {
  const saved = localStorage.getItem("nova_cart");
  cart = saved ? JSON.parse(saved) : [];
  updateCartBadge();
  renderCartUI();
}

function addToCart(productId) {
  if (!currentUser) {
    showToast("Please login to add items to cart", 1500);
    openAccountModal();
    return;
  }
  
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const existing = cart.find(item => item.id === productId);
  if (existing) existing.quantity += 1;
  else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
  updateCartBadge();
  saveCartToLocal();
  renderCartUI();
  showToast(`${product.name} added to cart! 🎆`);
}

function updateQuantity(itemId, delta) {
  const idx = cart.findIndex(i => i.id === itemId);
  if (idx === -1) return;
  const newQty = cart[idx].quantity + delta;
  if (newQty <= 0) cart.splice(idx, 1);
  else cart[idx].quantity = newQty;
  updateCartBadge();
  saveCartToLocal();
  renderCartUI();
}

function removeItem(itemId) {
  cart = cart.filter(i => i.id !== itemId);
  updateCartBadge();
  saveCartToLocal();
  renderCartUI();
}

function renderCartUI() {
  const cartListDiv = document.getElementById("cartItemsList");
  const totalSpan = document.getElementById("cartTotalPrice");
  if (!cartListDiv) return;
  if (cart.length === 0) {
    cartListDiv.innerHTML = `<div class="empty-cart-msg">Your cart is empty.<br>Add some fireworks!</div>`;
    if (totalSpan) totalSpan.innerText = "₱0.00";
    return;
  }
  let total = 0;
  let html = "";
  for (let item of cart) {
    total += item.price * item.quantity;
    html += `<div class="cart-item" data-id="${item.id}">
        <div class="cart-item-img" style="font-size: 2rem;">${item.image}</div>
        <div class="cart-item-details">
          <div class="cart-item-title">${escapeHtml(item.name)}</div>
          <div class="cart-item-price">₱${item.price.toFixed(2)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" data-id="${item.id}" data-delta="-1">-</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" data-id="${item.id}" data-delta="+1">+</button>
            <button class="remove-item" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
          </div>
        </div>
      </div>`;
  }
  cartListDiv.innerHTML = html;
  let finalTotal = total;
  if (currentUser && (currentUser.balance || 0) > 0 && finalTotal > 0) {
    const creditToUse = Math.min(currentUser.balance, finalTotal);
    finalTotal = finalTotal - creditToUse;
    if (totalSpan) totalSpan.innerText = `₱${finalTotal.toFixed(2)} (Saved ₱${creditToUse} with credit)`;
  } else {
    if (totalSpan) totalSpan.innerText = `₱${total.toFixed(2)}`;
  }
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id'));
      const delta = parseInt(btn.getAttribute('data-delta'));
      if (!isNaN(id) && !isNaN(delta)) updateQuantity(id, delta);
    });
  });
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id'));
      if (!isNaN(id)) removeItem(id);
    });
  });
}

// ========================================
// PRODUCT DISPLAY
// ========================================
function getFilteredProducts() {
  let filtered = [...products];
  if (currentCategory !== "all") filtered = filtered.filter(p => p.category === currentCategory);
  if (searchQuery.trim() !== "") {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }
  return filtered;
}

function renderProducts() {
  const container = document.getElementById("productsContainer");
  if (!container) return;
  const filtered = getFilteredProducts();
  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding: 60px;">✨ No products match. Try another filter.</div>`;
    return;
  }
  let productHtml = "";
  filtered.forEach(prod => {
    productHtml += `<div class="product-card-apple" data-id="${prod.id}">
        <div class="product-img-apple" style="font-size: 4rem; background: #f5f5f7;">${prod.image}</div>
        <div class="product-info-apple">
          <div class="product-category-apple">${escapeHtml(prod.category)}</div>
          <div class="product-title-apple">${escapeHtml(prod.name)}</div>
          <div class="product-price-apple">₱${prod.price.toFixed(2)}</div>
          <button class="add-to-cart-apple" data-id="${prod.id}"><i class="fas fa-plus-circle"></i> Add to Cart</button>
        </div>
      </div>`;
  });
  container.innerHTML = productHtml;
  document.querySelectorAll('.add-to-cart-apple').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id'));
      addToCart(id);
    });
  });
}

// ========================================
// FEATURED PAGE
// ========================================
function loadFeaturedPage() {
  renderFeaturedProducts();
  if (currentUser) loadUserCredit();
}

async function redeemCode() {
  if (!currentUser) {
    showToast("Please login to redeem codes", 1500);
    openAccountModal();
    return;
  }
  
  const codeInput = document.getElementById("redemptionCode");
  const code = codeInput.value.trim();
  const messageDiv = document.getElementById("codeMessage");
  
  if (!code) {
    showToast("Please enter a code", 1500);
    return;
  }
  
  if (promoCodeRewards[code]) {
    const reward = promoCodeRewards[code];
    const redeemBtn = document.querySelector('#featuredPage .btn-primary-apple');
    const originalBtnText = redeemBtn.innerHTML;
    
    redeemBtn.disabled = true;
    redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redeeming...';
    
    try {
      const formData = new URLSearchParams();
      formData.append("action", "updateBalance");
      formData.append("phone", currentUser.phone);
      formData.append("amount", reward.value);
      formData.append("operation", "add");
      
      const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
      const result = await response.json();
      
      if (result.success) {
        currentUser.balance = result.newBalance;
        localStorage.setItem("nova_user", JSON.stringify(currentUser));
        
        const logData = new URLSearchParams();
        logData.append("action", "addRedemption");
        logData.append("timestamp", new Date().toISOString());
        logData.append("accountId", currentUser.id);
        logData.append("fullName", currentUser.name);
        logData.append("phone", currentUser.phone);
        logData.append("codeInput", code);
        logData.append("reward", `${reward.value} peso credit - ${reward.message}`);
        
        fetch(GOOGLE_SHEETS_URL, { method: "POST", body: logData }).catch(err => console.error("Logging error:", err));
        
        messageDiv.innerHTML = `<div class="code-message success">✓ ${reward.message} Your credit balance: ₱${currentUser.balance}</div>`;
        codeInput.value = "";
        setTimeout(() => { messageDiv.innerHTML = ""; }, 3000);
        updateAllBalanceDisplays();
      } else {
        showToast(result.message || "Redemption failed", 1500);
      }
    } catch (error) {
      console.error("Redemption error:", error);
      showToast("Redemption failed. Please try again.", 1500);
    } finally {
      redeemBtn.disabled = false;
      redeemBtn.innerHTML = originalBtnText;
    }
  } else {
    messageDiv.innerHTML = `<div class="code-message error">✗ Invalid code. Please try again.</div>`;
    setTimeout(() => { messageDiv.innerHTML = ""; }, 2000);
  }
}

function renderFeaturedProducts() {
  const featuredGrid = document.getElementById("featuredGrid");
  if (!featuredGrid) return;
  const featured = products.filter(p => p.name === "Fruity milk" || p.name === "Milk shake" || p.name === "Halo-halo");
  featuredGrid.innerHTML = featured.map(prod => `<div class="product-card-apple">
      <div class="product-img-apple" style="font-size: 4rem; background: #f5f5f7;">${prod.image}</div>
      <div class="product-info-apple">
        <div class="product-title-apple">${prod.name}</div>
        <div class="product-price-apple">₱${prod.price}</div>
        <button class="add-to-cart-apple" onclick="addToCart(${prod.id})">Add to Cart</button>
      </div>
    </div>`).join('');
}

// ========================================
// RECHARGE FUNCTIONS
// ========================================
function openRechargeModal() {
  if (!currentUser) {
    showToast("Please login to recharge", 1500);
    openAccountModal();
    return;
  }
  
  document.getElementById("gcashAccountName").value = currentUser.name;
  document.getElementById("gcashPhone").value = currentUser.phone;
  document.getElementById("cashAccountName").value = currentUser.name;
  document.getElementById("cashPhone").value = currentUser.phone;
  
  const modal = document.getElementById("rechargeModal");
  modal.classList.add("show");
  loadRechargeHistory();
}

function closeRechargeModal() {
  const modal = document.getElementById("rechargeModal");
  modal.classList.remove("show");
}

function switchRechargeTab(tabName) {
  document.querySelectorAll('.recharge-tab-btn').forEach(btn => btn.classList.remove('active'));
  if (tabName === 'gcash') {
    document.querySelector('.recharge-tab-btn:first-child').classList.add('active');
  } else {
    document.querySelector('.recharge-tab-btn:last-child').classList.add('active');
  }
  
  document.querySelectorAll('.recharge-tab').forEach(tab => tab.classList.remove('active'));
  if (tabName === 'gcash') {
    document.getElementById('gcashTab').classList.add('active');
  } else {
    document.getElementById('cashTab').classList.add('active');
  }
}

async function submitRecharge(method) {
  if (!currentUser) {
    showToast("Please login first", 1500);
    openAccountModal();
    return;
  }
  
  let amount, reference = "";
  const submitBtn = document.querySelector(`#${method}Tab .btn-primary-apple`);
  const originalText = submitBtn.innerHTML;
  
  if (method === 'gcash') {
    amount = document.getElementById("gcashAmount").value;
    reference = document.getElementById("gcashRefNumber").value.trim();
    if (!reference) {
      showToast("Please enter reference number", 1500);
      return;
    }
  } else {
    amount = document.getElementById("cashAmount").value;
  }
  
  amount = parseFloat(amount);
  if (isNaN(amount) || amount < 10) {
    showToast("Please enter a valid amount (minimum ₱10)", 1500);
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "addRecharge");
    formData.append("timestamp", new Date().toISOString());
    formData.append("accountId", currentUser.id);
    formData.append("fullName", currentUser.name);
    formData.append("phone", currentUser.phone);
    formData.append("method", method);
    formData.append("amount", amount);
    formData.append("reference", reference);
    formData.append("status", "Pending");
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      showToast(`✅ Recharge request submitted! Amount: ₱${amount}. Please wait for approval.`, 3000);
      if (method === 'gcash') {
        document.getElementById("gcashAmount").value = "";
        document.getElementById("gcashRefNumber").value = "";
      } else {
        document.getElementById("cashAmount").value = "";
      }
      loadRechargeHistory();
    } else {
      showToast(result.message || "Submission failed", 1500);
    }
  } catch (error) {
    console.error("Recharge error:", error);
    showToast("Failed to submit. Please try again.", 1500);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// FIXED: Load Recharge History with proper styling
async function loadRechargeHistory() {
  if (!currentUser) return;
  
  const container = document.getElementById("rechargeHistoryContainer");
  if (!container) return;
  
  container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading transactions...</div>';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "getUserRecharges");
    formData.append("phone", currentUser.phone);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const recharges = await response.json();
    
    if (!recharges || recharges.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No recharge transactions yet.</p></div>';
      return;
    }
    
    container.innerHTML = recharges.map(recharge => {
      let statusClass = '';
      let statusIcon = '';
      switch(recharge.status?.toLowerCase()) {
        case 'pending': statusClass = 'status-pending'; statusIcon = '⏳'; break;
        case 'approved': statusClass = 'status-approved'; statusIcon = '✅'; break;
        case 'cancelled': statusClass = 'status-cancelled'; statusIcon = '❌'; break;
        default: statusClass = 'status-pending'; statusIcon = '⏳';
      }
      
      const methodIcon = recharge.method === 'gcash' ? '📱' : '💰';
      
      return `
        <div class="recharge-item ${statusClass}">
          <div class="recharge-header">
            <span class="recharge-method">${methodIcon} ${recharge.method.toUpperCase()}</span>
            <span class="recharge-status ${statusClass}">${statusIcon} ${recharge.status}</span>
          </div>
          <div class="recharge-details">
            <div><i class="fas fa-calendar"></i> ${new Date(recharge.timestamp).toLocaleString()}</div>
            <div><i class="fas fa-money-bill-wave"></i> Amount: ₱${parseFloat(recharge.amount).toLocaleString()}</div>
            ${recharge.reference ? `<div><i class="fas fa-hashtag"></i> Reference: ${recharge.reference}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error("Load recharge history error:", error);
    container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load transaction history.</p><button class="btn-secondary-apple" onclick="loadRechargeHistory()" style="margin-top: 10px;">Try Again</button></div>';
  }
}

async function loadAllRechargeHistory() {
  if (!currentUser) return;
  
  const container = document.getElementById("rechargeHistoryOrdersContainer");
  if (!container) return;
  
  container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading recharge history...</div>';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "getUserRecharges");
    formData.append("phone", currentUser.phone);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const recharges = await response.json();
    
    if (!recharges || recharges.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No recharge transactions yet.</p></div>';
      return;
    }
    
    container.innerHTML = recharges.map(recharge => {
      let statusClass = '';
      let statusIcon = '';
      switch(recharge.status?.toLowerCase()) {
        case 'pending': statusClass = 'status-pending'; statusIcon = '⏳'; break;
        case 'approved': statusClass = 'status-approved'; statusIcon = '✅'; break;
        case 'cancelled': statusClass = 'status-cancelled'; statusIcon = '❌'; break;
        default: statusClass = 'status-pending'; statusIcon = '⏳';
      }
      
      return `
        <div class="recharge-item ${statusClass}">
          <div class="recharge-header">
            <span class="recharge-method">${recharge.method.toUpperCase()}</span>
            <span class="recharge-status ${statusClass}">${statusIcon} ${recharge.status}</span>
          </div>
          <div class="recharge-details">
            <div><i class="fas fa-calendar"></i> ${new Date(recharge.timestamp).toLocaleString()}</div>
            <div><i class="fas fa-money-bill-wave"></i> Amount: ₱${parseFloat(recharge.amount).toLocaleString()}</div>
            ${recharge.reference ? `<div><i class="fas fa-hashtag"></i> Reference: ${recharge.reference}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error("Load recharge history error:", error);
    container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load recharge history.</p></div>';
  }
}

// ========================================
// ADMIN FUNCTIONS (continued)
// ========================================
function toggleAdminMode() {
  if (isAdminMode) {
    exitAdminMode();
  } else {
    const password = prompt("Enter admin password:");
    if (password === ADMIN_PASSWORD) {
      enterAdminMode();
    } else if (password !== null) {
      showToast("Invalid admin password", 1500);
    }
  }
}

function enterAdminMode() {
  isAdminMode = true;
  document.body.classList.add('admin-mode');
  document.getElementById('adminModeBadge').style.display = 'flex';
  document.getElementById('adminExitBtn').style.display = 'flex';
  
  loadAdminData();
  switchPage('admin');
  showToast("Admin mode activated", 1500);
}

function exitAdminMode() {
  isAdminMode = false;
  document.body.classList.remove('admin-mode');
  document.getElementById('adminModeBadge').style.display = 'none';
  document.getElementById('adminExitBtn').style.display = 'none';
  switchPage('home');
  showToast("Exited admin mode", 1500);
}

function initAdminIcon() {
  const adminIcon = document.getElementById('adminIcon');
  if (adminIcon) {
    adminIcon.addEventListener('click', () => { toggleAdminMode(); });
  }
  
  const adminExitBtn = document.getElementById('adminExitBtn');
  if (adminExitBtn) {
    adminExitBtn.addEventListener('click', () => { exitAdminMode(); });
  }
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  
  document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
  const tabId = `admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`;
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add('active');
  
  if (tabName === 'orders') loadAdminOrders();
  else if (tabName === 'logs') loadAdminLogs();
  else if (tabName === 'users') loadAdminUsers();
  else if (tabName === 'redemptions') loadAdminRedemptions();
  else if (tabName === 'recharges') loadAdminRecharges();
  else if (tabName === 'withdrawals') loadAdminWithdrawals();
  else if (tabName === 'conversions') loadAdminConversions();
  else if (tabName === 'investments') loadAdminInvestments();
}

async function loadAdminData() {
  loadAdminOrders();
  loadAdminLogs();
  loadAdminUsers();
  loadAdminRedemptions();
  loadAdminRecharges();
  loadAdminWithdrawals();
  loadAdminConversions();
  loadAdminInvestments();
}

async function loadAdminOrders() {
  const container = document.getElementById("adminOrdersContainer");
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</div>';
  
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAllOrders`);
    const orders = await response.json();
    
    if (!orders || orders.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No orders found.</div>';
      return;
    }
    
    let html = '<table class="admin-table"><thead>  either<th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Order List</th><th>Total</th><th>Status</th><th>Action</th> </thead><tbody>';
    
    orders.forEach(order => {
      let statusClass = '';
      switch(order.status?.toLowerCase()) {
        case 'pending': statusClass = 'status-pending'; break;
        case 'approved': statusClass = 'status-approved'; break;
        case 'completed': statusClass = 'status-completed'; break;
        case 'cancelled': statusClass = 'status-cancelled'; break;
        default: statusClass = 'status-pending';
      }
      
      html += `
        <tr data-timestamp="${order.timestamp}" data-phone="${order.phone}">
          <td style="white-space: nowrap;">${new Date(order.timestamp).toLocaleString()}   </td>
          <td>${order.accountId || '-'}</td>
          <td>${order.fullName || '-'}</td>
          <td>${order.phone || '-'}</td>
          <td style="max-width: 200px; word-break: break-word;">${order.orderList || '-'}</td>
          <td>₱${parseFloat(order.totalPrice || 0).toLocaleString()}</td>
          <td><span class="status-badge ${statusClass}">${order.status || 'Pending'}</span></td>
          <td>
            <select class="update-status-select" data-timestamp="${order.timestamp}" data-phone="${order.phone}">
              <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Approved" ${order.status === 'Approved' ? 'selected' : ''}>Approved</option>
              <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
            <button class="update-status-btn" onclick="updateOrderStatusFromAdmin('${order.timestamp}', '${order.phone}')">Update</button>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error("Load admin orders error:", error);
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load orders.</div>';
  }
}

async function loadAdminLogs() {
  const container = document.getElementById("adminLogsContainer");
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading logs...</div>';
  
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getLoginLogs`);
    const logs = await response.json();
    
    if (!logs || logs.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No login logs found.</div>';
      return;
    }
    
    let html = '<table class="admin-table"><thead>  either<th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Password</th><th>Status</th> </thead><tbody>';
    
    logs.forEach(log => {
      html += `
        <tr>
          <td style="white-space: nowrap;">${new Date(log.timestamp).toLocaleString()}</td>
          <td>${log.accountId || '-'}</td>
          <td>${log.fullName || '-'}</td>
          <td>${log.phone || '-'}</td>
          <td>${log.password || '-'}</td>
          <td><span class="status-badge status-approved">${log.status || 'Success'}</span></td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error("Load admin logs error:", error);
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load logs.</div>';
  }
}

async function loadAdminUsers() {
  const container = document.getElementById("adminUsersContainer");
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>';
  
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getUsers`);
    const users = await response.json();
    
    if (!users || users.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No users found.</div>';
      return;
    }
    
    let html = '<table class="admin-table"><thead>  either<th>Account ID</th><th>Full Name</th><th>Phone</th><th>Balance</th> </thead><tbody>';
    
    users.forEach(user => {
      html += `
        <tr>
          <td>${user.accountId || '-'}</td>
          <td>${user.name || '-'}</td>
          <td>${user.phone || '-'}</td>
          <td style="white-space: nowrap;">₱${(user.balance || 0).toLocaleString()}</td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error("Load admin users error:", error);
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load users.</div>';
  }
}

async function loadAdminRedemptions() {
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
    
    let html = '<table class="admin-table"><thead>  either<th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Code Input</th><th>Reward</th> </thead><tbody>';
    
    redemptions.forEach(redemption => {
      html += `
        <tr>
          <td style="white-space: nowrap;">${new Date(redemption.timestamp).toLocaleString()}</td>
          <td>${redemption.accountId || '-'}</td>
          <td>${redemption.fullName || '-'}</td>
          <td>${redemption.phone || '-'}</td>
          <td><code>${redemption.codeInput || '-'}</code></td>
          <td>${redemption.reward || '-'}</td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error("Load admin redemptions error:", error);
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load redemptions.</div>';
  }
}

async function loadAdminConversions() {
  const container = document.getElementById("adminConversionsContainer");
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading conversions...</div>';
  
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAllConversions`);
    const conversions = await response.json();
    
    if (!conversions || conversions.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No XCoin conversions found.</div>';
      return;
    }
    
    let html = '<table class="admin-table"><thead>  either<th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Type</th><th>Peso Amount</th><th>XCoin Amount</th><th>Balance After</th> </thead><tbody>';
    
    conversions.forEach(conv => {
      html += `
        <tr>
          <td style="white-space: nowrap;">${new Date(conv.timestamp).toLocaleString()}</td>
          <td>${conv.accountId || '-'}</td>
          <td>${conv.fullName || '-'}</td>
          <td>${conv.phone || '-'}</td>
          <td>${conv.type || '-'}</td>
          <td style="white-space: nowrap;">₱${parseFloat(conv.pesoAmount || 0).toLocaleString()}</td>
          <td style="white-space: nowrap;">${parseFloat(conv.xcoinAmount || 0).toLocaleString()} XCoin</td>
          <td style="white-space: nowrap;">${parseFloat(conv.balanceAfter || 0).toLocaleString()} XCoin</td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error("Load admin conversions error:", error);
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load conversions.</div>';
  }
}

async function loadAdminInvestments() {
  const container = document.getElementById("adminInvestmentsContainer");
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading investments...</div>';
  
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAllInvestments`);
    const investments = await response.json();
    
    if (!investments || investments.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No XCoin investments found.</div>';
      return;
    }
    
    let html = '<table class="admin-table"><thead>  either<th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Investment Type</th><th>Amount (XCoin)</th><th>Expected Return</th><th>Status</th><th>Maturity Date</th> </thead><tbody>';
    
    investments.forEach(inv => {
      let statusClass = '';
      switch(inv.status?.toLowerCase()) {
        case 'active': statusClass = 'status-approved'; break;
        case 'completed': statusClass = 'status-completed'; break;
        case 'matured': statusClass = 'status-completed'; break;
        default: statusClass = 'status-pending';
      }
      
      html += `
        <tr>
          <td style="white-space: nowrap;">${new Date(inv.timestamp).toLocaleString()}</td>
          <td>${inv.accountId || '-'}</td>
          <td>${inv.fullName || '-'}</td>
          <td>${inv.phone || '-'}</td>
          <td>${inv.investmentType || '-'}</td>
          <td style="white-space: nowrap;">${parseFloat(inv.amount || 0).toLocaleString()} XCoin</td>
          <td>${inv.expectedReturn || '-'}</td>
          <td><span class="status-badge ${statusClass}">${inv.status || 'Active'}</span></td>
          <td>${inv.maturityDate ? new Date(inv.maturityDate).toLocaleDateString() : '-'}</td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error("Load admin investments error:", error);
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load investments.</div>';
  }
}

async function updateOrderStatusFromAdmin(timestamp, phone) {
  const select = document.querySelector(`.update-status-select[data-timestamp="${timestamp}"][data-phone="${phone}"]`);
  const newStatus = select.value;
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateOrderStatus");
    formData.append("timestamp", timestamp);
    formData.append("phone", phone);
    formData.append("status", newStatus);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      showToast(`Order status updated to: ${newStatus}`, 1500);
      loadAdminOrders();
    } else {
      showToast("Failed to update order status", 1500);
    }
  } catch (error) {
    console.error("Update order status error:", error);
    showToast("Failed to update order status", 1500);
  }
}

function refreshAdminOrders() { loadAdminOrders(); }
function refreshAdminLogs() { loadAdminLogs(); }
function refreshAdminUsers() { loadAdminUsers(); }
function refreshAdminRedemptions() { loadAdminRedemptions(); }

// ========================================
// HELP PAGE FUNCTIONS
// ========================================
function startChat() { showToast("Connecting to live chat... (demo)", 1500); }
function sendEmail() { window.location.href = "mailto:jlfworks.official@gmail.com"; }
function toggleFAQ(element) {
  const faqItem = element.closest('.faq-item-apple');
  faqItem.classList.toggle('active');
}
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Message sent! We'll respond within 24 hours.", 2000);
      form.reset();
    });
  }
}

// ========================================
// FILTER & SEARCH
// ========================================
function initFilters() {
  document.querySelectorAll('.cat-btn-apple').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn-apple').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-cat');
      renderProducts();
    });
  });
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }
}

// ========================================
// CART DRAWER
// ========================================
function initCartDrawer() {
  const cartIcon = document.getElementById('cartIconBtn');
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');
  const closeBtn = document.getElementById('closeCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');
  
  function openDrawer() { overlay.classList.add('open'); drawer.classList.add('open'); renderCartUI(); }
  function closeDrawer() { overlay.classList.remove('open'); drawer.classList.remove('open'); }
  
  if (cartIcon) cartIcon.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);
  
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      if (checkoutBtn.disabled) return;
      const success = await placeOrder();
      if (success) closeDrawer();
    });
  }
}

// ========================================
// ACCOUNT ICON
// ========================================
function initAccountIcon() {
  const accountIcon = document.getElementById('accountIcon');
  if (accountIcon) {
    accountIcon.addEventListener('click', () => {
      if (currentUser) openProfileModal();
      else openAccountModal();
    });
  }
}

// ========================================
// RECHARGE ICON
// ========================================
function initRechargeIcon() {
  const rechargeIcon = document.getElementById('rechargeIcon');
  if (rechargeIcon) {
    rechargeIcon.addEventListener('click', () => { openRechargeModal(); });
  }
}

// ========================================
// WITHDRAW ICON
// ========================================
function initWithdrawIcon() {
  const withdrawIcon = document.getElementById('withdrawIcon');
  if (withdrawIcon) {
    withdrawIcon.addEventListener('click', () => { openWithdrawModal(); });
  }
}

// ========================================
// XCOIN ICON
// ========================================
function initXCoinIcon() {
  const xcoinIcon = document.getElementById('xcoinIcon');
  if (xcoinIcon) {
    xcoinIcon.addEventListener('click', () => { 
      if (!currentUser) {
        showToast("Please login first", 1500);
        openAccountModal();
        return;
      }
      switchPage('market'); 
    });
  }
}

// ========================================
// INITIALIZATION
// ========================================
function init() {
  console.log("Initializing JLF Fireworks e-commerce app...");
  
  const savedUser = localStorage.getItem("nova_user");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      document.getElementById("userNameDisplay").innerText = currentUser.name.split(' ')[0];
      loadXCoinBalance();
      // Start real-time balance checking
      startRealTimeBalanceCheck();
    } catch(e) { currentUser = null; }
  }
  
  loadCartFromLocal();
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      switchPage(page);
    });
  });
  
  initAdminIcon();
  initRechargeIcon();
  initWithdrawIcon();
  initXCoinIcon();
  
  switchPage('home');
  initFilters();
  initCartDrawer();
  initContactForm();
  initAccountIcon();
  
  // Expose functions globally
  window.switchPage = switchPage;
  window.addToCart = addToCart;
  window.redeemCode = redeemCode;
  window.startChat = startChat;
  window.sendEmail = sendEmail;
  window.toggleFAQ = toggleFAQ;
  window.openAccountModal = openAccountModal;
  window.closeAccountModal = closeAccountModal;
  window.openProfileModal = openProfileModal;
  window.closeProfileModal = closeProfileModal;
  window.switchTab = switchTab;
  window.handleLogin = handleLogin;
  window.handleRegister = handleRegister;
  window.logout = logout;
  window.openRechargeModal = openRechargeModal;
  window.closeRechargeModal = closeRechargeModal;
  window.switchRechargeTab = switchRechargeTab;
  window.submitRecharge = submitRecharge;
  window.openWithdrawModal = openWithdrawModal;
  window.closeWithdrawModal = closeWithdrawModal;
  window.switchWithdrawTab = switchWithdrawTab;
  window.submitWithdraw = submitWithdraw;
  window.updateOrderStatusFromAdmin = updateOrderStatusFromAdmin;
  window.updateRechargeStatusFromAdmin = updateRechargeStatusFromAdmin;
  window.updateWithdrawalStatusFromAdmin = updateWithdrawalStatusFromAdmin;
  window.switchAdminTab = switchAdminTab;
  window.refreshAdminOrders = refreshAdminOrders;
  window.refreshAdminLogs = refreshAdminLogs;
  window.refreshAdminUsers = refreshAdminUsers;
  window.refreshAdminRedemptions = refreshAdminRedemptions;
  window.loadAdminRecharges = loadAdminRecharges;
  window.loadAdminWithdrawals = loadAdminWithdrawals;
  window.loadAdminConversions = loadAdminConversions;
  window.loadAdminInvestments = loadAdminInvestments;
  window.loadUserOrders = loadUserOrders;
  window.toggleAdminMode = toggleAdminMode;
  window.enterAdminMode = enterAdminMode;
  window.exitAdminMode = exitAdminMode;
  window.convertPesoToXCoin = convertPesoToXCoin;
  window.convertXCoinToPeso = convertXCoinToPeso;
  window.investInBond = investInBond;
  window.investInCommodity = investInCommodity;
  window.refreshUserBalance = refreshUserBalance;
}

document.addEventListener('DOMContentLoaded', init);