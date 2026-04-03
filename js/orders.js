// ========================================
// ORDERS FUNCTIONS
// ========================================

async function loadUserOrders() {
  if (!currentUser || isAdmin) return;
  
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