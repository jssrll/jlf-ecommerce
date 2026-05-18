// ========================================
// SHOPPING CART FUNCTIONS
// ========================================

function updateCartBadge() {
  if (isAdmin) return;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById("cartCountBadge");
  if (badge) badge.innerText = totalItems;
  saveCartToLocal();
}

function saveCartToLocal() { 
  if (!isAdmin) localStorage.setItem("nova_cart", JSON.stringify(cart)); 
}

function loadCartFromLocal() {
  if (isAdmin) {
    cart = [];
    return;
  }
  const saved = localStorage.getItem("nova_cart");
  cart = saved ? JSON.parse(saved) : [];
  updateCartBadge();
  renderCartUI();
}

function addToCart(productId) {
  if (!currentUser || isAdmin) {
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
  if (isAdmin) return;
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
  if (isAdmin) return;
  cart = cart.filter(i => i.id !== itemId);
  updateCartBadge();
  saveCartToLocal();
  renderCartUI();
}

function renderCartUI() {
  if (isAdmin) return;
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
// CART DRAWER - FIXED
// ========================================

function openCartDrawer() {
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (!overlay || !drawer) return;
  overlay.classList.add('open');
  drawer.classList.add('open');
  renderCartUI();
  // Update icon state if function exists
  if (typeof updateIconActiveState === 'function') updateIconActiveState();
}

function closeCartDrawer() {
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (!overlay || !drawer) return;
  // Remove classes immediately — no race condition, no setTimeout needed
  overlay.classList.remove('open');
  drawer.classList.remove('open');
  // Update icon state if function exists
  if (typeof updateIconActiveState === 'function') updateIconActiveState();
}

function initCartDrawer() {
  const cartIcon = document.getElementById('cartIconBtn');
  const overlay = document.getElementById('cartOverlay');
  const closeBtn = document.getElementById('closeCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (cartIcon) {
    cartIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      openCartDrawer();
    });
  }

  // Close button: stop propagation so it doesn't bubble to overlay
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeCartDrawer();
    });
  }

  // Overlay click closes the drawer
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      // Only close if clicking the overlay itself, not the drawer inside it
      if (e.target === overlay) {
        closeCartDrawer();
      }
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (checkoutBtn.disabled) return;
      const success = await placeOrder();
      if (success) closeCartDrawer();
    });
  }
}

// ========================================
// PLACE ORDER FUNCTION - FIXED
// ========================================

async function placeOrder() {
  // Check if user is logged in
  if (!currentUser || isAdmin) {
    showToast("Please login to place order", 1500);
    // Use the SHARED pendingCheckout from auth.js (declared in state or auth scope)
    // We set it on window so both auth.js and cart.js share the same reference
    window._pendingCheckout = true;
    closeCartDrawer();
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
  const originalBtnText = checkoutBtn ? checkoutBtn.innerHTML : '';
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  }
  
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
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = originalBtnText;
      }
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
      
      window._pendingCheckout = false;
      showToast(`✅ Order placed successfully! Total: ₱${total}. Remaining balance: ₱${currentUser.balance}`, 3000);
      if (typeof updateAllBalanceDisplays === 'function') updateAllBalanceDisplays();
      
      return true;
    } else {
      // Refund on order failure
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
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = originalBtnText;
    }
  }
}

// Auto-retry checkout after login if pending
// Uses window._pendingCheckout so auth.js and cart.js share the same flag
function checkPendingCheckout() {
  if (window._pendingCheckout && currentUser && !isAdmin && cart.length > 0) {
    window._pendingCheckout = false;
    setTimeout(() => {
      openCartDrawer();
      setTimeout(() => {
        placeOrder();
      }, 200);
    }, 300);
  }
}