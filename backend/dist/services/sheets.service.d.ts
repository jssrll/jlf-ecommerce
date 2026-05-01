import { getUsers, updateBalance } from '../config/database.js';
export declare function loginUser(phone: string, password: string): Promise<{
    success: boolean;
    message: string;
    user?: undefined;
} | {
    success: boolean;
    user: import("../config/database.js").User;
    message?: undefined;
}>;
export declare function registerUser(name: string, phone: string, password: string, accountId: string): Promise<{
    success: boolean;
    message: string;
    accountId?: undefined;
    balance?: undefined;
} | {
    success: boolean;
    accountId: string;
    balance: number;
    message?: undefined;
}>;
export declare function placeOrder(user: {
    accountId: string;
    name: string;
    phone: string;
}, orderList: string, totalPrice: number): Promise<{
    success: boolean;
    newBalance?: number;
    message: string;
}>;
export declare function getUserOrders(phone: string): Promise<{
    timestamp: string;
    fullName: string;
    accountId: string;
    phone: string;
    orderList: string;
    totalPrice: string;
    status: string;
}[]>;
export declare function getAllOrders(): Promise<{
    timestamp: string;
    fullName: string;
    accountId: string;
    phone: string;
    orderList: string;
    totalPrice: string;
    status: string;
}[]>;
export declare function updateOrderStatus(timestamp: string, phone: string, status: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function submitRecharge(data: {
    accountId: string;
    fullName: string;
    phone: string;
    method: string;
    amount: number;
    reference: string;
}): Promise<{
    success: boolean;
    message: string;
}>;
export declare function getUserRecharges(phone: string): Promise<{
    timestamp: string;
    accountId: string;
    fullName: string;
    phone: string;
    method: string;
    amount: string;
    reference: string;
    status: string;
}[]>;
export declare function getAllRecharges(): Promise<{
    timestamp: string;
    accountId: string;
    fullName: string;
    phone: string;
    method: string;
    amount: string;
    reference: string;
    status: string;
}[]>;
export declare function updateRechargeStatus(timestamp: string, phone: string, status: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function submitWithdrawal(data: {
    accountId: string;
    fullName: string;
    phone: string;
    method: string;
    amount: number;
    receiverName: string;
    receiverNumber: string;
}): Promise<{
    success: boolean;
    message: string;
}>;
export declare function getUserWithdrawals(phone: string): Promise<{
    timestamp: string;
    accountId: string;
    fullName: string;
    phone: string;
    method: string;
    amount: string;
    receiverName: string;
    receiverNumber: string;
    status: string;
}[]>;
export declare function getAllWithdrawals(): Promise<{
    timestamp: string;
    accountId: string;
    fullName: string;
    phone: string;
    method: string;
    amount: string;
    receiverName: string;
    receiverNumber: string;
    status: string;
}[]>;
export declare function updateWithdrawalStatus(timestamp: string, phone: string, status: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function redeemCode(code: string, user: {
    accountId: string;
    name: string;
    phone: string;
}): Promise<{
    success: boolean;
    message: string;
    newBalance?: undefined;
    reward?: undefined;
} | {
    success: boolean;
    message: string;
    newBalance: number | undefined;
    reward: number;
}>;
export declare function getUserRedemptions(phone: string): Promise<{
    timestamp: string;
    accountId: string;
    fullName: string;
    phone: string;
    codeInput: string;
    reward: string;
}[]>;
export declare function getAllRedemptions(): Promise<{
    timestamp: string;
    accountId: string;
    fullName: string;
    phone: string;
    codeInput: string;
    reward: string;
}[]>;
export declare function getAllPromoCodes(): Promise<{
    code: string;
    reward: string;
    status: string;
    redeemedBy: string;
    redeemedByPhone: string;
    redeemedAt: string;
    expiryDate: string;
    description: string;
}[]>;
export declare function addPromoCode(code: string, reward: number, expiryDate: string, description: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function deletePromoCode(code: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function addCreditInvestment(data: {
    accountId: string;
    fullName: string;
    phone: string;
    investmentType: string;
    amount: number;
    expectedReturn: number;
    maturityDate: string;
    durationDays: number;
}): Promise<{
    success: boolean;
    message: string;
}>;
export declare function getUserCreditInvestments(phone: string): Promise<{
    timestamp: string;
    accountId: string;
    fullName: string;
    phone: string;
    investmentType: string;
    amount: string;
    expectedReturn: string;
    status: string;
    maturityDate: string;
    durationDays: string;
}[]>;
export declare function getAllCreditInvestments(): Promise<{
    timestamp: string;
    accountId: string;
    fullName: string;
    phone: string;
    investmentType: string;
    amount: string;
    expectedReturn: string;
    status: string;
    maturityDate: string;
    durationDays: string;
}[]>;
export declare function getUserLoyalty(phone: string): Promise<{
    success: boolean;
    marks: number;
    totalEarned?: undefined;
    lastScan?: undefined;
} | {
    success: boolean;
    marks: number;
    totalEarned: number;
    lastScan: string;
}>;
export declare function checkUserLoyalty(phone: string): Promise<{
    exists: boolean;
    marks: number;
}>;
export declare function createUserLoyalty(accountId: string, fullName: string, phone: string): Promise<{
    success: boolean;
    message: string;
    marks?: undefined;
} | {
    success: boolean;
    message: string;
    marks: number;
}>;
export declare function addLoyaltyScan(accountId: string, phone: string, scannedBy: string): Promise<{
    success: boolean;
    message: string;
    newMarks?: undefined;
    rewardClaimed?: undefined;
    userName?: undefined;
    phone?: undefined;
} | {
    success: boolean;
    message: string;
    newMarks: number;
    rewardClaimed: boolean;
    userName: string;
    phone: string;
}>;
export declare function getRecentScans(limit?: number): Promise<{
    timestamp: string;
    accountId: string;
    fullName: string;
    phone: string;
    scannedBy: string;
    marksBefore: string;
    marksAfter: string;
    rewardClaimed: string;
}[]>;
export declare function getAnnouncements(): Promise<{
    timestamp: string;
    date: string;
    header: string;
    content: string;
    type: string;
    priority: string;
    icon: string;
    link: string;
    linkText: string;
}[]>;
export declare function addAnnouncement(data: {
    header: string;
    content: string;
    type: string;
    priority: string;
    icon: string;
    link: string;
    linkText: string;
    expiryDate: string;
}): Promise<{
    success: boolean;
    message: string;
}>;
export declare function updateAnnouncementStatus(timestamp: string, status: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function addBugReport(data: {
    date: string;
    accountId: string;
    fullName: string;
    phone: string;
    bugReport: string;
    deviceInfo: string;
}): Promise<{
    success: boolean;
    message: string;
}>;
export declare function getAllBugReports(): Promise<{
    timestamp: string;
    date: string;
    accountId: string;
    fullName: string;
    phone: string;
    bugReport: string;
    status: string;
    deviceInfo: string;
}[]>;
export declare function updateBugReportStatus(timestamp: string, status: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function getLoginLogs(): Promise<{
    timestamp: string;
    accountId: string;
    fullName: string;
    phone: string;
    password: string;
    status: string;
}[]>;
export declare const sheetsService: {
    loginUser: typeof loginUser;
    registerUser: typeof registerUser;
    placeOrder: typeof placeOrder;
    getUserOrders: typeof getUserOrders;
    getAllOrders: typeof getAllOrders;
    updateOrderStatus: typeof updateOrderStatus;
    submitRecharge: typeof submitRecharge;
    getUserRecharges: typeof getUserRecharges;
    getAllRecharges: typeof getAllRecharges;
    updateRechargeStatus: typeof updateRechargeStatus;
    submitWithdrawal: typeof submitWithdrawal;
    getUserWithdrawals: typeof getUserWithdrawals;
    getAllWithdrawals: typeof getAllWithdrawals;
    updateWithdrawalStatus: typeof updateWithdrawalStatus;
    redeemCode: typeof redeemCode;
    getUserRedemptions: typeof getUserRedemptions;
    getAllRedemptions: typeof getAllRedemptions;
    getAllPromoCodes: typeof getAllPromoCodes;
    addPromoCode: typeof addPromoCode;
    deletePromoCode: typeof deletePromoCode;
    addCreditInvestment: typeof addCreditInvestment;
    getUserCreditInvestments: typeof getUserCreditInvestments;
    getAllCreditInvestments: typeof getAllCreditInvestments;
    getUserLoyalty: typeof getUserLoyalty;
    checkUserLoyalty: typeof checkUserLoyalty;
    createUserLoyalty: typeof createUserLoyalty;
    addLoyaltyScan: typeof addLoyaltyScan;
    getRecentScans: typeof getRecentScans;
    getAnnouncements: typeof getAnnouncements;
    addAnnouncement: typeof addAnnouncement;
    updateAnnouncementStatus: typeof updateAnnouncementStatus;
    addBugReport: typeof addBugReport;
    getAllBugReports: typeof getAllBugReports;
    updateBugReportStatus: typeof updateBugReportStatus;
    getLoginLogs: typeof getLoginLogs;
    getUsers: typeof getUsers;
    updateBalance: typeof updateBalance;
};
//# sourceMappingURL=sheets.service.d.ts.map