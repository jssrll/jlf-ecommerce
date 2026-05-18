// ========================================
// VIRTUAL SCROLLING FOR TRANSACTION HISTORY
// Prevents lag with 100+ transactions
// ========================================

class VirtualScroll {
    constructor(container, items, renderItem, options = {}) {
        this.container = container;
        this.items = items;
        this.renderItem = renderItem;
        this.itemHeight = options.itemHeight || 120;
        this.bufferSize = options.bufferSize || 5;
        this.scrollContainer = null;
        this.totalHeight = 0;
        this.startIndex = 0;
        this.endIndex = 0;
        this.visibleItems = [];
        
        this.init();
    }
    
    init() {
        // Create scroll container
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.className = 'virtual-scroll-container';
        this.scrollContainer.style.position = 'relative';
        this.scrollContainer.style.height = '100%';
        this.scrollContainer.style.overflowY = 'auto';
        this.scrollContainer.style.maxHeight = '600px';
        
        // Create spacer for total height
        this.spacer = document.createElement('div');
        this.spacer.style.position = 'relative';
        this.spacer.style.width = '100%';
        
        // Create viewport for visible items
        this.viewport = document.createElement('div');
        this.viewport.style.position = 'absolute';
        this.viewport.style.top = '0';
        this.viewport.style.left = '0';
        this.viewport.style.right = '0';
        
        this.spacer.appendChild(this.viewport);
        this.scrollContainer.appendChild(this.spacer);
        
        // Clear container and add scroll container
        this.container.innerHTML = '';
        this.container.appendChild(this.scrollContainer);
        
        // Calculate total height
        this.totalHeight = this.items.length * this.itemHeight;
        this.spacer.style.height = this.totalHeight + 'px';
        
        // Bind scroll event
        this.scrollContainer.addEventListener('scroll', () => this.onScroll());
        
        // Initial render
        this.onScroll();
        
        // Add resize observer
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => this.onScroll());
            resizeObserver.observe(this.scrollContainer);
        }
    }
    
    onScroll() {
        const scrollTop = this.scrollContainer.scrollTop;
        const containerHeight = this.scrollContainer.clientHeight;
        
        // Calculate which items should be visible
        const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.bufferSize);
        const endIndex = Math.min(
            this.items.length,
            Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.bufferSize
        );
        
        if (this.startIndex === startIndex && this.endIndex === endIndex) return;
        
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        
        this.render();
    }
    
    render() {
        const visibleItems = this.items.slice(this.startIndex, this.endIndex);
        const topPadding = this.startIndex * this.itemHeight;
        
        // Render visible items
        const itemsHtml = visibleItems.map((item, idx) => {
            const actualIndex = this.startIndex + idx;
            return this.renderItem(item, actualIndex);
        }).join('');
        
        this.viewport.innerHTML = itemsHtml;
        this.viewport.style.transform = `translateY(${topPadding}px)`;
        
        // Add loading indicator if needed
        if (this.items.length > 50 && this.startIndex === 0) {
            this.showLoader(false);
        }
    }
    
    showLoader(show) {
        let loader = this.container.querySelector('.virtual-scroll-loader');
        if (show && !loader) {
            loader = document.createElement('div');
            loader.className = 'virtual-scroll-loader';
            loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading more transactions...';
            this.scrollContainer.appendChild(loader);
        } else if (!show && loader) {
            loader.remove();
        }
    }
    
    updateItems(newItems) {
        this.items = newItems;
        this.totalHeight = this.items.length * this.itemHeight;
        this.spacer.style.height = this.totalHeight + 'px';
        this.startIndex = 0;
        this.endIndex = 0;
        this.onScroll();
    }
    
    destroy() {
        this.scrollContainer.removeEventListener('scroll', () => this.onScroll());
        this.container.innerHTML = '';
    }
}

// Initialize virtual scroll for transactions
let currentVirtualScroll = null;

function initVirtualScrollForTransactions(transactions) {
    const container = document.getElementById('transactionsList');
    if (!container) return;
    
    // Destroy existing virtual scroll
    if (currentVirtualScroll) {
        currentVirtualScroll.destroy();
    }
    
    if (transactions.length <= 20) {
        // No need for virtual scroll for small lists
        container.innerHTML = transactions.map(t => renderTransactionCardForVirtual(t)).join('');
        return;
    }
    
    // Create virtual scroll
    currentVirtualScroll = new VirtualScroll(
        container,
        transactions,
        (item, index) => renderTransactionCardForVirtual(item, index),
        { itemHeight: 130, bufferSize: 5 }
    );
}

// Render transaction card for virtual scroll
function renderTransactionCardForVirtual(t, index) {
    let amountClass = t.amount.toString().startsWith('+') ? 'amount-positive' : (t.amount.toString().startsWith('-') ? 'amount-negative' : '');
    
    // Add Order Again button for completed orders
    let orderAgainHtml = '';
    if (t.type === 'order' && t.status === 'Completed' && t.orderList) {
        const orderListEscaped = (t.orderList || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        orderAgainHtml = `
            <button class="order-again-btn" onclick="orderAgainFromHistory('${orderListEscaped}', ${t.rawAmount || 0})">
                <i class="fas fa-redo-alt"></i> Order Again
            </button>
        `;
    }
    
    return `
        <div class="transaction-card" data-type="${t.type}" data-index="${index}">
            <div class="transaction-icon" style="background: ${t.typeColor}20; color: ${t.typeColor};">
                ${t.typeIcon}
            </div>
            <div class="transaction-details">
                <div class="transaction-header">
                    <span class="transaction-type">${t.typeLabel}</span>
                    <span class="transaction-date">${t.date}</span>
                </div>
                <div class="transaction-title">
                    <span class="transaction-id-badge" onclick="copyTransactionId('${t.transactionId}', this)" style="cursor: pointer;">
                        <i class="fas fa-copy"></i>
                        <span style="font-family: monospace; font-size: 0.7rem;">${t.transactionId}</span>
                    </span>
                </div>
                ${t.details ? `<div class="transaction-info">${escapeHtml(t.details.substring(0, 100))}${t.details.length > 100 ? '...' : ''}</div>` : ''}
                <div class="transaction-footer">
                    <span class="transaction-amount ${amountClass}">${t.amount}</span>
                    <span class="transaction-status ${t.statusClass}">${t.status || 'Pending'}</span>
                    ${orderAgainHtml}
                </div>
            </div>
        </div>
    `;
}

// Export for use
window.VirtualScroll = VirtualScroll;
window.initVirtualScrollForTransactions = initVirtualScrollForTransactions;