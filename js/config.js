const GOOGLE_SHEETS_URL = "/api/sheets";

let ADMIN_PHONE = "";
let ADMIN_PASSWORD = "";

(async function() {
  try {
    const res = await fetch('/api/admin-config');
    const config = await res.json();
    ADMIN_PHONE = config.adminPhone;
    ADMIN_PASSWORD = config.adminPassword;
  } catch(e) {}
})();

let deferredPrompt = null;