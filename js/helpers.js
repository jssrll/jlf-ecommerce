// ========================================
// HELPER FUNCTIONS
// ========================================

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function showToast(message, duration = 1800) {
  const toast = document.getElementById("toastMsg");
  if (!toast) return;
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => { toast.classList.remove("show"); }, duration);
}

// ========================================
// RIGHT-CLICK & DEVTOOLS PROTECTION
// ========================================

document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  return false;
});

document.addEventListener('keydown', function(e) {
  if (e.keyCode === 123) {
    e.preventDefault();
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
    e.preventDefault();
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
    e.preventDefault();
    return false;
  }
  if (e.ctrlKey && e.keyCode === 85) {
    e.preventDefault();
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
    e.preventDefault();
    return false;
  }
});

// ========================================
// DOWNLOAD POPUP FUNCTIONS
// ========================================

function showDownloadPopup() {
    const popupClosed = localStorage.getItem("downloadPopupClosed");
    const appInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    if (appInstalled || popupClosed === "true") return;
    
    setTimeout(() => {
        const popup = document.getElementById("downloadPopup");
        if (popup) popup.style.display = "flex";
    }, 3000);
}

function closeDownloadPopup() {
    const popup = document.getElementById("downloadPopup");
    if (popup) popup.style.display = "none";
    localStorage.setItem("downloadPopupClosed", "true");
    setTimeout(() => {
        localStorage.removeItem("downloadPopupClosed");
    }, 7 * 24 * 60 * 60 * 1000);
}

function triggerInstall() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted install');
                closeDownloadPopup();
            }
            deferredPrompt = null;
        });
    } else {
        showToast("Tap the share button and select 'Add to Home Screen'", 3000);
        closeDownloadPopup();
    }
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('✅ Install prompt available');
});

window.addEventListener('appinstalled', () => {
    console.log('App was installed successfully');
    closeDownloadPopup();
});

// Prevent image dragging
document.addEventListener('dragstart', function(e) {
  if (e.target.tagName === 'IMG' || e.target.classList.contains('product-img-apple')) {
    e.preventDefault();
    return false;
  }
});

// Disable image selection
document.addEventListener('selectstart', function(e) {
  e.preventDefault();
  return false;
});