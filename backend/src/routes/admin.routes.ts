import { Router } from 'express';
import { getAllOrders, getUsers } from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);
router.get('/orders', getAllOrders);
router.get('/users', getUsers);

export default router;