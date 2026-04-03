// ========================================
// ADMIN BUG REPORTS MANAGEMENT
// ========================================

// Load bug reports for admin
async function loadAdminBugReports() {
    if (!isAdmin) return;
    
    const container = document.getElementById("adminBugReportsContainer");
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading bug reports...</div>';
    
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAllBugReports`);
        const reports = await response.json();
        
        if (!reports || reports.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px;">No bug reports found.</div>';
            return;
        }
        
        let html = '<table class="admin-table"><thead><tr><th>Date</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Bug Report</th><th>Status</th><th>Action</th></tr></thead><tbody>';
        
        reports.forEach(report => {
            let statusClass = '';
            switch(report.status?.toLowerCase()) {
                case 'pending': statusClass = 'status-pending'; break;
                case 'reviewed': statusClass = 'status-approved'; break;
                case 'fixed': statusClass = 'status-completed'; break;
                default: statusClass = 'status-pending';
            }
            
            html += `
                <tr data-timestamp="${report.timestamp}">
                    <td style="white-space: nowrap;">${report.date || '-'}</td>
                    <td>${report.accountId || '-'}</td>
                    <td>${report.fullName || '-'}</td>
                    <td>${report.phone || '-'}</td>
                    <td style="max-width: 300px; word-break: break-word;">${escapeHtml(report.bugReport || '-')}</td>
                    <td><span class="status-badge ${statusClass}">${report.status || 'Pending'}</span></td>
                    <td>
                        <select class="bug-status-select" data-timestamp="${report.timestamp}">
                            <option value="pending" ${report.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="reviewed" ${report.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                            <option value="fixed" ${report.status === 'fixed' ? 'selected' : ''}>Fixed</option>
                        </select>
                        <button class="update-bug-status-btn" onclick="updateBugReportStatus('${report.timestamp}')">Update</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error("Load bug reports error:", error);
        container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load bug reports. <button class="btn-secondary-apple" onclick="loadAdminBugReports()">Try Again</button></div>';
    }
}

// Update bug report status
async function updateBugReportStatus(timestamp) {
    if (!isAdmin) return;
    
    const select = document.querySelector(`.bug-status-select[data-timestamp="${timestamp}"]`);
    if (!select) return;
    
    const newStatus = select.value;
    const button = select.nextElementSibling;
    const originalText = button.innerHTML;
    
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        const formData = new URLSearchParams();
        formData.append("action", "updateBugReportStatus");
        formData.append("timestamp", timestamp);
        formData.append("status", newStatus);
        
        const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
        const result = await response.json();
        
        if (result.success) {
            showToast(`Bug report status updated to: ${newStatus}`, 1500);
            await loadAdminBugReports();
        } else {
            showToast(result.message || "Update failed", 1500);
            button.disabled = false;
            button.innerHTML = originalText;
        }
    } catch (error) {
        console.error("Update bug status error:", error);
        showToast("Update failed. Please try again.", 1500);
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Refresh bug reports
function refreshAdminBugReports() {
    if (isAdmin) loadAdminBugReports();
}