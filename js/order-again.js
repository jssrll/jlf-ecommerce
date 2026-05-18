// ========================================
// ORDER AGAIN FUNCTIONALITY
// Re-buy same items from transaction history
// ========================================

async function orderAgain(orderData) {
    if (!currentUser || isAdmin) {
        showToast("Please login to reorder", 1500);
        openAccountModal();
        return;
    }
    
    if (!orderData || !orderData.orderList) {
        showToast("Cannot reorder: Order data missing", 1500);
        return;
    }
    
    // Parse the order list string back to cart items
    let itemsToAdd = [];
    const orderListStr = orderData.orderList;
    
    try {
        // Try to parse as JSON first
        if (orderListStr.startsWith('[')) {
            itemsToAdd = JSON.parse(orderListStr);
        } else {
            // Parse from formatted string (e.g., "Product x1, Product2 x2")
            const parts = orderListStr.split(',');
            for (const part of parts) {
                const match = part.trim().match(/(.+?) x(\d+)$/);
                if (match) {
                    const productName = match[1].trim();
                    const quantity = parseInt(match[2]);
                    
                    // Find product by name
                    const product = products.find(p => p.name === productName);
                    if (product && quantity > 0) {
                        itemsToAdd.push({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: quantity,
                            image: product.image || '🎆'
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error parsing order list:", e);
        showToast("Cannot reorder: Invalid order format", 1500);
        return;
    }
    
    if (itemsToAdd.length === 0) {
        showToast("No items found to reorder", 1500);
        return;
    }
    
    // Add items to cart
    let addedCount = 0;
    for (const item of itemsToAdd) {
        const existingItem = cart.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image || '🎆'
            });
        }
        addedCount += item.quantity;
    }
    
    // Save cart
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof saveCartToLocal === 'function') saveCartToLocal();
    if (typeof renderCartUI === 'function') renderCartUI();
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    
    showToast(`✅ Added ${addedCount} item(s) to cart!`, 2000);
    
    // Open cart drawer to show items
    setTimeout(() => {
        if (typeof openCartDrawer === 'function') openCartDrawer();
        else {
            document.getElementById('cartDrawer')?.classList.add('open');
            document.getElementById('cartOverlay')?.classList.add('open');
        }
    }, 500);
}

// Add order again button to transaction cards
function addOrderAgainButtonToTransaction(transaction, container) {
    if (transaction.type === 'order' && transaction.orderList && transaction.status === 'Completed') {
        const orderAgainHtml = `
            <button class="order-again-btn" onclick='orderAgain(${JSON.stringify({
                orderList: transaction.orderList,
                totalPrice: transaction.amount
            })})'>
                <i class="fas fa-redo-alt"></i> Order Again
            </button>
        `;
        return orderAgainHtml;
    }
    return '';
}