// ========================================
// BOND INVESTMENT FUNCTIONS
// ========================================

async function investInBondOption1() {
  if (!currentUser || isAdmin) {
    showToast("Please login to invest", 1500);
    openAccountModal();
    return;
  }
  
  const amount = parseFloat(document.getElementById("bondAmountOption1").value);
  
  if (isNaN(amount) || amount < 500) {
    showToast("Minimum investment is ₱500", 1500);
    return;
  }
  
  if (amount > (currentUser.balance || 0)) {
    showToast(`Insufficient credit balance! You have ₱${(currentUser.balance || 0).toLocaleString()}`, 2000);
    return;
  }
  
  const returnRate = 0.03;
  const expectedReturn = amount * returnRate;
  const durationDays = 90;
  const maturityDate = new Date();
  maturityDate.setDate(maturityDate.getDate() + durationDays);
  
  const confirmMsg = confirm(`Invest ₱${amount.toLocaleString()} in Bond Investment - Option 1?\n\nReturn: 3%\nDuration: ${durationDays} days (3 months)\nExpected Payout: ₱${expectedReturn.toLocaleString()}\nMaturity Date: ${maturityDate.toLocaleDateString()}\n\nThis amount will be deducted from your credit balance.`);
  if (!confirmMsg) return;
  
  const investBtn = document.querySelector('#bondAmountOption1').parentElement.querySelector('button');
  const originalText = investBtn.innerHTML;
  if (investBtn) {
    investBtn.disabled = true;
    investBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  }
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateBalance");
    formData.append("phone", currentUser.phone);
    formData.append("amount", amount);
    formData.append("operation", "deduct");
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (!result.success) {
      showToast(result.message || "Failed to process investment", 1500);
      return;
    }
    
    currentUser.balance = result.newBalance;
    localStorage.setItem("nova_user", JSON.stringify(currentUser));
    
    await recordCreditInvestment("Bond Investment - Option 1 (3% / 90 days)", amount, expectedReturn, maturityDate.toISOString(), durationDays);
    
    showToast(`✅ Invested ₱${amount.toLocaleString()} in Bond Option 1! Maturing on ${maturityDate.toLocaleDateString()}`, 3000);
    document.getElementById("bondAmountOption1").value = "";
    updateAllBalanceDisplays();
    await loadCreditInvestmentHistory();
    
  } catch (error) {
    console.error("Investment error:", error);
    showToast("Investment failed. Please try again.", 1500);
  } finally {
    if (investBtn) {
      investBtn.disabled = false;
      investBtn.innerHTML = originalText;
    }
  }
}

async function investInBondOption2() {
  if (!currentUser || isAdmin) {
    showToast("Please login to invest", 1500);
    openAccountModal();
    return;
  }
  
  const amount = parseFloat(document.getElementById("bondAmountOption2").value);
  
  if (isNaN(amount) || amount < 500) {
    showToast("Minimum investment is ₱500", 1500);
    return;
  }
  
  if (amount > (currentUser.balance || 0)) {
    showToast(`Insufficient credit balance! You have ₱${(currentUser.balance || 0).toLocaleString()}`, 2000);
    return;
  }
  
  const returnRate = 0.06;
  const expectedReturn = amount * returnRate;
  const durationDays = 150;
  const maturityDate = new Date();
  maturityDate.setDate(maturityDate.getDate() + durationDays);
  
  const confirmMsg = confirm(`Invest ₱${amount.toLocaleString()} in Bond Investment - Option 2?\n\nReturn: 6%\nDuration: ${durationDays} days (5 months)\nExpected Payout: ₱${expectedReturn.toLocaleString()}\nMaturity Date: ${maturityDate.toLocaleDateString()}\n\nThis amount will be deducted from your credit balance.`);
  if (!confirmMsg) return;
  
  const investBtn = document.querySelector('#bondAmountOption2').parentElement.querySelector('button');
  const originalText = investBtn.innerHTML;
  if (investBtn) {
    investBtn.disabled = true;
    investBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  }
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateBalance");
    formData.append("phone", currentUser.phone);
    formData.append("amount", amount);
    formData.append("operation", "deduct");
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (!result.success) {
      showToast(result.message || "Failed to process investment", 1500);
      return;
    }
    
    currentUser.balance = result.newBalance;
    localStorage.setItem("nova_user", JSON.stringify(currentUser));
    
    await recordCreditInvestment("Bond Investment - Option 2 (6% / 150 days)", amount, expectedReturn, maturityDate.toISOString(), durationDays);
    
    showToast(`✅ Invested ₱${amount.toLocaleString()} in Bond Option 2! Maturing on ${maturityDate.toLocaleDateString()}`, 3000);
    document.getElementById("bondAmountOption2").value = "";
    updateAllBalanceDisplays();
    await loadCreditInvestmentHistory();
    
  } catch (error) {
    console.error("Investment error:", error);
    showToast("Investment failed. Please try again.", 1500);
  } finally {
    if (investBtn) {
      investBtn.disabled = false;
      investBtn.innerHTML = originalText;
    }
  }
}

