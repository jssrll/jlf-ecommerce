import { Router } from 'express';
import {
  getUsers, getAllOrders, updateOrderStatus,
  getAllRecharges, updateRechargeStatus,
  getAllWithdrawals, updateWithdrawalStatus,
  getAllInvestments, getAllRedemptions,
  getAllPromoCodes, addPromoCode, deletePromoCode,
  getLoginLogs, addAnnouncement, updateAnnouncementStatus,
  getAnnouncementsForAdmin, getAllBugReports, updateBugReportStatus,
  addLoyaltyScan, getRecentScans,
} from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// Orders
router.get('/orders', getAllOrders);
router.post('/orders/status', updateOrderStatus);

// Users
router.get('/users', getUsers);

// Recharges
router.get('/recharges', getAllRecharges);
router.post('/recharges/status', updateRechargeStatus);

// Withdrawals
router.get('/withdrawals', getAllWithdrawals);
router.post('/withdrawals/status', updateWithdrawalStatus);

// Investments
router.get('/investments', getAllInvestments);

// Redemptions
router.get('/redemptions', getAllRedemptions);

// Promo Codes
router.get('/promocodes', getAllPromoCodes);
router.post('/promocodes', addPromoCode);
router.delete('/promocodes', deletePromoCode);

// Logs
router.get('/logs', getLoginLogs);

// Announcements
router.get('/announcements', getAnnouncementsForAdmin);
router.post('/announcements', addAnnouncement);
router.post('/announcements/status', updateAnnouncementStatus);

// Bug Reports
router.get('/bugreports', getAllBugReports);
router.post('/bugreports/status', updateBugReportStatus);

// Loyalty
router.post('/loyalty/scan', addLoyaltyScan);
router.get('/loyalty/scans', getRecentScans);

export default router;