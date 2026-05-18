// ========================================
// BUG REPORT SYSTEM
// ========================================

// Open Bug Report Modal
function openBugReportModal() {
    if (!currentUser) {
        showToast("Please login to report a bug", 1500);
        openAccountModal();
        return;
    }
    
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-bug"></i> Report a Bug</h2>
            <button class="close-modal" onclick="closeBugReportModal()">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px;">
            <div class="form-group">
                <label>Date</label>
                <input type="text" id="bugDate" value="${new Date().toLocaleDateString()}" readonly style="background: #f5f5f7;">
            </div>
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="bugFullName" value="${escapeHtml(currentUser.name)}" readonly style="background: #f5f5f7;">
            </div>
            <div class="form-group">
                <label>Account ID</label>
                <input type="text" id="bugAccountId" value="${currentUser.id}" readonly style="background: #f5f5f7;">
            </div>
            <div class="form-group">
                <label>Phone Number</label>
                <input type="text" id="bugPhone" value="${currentUser.phone}" readonly style="background: #f5f5f7;">
            </div>
            <div class="form-group">
                <label>Bug Description / Complaint</label>
                <textarea id="bugDescription" rows="5" placeholder="Please describe the bug or issue you encountered..." style="width: 100%; padding: 12px; border: 1px solid #e9e9ef; border-radius: 12px; font-family: inherit;"></textarea>
            </div>
        </div>
        <div class="modal-footer" style="padding: 16px; border-top: 1px solid #e9e9ef; display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn-secondary-apple" onclick="closeBugReportModal()">Cancel</button>
            <button class="btn-primary-apple" id="submitBugBtn">Submit Report</button>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('bugReportModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalDiv = document.createElement('div');
    modalDiv.id = 'bugReportModal';
    modalDiv.className = 'modal show';
    modalDiv.innerHTML = `<div class="modal-content" style="max-width: 500px;">${modalContent}</div>`;
    document.body.appendChild(modalDiv);
    
    // Close when clicking outside
    modalDiv.addEventListener('click', (e) => {
        if (e.target === modalDiv) {
            closeBugReportModal();
        }
    });
    
    // Submit button handler
    document.getElementById('submitBugBtn')?.addEventListener('click', submitBugReport);
}

// Close Bug Report Modal
function closeBugReportModal() {
    const modal = document.getElementById('bugReportModal');
    if (modal) {
        modal.remove();
    }
}

// Submit Bug Report to Google Sheets
async function submitBugReport() {
    const description = document.getElementById('bugDescription')?.value.trim();
    
    if (!description) {
        showToast("Please describe the bug", 1500);
        return;
    }
    
    const submitBtn = document.getElementById('submitBugBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        const formData = new URLSearchParams();
        formData.append("action", "addBugReport");
        formData.append("timestamp", new Date().toISOString());
        formData.append("date", new Date().toLocaleDateString());
        formData.append("accountId", currentUser.id);
        formData.append("fullName", currentUser.name);
        formData.append("phone", currentUser.phone);
        formData.append("bugReport", description);
        formData.append("status", "pending");
        formData.append("deviceInfo", navigator.userAgent);
        
        const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
        const result = await response.json();
        
        if (result.success) {
            showToast("✅ Bug report submitted! Thank you for helping us improve.", 3000);
            closeBugReportModal();
        } else {
            showToast("Failed to submit report. Please try again.", 1500);
        }
    } catch (error) {
        console.error("Bug report error:", error);
        showToast("Error submitting report. Please try again.", 1500);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}