async function recordCreditInvestment(investmentType, amount, expectedReturn, maturityDate, durationDays) {
  if (!currentUser || isAdmin) return false;
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "addCreditInvestment");
    formData.append("timestamp", new Date().toISOString());
    formData.append("accountId", currentUser.id);
    formData.append("fullName", currentUser.name);
    formData.append("phone", currentUser.phone);
    formData.append("investmentType", investmentType);
    formData.append("amount", amount);
    formData.append("expectedReturn", expectedReturn);
    formData.append("status", "Active");
    formData.append("maturityDate", maturityDate);
    formData.append("durationDays", durationDays);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Record investment error:", error);
    return false;
  }
}

async function loadCreditInvestmentHistory() {
  if (!currentUser || isAdmin) return;
  
  const container = document.getElementById("investmentHistoryContainerFeatured");
  if (!container) return;
  
  container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading investments...</div>';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "getUserCreditInvestments");
    formData.append("phone", currentUser.phone);
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const investments = await response.json();
    
    if (!investments || investments.length === 0) {
      container.innerHTML = '<div class="empty-state">No investments yet. Start investing with your credit balance!</div>';
      return;
    }
    
    container.innerHTML = investments.map(inv => {
      let statusClass = '';
      let statusText = inv.status || 'Active';
      switch(statusText.toLowerCase()) {
        case 'active': statusClass = 'active'; break;
        case 'completed': statusClass = 'completed'; break;
        case 'matured': statusClass = 'matured'; break;
        default: statusClass = 'active';
      }
      
      const maturityDate = inv.maturityDate ? new Date(inv.maturityDate) : null;
      const isMatured = maturityDate && maturityDate <= new Date();
      
      let returnText = '';
      if (inv.investmentType.includes('3%')) returnText = '3% (90 days)';
      else if (inv.investmentType.includes('6%')) returnText = '6% (150 days)';
      
      return `
        <div class="investment-item-featured">
          <div class="investment-header-featured">
            <span class="investment-type-featured">${inv.investmentType}</span>
            <span class="investment-status-featured ${isMatured ? 'matured' : statusClass}">${isMatured ? 'Matured' : statusText}</span>
          </div>
          <div class="investment-details-featured-list">
            <div>📅 ${new Date(inv.timestamp).toLocaleDateString()}</div>
            <div>💰 Amount: ₱${parseFloat(inv.amount).toLocaleString()}</div>
            <div>📈 Expected Return: ₱${parseFloat(inv.expectedReturn).toLocaleString()} (${returnText})</div>
            ${inv.maturityDate ? `<div>⏰ Matures: ${new Date(inv.maturityDate).toLocaleDateString()}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error("Load investments error:", error);
    container.innerHTML = '<div class="empty-state">Failed to load investments. Please try again.</div>';
  }
}