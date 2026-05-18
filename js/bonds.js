// ========================================
// BOND INVESTMENT FUNCTIONS
// ========================================

function loadInvestments() {
    const saved = localStorage.getItem('jlf_investments');
    if (saved) {
        try {
            investments = JSON.parse(saved);
        } catch(e) { investments = []; }
    } else {
        investments = [];
    }
}

function saveInvestments() {
    localStorage.setItem('jlf_investments', JSON.stringify(investments));
}

function checkMaturedInvestments() {
    const now = new Date();
    let anyMatured = false;
    investments.forEach(inv => {
        if (inv.status === 'Active' && new Date(inv.maturityDate) <= now) {
            inv.status = 'Matured';
            if (typeof addUserCredit === 'function') {
                addUserCredit(inv.expectedReturn);
            }
            if (typeof showToast === 'function') {
                showToast(`🎉 Investment matured! You received ₱${inv.expectedReturn}`, 3000);
            }
            anyMatured = true;
        }
    });
    if (anyMatured) {
        saveInvestments();
        if (typeof loadTransactionHistory === 'function') loadTransactionHistory();
    }
}

async function investInBondOption1() {
    if (!currentUser || isAdmin) {
        if (typeof showToast === 'function') showToast("Please login first", 1500);
        if (typeof openAccountModal === 'function') openAccountModal();
        return;
    }
    
    const amountInput = document.getElementById('investmentAmount');
    const amount = amountInput ? parseFloat(amountInput.value) : 0;
    
    if (isNaN(amount) || amount < 500) {
        if (typeof showToast === 'function') showToast("Minimum investment is ₱500", 1500);
        return;
    }
    
    if (amount > (currentUser.balance || 0)) {
        if (typeof showToast === 'function') showToast("Insufficient balance", 1500);
        return;
    }
    
    const expectedReturn = amount * 0.05;
    const maturityDate = new Date();
    maturityDate.setDate(maturityDate.getDate() + 180);
    
    const btn = event ? event.target : null;
    const originalText = btn ? btn.innerHTML : 'Invest';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    try {
        // Deduct balance first
        const balanceFormData = new URLSearchParams();
        balanceFormData.append("action", "updateBalance");
        balanceFormData.append("phone", currentUser.phone);
        balanceFormData.append("amount", amount);
        balanceFormData.append("operation", "deduct");
        
        const balanceResponse = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: balanceFormData });
        const balanceResult = await balanceResponse.json();
        
        if (!balanceResult.success) {
            if (typeof showToast === 'function') showToast(balanceResult.message || "Insufficient balance", 1500);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
            return;
        }
        
        // Record investment
        const formData = new URLSearchParams();
        formData.append("action", "addCreditInvestment");
        formData.append("timestamp", new Date().toISOString());
        formData.append("accountId", currentUser.id);
        formData.append("fullName", currentUser.name);
        formData.append("phone", currentUser.phone);
        formData.append("investmentType", "5% Bond - 180 days");
        formData.append("amount", amount);
        formData.append("expectedReturn", expectedReturn);
        formData.append("maturityDate", maturityDate.toISOString());
        formData.append("status", "Active");
        formData.append("durationDays", "180");
        
        const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
        const result = await response.json();
        
        if (result.success) {
            // Update local user balance
            currentUser.balance = balanceResult.newBalance;
            localStorage.setItem("nova_user", JSON.stringify(currentUser));
            if (typeof updateAllBalanceDisplays === 'function') updateAllBalanceDisplays();
            
            // Add to local investments array
            investments.push({
                type: '5% Bond',
                amount: amount,
                expectedReturn: expectedReturn,
                maturityDate: maturityDate,
                status: 'Active',
                timestamp: new Date().toISOString()
            });
            saveInvestments();
            
            if (typeof showToast === 'function') {
                showToast(`✅ Invested ₱${amount.toLocaleString()}! Expected return: ₱${expectedReturn.toLocaleString()}`, 4000);
            }
            
            // Clear input
            if (amountInput) amountInput.value = '';
            
            // Refresh transaction history
            if (typeof loadTransactionHistory === 'function') setTimeout(loadTransactionHistory, 1000);
        } else {
            // Refund if investment recording failed
            const refundFormData = new URLSearchParams();
            refundFormData.append("action", "updateBalance");
            refundFormData.append("phone", currentUser.phone);
            refundFormData.append("amount", amount);
            refundFormData.append("operation", "add");
            await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: refundFormData });
            
            if (typeof showToast === 'function') showToast("Investment failed. Please try again.", 2000);
        }
    } catch (error) {
        console.error("Investment error:", error);
        if (typeof showToast === 'function') showToast("Investment failed. Please try again.", 2000);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

function investInInvestmentOption() {
    investInBondOption1();
}

// Initialize
loadInvestments();
setInterval(checkMaturedInvestments, 86400000); // Check daily

// Make functions global
window.investInBondOption1 = investInBondOption1;
window.investInInvestmentOption = investInInvestmentOption;
window.loadInvestments = loadInvestments;
window.saveInvestments = saveInvestments;
window.checkMaturedInvestments = checkMaturedInvestments;