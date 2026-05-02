const GOOGLE_SHEETS_URL = "/api/sheets";
const API = {
  sheets: "/api/sheets",
  order: "/api/order",
  login: "/api/login",
  recharge: "/api/recharge",
  withdraw: "/api/withdraw",
};

let ADMIN_PHONE = "";
let ADMIN_PASSWORD = "";

(async function() {
  const res = await fetch('/api/admin-config');
  const config = await res.json();
  ADMIN_PHONE = config.adminPhone;
  ADMIN_PASSWORD = config.adminPassword;
})();

let deferredPrompt = null;