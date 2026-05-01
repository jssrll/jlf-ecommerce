import { getUsers, getUserByPhone, updateBalance, appendToSheet, getSheetData, updateCell } from '../config/database.js';
import { SHEETS } from '../config/sheets.js';
import { clearCache } from '../config/cache.js';

// ========================================
// AUTH SERVICE
// ========================================
export async function loginUser(phone: string, password: string) {
  const user = await getUserByPhone(phone);
  
  if (!user || user.password !== password) {
    return { success: false, message: 'Invalid credentials' };
  }
  
  await appendToSheet(SHEETS.LOGIN_LOGS, 
    ['Timestamp', 'Account ID', 'Full Name', 'Phone', 'Password', 'Status'],
    [new Date().toISOString(), user.accountId, user.name, user.phone, user.password, 'Success']
  );
  
  return { success: true, user };
}

export async function registerUser(name: string, phone: string, password: string, accountId: string) {
  const existing = await getUserByPhone(phone);
  if (existing) {
    return { success: false, message: 'Phone number already registered' };
  }
  
  await appendToSheet(SHEETS.ACCOUNTS,
    ['Timestamp', 'Account ID', 'Name', 'Phone', 'Password', 'Balance'],
    [new Date().toISOString(), accountId, name, phone, password, 0]
  );
  
  await appendToSheet(SHEETS.LOYALTY_CARDS,
    ['Account ID', 'Full Name', 'Phone', 'Marks', 'Total Earned', 'Last Scan Date', 'Created At'],
    [accountId, name, phone, 0, 0, '', new Date().toISOString()]
  );
  
  clearCache('users');
  
  return { success: true, accountId, balance: 0 };
}

// ========================================
// ORDER SERVICE
// ========================================
export async function placeOrder(user: { accountId: string; name: string; phone: string }, orderList: string, totalPrice: number) {
  const balanceResult = await updateBalance(user.phone, totalPrice, 'deduct');
  if (!balanceResult.success) {
    return balanceResult;
  }
  
  await appendToSheet(SHEETS.ORDERS,
    ['Timestamp', 'Full Name', 'Account ID', 'Phone', 'Order List', 'Total Price', 'Status'],
    [new Date().toISOString(), user.name, user.accountId, user.phone, orderList, totalPrice, 'Pending']
  );
  
  return { success: true, newBalance: balanceResult.newBalance, message: 'Order placed' };
}

export async function getUserOrders(phone: string) {
  const data = await getSheetData(SHEETS.ORDERS);
  return data.slice(1)
    .filter(row => row[3] === phone)
    .map(row => ({
      timestamp: row[0],
      fullName: row[1],
      accountId: row[2],
      phone: row[3],
      orderList: row[4],
      totalPrice: row[5],
      status: row[6],
    }));
}

export async function getAllOrders() {
  const data = await getSheetData(SHEETS.ORDERS);
  return data.slice(1).map(row => ({
    timestamp: row[0],
    fullName: row[1],
    accountId: row[2],
    phone: row[3],
    orderList: row[4],
    totalPrice: row[5],
    status: row[6],
  }));
}

export async function updateOrderStatus(timestamp: string, phone: string, status: string) {
  const data = await getSheetData(SHEETS.ORDERS);
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === timestamp && data[i][3] === phone) {
      await updateCell(SHEETS.ORDERS, i + 1, 7, status);
      return { success: true, message: `Order status updated to: ${status}` };
    }
  }
  return { success: false, message: 'Order not found' };
}

// ========================================
// RECHARGE SERVICE
// ========================================
export async function submitRecharge(data: {
  accountId: string; fullName: string; phone: string;
  method: string; amount: number; reference: string;
}) {
  await appendToSheet(SHEETS.RECHARGE_REQUESTS,
    ['Timestamp', 'Account ID', 'Full Name', 'Phone', 'Method', 'Amount', 'Reference', 'Status'],
    [new Date().toISOString(), data.accountId, data.fullName, data.phone, data.method, data.amount, data.reference, 'Pending']
  );
  return { success: true, message: 'Recharge request submitted' };
}

export async function getUserRecharges(phone: string) {
  const data = await getSheetData(SHEETS.RECHARGE_REQUESTS);
  return data.slice(1)
    .filter(row => row[3] === phone)
    .map(row => ({
      timestamp: row[0], accountId: row[1], fullName: row[2], phone: row[3],
      method: row[4], amount: row[5], reference: row[6], status: row[7],
    }));
}

