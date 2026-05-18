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
let scanInterval = null;
let currentStream = null;
let announcementRefreshInterval = null;
let announcements = [];
let readAnnouncements = [];

// Make sure these are globally available
window.cart = cart;
window.currentCategory = currentCategory;
window.searchQuery = searchQuery;
window.currentPage = currentPage;
window.currentUser = currentUser;
window.isAdmin = isAdmin;