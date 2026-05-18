// ========================================
// CART FUNCTIONS - WITH LOADING INDICATORS
// ========================================

let isCheckingOut = false;

function addToCart(productId) {
    if (!currentUser || isAdmin) {
        showToast("Please login to add items", 1500);
        openAccountModal();
        return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image || '🎆',
            category: product.category
        });
    }
    
    updateCartBadge();
    saveCartToLocal();
    renderCartUI();
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
    
    showToast(`✅ ${product.name} added to cart!`, 1500);
}

function updateCartBadge() {
    const badge = document.getElementById("cartCountBadge");
    if (!badge) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.innerText = totalItems;
    badge.style.display = totalItems > 0 ? "flex" : "none";
}

function saveCartToLocal() {
    localStorage.setItem("nova_cart", JSON.stringify(cart));
}

function loadCartFromLocal() {
    const savedCart = localStorage.getItem("nova_cart");
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartBadge();
    }
}

function renderCartUI() {
    const container = document.getElementById("cartItemsList");
    const totalSpan = document.getElementById("cartTotalPrice");
    
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart-msg"><i class="fas fa-shopping-cart"></i><p>Your cart is empty. Add some fireworks!</p></div>';
        if (totalSpan) totalSpan.innerText = "₱0.00";
        return;
    }
    
    let total = 0;
    let itemsHtml = '';
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        itemsHtml += `
            <div class="cart-item" data-index="${index}">
                <div class="cart-item-img">
                    <img src="https://ik.imagekit.io/0sf7uub8b/SAMURAI-FWORKS/Screenshot%202026-01-20%20124812.png?updatedAt=1768884573239" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">₱${item.price.toFixed(2)}</div>
                    <div class="cart-item-qty">
                        <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                        <button class="remove-item" onclick="removeFromCart(${index})"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = itemsHtml;
    if (totalSpan) totalSpan.innerText = `₱${total.toFixed(2)}`;
}

function updateQuantity(index, delta) {
    if (cart[index]) {
        const newQty = cart[index].quantity + delta;
        if (newQty <= 0) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = newQty;
        }
        updateCartBadge();
        saveCartToLocal();
        renderCartUI();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartBadge();
    saveCartToLocal();
    renderCartUI();
    showToast("Item removed from cart", 1000);
}

function openCartDrawer() {
    renderCartUI();
    document.getElementById("cartDrawer").classList.add("open");
    document.getElementById("cartOverlay").classList.add("open");
}

// Updated checkout with loading indicator
async function placeOrder() {
    if (isCheckingOut) {
        showToast("Please wait, processing your order...", 1500);
        return;
    }
    
    if (!currentUser || isAdmin) {
        showToast("Please login to checkout", 1500);
        openAccountModal();
        return;
    }
    
    if (cart.length === 0) {
        showToast("Your cart is empty", 1500);
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (total > (currentUser.balance || 0)) {
        showToast(`❌ Insufficient balance! Need ₱${total.toLocaleString()}. Current balance: ₱${(currentUser.balance || 0).toLocaleString()}`, 3000);
        return;
    }
    
    isCheckingOut = true;
    const checkoutBtn = document.querySelector('.checkout-btn');
    const originalBtnText = checkoutBtn ? checkoutBtn.innerHTML : 'Checkout';
    
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Order...';
    }
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
    
    try {
        const orderList = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
        
        const balanceResult = await fetch(GOOGLE_SHEETS_URL, {
            method: "POST",
            body: new URLSearchParams({
                action: "updateBalance",
                phone: currentUser.phone,
                amount: total,
                operation: "deduct"
            })
        });
        const balanceData = await balanceResult.json();
        
        if (!balanceData.success) {
            showToast(balanceData.message || "Insufficient balance", 2000);
            if (checkoutBtn) {
                checkoutBtn.disabled = false;
                checkoutBtn.innerHTML = originalBtnText;
            }
            isCheckingOut = false;
            return;
        }
        
        const orderResult = await fetch(GOOGLE_SHEETS_URL, {
            method: "POST",
            body: new URLSearchParams({
                action: "addOrder",
                timestamp: new Date().toISOString(),
                fullName: currentUser.name,
                accountId: currentUser.id,
                phone: currentUser.phone,
                orderList: orderList,
                totalPrice: total,
                status: "Pending"
            })
        });
        const orderData = await orderResult.json();
        
        if (orderData.success) {
            currentUser.balance = balanceData.newBalance;
            localStorage.setItem("nova_user", JSON.stringify(currentUser));
            updateAllBalanceDisplays();
            
            cart = [];
            saveCartToLocal();
            updateCartBadge();
            renderCartUI();
            closeCartDrawer();
            
            const transactionId = generateTransactionId('order', new Date().toISOString());
            showToast(`✅ Order placed! ${transactionId}`, 3000);
            
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            
            if (typeof loadTransactionHistory === 'function') {
                setTimeout(() => loadTransactionHistory(), 500);
            }
        } else {
            await fetch(GOOGLE_SHEETS_URL, {
                method: "POST",
                body: new URLSearchParams({
                    action: "updateBalance",
                    phone: currentUser.phone,
                    amount: total,
                    operation: "add"
                })
            });
            showToast("Order failed. Please try again.", 2000);
        }
    } catch (error) {
        console.error("Checkout error:", error);
        showToast("Checkout failed. Please try again.", 2000);
    } finally {
        isCheckingOut = false;
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = originalBtnText;
        }
    }
}

// Export for global use
window.placeOrder = placeOrder;
window.checkout = placeOrder;