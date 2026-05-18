// ============================================
// JLF FIREWORKS - INVESTMENT MODULE
// Readable, unminified version
// ============================================

// Investment configuration
const INVESTMENT_CONFIG = {
    returnRate: 0.05,      // 5% return
    durationDays: 180,     // 6 months
    minAmount: 500,
    name: 'Investment Option'
};

// Initialize investments from localStorage
function loadInvestments() {
    const investments = loadFromLocalStorage('jlf_investments', []);
    AppState.investments = investments;
    return investments;
}

// Save investments to localStorage
function saveInvestments(investments) {
    saveToLocalStorage('jlf_investments', investments);
    AppState.investments = investments;
}

// Invest in investment option
async function investInInvestmentOption() {
    // Check if user is logged in
    if (!isLoggedIn()) {
        showToast('Please login first to invest');
        openAccountModal();
        return;
    }
    
    const amountInput = document.getElementById('investmentAmount');
    const amount = parseFloat(amountInput?.value);
    
    // Validation
    if (!amount || amount < INVESTMENT_CONFIG.minAmount) {
        showToast(`Minimum investment amount is ₱${INVESTMENT_CONFIG.minAmount}`);
        return;
    }
    
    const currentUser = getCurrentUser();
    const userBalance = currentUser.creditBalance || 0;
    
    if (amount > userBalance) {
        showToast(`Insufficient balance. Your current balance is ${formatCurrency(userBalance)}`);
        return;
    }
    
    // Calculate returns
    const returnAmount = amount * INVESTMENT_CONFIG.returnRate;
    const totalReturn = amount + returnAmount;
    const maturityDate = new Date();
    maturityDate.setDate(maturityDate.getDate() + INVESTMENT_CONFIG.durationDays);
    
    // Create investment record
    const investment = {
        id: generateId(),
        userId: currentUser.accountId,
        userName: currentUser.fullName,
        amount: amount,
        returnRate: INVESTMENT_CONFIG.returnRate,
        returnAmount: returnAmount,
        totalReturn: totalReturn,
        startDate: new Date().toISOString(),
        maturityDate: maturityDate.toISOString(),
        durationDays: INVESTMENT_CONFIG.durationDays,
        status: 'active', // active, matured, withdrawn
        createdAt: new Date().toISOString()
    };
    
    // Confirm investment
    const confirmMsg = `Confirm Investment:
    
Amount: ${formatCurrency(amount)}
Return Rate: ${INVESTMENT_CONFIG.returnRate * 100}%
Return Amount: ${formatCurrency(returnAmount)}
Total Return: ${formatCurrency(totalReturn)}
Duration: ${INVESTMENT_CONFIG.durationDays} days
Maturity Date: ${maturityDate.toLocaleDateString()}

Investment will be deducted from your balance now.
Returns will be credited at maturity.

Proceed?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // Disable button and show loading
    const button = event?.target;
    const originalText = button?.innerHTML;
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    try {
        // Deduct amount from user balance
        const users = loadFromLocalStorage('jlf_users', []);
        const userIndex = users.findIndex(u => u.accountId === currentUser.accountId);
        
        if (userIndex !== -1) {
            users[userIndex].creditBalance = (users[userIndex].creditBalance || 0) - amount;
            saveToLocalStorage('jlf_users', users);
            
            // Update current user
            const updatedUser = users[userIndex];
            localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
            AppState.currentUser = updatedUser;
            
            // Save investment
            const investments = loadInvestments();
            investments.push(investment);
            saveInvestments(investments);
            
            // Add transaction record
            addTransaction({
                type: 'investment',
                action: 'invest',
                amount: amount,
                returnRate: INVESTMENT_CONFIG.returnRate,
                maturityDate: investment.maturityDate,
                investmentId: investment.id,
                date: new Date().toISOString()
            });
            
            showToast(`Investment successful! ₱${amount.toFixed(2)} invested.`, 3000);
            
            // Clear input
            if (amountInput) amountInput.value = '';
            
            // Update UI
            updateUserDisplay();
            if (typeof updateProfileModal === 'function') updateProfileModal();
            
            // Refresh orders page if open
            if (document.getElementById('ordersPage')?.classList.contains('active')) {
                if (typeof loadOrders === 'function') loadOrders();
            }
        }
    } catch (error) {
        console.error('Investment error:', error);
        showToast('Investment failed. Please try again.');
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText || 'Invest Now';
        }
    }
}

// Check for matured investments and process returns
function checkMaturedInvestments() {
    const investments = loadInvestments();
    const users = loadFromLocalStorage('jlf_users', []);
    let hasUpdates = false;
    const now = new Date();
    
    for (const investment of investments) {
        if (investment.status === 'active') {
            const maturityDate = new Date(investment.maturityDate);
            if (maturityDate <= now) {
                // Investment has matured - add returns to user balance
                const userIndex = users.findIndex(u => u.accountId === investment.userId);
                if (userIndex !== -1) {
                    users[userIndex].creditBalance = (users[userIndex].creditBalance || 0) + investment.totalReturn;
                    investment.status = 'matured';
                    investment.maturedDate = now.toISOString();
                    hasUpdates = true;
                    
                    // Add transaction record for returns
                    addTransaction({
                        type: 'investment',
                        action: 'matured',
                        amount: investment.totalReturn,
                        investmentId: investment.id,
                        originalAmount: investment.amount,
                        returnAmount: investment.returnAmount,
                        date: now.toISOString()
                    });
                }
            }
        }
    }
    
    if (hasUpdates) {
        saveToLocalStorage('jlf_users', users);
        saveInvestments(investments);
        
        // Update current user if logged in
        const currentUser = getCurrentUser();
        if (currentUser) {
            const updatedUser = users.find(u => u.accountId === currentUser.accountId);
            if (updatedUser) {
                localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
                updateUserDisplay();
            }
        }
        
        showToast('You have matured investments! Returns have been added to your balance.', 5000);
    }
}

// Get user's active investments
function getUserActiveInvestments(userId) {
    const investments = loadInvestments();
    return investments.filter(i => i.userId === userId && i.status === 'active');
}

// Get user's investment history
function getUserInvestmentHistory(userId) {
    const investments = loadInvestments();
    return investments.filter(i => i.userId === userId).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
}

// Add transaction helper
function addTransaction(transaction) {
    const transactions = loadFromLocalStorage('jlf_transactions', []);
    transactions.unshift({
        ...transaction,
        id: generateId(),
        timestamp: new Date().toISOString()
    });
    saveToLocalStorage('jlf_transactions', transactions);
}

// Run maturity check on page load
setTimeout(() => {
    checkMaturedInvestments();
}, 1000);

// Run maturity check every hour
setInterval(() => {
    checkMaturedInvestments();
}, 3600000);