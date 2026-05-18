// ============================================================
// state.js — App state & persistent session (survives refresh)
// ============================================================

let currentUser = null;
let isAdmin = false;
let cart = [];
let currentCategory = "all";
let searchQuery = "";
let currentPage = "home";
let balanceCheckInterval = null;
let loyaltyRefreshInterval = null;
let announcementRefreshInterval = null;
let announcements = [];
let readAnnouncements = [];

// QR Scanner variables
let qrCurrentStream = null;
let qrScanInterval = null;

// Investment storage
let investments = [];

// Session Persistence
function saveSession(user) {
  try {
    localStorage.setItem("jlf_user", JSON.stringify(user));
  } catch (e) {
    console.error("Failed to save session:", e);
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem("jlf_user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load session:", e);
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem("jlf_user");
  } catch (e) {}
}

// Cart Persistence
function saveCartToLocal() {
  try {
    localStorage.setItem("jlf_cart", JSON.stringify(cart));
  } catch (e) {}
}

function loadCartFromLocal() {
  try {
    const raw = localStorage.getItem("jlf_cart");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

// Admin flag helpers
function setAdminMode(val) {
  isAdmin = val;
  try {
    if (val) localStorage.setItem("jlf_admin", "1");
    else localStorage.removeItem("jlf_admin");
  } catch (e) {}
}

function loadAdminFlag() {
  try {
    return localStorage.getItem("jlf_admin") === "1";
  } catch (e) {
    return false;
  }
}

// Make globally available
window.cart = cart;
window.currentUser = currentUser;
window.isAdmin = isAdmin;
window.saveSession = saveSession;
window.loadSession = loadSession;
window.clearSession = clearSession;
window.saveCartToLocal = saveCartToLocal;
window.loadCartFromLocal = loadCartFromLocal;
window.setAdminMode = setAdminMode;
window.loadAdminFlag = loadAdminFlag;