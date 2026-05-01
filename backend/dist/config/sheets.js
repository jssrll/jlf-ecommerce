import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
export const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
export const SHEETS = {
    ACCOUNTS: 'accounts',
    ORDERS: 'orders',
    LOGIN_LOGS: 'login_logs',
    CODE_REDEMPTION: 'code_redemption',
    PROMO_CODES: 'promo_codes',
    RECHARGE_REQUESTS: 'recharge_requests',
    WITHDRAWAL_REQUESTS: 'withdrawal_requests',
    CREDIT_INVESTMENTS: 'credit_investments',
    LOYALTY_CARDS: 'loyalty_cards',
    LOYALTY_SCANS: 'loyalty_scans',
    ANNOUNCEMENTS: 'announcements',
    BUG_REPORTS: 'bug_reports',
};
export { sheets };
//# sourceMappingURL=sheets.js.map