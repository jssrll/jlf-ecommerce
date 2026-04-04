// ========================================
// CODE REDEMPTION - WITH ONE-TIME USE PER USER VALIDATION
// ========================================

async function redeemCode() {
  if (!currentUser || isAdmin) {
    showToast("Please login to redeem codes", 1500);
    openAccountModal();
    return;
  }
  
  const codeInput = document.getElementById("redemptionCode");
  const code = codeInput.value.trim();
  const messageDiv = document.getElementById("codeMessage");
  
  if (!code) {
    showToast("Please enter a code", 1500);
    return;
  }
  
  // Check if code exists in promoCodeRewards
  if (promoCodeRewards[code]) {
    const reward = promoCodeRewards[code];
    const redeemBtn = document.querySelector('#featuredPage .btn-primary-apple');
    const originalBtnText = redeemBtn.innerHTML;
    
    redeemBtn.disabled = true;
    redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating code...';
    
    try {
      // FIRST: Check if user already redeemed this code
      const checkResponse = await fetch(`${GOOGLE_SHEETS_URL}?action=checkUserCodeRedemption&phone=${currentUser.phone}&code=${encodeURIComponent(code)}`);
      const checkResult = await checkResponse.json();
      
      if (!checkResult.canRedeem) {
        messageDiv.innerHTML = `<div class="code-message error">${checkResult.message || "You have already redeemed this code!"}</div>`;
        redeemBtn.disabled = false;
        redeemBtn.innerHTML = originalBtnText;
        setTimeout(() => { messageDiv.innerHTML = ""; }, 3000);
        return;
      }
      
      // SECOND: Add credit to user balance
      redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redeeming...';
      
      const formData = new URLSearchParams();
      formData.append("action", "updateBalance");
      formData.append("phone", currentUser.phone);
      formData.append("amount", reward.value);
      formData.append("operation", "add");
      
      const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
      const result = await response.json();
      
      if (result.success) {
        currentUser.balance = result.newBalance;
        localStorage.setItem("nova_user", JSON.stringify(currentUser));
        
        // THIRD: Record redemption in sheet
        const logData = new URLSearchParams();
        logData.append("action", "addRedemption");
        logData.append("timestamp", new Date().toISOString());
        logData.append("accountId", currentUser.id);
        logData.append("fullName", currentUser.name);
        logData.append("phone", currentUser.phone);
        logData.append("codeInput", code);
        logData.append("reward", `${reward.value} peso credit - ${reward.message}`);
        
        await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: logData });
        
        messageDiv.innerHTML = `<div class="code-message success">✓ ${reward.message} Your credit balance: ₱${currentUser.balance}</div>`;
        codeInput.value = "";
        setTimeout(() => { messageDiv.innerHTML = ""; }, 3000);
        updateAllBalanceDisplays();
        showToast(`🎉 ${reward.message} New balance: ₱${currentUser.balance}`, 3000);
      } else {
        showToast(result.message || "Redemption failed", 1500);
      }
    } catch (error) {
      console.error("Redemption error:", error);
      showToast("Redemption failed. Please try again.", 1500);
    } finally {
      redeemBtn.disabled = false;
      redeemBtn.innerHTML = originalBtnText;
    }
  } else {
    messageDiv.innerHTML = `<div class="code-message error">✗ Invalid code. Please try again.</div>`;
    setTimeout(() => { messageDiv.innerHTML = ""; }, 2000);
  }
}