// ========================================
// ADMIN RECHARGE MANAGEMENT - WITH LOADING INDICATORS
// ========================================

async function loadAdminRecharges() {
    if (!isAdmin) return;
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
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        console.error("Load recharges error:", error);
        container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load recharge requests. <button class="btn-secondary-apple" onclick="loadAdminRecharges()">Try Again</button></div>';
    }
}

let isUpdatingRecharge = false;

async function updateRechargeStatus(timestamp, phone) {
    if (!isAdmin) return;
    if (isUpdatingRecharge) {
        showToast("Please wait, updating...", 1500);
        return;
    }
    
    const select = document.querySelector(`.recharge-status-select[data-timestamp="${timestamp}"][data-phone="${phone}"]`);
    if (!select) return;
    
    const newStatus = select.value;
    const button = select.nextElementSibling;
    const originalText = button.innerHTML;
    
    isUpdatingRecharge = true;
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
            if (navigator.vibrate) navigator.vibrate(50);
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
    } finally {
        isUpdatingRecharge = false;
    }
}