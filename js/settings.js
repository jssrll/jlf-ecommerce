// ========================================
// SETTINGS SYSTEM
// ========================================

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem("jlf_settings");
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        if (settings.fontSize) {
            applyFontSize(settings.fontSize);
        }
        
        if (settings.compactMode) {
            document.body.classList.add('compact');
        } else {
            document.body.classList.remove('compact');
        }
        
        if (settings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        
        return settings;
    }
    
    return {
        fontSize: 'medium',
        compactMode: false,
        highContrast: false
    };
}

function saveSettings(settings) {
    localStorage.setItem("jlf_settings", JSON.stringify(settings));
}

function applyFontSize(size) {
    const sizes = {
        small: '13px',
        medium: '16px',
        large: '19px'
    };
    document.documentElement.style.fontSize = sizes[size] || '16px';
}

function changeFontSize(size) {
    const settings = loadSettings();
    settings.fontSize = size;
    applyFontSize(size);
    saveSettings(settings);
    
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    if (fontSizeSelect) {
        fontSizeSelect.value = size;
    }
    
    showToast(`Font size changed to ${size}`, 1500);
}

function clearCache() {
    localStorage.clear();
    showToast("Cache cleared!", 1500);
}

function resetAllSettings() {
    localStorage.removeItem("jlf_settings");
    loadSettings();
    showToast("Settings reset to default", 1500);
}

function toggleDarkMode() {
    const settings = loadSettings();
    settings.darkMode = !settings.darkMode;
    saveSettings(settings);
    
    if (settings.darkMode) {
        document.body.classList.add('dark');
        showToast("Dark mode enabled", 1500);
    } else {
        document.body.classList.remove('dark');
        showToast("Dark mode disabled", 1500);
    }
}

function toggleCompactMode() {
    const settings = loadSettings();
    settings.compactMode = !settings.compactMode;
    
    if (settings.compactMode) {
        document.body.classList.add('compact');
    } else {
        document.body.classList.remove('compact');
    }
    
    saveSettings(settings);
    
    const compactToggle = document.getElementById('compactModeToggle');
    if (compactToggle) {
        compactToggle.checked = settings.compactMode;
    }
    
    showToast(settings.compactMode ? "Compact mode enabled" : "Compact mode disabled", 1500);
}

function toggleHighContrast() {
    const settings = loadSettings();
    settings.highContrast = !settings.highContrast;
    
    if (settings.highContrast) {
        document.body.classList.add('high-contrast');
    } else {
        document.body.classList.remove('high-contrast');
    }
    
    saveSettings(settings);
    
    const contrastToggle = document.getElementById('highContrastToggle');
    if (contrastToggle) {
        contrastToggle.checked = settings.highContrast;
    }
    
    showToast(settings.highContrast ? "High contrast mode enabled" : "High contrast mode disabled", 1500);
}

