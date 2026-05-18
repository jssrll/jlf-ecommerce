// ============================================================
// helpers.js — Shared utility functions
// ============================================================

function showToast(message, duration = 2000) {
  const toast = document.getElementById("toastMsg");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

function formatDate(ts) {
  if (!ts) return "N/A";
  try {
    return new Date(ts).toLocaleString("en-PH", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch (e) { return ts; }
}

function formatCurrency(val) {
  return "₱" + (Number(val) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

function getStatusBadge(status) {
  const map = {
    "Pending": "badge-pending",
    "Approved": "badge-approved",
    "Completed": "badge-completed",
    "Cancelled": "badge-cancelled",
    "Active": "badge-approved",
    "Matured": "badge-completed",
    "Rejected": "badge-cancelled"
  };
  const cls = map[status] || "badge-pending";
  return `<span class="status-badge ${cls}">${status || "Pending"}</span>`;
}

function switchPage(page) {
  console.log("Switching to page:", page);
  
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
  
  const pageEl = document.getElementById(page + "Page");
  if (pageEl) pageEl.classList.add("active");
  
  const navLink = document.querySelector(`[data-page="${page}"]`);
  if (navLink) navLink.classList.add("active");
  
  currentPage = page;
  
  // Load page-specific data
  if (page === "orders" && currentUser && !isAdmin) {
    if (typeof loadTransactionHistory === "function") loadTransactionHistory();
  }
  if (page === "shop" && typeof renderProducts === "function") {
    renderProducts();
  }
  if (page === "featured" && typeof loadFeaturedPage === "function") {
    loadFeaturedPage();
  }
  if (page === "admin" && isAdmin && typeof loadAdminData === "function") {
    loadAdminData();
  }
  if (page === "settings" && typeof renderSettingsPage === "function") {
    renderSettingsPage();
  }
  
  window.scrollTo(0, 0);
  if (typeof updateIconActiveState === "function") updateIconActiveState();
}

function toggleFAQ(el) {
  const item = el.closest('.faq-item-apple');
  if (item) {
    item.classList.toggle('active');
    const icon = el.querySelector("i");
    if (icon) icon.style.transform = item.classList.contains("active") ? "rotate(180deg)" : "rotate(0)";
  }
}

function startChat() {
  window.open("https://m.me/jlfworks.official", "_blank");
}

function sendEmail() {
  window.location.href = "mailto:jlfworks.official@gmail.com";
}

function updateIconActiveState() {
  // Update active states for icons based on open modals
  const activeStates = {
    announcementModal: document.getElementById('announcementIcon'),
    rechargeModal: document.getElementById('rechargeIcon'),
    withdrawModal: document.getElementById('withdrawIcon'),
    profileModal: document.getElementById('accountIcon'),
    cartDrawer: document.getElementById('cartIconBtn')
  };
  
  Object.keys(activeStates).forEach(modalId => {
    const icon = activeStates[modalId];
    if (icon) {
      if (document.getElementById(modalId)?.classList.contains('show') || 
          document.getElementById(modalId)?.classList.contains('open')) {
        icon.classList.add('active');
      } else {
        icon.classList.remove('active');
      }
    }
  });
  
  if (currentPage === 'settings') {
    document.getElementById('settingsIcon')?.classList.add('active');
  } else {
    document.getElementById('settingsIcon')?.classList.remove('active');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Make functions global
window.showToast = showToast;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.getStatusBadge = getStatusBadge;
window.switchPage = switchPage;
window.toggleFAQ = toggleFAQ;
window.startChat = startChat;
window.sendEmail = sendEmail;
window.updateIconActiveState = updateIconActiveState;
window.escapeHtml = escapeHtml;