import { sheetsService } from '../services/sheets.service.js';
export async function getAnnouncements(req, res) {
    try {
        const announcements = await sheetsService.getAnnouncements();
        res.json({ success: true, announcements });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
//# sourceMappingURL=announcements.controller.js.map