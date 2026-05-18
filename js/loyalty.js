// ========================================
// LOYALTY QR CODE FUNCTIONS - FIXED
// ========================================

let isProcessingScan = false;

async function generateUserQRCode() {
    if (!currentUser || isAdmin) return;
    
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
    if (!currentUser || isAdmin) return;
    
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
    if (!currentUser || isAdmin) return;
    
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

function startLoyaltyAutoRefresh() {
    if (loyaltyRefreshInterval) clearInterval(loyaltyRefreshInterval);
    
    loyaltyRefreshInterval = setInterval(() => {
        if (currentUser && !isAdmin && document.getElementById("profileModal")?.classList.contains("show")) {
            loadUserLoyalty();
        }
        if (isAdmin && document.getElementById("adminQrScannerTab")?.classList.contains("active")) {
            loadRecentScans();
        }
    }, 5000);
}

// ========================================
// ADMIN QR SCANNER FUNCTIONS - FIXED
// ========================================

function startQrScanner() {
    const video = document.getElementById("qrVideo");
    const startBtn = document.getElementById("startScannerBtn");
    const stopBtn = document.getElementById("stopScannerBtn");
    
    if (qrCurrentStream) {
        stopQrScanner();
    }
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            qrCurrentStream = stream;
            video.srcObject = stream;
            video.play();
            
            if (startBtn) startBtn.style.display = "none";
            if (stopBtn) stopBtn.style.display = "inline-block";
            
            startScanningInterval();
            if (typeof showToast === 'function') showToast("Camera started. Point at QR code.", 2000);
        })
        .catch(err => {
            console.error("Camera error:", err);
            if (typeof showToast === 'function') showToast("Cannot access camera. Please check permissions.", 3000);
        });
}

function stopQrScanner() {
    if (qrCurrentStream) {
        qrCurrentStream.getTracks().forEach(track => track.stop());
        qrCurrentStream = null;
    }
    
    const video = document.getElementById("qrVideo");
    if (video) video.srcObject = null;
    
    const startBtn = document.getElementById("startScannerBtn");
    const stopBtn = document.getElementById("stopScannerBtn");
    
    if (startBtn) startBtn.style.display = "inline-block";
    if (stopBtn) stopBtn.style.display = "none";
    
    if (qrScanInterval) {
        clearInterval(qrScanInterval);
        qrScanInterval = null;
    }
}

function startScanningInterval() {
    if (qrScanInterval) clearInterval(qrScanInterval);
    
    qrScanInterval = setInterval(() => {
        scanQRFromVideo();
    }, 1000);
}

async function scanQRFromVideo() {
    if (isProcessingScan) return;
    
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
    if (isProcessingScan) {
        if (typeof showToast === 'function') showToast("Please wait, processing previous scan...", 1500);
        return;
    }
    
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
    if (isProcessingScan) {
        showScanResult("Processing previous scan...", true);
        return;
    }
    
    isProcessingScan = true;
    
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
            
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            
            loadRecentScans();
            
            if (currentUser && (currentUser.id === accountId || currentUser.phone === phone)) {
                await loadUserLoyalty();
                if (typeof refreshUserBalance === 'function') refreshUserBalance();
            }
        } else {
            showScanResult(result.message || "Scan failed. User not found.", true);
        }
    } catch (error) {
        console.error("Scan error:", error);
        showScanResult("Error processing scan. Please try again.", true);
    } finally {
        isProcessingScan = false;
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

function setupQrScannerUI() {
    const startScannerBtn = document.getElementById("startScannerBtn");
    const stopScannerBtn = document.getElementById("stopScannerBtn");
    const qrFileInput = document.getElementById("qrFileInput");
    const uploadArea = document.getElementById("uploadArea");
    const chooseFileBtn = document.getElementById("chooseFileBtn");
    
    if (startScannerBtn) {
        startScannerBtn.removeEventListener('click', startQrScanner);
        startScannerBtn.addEventListener('click', startQrScanner);
    }
    if (stopScannerBtn) {
        stopScannerBtn.removeEventListener('click', stopQrScanner);
        stopScannerBtn.addEventListener('click', stopQrScanner);
    }
    if (qrFileInput) {
        qrFileInput.removeEventListener('change', handleFileChange);
        qrFileInput.addEventListener('change', handleFileChange);
    }
    if (uploadArea) {
        uploadArea.removeEventListener('click', handleUploadClick);
        uploadArea.addEventListener('click', handleUploadClick);
    }
    if (chooseFileBtn) {
        chooseFileBtn.removeEventListener('click', handleChooseFileClick);
        chooseFileBtn.addEventListener('click', handleChooseFileClick);
    }
}

function handleFileChange(e) {
    if (e.target.files[0]) processQrFileUpload(e.target.files[0]);
}

function handleUploadClick() {
    const qrFileInput = document.getElementById("qrFileInput");
    if (qrFileInput) qrFileInput.click();
}

function handleChooseFileClick() {
    const qrFileInput = document.getElementById("qrFileInput");
    if (qrFileInput) qrFileInput.click();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        setupQrScannerUI();
    }, 500);
});

// Make functions global
window.generateUserQRCode = generateUserQRCode;
window.loadUserLoyalty = loadUserLoyalty;
window.startLoyaltyAutoRefresh = startLoyaltyAutoRefresh;
window.startQrScanner = startQrScanner;
window.stopQrScanner = stopQrScanner;
window.processQrFileUpload = processQrFileUpload;
window.loadRecentScans = loadRecentScans;
window.setupQrScannerUI = setupQrScannerUI;