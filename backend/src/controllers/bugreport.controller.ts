import { Request, Response } from 'express';
import { sheetsService } from '../services/sheets.service.js';

export async function submitBugReport(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ success: false, message: 'Description required' });
    }
    
    const result = await sheetsService.addBugReport({
      date: new Date().toLocaleDateString(),
      accountId: user.accountId,
      fullName: user.name,
      phone: user.phone,
      bugReport: description,
      deviceInfo: req.headers['user-agent'] || '',
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}