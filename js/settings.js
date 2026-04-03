// ========================================
// SETTINGS SYSTEM
// ========================================

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem("jlf_settings");
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Apply Font Size
        if (settings.fontSize) {
            applyFontSize(settings.fontSize);
        }
        
        // Apply Compact Mode
        if (settings.compactMode) {
            document.body.classList.add('compact');
        } else {
            document.body.classList.remove('compact');
        }
        
        // Apply High Contrast
        if (settings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        
        return settings;
    }
    
    // Default settings
    return {
        fontSize: 'medium',
        compactMode: false,
        highContrast: false
    };
}

// Save settings to localStorage
function saveSettings(settings) {
    localStorage.setItem("jlf_settings", JSON.stringify(settings));
}

// Apply font size to document
function applyFontSize(size) {
    const sizes = {
        small: '13px',
        medium: '16px',
        large: '19px'
    };
    document.documentElement.style.fontSize = sizes[size] || '16px';
}

// Change Font Size
function changeFontSize(size) {
    const settings = loadSettings();
    settings.fontSize = size;
    applyFontSize(size);
    saveSettings(settings);
    
    // Update select UI
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    if (fontSizeSelect) {
        fontSizeSelect.value = size;
    }
    
    showToast(`Font size changed to ${size}`, 1500);
}

// Toggle Compact Mode
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

// Toggle High Contrast
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

// Render Settings Page
function renderSettingsPage() {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) {
        console.error("mainContent element not found!");
        return;
    }
    
    const settings = loadSettings();
    
    mainContent.innerHTML = `
        <div class="settings-container">
            <div class="page-hero">
                <h1><i class="fas fa-sliders-h"></i> Settings</h1>
                <p>Customize your JLF Fireworks experience</p>
            </div>
            
            <!-- Appearance Section -->
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
            
            <!-- About & Support Section -->
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
    
    // Attach event listeners
    document.getElementById('fontSizeSelect')?.addEventListener('change', (e) => changeFontSize(e.target.value));
    document.getElementById('compactModeToggle')?.addEventListener('change', toggleCompactMode);
    document.getElementById('highContrastToggle')?.addEventListener('change', toggleHighContrast);
    document.getElementById('viewTermsBtn')?.addEventListener('click', () => openTermsModal());
    document.getElementById('viewPrivacyBtn')?.addEventListener('click', () => openPrivacyModal());
    document.getElementById('contactDevBtn')?.addEventListener('click', () => window.location.href = "mailto:jessrell1010@gmail.com");
    document.getElementById('faqBtn')?.addEventListener('click', () => switchPage('help'));
    document.getElementById('reportBugBtn')?.addEventListener('click', openBugReportModal);
}

// Open Terms of Service Modal
function openTermsModal() {
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-file-contract"></i> Terms of Service</h2>
            <button class="close-modal" onclick="closeCustomModal()">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px; max-height: 60vh; overflow-y: auto;">
            <p><strong>Last Updated: 04/04/2026</strong></p>
            <p>Welcome to JLF Fireworks. By accessing or using this website, you agree to these Terms of Service. If you do not agree, do not use the site.</p>
            <br>
            <p><strong>1. ELIGIBILITY</strong><br>You must be at least 18 years old to use this website. By using the site, you confirm that you meet this requirement.</p>
            <br>
            <p><strong>2. ACCOUNT RESPONSIBILITY</strong><br>You are responsible for your account. You agree to provide accurate information, keep your password secure, and not share your account with others. Any activity under your account is your responsibility.</p>
            <br>
            <p><strong>3. PRODUCTS AND SERVICES</strong><br>JLF Fireworks sells pyrotechnic products and offers online ordering, credit balance system, code redemption, and bond investment options. All products are subject to availability.</p>
            <br>
            <p><strong>4. FIREWORKS SAFETY</strong><br>Fireworks are hazardous. By purchasing, you agree to follow all safety instructions, comply with local laws, and not misuse products. JLF Fireworks is not liable for injuries, damages, or misuse.</p>
            <br>
            <p><strong>5. ORDERS AND PAYMENTS</strong><br>Orders require sufficient credit balance. Payments include GCash and Cash. Recharge and withdrawal requests require admin approval.</p>
            <br>
            <p><strong>6. NO REFUND POLICY</strong><br>All sales are final. No returns or exchanges once products leave the store.</p>
            <br>
            <p><strong>7. CREDIT SYSTEM</strong><br>Credits are used for purchases and services. Credits have no cash value unless withdrawn. Fraud or abuse leads to account suspension.</p>
            <br>
            <p><strong>8. BOND INVESTMENT</strong><br>The platform offers fixed-return bond options. Returns are fixed based on selected plan. Funds are locked for the chosen duration. Early withdrawal is not allowed.</p>
            <br>
            <p><strong>9. WITHDRAWALS</strong><br>Withdrawals require correct user input. You are responsible for accurate GCash details and recipient information.</p>
            <br>
            <p><strong>10. PROHIBITED USE</strong><br>You agree not to use the site for illegal activities, attempt to hack or disrupt the system, or abuse promotions. Violations result in account termination.</p>
            <br>
            <p><strong>11. ADMIN RIGHTS</strong><br>JLF Fireworks reserves the right to approve or reject transactions, suspend or terminate accounts, and modify system features.</p>
            <br>
            <p><strong>12. PRIVACY</strong><br>Your data is stored securely. We do not sell your personal information. By using the site, you agree to data processing for service operation.</p>
            <br>
            <p><strong>13. LIMITATION OF LIABILITY</strong><br>JLF Fireworks is not liable for loss of funds due to user error, system downtime, or damages from product misuse. Use the platform at your own risk.</p>
            <br>
            <p><strong>14. CHANGES TO TERMS</strong><br>We can update these terms at any time. Continued use means you accept the changes.</p>
            <br>
            <p><strong>15. CONTACT</strong><br>For support, contact: jessrell1010@gmail.com</p>
            <br>
            <p>By using this website, you confirm that you have read and agree to these Terms of Service.</p>
        </div>
        <div class="modal-footer" style="padding: 16px; border-top: 1px solid #e9e9ef; text-align: center;">
            <button class="btn-primary-apple" onclick="closeCustomModal()">Close</button>
        </div>
    `;
    
    showCustomModal(modalContent);
}

