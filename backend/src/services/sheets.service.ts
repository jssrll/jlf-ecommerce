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
  
  // Log login
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
  
  // Create loyalty record
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
  // Deduct balance
  const balanceResult = await updateBalance(user.phone, totalPrice, 'deduct');
  if (!balanceResult.success) {
    return balanceResult;
  }
  
  // Record order
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

// ========================================
// RECHARGE SERVICE
// ========================================
export async function submitRecharge(data: {
  accountId: string;
  fullName: string;
  phone: string;
  method: string;
  amount: number;
  reference: string;
}) {
  await appendToSheet(SHEETS.RECHARGE_REQUESTS,
    ['Timestamp', 'Account ID', 'Full Name', 'Phone', 'Method', 'Amount', 'Reference', 'Status'],
    [new Date().toISOString(), data.accountId, data.fullName, data.phone, data.method, data.amount, data.reference, 'Pending']
  );
  
  return { success: true, message: 'Recharge request submitted' };
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
  
  // Check expiry
  if (codeData[6]) {
    const expiryDate = new Date(codeData[6]);
    if (expiryDate < new Date()) {
      return { success: false, message: 'Code has expired' };
    }
  }
  
  const reward = parseInt(codeData[1]) || 0;
  
  // Mark as used
  await updateCell(SHEETS.PROMO_CODES, codeIndex + 1, 3, 'used');
  await updateCell(SHEETS.PROMO_CODES, codeIndex + 1, 4, user.accountId);
  await updateCell(SHEETS.PROMO_CODES, codeIndex + 1, 5, user.phone);
  await updateCell(SHEETS.PROMO_CODES, codeIndex + 1, 6, new Date().toISOString());
  
  // Add balance
  const balanceResult = await updateBalance(user.phone, reward, 'add');
  
  // Record redemption
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
      timestamp: row[0],
      date: row[1],
      header: row[2],
      content: row[3],
      type: row[4],
      priority: row[5],
      icon: row[6] || '📢',
      link: row[7] || '',
      linkText: row[8] || 'Learn More',
    }));
}

// ========================================
// LOYALTY SERVICE
// ========================================
export async function getUserLoyalty(phone: string) {
  const data = await getSheetData(SHEETS.LOYALTY_CARDS);
  const user = data.find(row => row[2] === phone);
  
  if (!user) {
    return { success: false, marks: 0 };
  }
  
  return {
    success: true,
    marks: parseInt(user[3]) || 0,
    totalEarned: parseInt(user[4]) || 0,
    lastScan: user[5] || '',
  };
}

// 🔥 EXPORT AS NAMED OBJECT (FIX)
export const sheetsService = {
  loginUser,
  registerUser,
  placeOrder,
  getUserOrders,
  getAllOrders,
  submitRecharge,
  redeemCode,
  getAnnouncements,
  getUserLoyalty,
  getUsers,
  updateBalance,
};