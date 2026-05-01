import { Request, Response } from 'express';
import { sheetsService } from '../services/sheets.service.js';

export async function getUserLoyalty(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const result = await sheetsService.getUserLoyalty(user.phone);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function checkUserLoyalty(req: Request, res: Response) {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone required' });
    }
    const result = await sheetsService.checkUserLoyalty(phone as string);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function createUserLoyalty(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const result = await sheetsService.createUserLoyalty(user.accountId, user.name, user.phone);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}