// Open Privacy Policy Modal
function openPrivacyModal() {
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-shield-alt"></i> Privacy Policy</h2>
            <button class="close-modal" onclick="closeCustomModal()">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px; max-height: 60vh; overflow-y: auto;">
            <p><strong>Last Updated: 04/04/2026</strong></p>
            <p>JLF Fireworks respects your privacy. This policy explains how your data is collected, used, and protected.</p>
            <br>
            <p><strong>1. INFORMATION WE COLLECT</strong><br>We collect full name, phone number, login details, transaction records, and investment activity.</p>
            <br>
            <p><strong>2. HOW WE USE YOUR INFORMATION</strong><br>Your data is used to create and manage your account, process orders and payments, approve recharges and withdrawals, track investments, provide customer support, and improve system performance.</p>
            <br>
            <p><strong>3. DATA STORAGE</strong><br>Your data is stored securely in our system with security measures to prevent unauthorized access.</p>
            <br>
            <p><strong>4. DATA SHARING</strong><br>We do not sell or share your personal data with third parties.</p>
            <br>
            <p><strong>5. ACCOUNT SECURITY</strong><br>You are responsible for your account security. Keep your password private.</p>
            <br>
            <p><strong>6. COOKIES AND TRACKING</strong><br>We may use browser storage or cookies to keep you logged in, save preferences, and improve user experience.</p>
            <br>
            <p><strong>7. TRANSACTIONS AND PAYMENTS</strong><br>Payment details such as GCash reference numbers are collected to verify transactions. We do not store sensitive financial credentials.</p>
            <br>
            <p><strong>8. DATA RETENTION</strong><br>We keep your data while your account is active. We may retain records for legal or security reasons.</p>
            <br>
            <p><strong>9. YOUR RIGHTS</strong><br>You have the right to access your data and request corrections. Contact support to process requests.</p>
            <br>
            <p><strong>10. CHILDREN'S PRIVACY</strong><br>This platform is not intended for users under 18 years old. We do not knowingly collect data from minors.</p>
            <br>
            <p><strong>11. SECURITY LIMITATIONS</strong><br>We apply security measures, but no system is fully secure. Use the platform at your own risk.</p>
            <br>
            <p><strong>12. CHANGES TO THIS POLICY</strong><br>We may update this policy at any time. Continued use means you accept the updated policy.</p>
            <br>
            <p><strong>13. CONTACT</strong><br>For privacy concerns, contact: jessrell1010@gmail.com</p>
            <br>
            <p>By using this website, you agree to this Privacy Policy.</p>
        </div>
        <div class="modal-footer" style="padding: 16px; border-top: 1px solid #e9e9ef; text-align: center;">
            <button class="btn-primary-apple" onclick="closeCustomModal()">Close</button>
        </div>
    `;
    
    showCustomModal(modalContent);
}

// Show custom modal
function showCustomModal(content) {
    // Remove existing modal if any
    const existingModal = document.getElementById('customModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalDiv = document.createElement('div');
    modalDiv.id = 'customModal';
    modalDiv.className = 'modal show';
    modalDiv.innerHTML = `<div class="modal-content" style="max-width: 600px;">${content}</div>`;
    document.body.appendChild(modalDiv);
    
    // Close when clicking outside
    modalDiv.addEventListener('click', (e) => {
        if (e.target === modalDiv) {
            closeCustomModal();
        }
    });
}

function closeCustomModal() {
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.remove();
    }
}