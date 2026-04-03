// ========================================
// APPLICATION STATE
// ========================================
let cart = [];
let currentCategory = "all";
let searchQuery = "";
let currentPage = "home";
let currentUser = null;
let isAdminMode = false;
let balanceCheckInterval = null;
let loyaltyRefreshInterval = null;
let scanInterval = null;
let currentStream = null;
let announcementRefreshInterval = null;
let announcements = [];
let readAnnouncements = [];
const ADMIN_PASSWORD = "jssrll101007";

// Your Google Sheets Web App URL
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbwnaCIKYhwQx9EWR7-q60rxA3YB1QyIHlHwvenkuTwK_iQhzULYkdl9SJU_jB3I8Zz6/exec";

// PWA Install Variables
let deferredPrompt = null;

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

// ========================================
// REAL-TIME BALANCE UPDATE FUNCTIONS
// ========================================
async function refreshUserBalance() {
  if (!currentUser) return;
  
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getUsers`);
    const users = await response.json();
    const updatedUser = users.find(u => u.phone === currentUser.phone);
    
    if (updatedUser) {
      const oldBalance = currentUser.balance;
      currentUser.balance = updatedUser.balance || 0;
      
      if (oldBalance !== currentUser.balance) {
        localStorage.setItem("nova_user", JSON.stringify(currentUser));
        showToast(`💰 Balance updated: ₱${currentUser.balance.toLocaleString()}`, 2000);
        updateAllBalanceDisplays();
      }
    }
  } catch (error) {
    console.error("Refresh balance error:", error);
  }
}

function updateAllBalanceDisplays() {
  const profileBalance = document.getElementById("profileBalance");
  if (profileBalance) {
    profileBalance.innerHTML = `₱${(currentUser.balance || 0).toLocaleString()}`;
  }
  renderCartUI();
  const userNameDisplay = document.getElementById("userNameDisplay");
  if (userNameDisplay && currentUser) {
    userNameDisplay.innerText = currentUser.name.split(' ')[0];
  }
}

function startRealTimeBalanceCheck() {
  if (balanceCheckInterval) clearInterval(balanceCheckInterval);
  balanceCheckInterval = setInterval(() => {
    if (currentUser) refreshUserBalance();
  }, 30000);
}

function stopRealTimeBalanceCheck() {
  if (balanceCheckInterval) {
    clearInterval(balanceCheckInterval);
    balanceCheckInterval = null;
  }
}

// ========================================
// LOYALTY QR CODE FUNCTIONS
// ========================================

async function generateUserQRCode() {
    if (!currentUser) return;
    
    const qrContainer = document.getElementById("qrCodeContainer");
    if (!qrContainer) return;
    
    const qrData = `${currentUser.id}_${currentUser.phone}`;
    qrContainer.innerHTML = '';
    
    try {
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: qrData,
                width: 180,
                height: 180,
                colorDark: "#1d1d1f",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            const qrUrl = `https://chart.googleapis.com/chart?chs=180x180&cht=qr&chl=${encodeURIComponent(qrData)}&choe=UTF-8`;
            qrContainer.innerHTML = `<img src="${qrUrl}" alt="QR Code" style="width:180px;height:180px;">`;
        }
    } catch (error) {
        console.error("QR generation error:", error);
        qrContainer.innerHTML = '<div class="qr-loading">Error generating QR code</div>';
    }
}

async function loadUserLoyalty() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getUserLoyalty&phone=${currentUser.phone}`);
        const data = await response.json();
        
        let marks = 0;
        if (data.success && data.marks !== undefined) {
            marks = data.marks;
        } else {
            const checkResponse = await fetch(`${GOOGLE_SHEETS_URL}?action=checkUserLoyalty&phone=${currentUser.phone}`);
            const checkData = await checkResponse.json();
            if (!checkData.exists) {
                await createUserLoyalty();
                marks = 0;
            } else {
                marks = checkData.marks || 0;
            }
        }
        
        updateLoyaltyDisplay(marks);
        return marks;
    } catch (error) {
        console.error("Load loyalty error:", error);
        return 0;
    }
}

async function createUserLoyalty() {
    if (!currentUser) return;
    
    try {
        const formData = new URLSearchParams();
        formData.append("action", "createUserLoyalty");
        formData.append("accountId", currentUser.id);
        formData.append("fullName", currentUser.name);
        formData.append("phone", currentUser.phone);
        formData.append("marks", "0");
        formData.append("totalEarned", "0");
        
        await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    } catch (error) {
        console.error("Create loyalty error:", error);
    }
}

function updateLoyaltyDisplay(marks) {
    const marksContainer = document.getElementById("loyaltyMarksContainer");
    const marksCountSpan = document.getElementById("loyaltyMarksCount");
    const loyaltyRewardMsg = document.getElementById("loyaltyRewardMessage");
    
    if (!marksContainer) return;
    
    let html = '';
    for (let i = 1; i <= 12; i++) {
        const earned = i <= marks;
        html += `<div class="loyalty-mark ${earned ? 'earned' : 'empty'}">${earned ? '✓' : i}</div>`;
    }
    marksContainer.innerHTML = html;
    
    if (marksCountSpan) {
        marksCountSpan.innerText = marks;
    }
    
    if (loyaltyRewardMsg) {
        if (marks >= 12) {
            loyaltyRewardMsg.innerHTML = '<i class="fas fa-gift"></i> 🎉 Congratulations! You\'ve reached 12 marks! Claim your ₱99 reward! 🎉';
            loyaltyRewardMsg.style.background = "#4caf50";
            loyaltyRewardMsg.style.color = "white";
        } else {
            loyaltyRewardMsg.innerHTML = '<i class="fas fa-qrcode"></i> Need ' + (12 - marks) + ' more scan(s) for ₱99 reward!';
            loyaltyRewardMsg.style.background = "rgba(255,255,255,0.15)";
            loyaltyRewardMsg.style.color = "inherit";
        }
    }
}

// ========================================
// ADMIN QR SCANNER FUNCTIONS
// ========================================

function startQrScanner() {
    const video = document.getElementById("qrVideo");
    const startBtn = document.getElementById("startScannerBtn");
    const stopBtn = document.getElementById("stopScannerBtn");
    
    if (currentStream) {
        stopQrScanner();
    }
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            currentStream = stream;
            video.srcObject = stream;
            video.play();
            
            if (startBtn) startBtn.style.display = "none";
            if (stopBtn) stopBtn.style.display = "inline-block";
            
            startScanningInterval();
        })
        .catch(err => {
            console.error("Camera error:", err);
            showToast("Cannot access camera. Please check permissions.", 3000);
        });
}

function stopQrScanner() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    const video = document.getElementById("qrVideo");
    if (video) video.srcObject = null;
    
    const startBtn = document.getElementById("startScannerBtn");
    const stopBtn = document.getElementById("stopScannerBtn");
    
    if (startBtn) startBtn.style.display = "inline-block";
    if (stopBtn) stopBtn.style.display = "none";
    
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
}

function startScanningInterval() {
    if (scanInterval) clearInterval(scanInterval);
    
    scanInterval = setInterval(() => {
        scanQRFromVideo();
    }, 1000);
}

async function scanQRFromVideo() {
    const video = document.getElementById("qrVideo");
    if (!video || !video.videoWidth || !video.videoHeight) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL("image/png");
    
    if (typeof jsQR !== 'undefined') {
        const img = new Image();
        img.src = imageData;
        img.onload = async () => {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext("2d");
            tempCtx.drawImage(img, 0, 0);
            const imageDataObj = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const code = jsQR(imageDataObj.data, tempCanvas.width, tempCanvas.height);
            
            if (code && code.data) {
                stopQrScanner();
                await processQrScan(code.data);
            }
        };
    }
}

async function processQrFileUpload(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const imageData = e.target.result;
        
        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            if (typeof jsQR !== 'undefined') {
                const code = jsQR(imageDataObj.data, canvas.width, canvas.height);
                if (code && code.data) {
                    await processQrScan(code.data);
                } else {
                    showScanResult("No QR code found in image", true);
                }
            } else {
                showScanResult("QR scanner library not loaded", true);
            }
        };
        img.src = imageData;
    };
    reader.readAsDataURL(file);
}

async function processQrScan(qrData) {
    const parts = qrData.split('_');
    let accountId = qrData;
    let phone = '';
    
    if (parts.length >= 2) {
        accountId = parts[0];
        phone = parts[1];
    }
    
    try {
        const formData = new URLSearchParams();
        formData.append("action", "addLoyaltyScan");
        formData.append("accountId", accountId);
        formData.append("phone", phone);
        formData.append("scannedBy", currentUser?.id || "Admin");
        formData.append("timestamp", new Date().toISOString());
        
        const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
        const result = await response.json();
        
        if (result.success) {
            showScanResult(`
                <div class="scan-success">
                    <p><strong>✅ Scan Successful!</strong></p>
                    <p>User: ${result.userName || accountId}</p>
                    <p>Phone: ${result.phone || phone}</p>
                    <p>New Marks: ${result.newMarks}/12</p>
                    ${result.rewardClaimed ? '<p>🎉 Reward claimed! ₱99 added to balance!</p>' : ''}
                </div>
            `);
            
            loadRecentScans();
            
            if (currentUser && (currentUser.id === accountId || currentUser.phone === phone)) {
                await loadUserLoyalty();
                await refreshUserBalance();
            }
        } else {
            showScanResult(result.message || "Scan failed. User not found.", true);
        }
    } catch (error) {
        console.error("Scan error:", error);
        showScanResult("Error processing scan. Please try again.", true);
    }
}

function showScanResult(message, isError = false) {
    const resultDiv = document.getElementById("qrScanResult");
    const contentDiv = document.getElementById("qrScanResultContent");
    
    if (!resultDiv) return;
    
    resultDiv.className = `qr-scan-result ${isError ? 'error' : ''}`;
    resultDiv.style.display = "block";
    contentDiv.innerHTML = message;
    
    setTimeout(() => {
        resultDiv.style.display = "none";
    }, 5000);
}

async function loadRecentScans() {
    const container = document.getElementById("recentScansContainer");
    if (!container) return;
    
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getRecentScans&limit=20`);
        const scans = await response.json();
        
        if (!scans || scans.length === 0) {
            container.innerHTML = '<div class="empty-state">No recent scans</div>';
            return;
        }
        
        container.innerHTML = scans.map(scan => `
            <div class="scan-history-item">
                <div>
                    <div class="scan-history-user">${scan.fullName || scan.accountId}</div>
                    <div class="scan-history-time">${new Date(scan.timestamp).toLocaleString()}</div>
                </div>
                <div class="scan-history-marks">+1</div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Load recent scans error:", error);
        container.innerHTML = '<div class="empty-state">Failed to load scans</div>';
    }
}

function startLoyaltyAutoRefresh() {
    if (loyaltyRefreshInterval) clearInterval(loyaltyRefreshInterval);
    
    loyaltyRefreshInterval = setInterval(() => {
        if (currentUser && document.getElementById("profileModal")?.classList.contains("show")) {
            loadUserLoyalty();
        }
        if (isAdminMode && document.getElementById("adminQrScannerTab")?.classList.contains("active")) {
            loadRecentScans();
        }
    }, 5000);
}

// ========================================
// ANNOUNCEMENT SYSTEM FUNCTIONS
// ========================================

// Load read announcements from localStorage
function loadReadAnnouncements() {
    const saved = localStorage.getItem("readAnnouncements");
    if (saved) {
        readAnnouncements = JSON.parse(saved);
    } else {
        readAnnouncements = [];
    }
}

// Save read announcements to localStorage
function saveReadAnnouncements() {
    localStorage.setItem("readAnnouncements", JSON.stringify(readAnnouncements));
}

// Mark single announcement as read
function markAnnouncementRead(timestamp) {
    if (!readAnnouncements.includes(timestamp)) {
        readAnnouncements.push(timestamp);
        saveReadAnnouncements();
        updateAnnouncementBadge();
        
        const btn = document.querySelector(`.mark-read-btn[data-timestamp="${timestamp}"]`);
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i> Read';
            btn.classList.add('read');
            btn.disabled = true;
        }
        
        showToast("Marked as read", 1000);
    }
}

// Mark all announcements as read
function markAllAnnouncementsRead() {
    announcements.forEach(ann => {
        if (!readAnnouncements.includes(ann.timestamp)) {
            readAnnouncements.push(ann.timestamp);
        }
    });
    saveReadAnnouncements();
    updateAnnouncementBadge();
    renderAnnouncements();
    showToast("All announcements marked as read", 1500);
}

// Get unread count
function getUnreadCount() {
    if (!announcements.length) return 0;
    let count = 0;
    announcements.forEach(ann => {
        if (!readAnnouncements.includes(ann.timestamp)) {
            count++;
        }
    });
    return count;
}

// Update bell badge
function updateAnnouncementBadge() {
    const count = getUnreadCount();
    const badge = document.getElementById("announcementBadge");
    if (badge) {
        if (count > 0) {
            badge.style.display = "flex";
            badge.innerText = count > 99 ? "99+" : count;
        } else {
            badge.style.display = "none";
        }
    }
}

// Fetch announcements from Google Sheets
async function fetchAnnouncements() {
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAnnouncements`);
        announcements = await response.json();
        updateAnnouncementBadge();
        return announcements;
    } catch (error) {
        console.error("Fetch announcements error:", error);
        return [];
    }
}

