import { sheetsService } from '../services/sheets.service.js';
export async function getAllOrders(req, res) {
    try {
        const orders = await sheetsService.getAllOrders();
        res.json({ success: true, orders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function getUsers(req, res) {
    try {
        const users = await sheetsService.getUsers();
        res.json({ success: true, users });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function updateOrderStatus(req, res) {
    try {
        const { timestamp, phone, status } = req.body;
        if (!timestamp || !phone || !status) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }
        const result = await sheetsService.updateOrderStatus(timestamp, phone, status);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function getAllRecharges(req, res) {
    try {
        const recharges = await sheetsService.getAllRecharges();
        res.json({ success: true, recharges });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function updateRechargeStatus(req, res) {
    try {
        const { timestamp, phone, status } = req.body;
        if (!timestamp || !phone || !status) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }
        const result = await sheetsService.updateRechargeStatus(timestamp, phone, status);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function getAllWithdrawals(req, res) {
    try {
        const withdrawals = await sheetsService.getAllWithdrawals();
        res.json({ success: true, withdrawals });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function updateWithdrawalStatus(req, res) {
    try {
        const { timestamp, phone, status } = req.body;
        if (!timestamp || !phone || !status) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }
        const result = await sheetsService.updateWithdrawalStatus(timestamp, phone, status);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function getAllInvestments(req, res) {
    try {
        const investments = await sheetsService.getAllCreditInvestments();
        res.json({ success: true, investments });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function getAllRedemptions(req, res) {
    try {
        const redemptions = await sheetsService.getAllRedemptions();
        res.json({ success: true, redemptions });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function getAllPromoCodes(req, res) {
    try {
        const codes = await sheetsService.getAllPromoCodes();
        res.json({ success: true, codes });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function addPromoCode(req, res) {
    try {
        const { code, reward, expiryDate, description } = req.body;
        if (!code || !reward) {
            return res.status(400).json({ success: false, message: 'Code and reward required' });
        }
        const result = await sheetsService.addPromoCode(code.toUpperCase(), parseInt(reward), expiryDate || '', description || '');
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function deletePromoCode(req, res) {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, message: 'Code required' });
        }
        const result = await sheetsService.deletePromoCode(code);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function getLoginLogs(req, res) {
    try {
        const logs = await sheetsService.getLoginLogs();
        res.json({ success: true, logs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function addAnnouncement(req, res) {
    try {
        const { header, content, type, priority, icon, link, linkText, expiryDate } = req.body;
        if (!header || !content) {
            return res.status(400).json({ success: false, message: 'Header and content required' });
        }
        const result = await sheetsService.addAnnouncement({
            header, content,
            type: type || 'general',
            priority: priority || 'medium',
            icon: icon || '📢',
            link: link || '',
            linkText: linkText || 'Learn More',
            expiryDate: expiryDate || '',
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function updateAnnouncementStatus(req, res) {
    try {
        const { timestamp, status } = req.body;
        if (!timestamp || !status) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }
        const result = await sheetsService.updateAnnouncementStatus(timestamp, status);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function getAnnouncementsForAdmin(req, res) {
    try {
        const announcements = await sheetsService.getAnnouncements();
        res.json({ success: true, announcements });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function getAllBugReports(req, res) {
    try {
        const reports = await sheetsService.getAllBugReports();
        res.json({ success: true, reports });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function updateBugReportStatus(req, res) {
    try {
        const { timestamp, status } = req.body;
        if (!timestamp || !status) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }
        const result = await sheetsService.updateBugReportStatus(timestamp, status);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
// Loyalty
export async function addLoyaltyScan(req, res) {
    try {
        const { accountId, phone, scannedBy } = req.body;
        if (!accountId && !phone) {
            return res.status(400).json({ success: false, message: 'Account ID or Phone required' });
        }
        const result = await sheetsService.addLoyaltyScan(accountId || '', phone || '', scannedBy || 'Admin');
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export async function getRecentScans(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const scans = await sheetsService.getRecentScans(limit);
        res.json({ success: true, scans });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
//# sourceMappingURL=admin.controller.js.map