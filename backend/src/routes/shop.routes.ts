import { Router } from 'express';
import {
  placeOrder, getOrders, getBalance, getProducts,
  redeemCode, submitRecharge, submitWithdrawal, invest, getTransactionHistory,
} from '../controllers/shop.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/products', getProducts);
router.use(authenticate);
router.post('/orders', placeOrder);
router.get('/orders', getOrders);
router.get('/balance', getBalance);
router.post('/redeem', redeemCode);
router.post('/recharge', submitRecharge);
router.post('/withdraw', submitWithdrawal);
router.post('/invest', invest);
router.get('/transactions', getTransactionHistory);

export default router;