// Helper functions for announcement types
function getTypeClass(type) {
    const types = {
        'sale': 'type-sale',
        'promo': 'type-promo',
        'holiday': 'type-holiday',
        'alert': 'type-alert',
        'general': 'type-general'
    };
    return types[type] || 'type-general';
}

function getTypeLabel(type) {
    const labels = {
        'sale': '🔥 SALE',
        'promo': '🎁 PROMO',
        'holiday': '🎉 HOLIDAY',
        'alert': '⚠️ ALERT',
        'general': 'ℹ️ INFO'
    };
    return labels[type] || 'ℹ️ INFO';
}

function getPriorityClass(priority) {
    const classes = {
        'high': 'priority-high',
        'medium': 'priority-medium',
        'low': 'priority-low'
    };
    return classes[priority] || '';
}

// Render announcements in modal
function renderAnnouncements() {
    const container = document.getElementById("announcementContainer");
    if (!container) return;
    
    if (!announcements.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>No announcements yet</p>
                <p style="font-size: 0.75rem;">Check back later for updates!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    announcements.forEach(ann => {
        const isRead = readAnnouncements.includes(ann.timestamp);
        const typeClass = getTypeClass(ann.type);
        const priorityClass = getPriorityClass(ann.priority);
        
        html += `
            <div class="announcement-item ${priorityClass}" data-timestamp="${ann.timestamp}">
                <span class="announcement-type ${typeClass}">${getTypeLabel(ann.type)}</span>
                <div class="announcement-header">
                    <div class="announcement-icon-display">${ann.icon || '📢'}</div>
                    <div class="announcement-title">
                        <h3>${escapeHtml(ann.header)}</h3>
                        <div class="announcement-date">
                            <i class="fas fa-calendar-alt"></i> ${ann.date}
                            ${!isRead ? '<span class="new-badge">NEW</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="announcement-content">
                    ${escapeHtml(ann.content)}
                </div>
                <div class="announcement-actions">
                    ${ann.link ? `<a href="${ann.link}" target="_blank" class="announcement-btn"><i class="fas fa-external-link-alt"></i> ${ann.linkText}</a>` : ''}
                    <button class="announcement-btn mark-read-btn ${isRead ? 'read' : ''}" data-timestamp="${ann.timestamp}" ${isRead ? 'disabled' : ''} onclick="markAnnouncementRead('${ann.timestamp}')">
                        <i class="fas ${isRead ? 'fa-check' : 'fa-eye'}"></i> ${isRead ? 'Read' : 'Mark as read'}
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Open announcement modal
async function openAnnouncementModal() {
    const modal = document.getElementById("announcementModal");
    if (!modal) return;
    
    const container = document.getElementById("announcementContainer");
    if (container) {
        container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading announcements...</div>';
    }
    
    modal.classList.add("show");
    
    await fetchAnnouncements();
    renderAnnouncements();
    updateAnnouncementBadge();
}

// Close announcement modal
function closeAnnouncementModal() {
    const modal = document.getElementById("announcementModal");
    if (modal) modal.classList.remove("show");
}

// Start announcement auto-refresh
function startAnnouncementAutoRefresh() {
    if (announcementRefreshInterval) clearInterval(announcementRefreshInterval);
    announcementRefreshInterval = setInterval(async () => {
        await fetchAnnouncements();
        if (document.getElementById("announcementModal")?.classList.contains("show")) {
            renderAnnouncements();
        }
        updateAnnouncementBadge();
    }, 30000);
}

// ========================================
// ADMIN ANNOUNCEMENT FUNCTIONS
// ========================================

// Publish announcement
async function publishAnnouncement() {
    const header = document.getElementById("annHeader").value;
    const content = document.getElementById("annContent").value;
    const type = document.getElementById("annType").value;
    const priority = document.getElementById("annPriority").value;
    const icon = document.getElementById("annIcon").value;
    const link = document.getElementById("annLink").value;
    const linkText = document.getElementById("annLinkText").value;
    const expiryDate = document.getElementById("annExpiry").value;
    
    if (!header || !content) {
        showToast("Please fill in header and content", 1500);
        return;
    }
    
    const publishBtn = event.target;
    const originalText = publishBtn.innerHTML;
    publishBtn.disabled = true;
    publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
    
    try {
        const formData = new URLSearchParams();
        formData.append("action", "addAnnouncement");
        formData.append("timestamp", new Date().toISOString());
        formData.append("date", new Date().toLocaleDateString());
        formData.append("header", header);
        formData.append("content", content);
        formData.append("type", type);
        formData.append("priority", priority);
        formData.append("icon", icon);
        formData.append("link", link);
        formData.append("linkText", linkText);
        formData.append("expiryDate", expiryDate);
        formData.append("publishedBy", currentUser?.name || "Admin");
        
        const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
        const result = await response.json();
        
        if (result.success) {
            showToast("✅ Announcement published successfully!", 2000);
            
            document.getElementById("annHeader").value = "";
            document.getElementById("annContent").value = "";
            document.getElementById("annLink").value = "";
            document.getElementById("annLinkText").value = "Learn More";
            document.getElementById("annExpiry").value = "";
            
            loadRecentAnnouncements();
            
            await fetchAnnouncements();
            if (document.getElementById("announcementModal")?.classList.contains("show")) {
                renderAnnouncements();
            }
            updateAnnouncementBadge();
            
        } else {
            showToast("Failed to publish", 1500);
        }
    } catch (error) {
        console.error("Publish error:", error);
        showToast("Error publishing announcement", 1500);
    } finally {
        publishBtn.disabled = false;
        publishBtn.innerHTML = originalText;
    }
}

// Load recent announcements for admin
async function loadRecentAnnouncements() {
    const container = document.getElementById("recentAnnouncementsList");
    if (!container) return;
    
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAnnouncements`);
        const announcementsList = await response.json();
        
        if (!announcementsList.length) {
            container.innerHTML = '<div class="empty-state">No announcements yet</div>';
            return;
        }
        
        let html = '<div style="max-height: 300px; overflow-y: auto;">';
        announcementsList.forEach(ann => {
            html += `
                <div class="admin-announcement-item" style="background: #f5f5f7; padding: 12px; border-radius: 12px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${ann.icon} ${ann.header}</strong>
                            <div style="font-size: 0.7rem; color: #86868b;">${ann.date} | ${ann.type} | ${ann.priority}</div>
                        </div>
                        <button class="btn-secondary-apple" style="padding: 4px 12px; font-size: 0.7rem;" onclick="deleteAnnouncement('${ann.timestamp}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error("Load recent announcements error:", error);
        container.innerHTML = '<div class="empty-state">Failed to load</div>';
    }
}

// Delete announcement
async function deleteAnnouncement(timestamp) {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    
    try {
        const formData = new URLSearchParams();
        formData.append("action", "updateAnnouncementStatus");
        formData.append("timestamp", timestamp);
        formData.append("status", "deleted");
        
        const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
        const result = await response.json();
        
        if (result.success) {
            showToast("Announcement deleted", 1500);
            loadRecentAnnouncements();
            await fetchAnnouncements();
            updateAnnouncementBadge();
        } else {
            showToast("Delete failed", 1500);
        }
    } catch (error) {
        console.error("Delete error:", error);
        showToast("Error deleting", 1500);
    }
}

// ========================================
// ACCOUNT MODAL FUNCTIONS
// ========================================
function openAccountModal() {
  const modal = document.getElementById("accountModal");
  modal.classList.add("show");
  document.getElementById("loginForm").reset();
  document.getElementById("registerForm").reset();
  const registerBtn = document.getElementById("registerBtn");
  if (registerBtn) {
    registerBtn.disabled = false;
    registerBtn.innerHTML = "Create Account";
  }
  const loadingIndicator = document.getElementById("registerLoading");
  if (loadingIndicator) loadingIndicator.style.display = "none";
}

function closeAccountModal() {
  const modal = document.getElementById("accountModal");
  modal.classList.remove("show");
}

function openProfileModal() {
  if (!currentUser) {
    openAccountModal();
    return;
  }
  
  document.getElementById("profileName").innerText = currentUser.name;
  document.getElementById("profileId").innerText = currentUser.id;
  document.getElementById("profilePhone").innerText = currentUser.phone;
  document.getElementById("profileJoined").innerText = currentUser.joined || new Date().toLocaleDateString();
  document.getElementById("profileBalance").innerHTML = `₱${(currentUser.balance || 0).toLocaleString()}`;
  
  generateUserQRCode();
  loadUserLoyalty();
  
  const modal = document.getElementById("profileModal");
  modal.classList.add("show");
}

function closeProfileModal() {
  const modal = document.getElementById("profileModal");
  modal.classList.remove("show");
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  if (tabName === 'login') {
    document.querySelector('.tab-btn:first-child').classList.add('active');
    document.getElementById('loginTab').classList.add('active');
  } else {
    document.querySelector('.tab-btn:last-child').classList.add('active');
    document.getElementById('registerTab').classList.add('active');
  }
}

// ========================================
// LOGIN FUNCTION
// ========================================
async function handleLogin(event) {
  event.preventDefault();
  let phone = document.getElementById("loginPhone").value.trim();
  const password = document.getElementById("loginPassword").value;
  const loginBtn = document.getElementById("loginBtn");
  
  if (!phone || !password) {
    showToast("Please fill in all fields", 1500);
    return;
  }
  
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
  
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getUsers`);
    const users = await response.json();
    
    const user = users.find(u => {
      const sheetPhone = u.phone.toString();
      const inputPhone = phone.toString();
      if (sheetPhone === inputPhone) return true;
      if (inputPhone.startsWith('09') && sheetPhone === inputPhone.substring(1)) return true;
      if (sheetPhone.startsWith('09') && inputPhone === sheetPhone.substring(1)) return true;
      return false;
    });
    
    if (user) {
      currentUser = {
        id: user.accountId,
        name: user.name,
        phone: user.phone,
        password: user.password,
        balance: user.balance || 0,
        joined: new Date().toLocaleDateString()
      };
      
      const logData = new URLSearchParams();
      logData.append("action", "addLoginLog");
      logData.append("timestamp", new Date().toISOString());
      logData.append("accountId", currentUser.id);
      logData.append("fullName", currentUser.name);
      logData.append("phone", currentUser.phone);
      logData.append("password", currentUser.password);
      logData.append("status", "Success");
      
      fetch(GOOGLE_SHEETS_URL, { method: "POST", body: logData }).catch(err => console.error("Login logging error:", err));
      
      localStorage.setItem("nova_user", JSON.stringify(currentUser));
      document.getElementById("userNameDisplay").innerText = currentUser.name.split(' ')[0];
      showToast(`Welcome back, ${user.name}!`, 2000);
      closeAccountModal();
      renderCartUI();
      startRealTimeBalanceCheck();
    } else {
      showToast("Invalid phone number or password", 1500);
    }
  } catch (error) {
    console.error("Login error:", error);
    showToast("Login failed. Please try again.", 1500);
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = "Login";
  }
}

// ========================================
// REGISTER FUNCTION
// ========================================
async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById("regFullName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;
  const registerBtn = document.getElementById("registerBtn");
  const loadingIndicator = document.getElementById("registerLoading");
  
  if (!name || !phone || !password) {
    showToast("Please fill in all fields", 1500);
    return;
  }
  
  if (password !== confirmPassword) {
    showToast("Passwords do not match", 1500);
    return;
  }
  
  if (!/^09\d{9}$/.test(phone) && !/^\d{10}$/.test(phone)) {
    showToast("Please enter a valid phone number (09XXXXXXXXX)", 1500);
    return;
  }
  
  const accountId = Math.floor(100000000 + Math.random() * 900000000).toString();
  const joinedDate = new Date().toLocaleDateString();
  
  registerBtn.disabled = true;
  registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
  loadingIndicator.style.display = "block";
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "addUser");
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("password", password);
    formData.append("accountId", accountId);
    formData.append("timestamp", new Date().toISOString());
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      currentUser = {
        id: accountId,
        name: name,
        phone: phone,
        password: password,
        balance: 0,
        joined: joinedDate
      };
      
      await createUserLoyalty();
      
      localStorage.setItem("nova_user", JSON.stringify(currentUser));
      document.getElementById("userNameDisplay").innerText = currentUser.name.split(' ')[0];
      showToast(`✅ Account created successfully!\n\nWelcome, ${name}!\nYour Account ID: ${accountId}`, 4000);
      closeAccountModal();
      document.getElementById("registerForm").reset();
      startRealTimeBalanceCheck();
    } else {
      showToast(result.message || "Registration failed. Phone may already exist.", 1500);
    }
  } catch (error) {
    console.error("Registration error:", error);
    showToast("Registration failed. Please try again.", 1500);
  } finally {
    registerBtn.disabled = false;
    registerBtn.innerHTML = "Create Account";
    loadingIndicator.style.display = "none";
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("nova_user");
  document.getElementById("userNameDisplay").innerText = "";
  closeProfileModal();
  showToast("Logged out successfully", 1500);
  cart = [];
  updateCartBadge();
  saveCartToLocal();
  renderCartUI();
  stopRealTimeBalanceCheck();
}

