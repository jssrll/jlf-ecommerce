import { Request, Response } from 'express';
import { sheetsService } from '../services/sheets.service.js';

export async function getAnnouncements(req: Request, res: Response) {
  try {
    const announcements = await sheetsService.getAnnouncements();
    res.json({ success: true, announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}