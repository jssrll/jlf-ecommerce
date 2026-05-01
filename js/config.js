// ========================================
// CONFIGURATION
// ========================================

// Google Sheets Web App URL - HIDDEN via Vercel proxy
const GOOGLE_SHEETS_URL = "/api/sheets";

// Admin credentials - fetched from server
let ADMIN_PHONE = "";
let ADMIN_PASSWORD = "";

// Load admin credentials from backend
(async function() {
  try {
    const res = await fetch('/api/admin-config');
    const config = await res.json();
    ADMIN_PHONE = config.adminPhone;
    ADMIN_PASSWORD = config.adminPassword;
  } catch(e) {
    console.error("Failed to load admin config");
  }
})();

// PWA Install Variables
let deferredPrompt = null;