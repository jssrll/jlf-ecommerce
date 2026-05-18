// ========================================
// JLF FIREWORKS - MAIN APPLICATION
// ========================================

// UPDATE ICON ACTIVE STATE
function updateIconActiveState() {
    document.querySelectorAll('.announcement-icon, .recharge-icon, .withdraw-icon, .settings-icon, .cart-icon, .account-icon').forEach(icon => {
        icon.classList.remove('active');
    });
    
    if (document.getElementById('announcementModal')?.classList.contains('show')) {
        document.getElementById('announcementIcon')?.classList.add('active');
    } 
    if (document.getElementById('rechargeModal')?.classList.contains('show')) {
        document.getElementById('rechargeIcon')?.classList.add('active');
    }
    if (document.getElementById('withdrawModal')?.classList.contains('show')) {
        document.getElementById('withdrawIcon')?.classList.add('active');
    }
    if (currentPage === 'settings') {
        document.getElementById('settingsIcon')?.classList.add('active');
    }
    if (document.getElementById('cartDrawer')?.classList.contains('open')) {
        document.getElementById('cartIconBtn')?.classList.add('active');
    }
    if (document.getElementById('profileModal')?.classList.contains('show') || document.getElementById('accountModal')?.classList.contains('show')) {
        document.getElementById('accountIcon')?.classList.add('active');
    }
}

// PAGE NAVIGATION
function switchPage(pageName) {
    console.log("Switching to page:", pageName);
    
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(`${pageName}Page`);
    if (targetPage) targetPage.classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });
    
    currentPage = pageName;
    
    if (pageName === 'featured' && typeof loadFeaturedPage === 'function') {
        loadFeaturedPage();
    } else if (pageName === 'shop' && typeof renderProducts === 'function') {
        renderProducts();
    } else if (pageName === 'orders' && typeof loadTransactionHistory === 'function') {
        if (currentUser && !isAdmin) {
            loadTransactionHistory();
        } else if (!currentUser) {
            const ordersContainer = document.getElementById("ordersContainer");
            if (ordersContainer) {
                ordersContainer.innerHTML = `
                    <div class="empty-orders">
                        <i class="fas fa-receipt" style="font-size: 4rem; color: #e63946; margin-bottom: 20px;"></i>
                        <p>Please login to view your transactions.</p>
                        <button class="btn-primary-apple" onclick="openAccountModal()" style="margin-top: 20px;">Login / Register</button>
                    </div>
                `;
            }
        }
    } else if (pageName === 'settings' && typeof renderSettingsPage === 'function') {
        renderSettingsPage();
    } else if (pageName === 'admin' && isAdmin && typeof loadAdminData === 'function') {
        loadAdminData();
    }
    
    updateIconActiveState();
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

// ICON INITIALIZATIONS
function initAccountIcon() {
    const accountIcon = document.getElementById('accountIcon');
    if (accountIcon) {
        accountIcon.removeEventListener('click', accountIcon._handler);
        accountIcon._handler = () => {
            if (currentUser && !isAdmin) {
                if (typeof openProfileModal === 'function') openProfileModal();
                updateIconActiveState();
            } else if (isAdmin) {
                showToast("Admin logged in. Logout to access user features.", 1500);
            } else {
                if (typeof openAccountModal === 'function') openAccountModal();
                updateIconActiveState();
            }
        };
        accountIcon.addEventListener('click', accountIcon._handler);
    }
}

function initSettingsIcon() {
    const settingsIcon = document.getElementById('settingsIcon');
    if (settingsIcon) {
        settingsIcon.removeEventListener('click', settingsIcon._handler);
        settingsIcon._handler = () => {
            if (!isAdmin && currentUser) {
                switchPage('settings');
            } else if (!currentUser) {
                showToast("Please login first", 1500);
                if (typeof openAccountModal === 'function') openAccountModal();
            } else if (isAdmin) {
                showToast("Admin mode. Cannot access settings.", 1500);
            }
        };
        settingsIcon.addEventListener('click', settingsIcon._handler);
    }
}

function initRechargeIcon() {
    const rechargeIcon = document.getElementById('rechargeIcon');
    if (rechargeIcon) {
        rechargeIcon.removeEventListener('click', rechargeIcon._handler);
        rechargeIcon._handler = () => {
            if (!isAdmin && currentUser) {
                if (typeof openRechargeModal === 'function') openRechargeModal();
                updateIconActiveState();
            } else if (!currentUser) {
                showToast("Please login first", 1500);
                if (typeof openAccountModal === 'function') openAccountModal();
            } else if (isAdmin) {
                showToast("Admin mode. Cannot recharge.", 1500);
            }
        };
        rechargeIcon.addEventListener('click', rechargeIcon._handler);
    }
}

