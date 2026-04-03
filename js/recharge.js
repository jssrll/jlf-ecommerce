// ========================================
// RECHARGE MODAL FUNCTIONS
// ========================================

function openRechargeModal() {
  if (!currentUser || isAdmin) {
    showToast("Please login to recharge", 1500);
    openAccountModal();
    return;
  }
  document.getElementById("gcashAccountName").value = currentUser.name;
  document.getElementById("gcashPhone").value = currentUser.phone;
  document.getElementById("cashAccountName").value = currentUser.name;
  document.getElementById("cashPhone").value = currentUser.phone;
  const modal = document.getElementById("rechargeModal");
  modal.classList.add("show");
}

function closeRechargeModal() {
  const modal = document.getElementById("rechargeModal");
  modal.classList.remove("show");
}

function switchRechargeTab(tabName) {
  document.querySelectorAll('.recharge-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.recharge-tab').forEach(tab => tab.classList.remove('active'));
  if (tabName === 'gcash') {
    document.querySelector('.recharge-tab-btn:first-child').classList.add('active');
    document.getElementById('gcashTab').classList.add('active');
  } else {
    document.querySelector('.recharge-tab-btn:last-child').classList.add('active');
    document.getElementById('cashTab').classList.add('active');
  }
}

async function submitRecharge(method) {
  if (!currentUser || isAdmin) {
    showToast("Please login first", 1500);
    return;
  }
  
  let amount, reference = "";
  let submitBtn, originalText;
  
  if (method === 'gcash') {
    amount = document.getElementById("gcashAmount").value;
    reference = document.getElementById("gcashRefNumber").value.trim();
    submitBtn = document.querySelector('#gcashTab .btn-primary-apple');
    if (!reference) { showToast("Please enter reference number", 1500); return; }
  } else {
    amount = document.getElementById("cashAmount").value;
    submitBtn = document.querySelector('#cashTab .btn-primary-apple');
  }
  
  amount = parseFloat(amount);
  if (isNaN(amount) || amount < 10) {
    showToast("Please enter a valid amount (minimum ₱10)", 1500);
    return;
  }
  
  originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  
  try {
    const formData = new URLSearchParams();
    formData.append("action", "addRecharge");
    formData.append("timestamp", new Date().toISOString());
    formData.append("accountId", currentUser.id);
    formData.append("fullName", currentUser.name);
    formData.append("phone", currentUser.phone);
    formData.append("method", method);
    formData.append("amount", amount);
    formData.append("reference", reference);
    formData.append("status", "Pending");
    
    const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
    const result = await response.json();
    
    if (result.success) {
      showToast(`✅ Recharge request submitted! Amount: ₱${amount}. Please wait for approval.`, 3000);
      if (method === 'gcash') {
        document.getElementById("gcashAmount").value = "";
        document.getElementById("gcashRefNumber").value = "";
      } else {
        document.getElementById("cashAmount").value = "";
      }
    } else {
      showToast(result.message || "Submission failed", 1500);
    }
  } catch (error) {
    console.error("Recharge error:", error);
    showToast("Failed to submit. Please try again.", 1500);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}