// ========================================
// CREDIT FUNCTIONS
// ========================================
function loadUserCredit() {
  if (currentUser) return currentUser.balance || 0;
  return 0;
}

async function addUserCredit(amount) {
  if (!currentUser) return 0;
  
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

// ========================================
// BOND INVESTMENT FUNCTIONS
// ========================================

async function investInBondOption1() {
  if (!currentUser) {
    showToast("Please login to invest", 1500);
    openAccountModal();
    return;
  }
  
  const amount = parseFloat(document.getElementById("bondAmountOption1").value);
  
  if (isNaN(amount) || amount < 500) {
    showToast("Minimum investment is ₱500", 1500);
    return;
  }
  
  if (amount > (currentUser.balance || 0)) {
    showToast(`Insufficient credit balance! You have ₱${(currentUser.balance || 0).toLocaleString()}`, 2000);
    return;
  }
  
  const returnRate = 0.03;
  const expectedReturn = amount * returnRate;
  const durationDays = 90;
  const maturityDate = new Date();
  maturityDate.setDate(maturityDate.getDate() + durationDays);
  
  const confirmMsg = confirm(`Invest ₱${amount.toLocaleString()} in Bond Investment - Option 1?\n\nReturn: 3%\nDuration: ${durationDays} days (3 months)\nExpected Payout: ₱${expectedReturn.toLocaleString()}\nMaturity Date: ${maturityDate.toLocaleDateString()}\n\nThis amount will be deducted from your credit balance.`);
  if (!confirmMsg) return;
  
  const investBtn = document.querySelector('#bondAmountOption1').parentElement.querySelector('button');
  const originalText = investBtn.innerHTML;
  if (investBtn) {
    investBtn.disabled = true;
    investBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  }
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateBalance");
    formData.append("phone", currentUser.phone);
    formData.append("amount", amount);
    formData.append("operation", "deduct");
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (!result.success) {
      showToast(result.message || "Failed to process investment", 1500);
      return;
    }
    
    currentUser.balance = result.newBalance;
    localStorage.setItem("nova_user", JSON.stringify(currentUser));
    
    await recordCreditInvestment("Bond Investment - Option 1 (3% / 90 days)", amount, expectedReturn, maturityDate.toISOString(), durationDays);
    
    showToast(`✅ Invested ₱${amount.toLocaleString()} in Bond Option 1! Maturing on ${maturityDate.toLocaleDateString()}`, 3000);
    document.getElementById("bondAmountOption1").value = "";
    updateAllBalanceDisplays();
    await loadCreditInvestmentHistory();
    
  } catch (error) {
    console.error("Investment error:", error);
    showToast("Investment failed. Please try again.", 1500);
  } finally {
    if (investBtn) {
      investBtn.disabled = false;
      investBtn.innerHTML = originalText;
    }
  }
}

