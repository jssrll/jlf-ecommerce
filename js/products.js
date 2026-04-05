// ========================================
// PRODUCT DISPLAY
// ========================================

function getFilteredProducts() {
  let filtered = [...products];
  if (currentCategory !== "all") filtered = filtered.filter(p => p.category === currentCategory);
  if (searchQuery.trim() !== "") {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }
  return filtered;
}

function renderProducts() {
  if (isAdmin) return;
  const container = document.getElementById("productsContainer");
  if (!container) return;
  const filtered = getFilteredProducts();
  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding: 60px;">✨ No products match. Try another filter.</div>`;
    return;
  }
  let productHtml = "";
  filtered.forEach(prod => {
    productHtml += `<div class="product-card-apple" data-id="${prod.id}">
        <div class="product-img-apple" style="font-size: 4rem; background: #f5f5f7;">${prod.image}</div>
        <div class="product-info-apple">
          <div class="product-category-apple">${escapeHtml(prod.category)}</div>
          <div class="product-title-apple">${escapeHtml(prod.name)}</div>
          <div class="product-price-apple">₱${prod.price.toFixed(2)}</div>
          <button class="add-to-cart-apple" data-id="${prod.id}"><i class="fas fa-plus-circle"></i> Add to Cart</button>
        </div>
      </div>`;
  });
  container.innerHTML = productHtml;
  document.querySelectorAll('.add-to-cart-apple').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id'));
      addToCart(id);
    });
  });
}

// ========================================
// FILTER & SEARCH
// ========================================
function initFilters() {
  document.querySelectorAll('.cat-btn-apple').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn-apple').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-cat');
      renderProducts();
    });
  });
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }
}

// ========================================
// FEATURED PAGE
// ========================================
function loadFeaturedPage() {
  if (isAdmin) return;
  renderFeaturedProducts();
  if (currentUser) {
    if (typeof loadUserCredit === 'function') loadUserCredit();
    if (typeof loadCreditInvestmentHistory === 'function') loadCreditInvestmentHistory();
  }
}

function renderFeaturedProducts() {
  if (isAdmin) return;
  const featuredGrid = document.getElementById("featuredGrid");
  if (!featuredGrid) return;
  const featured = products.filter(p => p.name === "Maribel Kwitis" || p.name === "TS Thunder Sawa 500 Rounds" || p.name === "TS Special DK Sawa 500 Rounds");
  featuredGrid.innerHTML = featured.map(prod => `<div class="product-card-apple">
      <div class="product-img-apple" style="font-size: 4rem; background: #f5f5f7;">${prod.image}</div>
      <div class="product-info-apple">
        <div class="product-title-apple">${prod.name}</div>
        <div class="product-price-apple">₱${prod.price}</div>
        <button class="add-to-cart-apple" onclick="addToCart(${prod.id})">Add to Cart</button>
      </div>
    </div>`).join('');
}

// ========================================
// CODE REDEMPTION - GLOBAL ONE-TIME USE
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
  
  console.log("🔍 Checking code:", code);
  
  // Check if code exists in promoCodeRewards
  if (promoCodeRewards[code]) {
    const reward = promoCodeRewards[code];
    const redeemBtn = document.querySelector('#featuredPage .btn-primary-apple');
    const originalBtnText = redeemBtn.innerHTML;
    
    redeemBtn.disabled = true;
    redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating code...';
    
    try {
      // FIRST: Check if code has been used by ANYONE globally
      const checkResponse = await fetch(`${GOOGLE_SHEETS_URL}?action=checkGlobalCodeRedemption&code=${encodeURIComponent(code)}`);
      const checkResult = await checkResponse.json();
      
      console.log("Check result:", checkResult);
      
      if (!checkResult.canRedeem) {
        messageDiv.innerHTML = `<div class="code-message error">${checkResult.message || "This code has already been used!"}</div>`;
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
      
      console.log("Update balance result:", result);
      
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
    console.log("❌ Invalid code entered:", code);
    messageDiv.innerHTML = `<div class="code-message error">✗ Invalid code. Please try again.</div>`;
    setTimeout(() => { messageDiv.innerHTML = ""; }, 2000);
  }
}