// ========================================
// ADMIN BOND INVESTMENTS
// ========================================

async function loadAdminCreditInvestments() {
  if (!isAdmin) return;
  const container = document.getElementById("adminInvestmentsContainer");
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading bond investments...</div>';
  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAllCreditInvestments`);
    const investments = await response.json();
    if (!investments || investments.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">No bond investments found.</div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr><th>Timestamp</th><th>Account ID</th><th>Full Name</th><th>Phone</th><th>Investment Type</th><th>Amount (₱)</th><th>Expected Return (₱)</th><th>Status</th><th>Maturity Date</th><th>Duration</th></tr></thead><tbody>';
    investments.forEach(inv => {
      let statusClass = '';
      switch(inv.status?.toLowerCase()) {
        case 'active': statusClass = 'status-approved'; break;
        case 'completed': statusClass = 'status-completed'; break;
        case 'matured': statusClass = 'status-completed'; break;
        default: statusClass = 'status-pending';
      }
      html += `<tr><td style="white-space: nowrap;">${new Date(inv.timestamp).toLocaleString()}</td><td>${inv.accountId || '-'}</td><td>${inv.fullName || '-'}</td><td>${inv.phone || '-'}</td><td>${inv.investmentType || '-'}</td><td>₱${parseFloat(inv.amount || 0).toLocaleString()}</td><td>₱${parseFloat(inv.expectedReturn || 0).toLocaleString()}</td><td><span class="status-badge ${statusClass}">${inv.status || 'Active'}</span></td><td>${inv.maturityDate ? new Date(inv.maturityDate).toLocaleDateString() : '-'}</td><td>${inv.durationDays ? inv.durationDays + ' days' : '-'}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Failed to load bond investments. <button class="btn-secondary-apple" onclick="loadAdminCreditInvestments()">Try Again</button></div>';
  }
}