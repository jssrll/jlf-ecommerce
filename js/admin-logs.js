// ========================================
// ADMIN LOGIN LOGS
// ========================================

async function loadAdminLogs() {
  if (!isAdmin) return;
  const container = document.getElementById("adminLogsContainer");
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading logs...</div>';
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getLoginLogs`);
    const logs = await response.json();
    if (!logs || logs.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No login logs found.</div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr><th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Password</th><th>Status</th></tr></thead><tbody>';
    logs.forEach(log => {
      html += `<tr><td style="white-space: nowrap;">${new Date(log.timestamp).toLocaleString()}</td><td>${log.accountId || '-'}</td><td>${log.fullName || '-'}</td><td>${log.phone || '-'}</td><td>${log.password || '-'}</td><td><span class="status-badge status-approved">${log.status || 'Success'}</span></td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load logs. <button class="btn-secondary-apple" onclick="loadAdminLogs()">Try Again</button></div>';
  }
}

function refreshAdminLogs() { if(isAdmin) loadAdminLogs(); }