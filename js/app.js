// ========================================
// JLF FIREWORKS - MAIN APPLICATION
// ========================================

// PAGE NAVIGATION
function switchPage(pageName) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(`${pageName}Page`);
  if (targetPage) targetPage.classList.add('active');
  
  currentPage = pageName;
  if (pageName === 'featured') loadFeaturedPage();
  else if (pageName === 'shop') renderProducts();
  else if (pageName === 'orders') loadUserOrders();
  else if (pageName === 'settings') renderSettingsPage();
  else if (pageName === 'admin') loadAdminData();
}

// CREDIT FUNCTIONS
function loadUserCredit() {
  if (currentUser && !isAdmin) return currentUser.balance || 0;
  return 0;
}

async function addUserCredit(amount) {
  if (!currentUser || isAdmin) return 0;
  
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
    }
    return 0;
  } catch (error) {
    console.error("Credit error:", error);
    showToast("Failed to add credit. Please try again.", 1500);
    return 0;
  }
}

// ACCOUNT ICON
function initAccountIcon() {
  const accountIcon = document.getElementById('accountIcon');
  if (accountIcon) {
    accountIcon.addEventListener('click', () => {
      if (currentUser && !isAdmin) openProfileModal();
      else if (isAdmin) {
        showToast("Admin logged in. Logout to access user features.", 1500);
      } else {
        openAccountModal();
      }
    });
  }
}

// SETTINGS ICON
function initSettingsIcon() {
  const settingsIcon = document.getElementById('settingsIcon');
  if (settingsIcon) {
    settingsIcon.addEventListener('click', () => {
      if (!isAdmin && currentUser) {
        switchPage('settings');
      } else if (!currentUser) {
        showToast("Please login first", 1500);
        openAccountModal();
      } else if (isAdmin) {
        showToast("Admin mode. Cannot access settings.", 1500);
      }
    });
  }
}

// RECHARGE ICON
function initRechargeIcon() {
  const rechargeIcon = document.getElementById('rechargeIcon');
  if (rechargeIcon) {
    rechargeIcon.addEventListener('click', () => { 
      if (!isAdmin) openRechargeModal(); 
      else showToast("Admin mode. Cannot recharge.", 1500);
    });
  }
}

// WITHDRAW ICON
function initWithdrawIcon() {
  const withdrawIcon = document.getElementById('withdrawIcon');
  if (withdrawIcon) {
    withdrawIcon.addEventListener('click', () => { 
      if (!isAdmin) openWithdrawModal(); 
      else showToast("Admin mode. Cannot withdraw.", 1500);
    });
  }
}

// HELP PAGE FUNCTIONS
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
// INITIALIZATION
// ========================================
function init() {
  console.log("Initializing JLF Fireworks e-commerce app with QR Loyalty System, Announcements, and Settings...");
  
  // Load settings first
  loadSettings();
  
  const savedUser = localStorage.getItem("nova_user");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      isAdmin = false;
      document.getElementById("userNameDisplay").innerText = currentUser.name.split(' ')[0];
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
  
  initRechargeIcon();
  initWithdrawIcon();
  initSettingsIcon();
  
  switchPage('home');
  initFilters();
  initCartDrawer();
  initContactForm();
  initAccountIcon();
  
  setupQrScannerUI();
  startLoyaltyAutoRefresh();
  showDownloadPopup();
  
  // Initialize Announcement System
  loadReadAnnouncements();
  fetchAnnouncements();
  startAnnouncementAutoRefresh();
  
  // Setup announcement icon click
  const announcementIcon = document.getElementById("announcementIcon");
  if (announcementIcon) {
    announcementIcon.addEventListener("click", openAnnouncementModal);
  }
  
  const installBtn = document.getElementById("installAppBtn");
  if (installBtn) {
    installBtn.addEventListener("click", triggerInstall);
  }
  
  // Global window exports
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
  window.investInBondOption1 = investInBondOption1;
  window.investInBondOption2 = investInBondOption2;
  window.updateOrderStatus = updateOrderStatus;
  window.updateRechargeStatus = updateRechargeStatus;
  window.updateWithdrawalStatus = updateWithdrawalStatus;
  window.switchAdminTab = switchAdminTab;
  window.refreshAdminOrders = refreshAdminOrders;
  window.refreshAdminLogs = refreshAdminLogs;
  window.refreshAdminUsers = refreshAdminUsers;
  window.refreshAdminRedemptions = refreshAdminRedemptions;
  window.loadAdminRecharges = loadAdminRecharges;
  window.loadAdminWithdrawals = loadAdminWithdrawals;
  window.loadAdminCreditInvestments = loadAdminCreditInvestments;
  window.showDownloadPopup = showDownloadPopup;
  window.closeDownloadPopup = closeDownloadPopup;
  window.triggerInstall = triggerInstall;
  window.startQrScanner = startQrScanner;
  window.stopQrScanner = stopQrScanner;
  window.processQrFileUpload = processQrFileUpload;
  window.loadRecentScans = loadRecentScans;
  // Announcement System Functions
  window.openAnnouncementModal = openAnnouncementModal;
  window.closeAnnouncementModal = closeAnnouncementModal;
  window.markAnnouncementRead = markAnnouncementRead;
  window.markAllAnnouncementsRead = markAllAnnouncementsRead;
  window.publishAnnouncement = publishAnnouncement;
  window.deleteAnnouncement = deleteAnnouncement;
  window.loadRecentAnnouncements = loadRecentAnnouncements;
  // Settings Functions
  window.toggleDarkMode = toggleDarkMode;
  window.changeFontSize = changeFontSize;
  window.toggleCompactMode = toggleCompactMode;
  window.toggleHighContrast = toggleHighContrast;
  window.clearCache = clearCache;
  window.resetAllSettings = resetAllSettings;
  window.openTermsModal = openTermsModal;
  window.openPrivacyModal = openPrivacyModal;
  window.shareApp = shareApp;
  window.openBugReportModal = openBugReportModal;
  window.closeBugReportModal = closeBugReportModal;
  window.submitBugReport = submitBugReport;
  // Admin Bug Reports
  window.loadAdminBugReports = loadAdminBugReports;
  window.updateBugReportStatus = updateBugReportStatus;
  window.refreshAdminBugReports = refreshAdminBugReports;
}

document.addEventListener('DOMContentLoaded', init);