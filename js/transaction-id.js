// ========================================
// TRANSACTION ID GENERATOR
// Formats: JLF-ORDER #XXXXXXXX, JLF-RECHARGE #XXXXXXXX, etc.
// ========================================

// Generate a unique transaction ID
function generateTransactionId(type, timestamp = null) {
    const ts = timestamp ? new Date(timestamp) : new Date();
    const year = ts.getFullYear();
    const month = String(ts.getMonth() + 1).padStart(2, '0');
    const day = String(ts.getDate()).padStart(2, '0');
    const hours = String(ts.getHours()).padStart(2, '0');
    const minutes = String(ts.getMinutes()).padStart(2, '0');
    const seconds = String(ts.getSeconds()).padStart(2, '0');
    
    // Generate random 6-digit number
    const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    // Generate sequential counter from timestamp
    const sequential = `${year}${month}${day}${hours}${minutes}${seconds}`;
    
    let prefix = '';
    let separator = '#';
    
    switch(type) {
        case 'order':
            prefix = 'JLF-ORDER';
            break;
        case 'withdrawal':
            prefix = 'JLF-WITHDRAW';
            break;
        case 'recharge':
            prefix = 'JLF-RECHARGE';
            break;
        case 'investment':
            prefix = 'JLF-INVESTMENT';
            break;
        case 'redemption':
            prefix = 'JLF-REDEEM';
            break;
        default:
            prefix = 'JLF-TXN';
    }
    
    // Format: JLF-ORDER #YYYYMMDDHHMMSS + random
    return `${prefix}${separator}${sequential}${randomNum.slice(0, 2)}`;
}

// Generate a shorter transaction ID (for display)
function generateShortTransactionId(type, timestamp = null) {
    const ts = timestamp ? new Date(timestamp) : new Date();
    const dateStr = ts.getFullYear().toString().slice(-2) + 
                    String(ts.getMonth() + 1).padStart(2, '0') +
                    String(ts.getDate()).padStart(2, '0');
    const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    let prefix = '';
    switch(type) {
        case 'order':
            prefix = 'ORD';
            break;
        case 'withdrawal':
            prefix = 'WDL';
            break;
        case 'recharge':
            prefix = 'RCH';
            break;
        case 'investment':
            prefix = 'INV';
            break;
        default:
            prefix = 'TXN';
    }
    
    return `JLF-${prefix}-${dateStr}${randomSuffix}`;
}

// Copy transaction ID to clipboard
async function copyTransactionId(transactionId, buttonElement) {
    if (!transactionId) {
        showToast("No transaction ID to copy", 1500);
        return;
    }
    
    const originalHtml = buttonElement ? buttonElement.innerHTML : '';
    
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(transactionId);
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = transactionId;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        
        if (buttonElement) {
            buttonElement.innerHTML = '<i class="fas fa-check"></i> <span>Copied!</span>';
            buttonElement.classList.add('copied');
            setTimeout(() => {
                buttonElement.innerHTML = originalHtml;
                buttonElement.classList.remove('copied');
            }, 2000);
        }
        
        showToast(`✅ Copied: ${transactionId}`, 1500);
        
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(50);
        
    } catch (error) {
        console.error("Copy failed:", error);
        showToast("Copy failed. Please try manually.", 1500);
    }
}

// Format transaction ID for display
function formatTransactionIdForDisplay(transactionId) {
    if (!transactionId) return 'N/A';
    return `<span class="transaction-id"><i class="fas fa-hashtag"></i> ${transactionId}</span>`;
}

// Extract transaction type from ID
function getTransactionTypeFromId(transactionId) {
    if (transactionId.includes('ORDER')) return 'order';
    if (transactionId.includes('WITHDRAW')) return 'withdrawal';
    if (transactionId.includes('RECHARGE')) return 'recharge';
    if (transactionId.includes('INVESTMENT')) return 'investment';
    if (transactionId.includes('REDEEM')) return 'redemption';
    return 'unknown';
}

// Validate transaction ID format
function isValidTransactionId(transactionId) {
    const patterns = [
        /^JLF-ORDER#\d{14,16}$/,
        /^JLF-WITHDRAW#\d{14,16}$/,
        /^JLF-RECHARGE#\d{14,16}$/,
        /^JLF-INVESTMENT#\d{14,16}$/,
        /^JLF-REDEEM#\d{14,16}$/,
        /^JLF-TXN#\d{14,16}$/,
        /^JLF-ORD-\d{10}$/,
        /^JLF-WDL-\d{10}$/,
        /^JLF-RCH-\d{10}$/,
        /^JLF-INV-\d{10}$/
    ];
    
    return patterns.some(pattern => pattern.test(transactionId));
}

// Generate sequential ID for order (used by backend)
function generateSequentialOrderId(orderNumber) {
    const date = new Date();
    const dateStr = date.getFullYear() + 
                    String(date.getMonth() + 1).padStart(2, '0') +
                    String(date.getDate()).padStart(2, '0');
    return `JLF-${dateStr}-${String(orderNumber).padStart(6, '0')}`;
}

// Export functions for use in other files
window.generateTransactionId = generateTransactionId;
window.generateShortTransactionId = generateShortTransactionId;
window.copyTransactionId = copyTransactionId;
window.formatTransactionIdForDisplay = formatTransactionIdForDisplay;
window.getTransactionTypeFromId = getTransactionTypeFromId;
window.isValidTransactionId = isValidTransactionId;
window.generateSequentialOrderId = generateSequentialOrderId;