async function investInBondOption2() {
  if (!currentUser) {
    showToast("Please login to invest", 1500);
    openAccountModal();
    return;
  }
  
  const amount = parseFloat(document.getElementById("bondAmountOption2").value);
  
  if (isNaN(amount) || amount < 500) {
    showToast("Minimum investment is ₱500", 1500);
    return;
  }
  
  if (amount > (currentUser.balance || 0)) {
    showToast(`Insufficient credit balance! You have ₱${(currentUser.balance || 0).toLocaleString()}`, 2000);
    return;
  }
  
  const returnRate = 0.06;
  const expectedReturn = amount * returnRate;
  const durationDays = 150;
  const maturityDate = new Date();
  maturityDate.setDate(maturityDate.getDate() + durationDays);
  
  const confirmMsg = confirm(`Invest ₱${amount.toLocaleString()} in Bond Investment - Option 2?\n\nReturn: 6%\nDuration: ${durationDays} days (5 months)\nExpected Payout: ₱${expectedReturn.toLocaleString()}\nMaturity Date: ${maturityDate.toLocaleDateString()}\n\nThis amount will be deducted from your credit balance.`);
  if (!confirmMsg) return;
  
  const investBtn = document.querySelector('#bondAmountOption2').parentElement.querySelector('button');
  const originalText = investBtn.innerHTML;
  if (investBtn) {
    investBtn.disabled = true;
    investBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  }
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateBalance");
    formData.append("phone", currentUser.phone);
    formData.append("amount", amount);
    formData.append("operation", "deduct");
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (!result.success) {
      showToast(result.message || "Failed to process investment", 1500);
      return;
    }
    
    currentUser.balance = result.newBalance;
    localStorage.setItem("nova_user", JSON.stringify(currentUser));
    
    await recordCreditInvestment("Bond Investment - Option 2 (6% / 150 days)", amount, expectedReturn, maturityDate.toISOString(), durationDays);
    
    showToast(`✅ Invested ₱${amount.toLocaleString()} in Bond Option 2! Maturing on ${maturityDate.toLocaleDateString()}`, 3000);
    document.getElementById("bondAmountOption2").value = "";
    updateAllBalanceDisplays();
    await loadCreditInvestmentHistory();
    
  } catch (error) {
    console.error("Investment error:", error);
    showToast("Investment failed. Please try again.", 1500);
  } finally {
    if (investBtn) {
      investBtn.disabled = false;
      investBtn.innerHTML = originalText;
    }
  }
}

async function recordCreditInvestment(investmentType, amount, expectedReturn, maturityDate, durationDays) {
  if (!currentUser) return false;
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "addCreditInvestment");
    formData.append("timestamp", new Date().toISOString());
    formData.append("accountId", currentUser.id);
    formData.append("fullName", currentUser.name);
    formData.append("phone", currentUser.phone);
    formData.append("investmentType", investmentType);
    formData.append("amount", amount);
    formData.append("expectedReturn", expectedReturn);
    formData.append("status", "Active");
    formData.append("maturityDate", maturityDate);
    formData.append("durationDays", durationDays);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Record investment error:", error);
    return false;
  }
}

async function loadCreditInvestmentHistory() {
  if (!currentUser) return;
  
  const container = document.getElementById("investmentHistoryContainerFeatured");
  if (!container) return;
  
  container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading investments...</div>';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "getUserCreditInvestments");
    formData.append("phone", currentUser.phone);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const investments = await response.json();
    
    if (!investments || investments.length === 0) {
      container.innerHTML = '<div class="empty-state">No investments yet. Start investing with your credit balance!</div>';
      return;
    }
    
    container.innerHTML = investments.map(inv => {
      let statusClass = '';
      let statusText = inv.status || 'Active';
      switch(statusText.toLowerCase()) {
        case 'active': statusClass = 'active'; break;
        case 'completed': statusClass = 'completed'; break;
        case 'matured': statusClass = 'matured'; break;
        default: statusClass = 'active';
      }
      
      const maturityDate = inv.maturityDate ? new Date(inv.maturityDate) : null;
      const isMatured = maturityDate && maturityDate <= new Date();
      
      let returnText = '';
      if (inv.investmentType.includes('3%')) returnText = '3% (90 days)';
      else if (inv.investmentType.includes('6%')) returnText = '6% (150 days)';
      
      return `
        <div class="investment-item-featured">
          <div class="investment-header-featured">
            <span class="investment-type-featured">${inv.investmentType}</span>
            <span class="investment-status-featured ${isMatured ? 'matured' : statusClass}">${isMatured ? 'Matured' : statusText}</span>
          </div>
          <div class="investment-details-featured-list">
            <div>📅 ${new Date(inv.timestamp).toLocaleDateString()}</div>
            <div>💰 Amount: ₱${parseFloat(inv.amount).toLocaleString()}</div>
            <div>📈 Expected Return: ₱${parseFloat(inv.expectedReturn).toLocaleString()} (${returnText})</div>
            ${inv.maturityDate ? `<div>⏰ Matures: ${new Date(inv.maturityDate).toLocaleDateString()}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error("Load investments error:", error);
    container.innerHTML = '<div class="empty-state">Failed to load investments. Please try again.</div>';
  }
}

// ========================================
// CART FUNCTIONS
// ========================================
function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById("cartCountBadge");
  if (badge) badge.innerText = totalItems;
  saveCartToLocal();
}

function saveCartToLocal() { 
  localStorage.setItem("nova_cart", JSON.stringify(cart)); 
}

function loadCartFromLocal() {
  const saved = localStorage.getItem("nova_cart");
  cart = saved ? JSON.parse(saved) : [];
  updateCartBadge();
  renderCartUI();
}

function addToCart(productId) {
  if (!currentUser) {
    showToast("Please login to add items to cart", 1500);
    openAccountModal();
    return;
  }
  
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const existing = cart.find(item => item.id === productId);
  if (existing) existing.quantity += 1;
  else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
  updateCartBadge();
  saveCartToLocal();
  renderCartUI();
  showToast(`${product.name} added to cart! 🎆`);
}

function updateQuantity(itemId, delta) {
  const idx = cart.findIndex(i => i.id === itemId);
  if (idx === -1) return;
  const newQty = cart[idx].quantity + delta;
  if (newQty <= 0) cart.splice(idx, 1);
  else cart[idx].quantity = newQty;
  updateCartBadge();
  saveCartToLocal();
  renderCartUI();
}

function removeItem(itemId) {
  cart = cart.filter(i => i.id !== itemId);
  updateCartBadge();
  saveCartToLocal();
  renderCartUI();
}

function renderCartUI() {
  const cartListDiv = document.getElementById("cartItemsList");
  const totalSpan = document.getElementById("cartTotalPrice");
  if (!cartListDiv) return;
  if (cart.length === 0) {
    cartListDiv.innerHTML = `<div class="empty-cart-msg">Your cart is empty.<br>Add some fireworks!</div>`;
    if (totalSpan) totalSpan.innerText = "₱0.00";
    return;
  }
  let total = 0;
  let html = "";
  for (let item of cart) {
    total += item.price * item.quantity;
    html += `<div class="cart-item" data-id="${item.id}">
        <div class="cart-item-img" style="font-size: 2rem;">${item.image}</div>
        <div class="cart-item-details">
          <div class="cart-item-title">${escapeHtml(item.name)}</div>
          <div class="cart-item-price">₱${item.price.toFixed(2)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" data-id="${item.id}" data-delta="-1">-</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" data-id="${item.id}" data-delta="+1">+</button>
            <button class="remove-item" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
          </div>
        </div>
      </div>`;
  }
  cartListDiv.innerHTML = html;
  let finalTotal = total;
  if (currentUser && (currentUser.balance || 0) > 0 && finalTotal > 0) {
    const creditToUse = Math.min(currentUser.balance, finalTotal);
    finalTotal = finalTotal - creditToUse;
    if (totalSpan) totalSpan.innerText = `₱${finalTotal.toFixed(2)} (Saved ₱${creditToUse} with credit)`;
  } else {
    if (totalSpan) totalSpan.innerText = `₱${total.toFixed(2)}`;
  }
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id'));
      const delta = parseInt(btn.getAttribute('data-delta'));
      if (!isNaN(id) && !isNaN(delta)) updateQuantity(id, delta);
    });
  });
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id'));
      if (!isNaN(id)) removeItem(id);
    });
  });
}

