// ========================================
// ADMIN WITHDRAWAL MANAGEMENT
// ========================================

async function loadAdminWithdrawals() {
  if (!isAdmin) return;
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
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load withdrawal requests. <button class="btn-secondary-apple" onclick="loadAdminWithdrawals()">Try Again</button></div>';
  }
}

async function updateWithdrawalStatus(timestamp, phone) {
  if (!isAdmin) return;
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