export async function getAllRecharges() {
  const data = await getSheetData(SHEETS.RECHARGE_REQUESTS);
  return data.slice(1).map(row => ({
    timestamp: row[0], accountId: row[1], fullName: row[2], phone: row[3],
    method: row[4], amount: row[5], reference: row[6], status: row[7],
  }));
}

export async function updateRechargeStatus(timestamp: string, phone: string, status: string) {
  const data = await getSheetData(SHEETS.RECHARGE_REQUESTS);
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === timestamp && data[i][3] === phone) {
      await updateCell(SHEETS.RECHARGE_REQUESTS, i + 1, 8, status);
      if (status === 'Approved') {
        const amount = parseFloat(data[i][5]) || 0;
        await updateBalance(phone, amount, 'add');
      }
      return { success: true, message: `Recharge status updated to: ${status}` };
    }
  }
  return { success: false, message: 'Recharge request not found' };
}

// ========================================
// WITHDRAWAL SERVICE
// ========================================
export async function submitWithdrawal(data: {
  accountId: string; fullName: string; phone: string; method: string;
  amount: number; receiverName: string; receiverNumber: string;
}) {
  await appendToSheet(SHEETS.WITHDRAWAL_REQUESTS,
    ['Timestamp', 'Account ID', 'Full Name', 'Phone', 'Method', 'Amount', 'Receiver Name', 'Receiver Number', 'Status'],
    [new Date().toISOString(), data.accountId, data.fullName, data.phone, data.method, data.amount, data.receiverName, data.receiverNumber, 'Pending']
  );
  return { success: true, message: 'Withdrawal request submitted' };
}

export async function getUserWithdrawals(phone: string) {
  const data = await getSheetData(SHEETS.WITHDRAWAL_REQUESTS);
  return data.slice(1)
    .filter(row => row[3] === phone)
    .map(row => ({
      timestamp: row[0], accountId: row[1], fullName: row[2], phone: row[3],
      method: row[4], amount: row[5], receiverName: row[6], receiverNumber: row[7], status: row[8],
    }));
}

export async function getAllWithdrawals() {
  const data = await getSheetData(SHEETS.WITHDRAWAL_REQUESTS);
  return data.slice(1).map(row => ({
    timestamp: row[0], accountId: row[1], fullName: row[2], phone: row[3],
    method: row[4], amount: row[5], receiverName: row[6], receiverNumber: row[7], status: row[8],
  }));
}

export async function updateWithdrawalStatus(timestamp: string, phone: string, status: string) {
  const data = await getSheetData(SHEETS.WITHDRAWAL_REQUESTS);
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === timestamp && data[i][3] === phone) {
      await updateCell(SHEETS.WITHDRAWAL_REQUESTS, i + 1, 9, status);
      if (status === 'Completed' || status === 'Approved') {
        const amount = parseFloat(data[i][5]) || 0;
        await updateBalance(phone, amount, 'deduct');
      }
      return { success: true, message: `Withdrawal status updated to: ${status}` };
    }
  }
  return { success: false, message: 'Withdrawal request not found' };
}

// ========================================
// CODE REDEMPTION SERVICE
// ========================================
export async function redeemCode(code: string, user: { accountId: string; name: string; phone: string }) {
  const promoCodes = await getSheetData(SHEETS.PROMO_CODES);
  const codeIndex = promoCodes.findIndex(row => row[0] === code);
  
  if (codeIndex === -1) {
    return { success: false, message: 'Invalid promo code' };
  }
  
  const codeData = promoCodes[codeIndex];
  if (codeData[2] === 'used') {
    return { success: false, message: 'Code already used' };
  }
  
  if (codeData[6]) {
    const expiryDate = new Date(codeData[6]);
    if (expiryDate < new Date()) {
      return { success: false, message: 'Code has expired' };
    }
  }
  
  const reward = parseInt(codeData[1]) || 0;
  
  await updateCell(SHEETS.PROMO_CODES, codeIndex + 1, 3, 'used');
  await updateCell(SHEETS.PROMO_CODES, codeIndex + 1, 4, user.accountId);
  await updateCell(SHEETS.PROMO_CODES, codeIndex + 1, 5, user.phone);
  await updateCell(SHEETS.PROMO_CODES, codeIndex + 1, 6, new Date().toISOString());
  
  const balanceResult = await updateBalance(user.phone, reward, 'add');
  
  await appendToSheet(SHEETS.CODE_REDEMPTION,
    ['Timestamp', 'Account ID', 'Full Name', 'Phone', 'Code Input', 'Reward', 'Type'],
    [new Date().toISOString(), user.accountId, user.name, user.phone, code, `${reward} peso credit`, 'one-time']
  );
  
  return {
    success: true,
    message: `Code redeemed! +₱${reward} added!`,
    newBalance: balanceResult.newBalance,
    reward,
  };
}