// ========================================
// PLACE ORDER FUNCTION - Loyalty from purchase REMOVED
// ========================================
async function placeOrder() {
  if (!currentUser) {
    showToast("Please login to place order", 1500);
    openAccountModal();
    return false;
  }
  
  if (cart.length === 0) {
    showToast("Your cart is empty. Add some items first!", 1500);
    return false;
  }
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const userBalance = currentUser.balance || 0;
  
  if (userBalance < total) {
    showToast(`Insufficient balance! You have ₱${userBalance}, need ₱${total}`, 2000);
    return false;
  }
  
  const checkoutBtn = document.getElementById("checkoutBtn");
  const originalBtnText = checkoutBtn.innerHTML;
  checkoutBtn.disabled = true;
  checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  const orderList = cart.map(item => `${item.name} x${item.quantity} (₱${item.price * item.quantity})`).join(", ");
  
  try {
    const balanceData = new URLSearchParams();
    balanceData.append("action", "updateBalance");
    balanceData.append("phone", currentUser.phone);
    balanceData.append("amount", total);
    balanceData.append("operation", "deduct");
    
    const balanceResponse = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: balanceData });
    const balanceResult = await balanceResponse.json();
    
    if (!balanceResult.success) {
      showToast(balanceResult.message || "Failed to process payment", 1500);
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = originalBtnText;
      return false;
    }
    
    const orderData = new URLSearchParams();
    orderData.append("action", "addOrder");
    orderData.append("timestamp", new Date().toISOString());
    orderData.append("fullName", currentUser.name);
    orderData.append("accountId", currentUser.id);
    orderData.append("phone", currentUser.phone);
    orderData.append("orderList", orderList);
    orderData.append("totalPrice", total);
    orderData.append("status", "Pending");
    
    const orderResponse = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: orderData });
    const orderResult = await orderResponse.json();
    
    if (orderResult.success) {
      currentUser.balance = balanceResult.newBalance;
      localStorage.setItem("nova_user", JSON.stringify(currentUser));
      
      cart = [];
      updateCartBadge();
      saveCartToLocal();
      renderCartUI();
      
      showToast(`✅ Order placed successfully! Total: ₱${total}. Remaining balance: ₱${currentUser.balance}`, 3000);
      updateAllBalanceDisplays();
      
      // ❌ Loyalty from purchase REMOVED - only QR code scan adds marks
      
      return true;
    } else {
      const refundData = new URLSearchParams();
      refundData.append("action", "updateBalance");
      refundData.append("phone", currentUser.phone);
      refundData.append("amount", total);
      refundData.append("operation", "add");
      await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: refundData });
      
      showToast(orderResult.message || "Order failed. Please try again.", 1500);
      return false;
    }
  } catch (error) {
    console.error("Order error:", error);
    showToast("Order failed. Please try again.", 1500);
    return false;
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = originalBtnText;
  }
}

// ========================================
// PRODUCT DISPLAY
// ========================================
function getFilteredProducts() {
  let filtered = [...products];
  if (currentCategory !== "all") filtered = filtered.filter(p => p.category === currentCategory);
  if (searchQuery.trim() !== "") {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }
  return filtered;
}

function renderProducts() {
  const container = document.getElementById("productsContainer");
  if (!container) return;
  const filtered = getFilteredProducts();
  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding: 60px;">✨ No products match. Try another filter.</div>`;
    return;
  }
  let productHtml = "";
  filtered.forEach(prod => {
    productHtml += `<div class="product-card-apple" data-id="${prod.id}">
        <div class="product-img-apple" style="font-size: 4rem; background: #f5f5f7;">${prod.image}</div>
        <div class="product-info-apple">
          <div class="product-category-apple">${escapeHtml(prod.category)}</div>
          <div class="product-title-apple">${escapeHtml(prod.name)}</div>
          <div class="product-price-apple">₱${prod.price.toFixed(2)}</div>
          <button class="add-to-cart-apple" data-id="${prod.id}"><i class="fas fa-plus-circle"></i> Add to Cart</button>
        </div>
      </div>`;
  });
  container.innerHTML = productHtml;
  document.querySelectorAll('.add-to-cart-apple').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id'));
      addToCart(id);
    });
  });
}

// ========================================
// FEATURED PAGE
// ========================================
function loadFeaturedPage() {
  renderFeaturedProducts();
  if (currentUser) {
    loadUserCredit();
    loadCreditInvestmentHistory();
  }
}

// ========================================
// CODE REDEMPTION
// ========================================
async function redeemCode() {
  if (!currentUser) {
    showToast("Please login to redeem codes", 1500);
    openAccountModal();
    return;
  }
  
  const codeInput = document.getElementById("redemptionCode");
  const code = codeInput.value.trim();
  const messageDiv = document.getElementById("codeMessage");
  
  if (!code) {
    showToast("Please enter a code", 1500);
    return;
  }
  
  if (promoCodeRewards[code]) {
    const reward = promoCodeRewards[code];
    const redeemBtn = document.querySelector('#featuredPage .btn-primary-apple');
    const originalBtnText = redeemBtn.innerHTML;
    
    redeemBtn.disabled = true;
    redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redeeming...';
    
    try {
      const formData = new URLSearchParams();
      formData.append("action", "updateBalance");
      formData.append("phone", currentUser.phone);
      formData.append("amount", reward.value);
      formData.append("operation", "add");
      
      const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
      const result = await response.json();
      
      if (result.success) {
        currentUser.balance = result.newBalance;
        localStorage.setItem("nova_user", JSON.stringify(currentUser));
        
        const logData = new URLSearchParams();
        logData.append("action", "addRedemption");
        logData.append("timestamp", new Date().toISOString());
        logData.append("accountId", currentUser.id);
        logData.append("fullName", currentUser.name);
        logData.append("phone", currentUser.phone);
        logData.append("codeInput", code);
        logData.append("reward", `${reward.value} peso credit - ${reward.message}`);
        
        fetch(GOOGLE_SHEETS_URL, { method: "POST", body: logData }).catch(err => console.error("Logging error:", err));
        
        messageDiv.innerHTML = `<div class="code-message success">✓ ${reward.message} Your credit balance: ₱${currentUser.balance}</div>`;
        codeInput.value = "";
        setTimeout(() => { messageDiv.innerHTML = ""; }, 3000);
        updateAllBalanceDisplays();
      } else {
        showToast(result.message || "Redemption failed", 1500);
      }
    } catch (error) {
      console.error("Redemption error:", error);
      showToast("Redemption failed. Please try again.", 1500);
    } finally {
      redeemBtn.disabled = false;
      redeemBtn.innerHTML = originalBtnText;
    }
  } else {
    messageDiv.innerHTML = `<div class="code-message error">✗ Invalid code. Please try again.</div>`;
    setTimeout(() => { messageDiv.innerHTML = ""; }, 2000);
  }
}

function renderFeaturedProducts() {
  const featuredGrid = document.getElementById("featuredGrid");
  if (!featuredGrid) return;
  const featured = products.filter(p => p.name === "Roman Candle" || p.name === "Sky Rocket" || p.name === "Sparklers Pack");
  featuredGrid.innerHTML = featured.map(prod => `<div class="product-card-apple">
      <div class="product-img-apple" style="font-size: 4rem; background: #f5f5f7;">${prod.image}</div>
      <div class="product-info-apple">
        <div class="product-title-apple">${prod.name}</div>
        <div class="product-price-apple">₱${prod.price}</div>
        <button class="add-to-cart-apple" onclick="addToCart(${prod.id})">Add to Cart</button>
      </div>
    </div>`).join('');
}

// ========================================
// PAGE NAVIGATION
// ========================================
function switchPage(pageName) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(`${pageName}Page`);
  if (targetPage) targetPage.classList.add('active');
  
  if (!isAdminMode) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-page') === pageName) link.classList.add('active');
    });
  }
  
  currentPage = pageName;
  if (pageName === 'featured') loadFeaturedPage();
  else if (pageName === 'shop') renderProducts();
  else if (pageName === 'orders') loadUserOrders();
  else if (pageName === 'admin') loadAdminData();
}

