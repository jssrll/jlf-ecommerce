// ========================================
// ADMIN USER MANAGEMENT
// ========================================

async function loadAdminUsers() {
  if (!isAdmin) return;
  const container = document.getElementById("adminUsersContainer");
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>';
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getUsers`);
    const users = await response.json();
    if (!users || users.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No users found.</div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Balance</th></tr></thead><tbody>';
    users.forEach(user => {
      html += `<tr><td style="white-space: nowrap;">${user.accountId || '-'}</td><td>${user.name || '-'}</td><td>${user.phone || '-'}</td><td style="white-space: nowrap;">₱${(user.balance || 0).toLocaleString()}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load users. <button class="btn-secondary-apple" onclick="loadAdminUsers()">Try Again</button></div>';
  }
}

function refreshAdminUsers() { if(isAdmin) loadAdminUsers(); }