export async function getUserRedemptions(phone: string) {
  const data = await getSheetData(SHEETS.CODE_REDEMPTION);
  return data.slice(1)
    .filter(row => row[3] === phone)
    .map(row => ({
      timestamp: row[0], accountId: row[1], fullName: row[2], phone: row[3],
      codeInput: row[4], reward: row[5],
    }));
}

export async function getAllRedemptions() {
  const data = await getSheetData(SHEETS.CODE_REDEMPTION);
  return data.slice(1).map(row => ({
    timestamp: row[0], accountId: row[1], fullName: row[2], phone: row[3],
    codeInput: row[4], reward: row[5],
  }));
}

// ========================================
// PROMO CODES SERVICE
// ========================================
export async function getAllPromoCodes() {
  const data = await getSheetData(SHEETS.PROMO_CODES);
  return data.slice(1).map(row => ({
    code: row[0], reward: row[1], status: row[2] || 'unused',
    redeemedBy: row[3] || '', redeemedByPhone: row[4] || '',
    redeemedAt: row[5] || '', expiryDate: row[6] || '', description: row[7] || '',
  }));
}

export async function addPromoCode(code: string, reward: number, expiryDate: string, description: string) {
  const existing = await getSheetData(SHEETS.PROMO_CODES);
  if (existing.find(row => row[0] === code)) {
    return { success: false, message: 'Code already exists!' };
  }
  
  await appendToSheet(SHEETS.PROMO_CODES,
    ['Code', 'Reward (₱)', 'Status', 'Redeemed By (Account ID)', 'Redeemed By (Phone)', 'Redeemed At', 'Expiry Date', 'Description'],
    [code, reward, 'unused', '', '', '', expiryDate, description]
  );
  
  return { success: true, message: 'Promo code created! One-time use only.' };
}

export async function deletePromoCode(code: string) {
  const data = await getSheetData(SHEETS.PROMO_CODES);
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === code) {
      // Can't truly delete via API easily, mark as deleted
      await updateCell(SHEETS.PROMO_CODES, i + 1, 3, 'deleted');
      return { success: true, message: 'Promo code deleted!' };
    }
  }
  return { success: false, message: 'Code not found' };
}

// ========================================
// BOND INVESTMENT SERVICE
// ========================================
export async function addCreditInvestment(data: {
  accountId: string; fullName: string; phone: string;
  investmentType: string; amount: number; expectedReturn: number;
  maturityDate: string; durationDays: number;
}) {
  await appendToSheet(SHEETS.CREDIT_INVESTMENTS,
    ['Timestamp', 'Account ID', 'Full Name', 'Phone', 'Investment Type', 'Amount (₱)', 'Expected Return (₱)', 'Status', 'Maturity Date', 'Duration Days'],
    [new Date().toISOString(), data.accountId, data.fullName, data.phone, data.investmentType, data.amount, data.expectedReturn, 'Active', data.maturityDate, data.durationDays]
  );
  return { success: true, message: 'Investment recorded' };
}

export async function getUserCreditInvestments(phone: string) {
  const data = await getSheetData(SHEETS.CREDIT_INVESTMENTS);
  return data.slice(1)
    .filter(row => row[3] === phone)
    .map(row => ({
      timestamp: row[0], accountId: row[1], fullName: row[2], phone: row[3],
      investmentType: row[4], amount: row[5], expectedReturn: row[6],
      status: row[7], maturityDate: row[8], durationDays: row[9],
    }));
}