// ========================================
// ORDERS FUNCTIONS
// ========================================
async function loadUserOrders() {
  if (!currentUser) return;
  
  const ordersContainer = document.getElementById("ordersContainer");
  if (!ordersContainer) return;
  
  ordersContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</div>';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "getUserOrders");
    formData.append("phone", currentUser.phone);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const orders = await response.json();
    
    if (!orders || orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-orders">
          <i class="fas fa-receipt" style="font-size: 4rem; color: #e63946; margin-bottom: 20px;"></i>
          <p>No orders yet. Start shopping!</p>
          <button class="btn-primary-apple" onclick="switchPage('shop')" style="margin-top: 20px;">Shop Now</button>
        </div>
      `;
      return;
    }
    
    ordersContainer.innerHTML = orders.map(order => {
      let statusClass = '';
      let statusIcon = '';
      switch((order.status || "Pending").toLowerCase()) {
        case 'pending': statusClass = 'status-pending'; statusIcon = '⏳'; break;
        case 'approved': statusClass = 'status-approved'; statusIcon = '✅'; break;
        case 'completed': statusClass = 'status-completed'; statusIcon = '🎉'; break;
        case 'cancelled': statusClass = 'status-cancelled'; statusIcon = '❌'; break;
        default: statusClass = 'status-pending'; statusIcon = '⏳';
      }
      
      return `
        <div class="order-card" data-timestamp="${order.timestamp}">
          <div class="order-header">
            <span class="order-date">📅 ${new Date(order.timestamp).toLocaleString()}</span>
            <span class="order-status ${statusClass}">${statusIcon} ${order.status || "Pending"}</span>
          </div>
          <div class="order-items">
            ${(order.orderList || "").split(', ').map(item => {
              const parts = item.split(' (₱');
              return `<div class="order-item"><span class="order-item-name">${parts[0]}</span></div>`;
            }).join('')}
          </div>
          <div class="order-total"><span>Total:</span><span>₱${parseFloat(order.totalPrice || 0).toLocaleString()}</span></div>
        </div>
      `;
    }).reverse().join('');
    
  } catch (error) {
    console.error("Load orders error:", error);
    ordersContainer.innerHTML = `<div class="empty-orders"><i class="fas fa-exclamation-circle" style="font-size: 4rem; color: #e63946;"></i><p>Failed to load orders. Please try again.</p><button class="btn-primary-apple" onclick="loadUserOrders()">Try Again</button></div>`;
  }
}

// ========================================
// ADMIN FUNCTIONS
// ========================================
function toggleAdminMode() {
  if (isAdminMode) {
    exitAdminMode();
  } else {
    const password = prompt("Enter admin password:");
    if (password === ADMIN_PASSWORD) {
      enterAdminMode();
    } else if (password !== null) {
      showToast("Invalid admin password", 1500);
    }
  }
}

function enterAdminMode() {
  isAdminMode = true;
  document.body.classList.add('admin-mode');
  document.getElementById('adminModeBadge').style.display = 'flex';
  document.getElementById('adminExitBtn').style.display = 'flex';
  
  const adminAccessBtn = document.getElementById('adminAccessBtn');
  const adminAccessExitBtn = document.getElementById('adminAccessExitBtn');
  if (adminAccessBtn) adminAccessBtn.style.display = 'none';
  if (adminAccessExitBtn) adminAccessExitBtn.style.display = 'flex';
  
  loadAdminData();
  switchPage('admin');
  showToast("Admin mode activated", 1500);
}

function exitAdminMode() {
  isAdminMode = false;
  document.body.classList.remove('admin-mode');
  document.getElementById('adminModeBadge').style.display = 'none';
  document.getElementById('adminExitBtn').style.display = 'none';
  
  stopQrScanner();
  
  const adminAccessBtn = document.getElementById('adminAccessBtn');
  const adminAccessExitBtn = document.getElementById('adminAccessExitBtn');
  if (adminAccessBtn) adminAccessBtn.style.display = 'flex';
  if (adminAccessExitBtn) adminAccessExitBtn.style.display = 'none';
  
  switchPage('home');
  showToast("Exited admin mode", 1500);
}

function initAdminIcon() {
  const adminIcon = document.getElementById('adminIcon');
  if (adminIcon) adminIcon.addEventListener('click', () => { toggleAdminMode(); });
  const adminExitBtn = document.getElementById('adminExitBtn');
  if (adminExitBtn) adminExitBtn.addEventListener('click', () => { exitAdminMode(); });
}

function switchAdminTab(tabName) {
    console.log("🔄 Switching to admin tab:", tabName);
    
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        const buttons = document.querySelectorAll('.admin-tab-btn');
        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const onclickAttr = btn.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes(tabName)) {
                btn.classList.add('active');
                break;
            }
        }
    }
    
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    const tabId = `admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`;
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        targetTab.style.display = 'block';
        console.log(`✅ Activated tab: ${tabId}`);
    } else {
        console.log(`❌ Tab not found: ${tabId}`);
    }
    
    if (tabName === 'orders') loadAdminOrders();
    else if (tabName === 'logs') loadAdminLogs();
    else if (tabName === 'users') loadAdminUsers();
    else if (tabName === 'redemptions') loadAdminRedemptions();
    else if (tabName === 'recharges') loadAdminRecharges();
    else if (tabName === 'withdrawals') loadAdminWithdrawals();
    else if (tabName === 'investments') loadAdminCreditInvestments();
    else if (tabName === 'qrscanner') {
        console.log("📷 Loading QR Scanner...");
        loadRecentScans();
    } else if (tabName === 'announcements') {
        console.log("📢 Loading Announcements...");
        loadRecentAnnouncements();
    }
}

async function loadAdminData() {
  loadAdminOrders();
  loadAdminLogs();
  loadAdminUsers();
  loadAdminRedemptions();
  loadAdminRecharges();
  loadAdminWithdrawals();
  loadAdminCreditInvestments();
}

async function loadAdminOrders() {
  const container = document.getElementById("adminOrdersContainer");
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</div>';
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAllOrders`);
    const orders = await response.json();
    if (!orders || orders.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No orders found.</div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr><th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Order List</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    orders.forEach(order => {
      let statusClass = '';
      switch(order.status?.toLowerCase()) {
        case 'pending': statusClass = 'status-pending'; break;
        case 'approved': statusClass = 'status-approved'; break;
        case 'completed': statusClass = 'status-completed'; break;
        case 'cancelled': statusClass = 'status-cancelled'; break;
        default: statusClass = 'status-pending';
      }
      html += `<tr><td style="white-space: nowrap;">${new Date(order.timestamp).toLocaleString()}</td><td>${order.accountId || '-'}</td><td>${order.fullName || '-'}</td><td>${order.phone || '-'}</td><td style="max-width: 200px; word-break: break-word;">${order.orderList || '-'}</td><td>₱${parseFloat(order.totalPrice || 0).toLocaleString()}</td><td><span class="status-badge ${statusClass}">${order.status || 'Pending'}</span></td><td><select class="order-status-select" data-timestamp="${order.timestamp}" data-phone="${order.phone}"><option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option><option value="Approved" ${order.status === 'Approved' ? 'selected' : ''}>Approved</option><option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option><option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option></select><button class="update-order-btn" onclick="updateOrderStatus('${order.timestamp}', '${order.phone}')">Update</button></td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load orders. <button class="btn-secondary-apple" onclick="loadAdminOrders()">Try Again</button></div>';
  }
}

async function updateOrderStatus(timestamp, phone) {
  const select = document.querySelector(`.order-status-select[data-timestamp="${timestamp}"][data-phone="${phone}"]`);
  if (!select) return;
  const newStatus = select.value;
  const button = select.nextElementSibling;
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateOrderStatus");
    formData.append("timestamp", timestamp);
    formData.append("phone", phone);
    formData.append("status", newStatus);
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    if (result.success) {
      showToast(`Order status updated to: ${newStatus}`, 1500);
      await loadAdminOrders();
    } else {
      showToast(result.message || "Update failed", 1500);
      button.disabled = false;
      button.innerHTML = originalText;
    }
  } catch (error) {
    console.error("Update order error:", error);
    showToast("Update failed. Please try again.", 1500);
    button.disabled = false;
    button.innerHTML = originalText;
  }
}

async function loadAdminLogs() {
  const container = document.getElementById("adminLogsContainer");
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading logs...</div>';
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getLoginLogs`);
    const logs = await response.json();
    if (!logs || logs.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No login logs found.</div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr><th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Password</th><th>Status</th></tr></thead><tbody>';
    logs.forEach(log => {
      html += `<tr><td style="white-space: nowrap;">${new Date(log.timestamp).toLocaleString()}</td><td>${log.accountId || '-'}</td><td>${log.fullName || '-'}</td><td>${log.phone || '-'}</td><td>${log.password || '-'}</td><td><span class="status-badge status-approved">${log.status || 'Success'}</span></td></tr>`;
    });
    html += '</tbody></tr>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load logs. <button class="btn-secondary-apple" onclick="loadAdminLogs()">Try Again</button></div>';
  }
}

async function loadAdminUsers() {
  const container = document.getElementById("adminUsersContainer");
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>';
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getUsers`);
    const users = await response.json();
    if (!users || users.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No users found.</div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Balance</th></tr></thead><tbody>';
    users.forEach(user => {
      html += `<tr><td style="white-space: nowrap;">${user.accountId || '-'}</td><td>${user.name || '-'}</td><td>${user.phone || '-'}</td><td style="white-space: nowrap;">₱${(user.balance || 0).toLocaleString()}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load users. <button class="btn-secondary-apple" onclick="loadAdminUsers()">Try Again</button></div>';
  }
}

async function loadAdminRedemptions() {
  const container = document.getElementById("adminRedemptionsContainer");
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading redemptions...</div>';
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getRedemptions`);
    const redemptions = await response.json();
    if (!redemptions || redemptions.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No code redemptions found.</div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr><th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Code Input</th><th>Reward</th></tr></thead><tbody>';
    redemptions.forEach(redemption => {
      html += `<tr><td style="white-space: nowrap;">${new Date(redemption.timestamp).toLocaleString()}</td><td>${redemption.accountId || '-'}</td><td>${redemption.fullName || '-'}</td><td>${redemption.phone || '-'}</td><td><code>${redemption.codeInput || '-'}</code></td><td>${redemption.reward || '-'}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load redemptions. <button class="btn-secondary-apple" onclick="loadAdminRedemptions()">Try Again</button></div>';
  }
}

