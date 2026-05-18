// ========================================
// APPLICATION STATE
// ========================================

let cart = [];
let currentCategory = "all";
let searchQuery = "";
let currentPage = "home";
let currentUser = null;
let isAdmin = false;
let balanceCheckInterval = null;
let loyaltyRefreshInterval = null;
let announcementRefreshInterval = null;
let announcements = [];
let readAnnouncements = [];

// QR Scanner variables - declared once here
let qrCurrentStream = null;
let qrScanInterval = null;

// Investment storage
let investments = [];

// Make sure these are globally available
window.cart = cart;
window.currentCategory = currentCategory;
window.searchQuery = searchQuery;
window.currentPage = currentPage;
window.currentUser = currentUser;
window.isAdmin = isAdmin;
window.qrCurrentStream = qrCurrentStream;
window.qrScanInterval = qrScanInterval;
window.investments = investments;