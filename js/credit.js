// ========================================
// CREDIT FUNCTIONS
// ========================================

function loadUserCredit() {
  if (currentUser && !isAdmin) return currentUser.balance || 0;
  return 0;
}

async function addUserCredit(amount) {
  if (!currentUser || isAdmin) return 0;
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateBalance");
    formData.append("phone", currentUser.phone);
    formData.append("amount", amount);
    formData.append("operation", "add");
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      currentUser.balance = result.newBalance;
      localStorage.setItem("nova_user", JSON.stringify(currentUser));
      showToast(`₱${amount} added to your credit balance! Current balance: ₱${currentUser.balance}`, 2500);
      updateAllBalanceDisplays();
      return currentUser.balance;
    }
    return 0;
  } catch (error) {
    console.error("Credit error:", error);
    showToast("Failed to add credit. Please try again.", 1500);
    return 0;
  }
}