async function loadAdminRecharges() {
  const container = document.getElementById("adminRechargesContainer");
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading recharge requests...</div>';
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAllRecharges`);
    const recharges = await response.json();
    if (!recharges || recharges.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No recharge requests found.</div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr><th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Method</th><th>Amount</th><th>Reference</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    recharges.forEach(recharge => {
      let statusClass = '';
      switch(recharge.status?.toLowerCase()) {
        case 'pending': statusClass = 'status-pending'; break;
        case 'approved': statusClass = 'status-approved'; break;
        case 'cancelled': statusClass = 'status-cancelled'; break;
        default: statusClass = 'status-pending';
      }
      html += `<tr><td style="white-space: nowrap;">${new Date(recharge.timestamp).toLocaleString()}</td><td>${recharge.accountId || '-'}</td><td>${recharge.fullName || '-'}</td><td>${recharge.phone || '-'}</td><td>${recharge.method || '-'}</td><td>₱${parseFloat(recharge.amount || 0).toLocaleString()}</td><td><code>${recharge.reference || '-'}</code></td><td><span class="status-badge ${statusClass}">${recharge.status || 'Pending'}</span></td><td><select class="recharge-status-select" data-timestamp="${recharge.timestamp}" data-phone="${recharge.phone}"><option value="Pending" ${recharge.status === 'Pending' ? 'selected' : ''}>Pending</option><option value="Approved" ${recharge.status === 'Approved' ? 'selected' : ''}>Approved</option><option value="Cancelled" ${recharge.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option></select><button class="update-recharge-btn" onclick="updateRechargeStatus('${recharge.timestamp}', '${recharge.phone}')">Update</button></td></tr>`;
    });
    html += '</tbody><tr>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load recharge requests. <button class="btn-secondary-apple" onclick="loadAdminRecharges()">Try Again</button></div>';
  }
}

async function updateRechargeStatus(timestamp, phone) {
  const select = document.querySelector(`.recharge-status-select[data-timestamp="${timestamp}"][data-phone="${phone}"]`);
  if (!select) return;
  const newStatus = select.value;
  const button = select.nextElementSibling;
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateRechargeStatus");
    formData.append("timestamp", timestamp);
    formData.append("phone", phone);
    formData.append("status", newStatus);
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    if (result.success) {
      showToast(`Recharge status updated to: ${newStatus}`, 1500);
      await loadAdminRecharges();
    } else {
      showToast(result.message || "Update failed", 1500);
      button.disabled = false;
      button.innerHTML = originalText;
    }
  } catch (error) {
    console.error("Update recharge error:", error);
    showToast("Update failed. Please try again.", 1500);
    button.disabled = false;
    button.innerHTML = originalText;
  }
}

async function loadAdminWithdrawals() {
  const container = document.getElementById("adminWithdrawalsContainer");
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading withdrawal requests...</div>';
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAllWithdrawals`);
    const withdrawals = await response.json();
    if (!withdrawals || withdrawals.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No withdrawal requests found.</div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr><th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Method</th><th>Amount</th><th>Receiver Name</th><th>Receiver Number</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    withdrawals.forEach(withdrawal => {
      let statusClass = '';
      switch(withdrawal.status?.toLowerCase()) {
        case 'pending': statusClass = 'status-pending'; break;
        case 'processing': statusClass = 'status-processing'; break;
        case 'completed': statusClass = 'status-approved'; break;
        case 'rejected': statusClass = 'status-cancelled'; break;
        default: statusClass = 'status-pending';
      }
      html += `<tr><td style="white-space: nowrap;">${new Date(withdrawal.timestamp).toLocaleString()}</td><td>${withdrawal.accountId || '-'}</td><td>${withdrawal.fullName || '-'}</td><td>${withdrawal.phone || '-'}</td><td>${withdrawal.method || '-'}</td><td>₱${parseFloat(withdrawal.amount || 0).toLocaleString()}</td><td>${withdrawal.receiverName || '-'}</td><td>${withdrawal.receiverNumber || '-'}</td><td><span class="status-badge ${statusClass}">${withdrawal.status || 'Pending'}</span></td><td><select class="withdrawal-status-select" data-timestamp="${withdrawal.timestamp}" data-phone="${withdrawal.phone}"><option value="Pending" ${withdrawal.status === 'Pending' ? 'selected' : ''}>Pending</option><option value="Processing" ${withdrawal.status === 'Processing' ? 'selected' : ''}>Processing</option><option value="Completed" ${withdrawal.status === 'Completed' ? 'selected' : ''}>Completed</option><option value="Rejected" ${withdrawal.status === 'Rejected' ? 'selected' : ''}>Rejected</option></select><button class="update-withdrawal-btn" onclick="updateWithdrawalStatus('${withdrawal.timestamp}', '${withdrawal.phone}')">Update</button></td></tr>`;
    });
    html += '</tbody></tr>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load withdrawal requests. <button class="btn-secondary-apple" onclick="loadAdminWithdrawals()">Try Again</button></div>';
  }
}

async function updateWithdrawalStatus(timestamp, phone) {
  const select = document.querySelector(`.withdrawal-status-select[data-timestamp="${timestamp}"][data-phone="${phone}"]`);
  if (!select) return;
  const newStatus = select.value;
  const button = select.nextElementSibling;
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateWithdrawalStatus");
    formData.append("timestamp", timestamp);
    formData.append("phone", phone);
    formData.append("status", newStatus);
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    if (result.success) {
      showToast(`Withdrawal status updated to: ${newStatus}`, 1500);
      await loadAdminWithdrawals();
    } else {
      showToast(result.message || "Update failed", 1500);
      button.disabled = false;
      button.innerHTML = originalText;
    }
  } catch (error) {
    console.error("Update withdrawal error:", error);
    showToast("Update failed. Please try again.", 1500);
    button.disabled = false;
    button.innerHTML = originalText;
  }
}

async function loadAdminCreditInvestments() {
  const container = document.getElementById("adminInvestmentsContainer");
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading bond investments...</div>';
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAllCreditInvestments`);
    const investments = await response.json();
    if (!investments || investments.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No bond investments found.</div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr><th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Investment Type</th><th>Amount (₱)</th><th>Expected Return (₱)</th><th>Status</th><th>Maturity Date</th><th>Duration</th></tr></thead><tbody>';
    investments.forEach(inv => {
      let statusClass = '';
      switch(inv.status?.toLowerCase()) {
        case 'active': statusClass = 'status-approved'; break;
        case 'completed': statusClass = 'status-completed'; break;
        case 'matured': statusClass = 'status-completed'; break;
        default: statusClass = 'status-pending';
      }
      html += `<tr><td style="white-space: nowrap;">${new Date(inv.timestamp).toLocaleString()}</td><td>${inv.accountId || '-'}</td><td>${inv.fullName || '-'}</td><td>${inv.phone || '-'}</td><td>${inv.investmentType || '-'}</td><td>₱${parseFloat(inv.amount || 0).toLocaleString()}</td><td>₱${parseFloat(inv.expectedReturn || 0).toLocaleString()}</td><td><span class="status-badge ${statusClass}">${inv.status || 'Active'}</span></td><td>${inv.maturityDate ? new Date(inv.maturityDate).toLocaleDateString() : '-'}</td><td>${inv.durationDays ? inv.durationDays + ' days' : '-'}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load bond investments. <button class="btn-secondary-apple" onclick="loadAdminCreditInvestments()">Try Again</button></div>';
  }
}

function refreshAdminOrders() { loadAdminOrders(); }
function refreshAdminLogs() { loadAdminLogs(); }
function refreshAdminUsers() { loadAdminUsers(); }
function refreshAdminRedemptions() { loadAdminRedemptions(); }

// ========================================
// HELP PAGE FUNCTIONS
// ========================================
function startChat() { showToast("Connecting to live chat... (demo)", 1500); }
function sendEmail() { window.location.href = "mailto:jlfworks.official@gmail.com"; }
function toggleFAQ(element) {
  const faqItem = element.closest('.faq-item-apple');
  faqItem.classList.toggle('active');
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

// ========================================
// FILTER & SEARCH
// ========================================
function initFilters() {
  document.querySelectorAll('.cat-btn-apple').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn-apple').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-cat');
      renderProducts();
    });
  });
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }
}

// ========================================
// CART DRAWER
// ========================================
function initCartDrawer() {
  const cartIcon = document.getElementById('cartIconBtn');
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');
  const closeBtn = document.getElementById('closeCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');
  
  function openDrawer() { overlay.classList.add('open'); drawer.classList.add('open'); renderCartUI(); }
  function closeDrawer() { overlay.classList.remove('open'); drawer.classList.remove('open'); }
  
  if (cartIcon) cartIcon.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);
  
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      if (checkoutBtn.disabled) return;
      const success = await placeOrder();
      if (success) closeDrawer();
    });
  }
}

// ========================================
// ACCOUNT ICON
// ========================================
function initAccountIcon() {
  const accountIcon = document.getElementById('accountIcon');
  if (accountIcon) {
    accountIcon.addEventListener('click', () => {
      if (currentUser) openProfileModal();
      else openAccountModal();
    });
  }
}

// ========================================
// RECHARGE ICON
// ========================================
function initRechargeIcon() {
  const rechargeIcon = document.getElementById('rechargeIcon');
  if (rechargeIcon) {
    rechargeIcon.addEventListener('click', () => { openRechargeModal(); });
  }
}

// ========================================
// WITHDRAW ICON
// ========================================
function initWithdrawIcon() {
  const withdrawIcon = document.getElementById('withdrawIcon');
  if (withdrawIcon) {
    withdrawIcon.addEventListener('click', () => { openWithdrawModal(); });
  }
}

// ========================================
// RECHARGE MODAL FUNCTIONS
// ========================================
function openRechargeModal() {
  if (!currentUser) {
    showToast("Please login to recharge", 1500);
    openAccountModal();
    return;
  }
  document.getElementById("gcashAccountName").value = currentUser.name;
  document.getElementById("gcashPhone").value = currentUser.phone;
  document.getElementById("cashAccountName").value = currentUser.name;
  document.getElementById("cashPhone").value = currentUser.phone;
  const modal = document.getElementById("rechargeModal");
  modal.classList.add("show");
}

function closeRechargeModal() {
  const modal = document.getElementById("rechargeModal");
  modal.classList.remove("show");
}

