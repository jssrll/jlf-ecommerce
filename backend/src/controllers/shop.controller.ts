import { Request, Response } from 'express';
import { sheetsService } from '../services/sheets.service.js';
import { z } from 'zod';

const orderSchema = z.object({
  orderList: z.string().min(1),
  totalPrice: z.number().positive(),
});

export async function placeOrder(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { orderList, totalPrice } = orderSchema.parse(req.body);
    
    const result = await sheetsService.placeOrder(
      { accountId: user.accountId || '', name: user.name || '', phone: user.phone },
      orderList,
      totalPrice
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getOrders(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const orders = await sheetsService.getUserOrders(user.phone);
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getBalance(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const users = await sheetsService.getUsers();
    const found = users.find(u => u.phone === user.phone);
    res.json({ success: true, balance: found?.balance || 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}