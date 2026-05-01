import { Router } from 'express';
import { placeOrder, getOrders, getBalance } from '../controllers/shop.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.post('/orders', placeOrder);
router.get('/orders', getOrders);
router.get('/balance', getBalance);

export default router;