function initWithdrawIcon() {
    const withdrawIcon = document.getElementById('withdrawIcon');
    if (withdrawIcon) {
        withdrawIcon.removeEventListener('click', withdrawIcon._handler);
        withdrawIcon._handler = () => {
            if (!isAdmin && currentUser) {
                if (typeof openWithdrawModal === 'function') openWithdrawModal();
                updateIconActiveState();
            } else if (!currentUser) {
                showToast("Please login first", 1500);
                if (typeof openAccountModal === 'function') openAccountModal();
            } else if (isAdmin) {
                showToast("Admin mode. Cannot withdraw.", 1500);
            }
        };
        withdrawIcon.addEventListener('click', withdrawIcon._handler);
    }
}

function initCartIcon() {
    const cartIcon = document.getElementById('cartIconBtn');
    if (cartIcon) {
        cartIcon.removeEventListener('click', cartIcon._handler);
        cartIcon._handler = () => {
            if (typeof openCartDrawer === 'function') {
                openCartDrawer();
                updateIconActiveState();
            }
        };
        cartIcon.addEventListener('click', cartIcon._handler);
    }
}

function initAnnouncementIcon() {
    const announcementIcon = document.getElementById("announcementIcon");
    if (announcementIcon) {
        announcementIcon.removeEventListener('click', announcementIcon._handler);
        announcementIcon._handler = () => {
            if (typeof openAnnouncementModal === 'function') {
                openAnnouncementModal();
                updateIconActiveState();
            }
        };
        announcementIcon.addEventListener('click', announcementIcon._handler);
    }
}

// HELP PAGE FUNCTIONS
function startChat() { 
    showToast("Connecting to live chat... (demo)", 1500); 
}

function sendEmail() { 
    window.location.href = "mailto:jlfworks.official@gmail.com"; 
}

function toggleFAQ(element) {
    const faqItem = element.closest('.faq-item-apple');
    if (faqItem) {
        faqItem.classList.toggle('active');
    }
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

// CART DRAWER INIT
function initCartDrawer() {
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCart = document.querySelector('.close-cart');
    
    if (cartOverlay) {
        cartOverlay.removeEventListener('click', cartOverlay._handler);
        cartOverlay._handler = () => {
            document.getElementById('cartDrawer')?.classList.remove('open');
            cartOverlay.classList.remove('open');
            updateIconActiveState();
        };
        cartOverlay.addEventListener('click', cartOverlay._handler);
    }
    
    if (closeCart) {
        closeCart.removeEventListener('click', closeCart._handler);
        closeCart._handler = () => {
            document.getElementById('cartDrawer')?.classList.remove('open');
            document.getElementById('cartOverlay')?.classList.remove('open');
            updateIconActiveState();
        };
        closeCart.addEventListener('click', closeCart._handler);
    }
}

// HAPTIC FEEDBACK
function hapticFeedback() {
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// ========================================
// INITIALIZATION
// ========================================
function init() {
    console.log("Initializing JLF Fireworks e-commerce app...");
    
    // Load settings first
    if (typeof loadSettings === 'function') {
        loadSettings();
    }
    
    // Load cart from localStorage
    if (typeof loadCartFromLocal === 'function') {
        loadCartFromLocal();
    }
    
    // RESTORE USER FROM STORAGE - THIS IS THE KEY FIX
    const userRestored = restoreUserFromStorage();
    console.log("User restored:", userRestored);
    
    // Initialize navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.removeEventListener('click', link._handler);
        link._handler = (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (page) {
                switchPage(page);
            }
        };
        link.addEventListener('click', link._handler);
    });
    
    // Initialize all icons
    initRechargeIcon();
    initWithdrawIcon();
    initSettingsIcon();
    initAccountIcon();
    initCartIcon();
    initAnnouncementIcon();
    
    // Initialize cart drawer
    initCartDrawer();
    
    // Initialize contact form
    initContactForm();
    
    // Initialize filters and products
    if (typeof initFilters === 'function') {
        initFilters();
    }
    
    // Initialize products display
    if (typeof renderProducts === 'function') {
        renderProducts();
    }
    
    // Initialize QR scanner UI
    if (typeof setupQrScannerUI === 'function') {
        setTimeout(() => {
            setupQrScannerUI();
        }, 500);
    }
    
    // Start loyalty auto refresh
    if (typeof startLoyaltyAutoRefresh === 'function') {
        startLoyaltyAutoRefresh();
    }
    
    // Show download popup
    if (typeof showDownloadPopup === 'function') {
        setTimeout(() => {
            showDownloadPopup();
        }, 5000);
    }
    
    // Initialize Announcement System
    if (typeof loadReadAnnouncements === 'function') {
        loadReadAnnouncements();
    }
    if (typeof fetchAnnouncements === 'function') {
        fetchAnnouncements();
    }
    if (typeof startAnnouncementAutoRefresh === 'function') {
        startAnnouncementAutoRefresh();
    }
    
    // Install button
    const installBtn = document.getElementById("installAppBtn");
    if (installBtn) {
        installBtn.removeEventListener('click', installBtn._handler);
        installBtn._handler = () => {
            if (typeof triggerInstall === 'function') {
                triggerInstall();
            }
        };
        installBtn.addEventListener('click', installBtn._handler);
    }
    
    // Start with home page
    switchPage('home');
    
    // Update icon states
    updateIconActiveState();
    
    // If user was restored, refresh balance and transaction history
    if (currentUser && !isAdmin) {
        refreshUserBalance();
        if (typeof loadTransactionHistory === 'function') {
            // Check if on orders page
            const ordersPage = document.getElementById('ordersPage');
            if (ordersPage && ordersPage.classList.contains('active')) {
                loadTransactionHistory();
            }
        }
    }
    
    console.log("JLF Fireworks App Initialized Successfully!");
}

