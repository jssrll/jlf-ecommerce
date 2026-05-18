// ========================================
// ADMIN ORDER MANAGEMENT
// ========================================

async function loadAdminOrders() {
  if (!isAdmin) return;
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
      html += `<tr><td style="white-space: nowrap;">${new Date(order.timestamp).toLocaleString()}</td><td>${order.accountId || '-'}</td><td>${order.fullName || '-'}</td><td>${order.phone || '-'}</td><td style="max-width: 200px; word-break: break-word;">${order.orderList || '-'}</td><td>₱${parseFloat(order.totalPrice || 0).toLocaleString()}</td><td><span class="status-badge ${statusClass}">${order.status || 'Pending'}</span></td><td><select class="order-status-select" data-timestamp="${order.timestamp}" data-phone="${order.phone}"><option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option><option value="Approved" ${order.status === 'Approved' ? 'selected' : ''}>Approved</option><option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option><option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option></select><button class="update-status-btn" onclick="updateOrderStatus('${order.timestamp}', '${order.phone}')">Update</button></td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load orders. <button class="btn-secondary-apple" onclick="loadAdminOrders()">Try Again</button></div>';
  }
}

async function updateOrderStatus(timestamp, phone) {
  if (!isAdmin) return;
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

function refreshAdminOrders() { if(isAdmin) loadAdminOrders(); }