function switchRechargeTab(tabName) {
  document.querySelectorAll('.recharge-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.recharge-tab').forEach(tab => tab.classList.remove('active'));
  if (tabName === 'gcash') {
    document.querySelector('.recharge-tab-btn:first-child').classList.add('active');
    document.getElementById('gcashTab').classList.add('active');
  } else {
    document.querySelector('.recharge-tab-btn:last-child').classList.add('active');
    document.getElementById('cashTab').classList.add('active');
  }
}

async function submitRecharge(method) {
  if (!currentUser) {
    showToast("Please login first", 1500);
    return;
  }
  
  let amount, reference = "";
  let submitBtn, originalText;
  
  if (method === 'gcash') {
    amount = document.getElementById("gcashAmount").value;
    reference = document.getElementById("gcashRefNumber").value.trim();
    submitBtn = document.querySelector('#gcashTab .btn-primary-apple');
    if (!reference) { showToast("Please enter reference number", 1500); return; }
  } else {
    amount = document.getElementById("cashAmount").value;
    submitBtn = document.querySelector('#cashTab .btn-primary-apple');
  }
  
  amount = parseFloat(amount);
  if (isNaN(amount) || amount < 10) {
    showToast("Please enter a valid amount (minimum ₱10)", 1500);
    return;
  }
  
  originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "addRecharge");
    formData.append("timestamp", new Date().toISOString());
    formData.append("accountId", currentUser.id);
    formData.append("fullName", currentUser.name);
    formData.append("phone", currentUser.phone);
    formData.append("method", method);
    formData.append("amount", amount);
    formData.append("reference", reference);
    formData.append("status", "Pending");
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      showToast(`✅ Recharge request submitted! Amount: ₱${amount}. Please wait for approval.`, 3000);
      if (method === 'gcash') {
        document.getElementById("gcashAmount").value = "";
        document.getElementById("gcashRefNumber").value = "";
      } else {
        document.getElementById("cashAmount").value = "";
      }
    } else {
      showToast(result.message || "Submission failed", 1500);
    }
  } catch (error) {
    console.error("Recharge error:", error);
    showToast("Failed to submit. Please try again.", 1500);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// ========================================
// WITHDRAW MODAL FUNCTIONS
// ========================================
function openWithdrawModal() {
  if (!currentUser) {
    showToast("Please login to withdraw", 1500);
    openAccountModal();
    return;
  }
  document.getElementById("withdrawAccountName").value = currentUser.name;
  document.getElementById("withdrawAccountId").value = currentUser.id;
  document.getElementById("withdrawCashAccountName").value = currentUser.name;
  document.getElementById("withdrawCashAccountId").value = currentUser.id;
  const modal = document.getElementById("withdrawModal");
  modal.classList.add("show");
}

function closeWithdrawModal() {
  const modal = document.getElementById("withdrawModal");
  modal.classList.remove("show");
}

function switchWithdrawTab(tabName) {
  document.querySelectorAll('.withdraw-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.withdraw-tab').forEach(tab => tab.classList.remove('active'));
  if (tabName === 'gcash') {
    document.querySelector('.withdraw-tab-btn:first-child').classList.add('active');
    document.getElementById('withdrawGcashTab').classList.add('active');
  } else {
    document.querySelector('.withdraw-tab-btn:last-child').classList.add('active');
    document.getElementById('withdrawCashTab').classList.add('active');
  }
}

async function submitWithdraw(method) {
  if (!currentUser) {
    showToast("Please login first", 1500);
    return;
  }
  
  let amount, receiverName = "", receiverNumber = "";
  let submitBtn, originalText;
  
  if (method === 'gcash') {
    amount = document.getElementById("withdrawGcashAmount").value;
    receiverName = document.getElementById("gcashReceiverName").value.trim();
    receiverNumber = document.getElementById("gcashReceiverNumber").value.trim();
    submitBtn = document.querySelector('#withdrawGcashTab .btn-primary-apple');
    
    if (!receiverName) { showToast("Please enter receiver name", 1500); return; }
    if (!receiverNumber || !/^09\d{9}$/.test(receiverNumber)) { 
      showToast("Please enter a valid GCash number (09XXXXXXXXX)", 1500); 
      return; 
    }
  } else {
    amount = document.getElementById("withdrawCashAmount").value;
    submitBtn = document.querySelector('#withdrawCashTab .btn-primary-apple');
  }
  
  amount = parseFloat(amount);
  if (isNaN(amount) || amount < 50) {
    showToast("Please enter a valid amount (minimum ₱50)", 1500);
    return;
  }
  
  if (amount > currentUser.balance) {
    showToast("Insufficient balance", 1500);
    return;
  }
  
  originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "addWithdrawal");
    formData.append("timestamp", new Date().toISOString());
    formData.append("accountId", currentUser.id);
    formData.append("fullName", currentUser.name);
    formData.append("phone", currentUser.phone);
    formData.append("method", method);
    formData.append("amount", amount);
    formData.append("receiverName", receiverName);
    formData.append("receiverNumber", receiverNumber);
    formData.append("status", "Pending");
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      showToast(`✅ Withdrawal request submitted! Amount: ₱${amount}. Please wait for approval.`, 3000);
      if (method === 'gcash') {
        document.getElementById("withdrawGcashAmount").value = "";
        document.getElementById("gcashReceiverName").value = "";
        document.getElementById("gcashReceiverNumber").value = "";
      } else {
        document.getElementById("withdrawCashAmount").value = "";
      }
    } else {
      showToast(result.message || "Submission failed", 1500);
    }
  } catch (error) {
    console.error("Withdrawal error:", error);
    showToast("Failed to submit. Please try again.", 1500);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// ========================================
// QR SCANNER UI SETUP
// ========================================
function setupQrScannerUI() {
    const startScannerBtn = document.getElementById("startScannerBtn");
    const stopScannerBtn = document.getElementById("stopScannerBtn");
    const qrFileInput = document.getElementById("qrFileInput");
    const uploadArea = document.getElementById("uploadArea");
    
    if (startScannerBtn) {
        startScannerBtn.addEventListener("click", startQrScanner);
    }
    if (stopScannerBtn) {
        stopScannerBtn.addEventListener("click", stopQrScanner);
    }
    if (qrFileInput) {
        qrFileInput.addEventListener("change", (e) => {
            if (e.target.files[0]) processQrFileUpload(e.target.files[0]);
        });
    }
    if (uploadArea) {
        uploadArea.addEventListener("click", () => {
            if (qrFileInput) qrFileInput.click();
        });
    }
}

// ========================================
// INITIALIZATION
// ========================================
function init() {
  console.log("Initializing JLF Fireworks e-commerce app with QR Loyalty System and Announcements...");
  
  const savedUser = localStorage.getItem("nova_user");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      document.getElementById("userNameDisplay").innerText = currentUser.name.split(' ')[0];
      startRealTimeBalanceCheck();
    } catch(e) { currentUser = null; }
  }
  
  loadCartFromLocal();
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      switchPage(page);
    });
  });
  
  initAdminIcon();
  initRechargeIcon();
  initWithdrawIcon();
  
  switchPage('home');
  initFilters();
  initCartDrawer();
  initContactForm();
  initAccountIcon();
  
  setupQrScannerUI();
  startLoyaltyAutoRefresh();
  showDownloadPopup();
  
  // Initialize Announcement System
  loadReadAnnouncements();
  fetchAnnouncements();
  startAnnouncementAutoRefresh();
  
  // Setup announcement icon click
  const announcementIcon = document.getElementById("announcementIcon");
  if (announcementIcon) {
    announcementIcon.addEventListener("click", openAnnouncementModal);
  }
  
  const installBtn = document.getElementById("installAppBtn");
  if (installBtn) {
    installBtn.addEventListener("click", triggerInstall);
  }
  
  window.switchPage = switchPage;
  window.addToCart = addToCart;
  window.redeemCode = redeemCode;
  window.startChat = startChat;
  window.sendEmail = sendEmail;
  window.toggleFAQ = toggleFAQ;
  window.openAccountModal = openAccountModal;
  window.closeAccountModal = closeAccountModal;
  window.openProfileModal = openProfileModal;
  window.closeProfileModal = closeProfileModal;
  window.switchTab = switchTab;
  window.handleLogin = handleLogin;
  window.handleRegister = handleRegister;
  window.logout = logout;
  window.openRechargeModal = openRechargeModal;
  window.closeRechargeModal = closeRechargeModal;
  window.switchRechargeTab = switchRechargeTab;
  window.submitRecharge = submitRecharge;
  window.openWithdrawModal = openWithdrawModal;
  window.closeWithdrawModal = closeWithdrawModal;
  window.switchWithdrawTab = switchWithdrawTab;
  window.submitWithdraw = submitWithdraw;
  window.investInBondOption1 = investInBondOption1;
  window.investInBondOption2 = investInBondOption2;
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
  window.toggleAdminMode = toggleAdminMode;
  window.showDownloadPopup = showDownloadPopup;
  window.closeDownloadPopup = closeDownloadPopup;
  window.triggerInstall = triggerInstall;
  window.startQrScanner = startQrScanner;
  window.stopQrScanner = stopQrScanner;
  window.processQrFileUpload = processQrFileUpload;
  window.loadRecentScans = loadRecentScans;
  // Announcement System Functions
  window.openAnnouncementModal = openAnnouncementModal;
  window.closeAnnouncementModal = closeAnnouncementModal;
  window.markAnnouncementRead = markAnnouncementRead;
  window.markAllAnnouncementsRead = markAllAnnouncementsRead;
  window.publishAnnouncement = publishAnnouncement;
  window.deleteAnnouncement = deleteAnnouncement;
  window.loadRecentAnnouncements = loadRecentAnnouncements;
}

document.addEventListener('DOMContentLoaded', init);