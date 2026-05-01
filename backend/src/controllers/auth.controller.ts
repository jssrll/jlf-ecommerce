import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { sheetsService } from '../services/sheets.service.js';
import { z } from 'zod';

const loginSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^(09\d{9}|\d{10})$/),
  password: z.string().min(1),
  accountId: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  try {
    const { phone, password } = loginSchema.parse(req.body);
    
    // Admin login
    if (phone === '101007101007' && password === '101007101007') {
      const token = jwt.sign(
        { phone, role: 'admin' },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );
      return res.json({ success: true, token, user: { name: 'Admin', role: 'admin' } });
    }
    
    const result = await sheetsService.loginUser(phone, password);
    
    if (!result.success) {
      return res.status(401).json(result);
    }
    
    const token = jwt.sign(
      { phone: result.user?.phone, accountId: result.user?.accountId, name: result.user?.name, role: 'user' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        accountId: result.user?.accountId,
        name: result.user?.name,
        phone: result.user?.phone,
        balance: result.user?.balance,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await sheetsService.registerUser(data.name, data.phone, data.password, data.accountId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    const token = jwt.sign(
      { phone: data.phone, accountId: data.accountId, name: data.name, role: 'user' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    
    res.json({ success: true, token, user: { name: data.name, phone: data.phone, accountId: data.accountId, balance: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}