function renderSettingsPage() {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) {
        return;
    }
    
    const settings = loadSettings();
    
    mainContent.innerHTML = `
        <div class="settings-container">
            <div class="page-hero">
                <h1><i class="fas fa-sliders-h"></i> Settings</h1>
                <p>Customize your JLF Fireworks experience</p>
            </div>
            
            <div class="settings-card">
                <h3><i class="fas fa-palette"></i> Appearance</h3>
                <div class="settings-row">
                    <span><i class="fas fa-text-height"></i> Font Size</span>
                    <select id="fontSizeSelect" class="settings-select">
                        <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
                        <option value="medium" ${settings.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
                    </select>
                </div>
                <div class="settings-row">
                    <span><i class="fas fa-compress"></i> Compact Mode</span>
                    <label class="switch">
                        <input type="checkbox" id="compactModeToggle" ${settings.compactMode ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="settings-row">
                    <span><i class="fas fa-adjust"></i> High Contrast</span>
                    <label class="switch">
                        <input type="checkbox" id="highContrastToggle" ${settings.highContrast ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            
            <div class="settings-card">
                <h3><i class="fas fa-info-circle"></i> About & Support</h3>
                <div class="settings-row">
                    <span><i class="fas fa-code-branch"></i> App Version</span>
                    <span class="settings-value">1.00.59</span>
                </div>
                <div class="settings-row">
                    <span><i class="fas fa-file-contract"></i> Terms of Service</span>
                    <button class="btn-secondary-apple" id="viewTermsBtn">View</button>
                </div>
                <div class="settings-row">
                    <span><i class="fas fa-shield-alt"></i> Privacy Policy</span>
                    <button class="btn-secondary-apple" id="viewPrivacyBtn">View</button>
                </div>
                <div class="settings-row">
                    <span><i class="fas fa-envelope"></i> Contact Developer</span>
                    <button class="btn-secondary-apple" id="contactDevBtn">Email</button>
                </div>
                <div class="settings-row">
                    <span><i class="fas fa-question-circle"></i> FAQ</span>
                    <button class="btn-secondary-apple" id="faqBtn">Go to FAQ</button>
                </div>
                <div class="settings-row">
                    <span><i class="fas fa-bug"></i> Report Bug</span>
                    <button class="btn-secondary-apple" id="reportBugBtn">Report</button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('fontSizeSelect')?.addEventListener('change', (e) => changeFontSize(e.target.value));
    document.getElementById('compactModeToggle')?.addEventListener('change', toggleCompactMode);
    document.getElementById('highContrastToggle')?.addEventListener('change', toggleHighContrast);
    document.getElementById('viewTermsBtn')?.addEventListener('click', () => openTermsModal());
    document.getElementById('viewPrivacyBtn')?.addEventListener('click', () => openPrivacyModal());
    document.getElementById('contactDevBtn')?.addEventListener('click', () => window.location.href = "mailto:jessrell1010@gmail.com");
    document.getElementById('faqBtn')?.addEventListener('click', () => switchPage('help'));
    document.getElementById('reportBugBtn')?.addEventListener('click', openBugReportModal);
}

function openTermsModal() {
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-file-contract"></i> Terms of Service</h2>
            <button class="close-modal" onclick="closeCustomModal()">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px; max-height: 60vh; overflow-y: auto;">
            <p><strong>Last Updated: 04/04/2026</strong></p>
            <p>Welcome to JLF Fireworks. By accessing or using this website, you agree to these Terms of Service.</p>
            <br>
            <p><strong>1. ELIGIBILITY</strong><br>You must be at least 18 years old to use this website.</p>
            <br>
            <p><strong>2. ACCOUNT RESPONSIBILITY</strong><br>You are responsible for your account activity.</p>
            <br>
            <p><strong>3. PRODUCTS AND SERVICES</strong><br>All products are subject to availability.</p>
            <br>
            <p><strong>4. FIREWORKS SAFETY</strong><br>Follow all safety instructions. JLF is not liable for misuse.</p>
            <br>
            <p><strong>5. ORDERS AND PAYMENTS</strong><br>Orders require sufficient credit balance.</p>
            <br>
            <p><strong>6. NO REFUND POLICY</strong><br>All sales are final. No returns or exchanges.</p>
            <br>
            <p><strong>7. CONTACT</strong><br>For support, contact: jessrell1010@gmail.com</p>
        </div>
        <div class="modal-footer" style="padding: 16px; text-align: center;">
            <button class="btn-primary-apple" onclick="closeCustomModal()">Close</button>
        </div>
    `;
    showCustomModal(modalContent);
}

function openPrivacyModal() {
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-shield-alt"></i> Privacy Policy</h2>
            <button class="close-modal" onclick="closeCustomModal()">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px; max-height: 60vh; overflow-y: auto;">
            <p><strong>Last Updated: 04/04/2026</strong></p>
            <p>JLF Fireworks respects your privacy.</p>
            <br>
            <p><strong>1. INFORMATION WE COLLECT</strong><br>Full name, phone number, transaction records.</p>
            <br>
            <p><strong>2. HOW WE USE IT</strong><br>To manage your account, process orders, and provide support.</p>
            <br>
            <p><strong>3. DATA SHARING</strong><br>We do not sell or share your data with third parties.</p>
            <br>
            <p><strong>4. CONTACT</strong><br>For privacy concerns: jessrell1010@gmail.com</p>
        </div>
        <div class="modal-footer" style="padding: 16px; text-align: center;">
            <button class="btn-primary-apple" onclick="closeCustomModal()">Close</button>
        </div>
    `;
    showCustomModal(modalContent);
}

function showCustomModal(content) {
    const existingModal = document.getElementById('customModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalDiv = document.createElement('div');
    modalDiv.id = 'customModal';
    modalDiv.className = 'modal show';
    modalDiv.innerHTML = `<div class="modal-content" style="max-width: 600px;">${content}</div>`;
    document.body.appendChild(modalDiv);
    
    modalDiv.addEventListener('click', (e) => {
        if (e.target === modalDiv) {
            closeCustomModal();
        }
    });
}

function shareApp() {
  if (navigator.share) {
    navigator.share({
      title: 'JLF Fireworks',
      text: 'Check out JLF Fireworks - Premium Pyrotechnics!',
      url: window.location.href,
    }).catch(() => {});
  } else {
    showToast("Copy this link to share: " + window.location.href, 3000);
  }
}

function closeCustomModal() {
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.remove();
    }
}