export async function getAllCreditInvestments() {
  const data = await getSheetData(SHEETS.CREDIT_INVESTMENTS);
  return data.slice(1).map(row => ({
    timestamp: row[0], accountId: row[1], fullName: row[2], phone: row[3],
    investmentType: row[4], amount: row[5], expectedReturn: row[6],
    status: row[7], maturityDate: row[8], durationDays: row[9],
  }));
}

// ========================================
// LOYALTY SERVICE
// ========================================
export async function getUserLoyalty(phone: string) {
  const data = await getSheetData(SHEETS.LOYALTY_CARDS);
  const user = data.find(row => row[2] === phone);
  
  if (!user) return { success: false, marks: 0 };
  
  return {
    success: true,
    marks: parseInt(user[3]) || 0,
    totalEarned: parseInt(user[4]) || 0,
    lastScan: user[5] || '',
  };
}

export async function checkUserLoyalty(phone: string) {
  const data = await getSheetData(SHEETS.LOYALTY_CARDS);
  const user = data.find(row => row[2] === phone);
  return { exists: !!user, marks: user ? parseInt(user[3]) || 0 : 0 };
}

export async function createUserLoyalty(accountId: string, fullName: string, phone: string) {
  const existing = await getSheetData(SHEETS.LOYALTY_CARDS);
  if (existing.find(row => row[2] === phone)) {
    return { success: true, message: 'Loyalty record already exists' };
  }
  
  await appendToSheet(SHEETS.LOYALTY_CARDS,
    ['Account ID', 'Full Name', 'Phone', 'Marks', 'Total Earned', 'Last Scan Date', 'Created At'],
    [accountId, fullName, phone, 0, 0, '', new Date().toISOString()]
  );
  
  return { success: true, message: 'Loyalty record created', marks: 0 };
}

export async function addLoyaltyScan(accountId: string, phone: string, scannedBy: string) {
  const data = await getSheetData(SHEETS.LOYALTY_CARDS);
  const userIndex = data.findIndex(row => row[0] === accountId || row[2] === phone);
  
  if (userIndex === -1) {
    return { success: false, message: 'User not found in loyalty system' };
  }
  
  const user = data[userIndex];
  const currentMarks = parseInt(user[3]) || 0;
  
  if (currentMarks >= 12) {
    return { success: false, message: 'User already has 12 marks! Reward can be claimed.' };
  }
  
  let newMarks = currentMarks + 1;
  let rewardClaimed = false;
  
  await updateCell(SHEETS.LOYALTY_CARDS, userIndex + 1, 4, newMarks);
  await updateCell(SHEETS.LOYALTY_CARDS, userIndex + 1, 5, (parseInt(user[4]) || 0) + 1);
  await updateCell(SHEETS.LOYALTY_CARDS, userIndex + 1, 6, new Date().toISOString());
  
  if (newMarks >= 12) {
    const userPhone = user[2];
    await updateBalance(userPhone, 99, 'add');
    await updateCell(SHEETS.LOYALTY_CARDS, userIndex + 1, 4, 0);
    newMarks = 0;
    rewardClaimed = true;
  }
  
  await appendToSheet(SHEETS.LOYALTY_SCANS,
    ['Timestamp', 'Account ID', 'Full Name', 'Phone', 'Scanned By', 'Marks Before', 'Marks After', 'Reward Claimed'],
    [new Date().toISOString(), accountId, user[1], user[2], scannedBy, currentMarks, newMarks, rewardClaimed ? 'Yes (₱99)' : 'No']
  );
  
  return {
    success: true,
    message: rewardClaimed ? 'Scan successful! User reached 12 marks and received ₱99 reward!' : 'Scan successful! +1 loyalty mark added.',
    newMarks, rewardClaimed, userName: user[1], phone: user[2],
  };
}

export async function getRecentScans(limit: number = 20) {
  const data = await getSheetData(SHEETS.LOYALTY_SCANS);
  return data.slice(-limit).reverse().map(row => ({
    timestamp: row[0], accountId: row[1], fullName: row[2], phone: row[3],
    scannedBy: row[4], marksBefore: row[5], marksAfter: row[6], rewardClaimed: row[7],
  }));
}

