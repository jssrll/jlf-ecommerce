import { Request, Response } from 'express';
import { sheetsService } from '../services/sheets.service.js';

export async function getAllOrders(req: Request, res: Response) {
  try {
    const orders = await sheetsService.getAllOrders();
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await sheetsService.getUsers();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}