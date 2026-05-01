// ========================================
// CONFIGURATION
// ========================================

// Auto-detect backend URL
const GOOGLE_SHEETS_URL = window.location.hostname === 'localhost' 
  ? "https://script.google.com/macros/s/AKfycbwY-mVJM44luUBfpKZJcD5wsV1y4qP3Vjigzc14LatdWhOeUdGFBL65YKDE88TcFkeV/exec"
  : "/api"; // Will use Render backend

// Hardcoded Admin Credentials
const ADMIN_PHONE = "101007101007";
const ADMIN_PASSWORD = "101007101007";

let deferredPrompt = null;