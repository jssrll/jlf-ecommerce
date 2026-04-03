// ========================================
// WITHDRAW MODAL FUNCTIONS
// ========================================

function openWithdrawModal() {
  if (!currentUser || isAdmin) {
    showToast("Please login to withdraw", 1500);
    openAccountModal();
    return;
  }
  document.getElementById("withdrawAccountName").value = currentUser.name;
  document.getElementById("withdrawAccountId").value = currentUser.id;
  document.getElementById("withdrawCashAccountName").value = currentUser.name;
  document.getElementById("withdrawCashAccountId").value = currentUser.id;
  const modal = document.getElementById("withdrawModal");
  modal.classList.add("show");
}

function closeWithdrawModal() {
  const modal = document.getElementById("withdrawModal");
  modal.classList.remove("show");
}

function switchWithdrawTab(tabName) {
  document.querySelectorAll('.withdraw-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.withdraw-tab').forEach(tab => tab.classList.remove('active'));
  if (tabName === 'gcash') {
    document.querySelector('.withdraw-tab-btn:first-child').classList.add('active');
    document.getElementById('withdrawGcashTab').classList.add('active');
  } else {
    document.querySelector('.withdraw-tab-btn:last-child').classList.add('active');
    document.getElementById('withdrawCashTab').classList.add('active');
  }
}

async function submitWithdraw(method) {
  if (!currentUser || isAdmin) {
    showToast("Please login first", 1500);
    return;
  }
  
  let amount, receiverName = "", receiverNumber = "";
  let submitBtn, originalText;
  
  if (method === 'gcash') {
    amount = document.getElementById("withdrawGcashAmount").value;
    receiverName = document.getElementById("gcashReceiverName").value.trim();
    receiverNumber = document.getElementById("gcashReceiverNumber").value.trim();
    submitBtn = document.querySelector('#withdrawGcashTab .btn-primary-apple');
    
    if (!receiverName) { showToast("Please enter receiver name", 1500); return; }
    if (!receiverNumber || !/^09\d{9}$/.test(receiverNumber)) { 
      showToast("Please enter a valid GCash number (09XXXXXXXXX)", 1500); 
      return; 
    }
  } else {
    amount = document.getElementById("withdrawCashAmount").value;
    submitBtn = document.querySelector('#withdrawCashTab .btn-primary-apple');
  }
  
  amount = parseFloat(amount);
  if (isNaN(amount) || amount < 50) {
    showToast("Please enter a valid amount (minimum ₱50)", 1500);
    return;
  }
  
  if (amount > currentUser.balance) {
    showToast("Insufficient balance", 1500);
    return;
  }
  
  originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "addWithdrawal");
    formData.append("timestamp", new Date().toISOString());
    formData.append("accountId", currentUser.id);
    formData.append("fullName", currentUser.name);
    formData.append("phone", currentUser.phone);
    formData.append("method", method);
    formData.append("amount", amount);
    formData.append("receiverName", receiverName);
    formData.append("receiverNumber", receiverNumber);
    formData.append("status", "Pending");
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      showToast(`✅ Withdrawal request submitted! Amount: ₱${amount}. Please wait for approval.`, 3000);
      if (method === 'gcash') {
        document.getElementById("withdrawGcashAmount").value = "";
        document.getElementById("gcashReceiverName").value = "";
        document.getElementById("gcashReceiverNumber").value = "";
      } else {
        document.getElementById("withdrawCashAmount").value = "";
      }
    } else {
      showToast(result.message || "Submission failed", 1500);
    }
  } catch (error) {
    console.error("Withdrawal error:", error);
    showToast("Failed to submit. Please try again.", 1500);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}