// ========================================
// GLOBAL EXPORTS
// ========================================

// Core functions
window.switchPage = switchPage;
window.updateIconActiveState = updateIconActiveState;
window.loadUserCredit = loadUserCredit;
window.addUserCredit = addUserCredit;
window.hapticFeedback = hapticFeedback;

// Help page
window.startChat = startChat;
window.sendEmail = sendEmail;
window.toggleFAQ = toggleFAQ;

// Cart functions (from cart.js)
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.openCartDrawer = openCartDrawer;
window.placeOrder = placeOrder;

// Auth functions (from auth.js)
window.openAccountModal = openAccountModal;
window.closeAccountModal = closeAccountModal;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.switchTab = switchTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.restoreUserFromStorage = restoreUserFromStorage;

// Recharge functions (from recharge.js)
window.openRechargeModal = openRechargeModal;
window.closeRechargeModal = closeRechargeModal;
window.switchRechargeTab = switchRechargeTab;
window.submitRecharge = submitRecharge;

// Withdraw functions (from withdraw.js)
window.openWithdrawModal = openWithdrawModal;
window.closeWithdrawModal = closeWithdrawModal;
window.switchWithdrawTab = switchWithdrawTab;
window.submitWithdraw = submitWithdraw;

// Bond investment functions
window.investInBondOption1 = investInBondOption1;
window.investInInvestmentOption = investInInvestmentOption;

// Product functions (from products.js)
window.redeemCode = redeemCode;
window.addMysteryBox = addMysteryBox;

// Admin functions
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
window.loadAdminBugReports = loadAdminBugReports;
window.updateBugReportStatus = updateBugReportStatus;
window.refreshAdminBugReports = refreshAdminBugReports;

// Transaction functions (from orders.js)
window.loadTransactionHistory = loadTransactionHistory;
window.clearTransactionHistory = clearTransactionHistory;
window.orderAgainFromHistory = orderAgainFromHistory;

// Transaction ID functions (from transaction-id.js)
window.generateTransactionId = generateTransactionId;
window.copyTransactionId = copyTransactionId;

// Download popup
window.showDownloadPopup = showDownloadPopup;
window.closeDownloadPopup = closeDownloadPopup;
window.triggerInstall = triggerInstall;

// QR Scanner functions (from loyalty.js)
window.startQrScanner = startQrScanner;
window.stopQrScanner = stopQrScanner;
window.processQrFileUpload = processQrFileUpload;
window.loadRecentScans = loadRecentScans;
window.setupQrScannerUI = setupQrScannerUI;

// Announcement functions (from announcements.js)
window.openAnnouncementModal = openAnnouncementModal;
window.closeAnnouncementModal = closeAnnouncementModal;
window.markAnnouncementRead = markAnnouncementRead;
window.markAllAnnouncementsRead = markAllAnnouncementsRead;
window.publishAnnouncement = publishAnnouncement;
window.deleteAnnouncement = deleteAnnouncement;
window.loadRecentAnnouncements = loadRecentAnnouncements;

// Settings functions (from settings.js)
window.toggleDarkMode = toggleDarkMode;
window.changeFontSize = changeFontSize;
window.toggleCompactMode = toggleCompactMode;
window.toggleHighContrast = toggleHighContrast;
window.clearCache = clearCache;
window.resetAllSettings = resetAllSettings;
window.openTermsModal = openTermsModal;
window.openPrivacyModal = openPrivacyModal;
window.shareApp = shareApp;

// Bug Report functions (from bug-report.js)
window.openBugReportModal = openBugReportModal;
window.closeBugReportModal = closeBugReportModal;
window.submitBugReport = submitBugReport;

// Copy Account ID function
window.copyAccountId = copyAccountId;

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}