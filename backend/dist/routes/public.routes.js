import { Router } from 'express';
import { getAnnouncements } from '../controllers/announcements.controller.js';
import { getUserLoyalty, checkUserLoyalty } from '../controllers/loyalty.controller.js';
import { submitBugReport } from '../controllers/bugreport.controller.js';
import { authenticate } from '../middlewares/auth.js';
const router = Router();
// Public
router.get('/announcements', getAnnouncements);
router.get('/loyalty/check', checkUserLoyalty);
// Authenticated
router.get('/loyalty', authenticate, getUserLoyalty);
router.post('/bugreport', authenticate, submitBugReport);
export default router;
//# sourceMappingURL=public.routes.js.map