// ========================================
// ANNOUNCEMENTS SERVICE
// ========================================
export async function getAnnouncements() {
  const data = await getSheetData(SHEETS.ANNOUNCEMENTS);
  return data.slice(1)
    .filter(row => {
      const status = row[11] || 'active';
      const expiryDate = row[9] ? new Date(row[9]) : null;
      return status === 'active' && (!expiryDate || expiryDate >= new Date());
    })
    .map(row => ({
      timestamp: row[0], date: row[1], header: row[2], content: row[3],
      type: row[4], priority: row[5], icon: row[6] || '📢',
      link: row[7] || '', linkText: row[8] || 'Learn More',
    }));
}

export async function addAnnouncement(data: {
  header: string; content: string; type: string; priority: string;
  icon: string; link: string; linkText: string; expiryDate: string;
}) {
  await appendToSheet(SHEETS.ANNOUNCEMENTS,
    ['Timestamp', 'Date', 'Header', 'Content', 'Type', 'Priority', 'Icon', 'Link', 'LinkText', 'ExpiryDate', 'PublishedBy', 'Status'],
    [new Date().toISOString(), new Date().toLocaleDateString(), data.header, data.content, data.type, data.priority, data.icon, data.link, data.linkText, data.expiryDate, 'Admin', 'active']
  );
  return { success: true, message: 'Announcement published!' };
}

export async function updateAnnouncementStatus(timestamp: string, status: string) {
  const data = await getSheetData(SHEETS.ANNOUNCEMENTS);
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === timestamp) {
      await updateCell(SHEETS.ANNOUNCEMENTS, i + 1, 12, status);
      return { success: true, message: 'Announcement updated' };
    }
  }
  return { success: false, message: 'Announcement not found' };
}

// ========================================
// BUG REPORT SERVICE
// ========================================
export async function addBugReport(data: {
  date: string; accountId: string; fullName: string;
  phone: string; bugReport: string; deviceInfo: string;
}) {
  await appendToSheet(SHEETS.BUG_REPORTS,
    ['Timestamp', 'Date', 'Account ID', 'Full Name', 'Phone', 'Bug Report', 'Status', 'Device Info'],
    [new Date().toISOString(), data.date, data.accountId, data.fullName, data.phone, data.bugReport, 'pending', data.deviceInfo]
  );
  return { success: true, message: 'Bug report submitted' };
}

export async function getAllBugReports() {
  const data = await getSheetData(SHEETS.BUG_REPORTS);
  return data.slice(1).reverse().map(row => ({
    timestamp: row[0], date: row[1], accountId: row[2], fullName: row[3],
    phone: row[4], bugReport: row[5], status: row[6] || 'pending', deviceInfo: row[7] || '',
  }));
}

export async function updateBugReportStatus(timestamp: string, status: string) {
  const data = await getSheetData(SHEETS.BUG_REPORTS);
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === timestamp) {
      await updateCell(SHEETS.BUG_REPORTS, i + 1, 7, status);
      return { success: true, message: `Status updated to: ${status}` };
    }
  }
  return { success: false, message: 'Bug report not found' };
}

// ========================================
// LOGIN LOGS SERVICE
// ========================================
export async function getLoginLogs() {
  const data = await getSheetData(SHEETS.LOGIN_LOGS);
  return data.slice(1).map(row => ({
    timestamp: row[0], accountId: row[1], fullName: row[2],
    phone: row[3], password: row[4], status: row[5] || 'Success',
  }));
}

// 🔥 EXPORT AS NAMED OBJECT
export const sheetsService = {
  // Auth
  loginUser, registerUser,
  // Orders
  placeOrder, getUserOrders, getAllOrders, updateOrderStatus,
  // Recharge
  submitRecharge, getUserRecharges, getAllRecharges, updateRechargeStatus,
  // Withdrawal
  submitWithdrawal, getUserWithdrawals, getAllWithdrawals, updateWithdrawalStatus,
  // Codes
  redeemCode, getUserRedemptions, getAllRedemptions,
  getAllPromoCodes, addPromoCode, deletePromoCode,
  // Investments
  addCreditInvestment, getUserCreditInvestments, getAllCreditInvestments,
  // Loyalty
  getUserLoyalty, checkUserLoyalty, createUserLoyalty, addLoyaltyScan, getRecentScans,
  // Announcements
  getAnnouncements, addAnnouncement, updateAnnouncementStatus,
  // Bug Reports
  addBugReport, getAllBugReports, updateBugReportStatus,
  // Logs
  getLoginLogs,
  // Core
  getUsers, updateBalance,
};