import { Request, Response } from 'express';
import { sheetsService } from '../services/sheets.service.js';

export async function placeOrder(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { orderList, totalPrice } = req.body;
    
    if (!orderList || !totalPrice) {
      return res.status(400).json({ success: false, message: 'Missing order details' });
    }
    
    const result = await sheetsService.placeOrder(
      { accountId: user.accountId, name: user.name, phone: user.phone },
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

export async function addToCart(req: Request, res: Response) {
  try {
    // Products are hardcoded, just validate
    const { productId } = req.body;
    // This will be handled client-side with the products list
    res.json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getProducts(req: Request, res: Response) {
  try {
    // Products are hardcoded - return the full list
    const products = [
      { id: 1, name: "Maribel Kwitis", category: "Aerial", price: 129, image: "🎇", description: "10 pcs per order" },
      { id: 2, name: "TS Pastillas Small", category: "Ground", price: 29, image: "🧨", description: "Pack of 10 per order" },
      { id: 3, name: "TS Special Pastillas", category: "Ground", price: 39, image: "🧨", description: "Pack of 10 per order" },
      { id: 4, name: "TS Pastillas Big", category: "Ground", price: 149, image: "🧨", description: "Pack of 10 per order" },
      { id: 5, name: "TS Thunder Sawa 500 Rounds", category: "Ground", price: 749, image: "🧨", description: "1 pcs per order" },
      { id: 6, name: "TS Special DK Sawa 500 Rounds", category: "Ground", price: 789, image: "🧨", description: "1 pcs per order" },
      { id: 7, name: "TS Super Thunder Sawa 500 Rounds", category: "Ground", price: 799, image: "🧨", description: "1 pcs per order" },
      { id: 8, name: "Dreamlight 3 Star", category: "Ground", price: 149, image: "🧨", description: "Ream of 100 per order" },
      { id: 9, name: "Phoenix Thunder", category: "Ground", price: 249, image: "🧨", description: "Ream of 100 per order" },
      { id: 10, name: "Dreamlight Whistle Bomb", category: "Ground", price: 129, image: "🧨", description: "Pack of 10 per order" },
      { id: 11, name: "Nation Whistle Bomb", category: "Ground", price: 129, image: "🧨", description: "Pack of 10 per order" },
      { id: 12, name: "Maribel Mabuhay Ordinary", category: "Sparklers", price: 29, image: "✨", description: "Pack of 10 per order" },
      { id: 13, name: "Tiger 1 Minutes Luces w/ Effect", category: "Sparklers", price: 49, image: "✨", description: "1 pcs per order" },
      { id: 14, name: "Yanco 1 Minute RC Luces", category: "Sparklers", price: 34, image: "✨", description: "1 pcs per order" },
      { id: 15, name: "Yanco 1 Minute Baby Luces", category: "Sparklers", price: 129, image: "✨", description: "Pack of 10 per order" },
      { id: 16, name: "Yanco Batibot", category: "Fountains", price: 99, image: "💧", description: "3 pcs per order" },
      { id: 17, name: "Yanco Small Silver", category: "Fountains", price: 99, image: "💧", description: "2 pcs per order" },
      { id: 18, name: "alp-alp", category: "Others", price: 169, image: "🌊", description: "Pack of 10 per order" },
      { id: 19, name: "kk", category: "Others", price: 269, image: "🌊", description: "Pack of 10 per order" },
      { id: 20, name: "dyn", category: "Others", price: 69, image: "🌊", description: "1 pcs per order" },
      { id: 21, name: "kbs", category: "Others", price: 69, image: "🌊", description: "1 pcs per order" },
      { id: 22, name: "el", category: "Others", price: 79, image: "🌊", description: "1 pcs per order" },
      { id: 23, name: "al", category: "Others", price: 159, image: "🌊", description: "1 pcs per order" },
    ];
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function redeemCode(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }
    
    const result = await sheetsService.redeemCode(code.toUpperCase(), {
      accountId: user.accountId,
      name: user.name,
      phone: user.phone,
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function submitRecharge(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { method, amount, reference } = req.body;
    
    if (!method || !amount) {
      return res.status(400).json({ success: false, message: 'Method and amount are required' });
    }
    
    const result = await sheetsService.submitRecharge({
      accountId: user.accountId,
      fullName: user.name,
      phone: user.phone,
      method,
      amount: parseFloat(amount),
      reference: reference || '',
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function submitWithdrawal(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { method, amount, receiverName, receiverNumber } = req.body;
    
    if (!method || !amount) {
      return res.status(400).json({ success: false, message: 'Method and amount are required' });
    }
    
    if (parseFloat(amount) > (user.balance || 0)) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }
    
    const result = await sheetsService.submitWithdrawal({
      accountId: user.accountId,
      fullName: user.name,
      phone: user.phone,
      method,
      amount: parseFloat(amount),
      receiverName: receiverName || '',
      receiverNumber: receiverNumber || '',
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function invest(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { option, amount } = req.body;
    
    if (!option || !amount) {
      return res.status(400).json({ success: false, message: 'Option and amount are required' });
    }
    
    const parsedAmount = parseFloat(amount);
    if (parsedAmount < 500) {
      return res.status(400).json({ success: false, message: 'Minimum investment is ₱500' });
    }
    
    let returnRate, durationDays, investmentType;
    if (option === '1') {
      returnRate = 0.03;
      durationDays = 90;
      investmentType = 'Bond Investment - Option 1 (3% / 90 days)';
    } else {
      returnRate = 0.06;
      durationDays = 150;
      investmentType = 'Bond Investment - Option 2 (6% / 150 days)';
    }
    
    const expectedReturn = parsedAmount * returnRate;
    const maturityDate = new Date();
    maturityDate.setDate(maturityDate.getDate() + durationDays);
    
    // Deduct balance first
    const balanceResult = await sheetsService.updateBalance(user.phone, parsedAmount, 'deduct');
    if (!balanceResult.success) {
      return res.status(400).json(balanceResult);
    }
    
    // Record investment
    await sheetsService.addCreditInvestment({
      accountId: user.accountId,
      fullName: user.name,
      phone: user.phone,
      investmentType,
      amount: parsedAmount,
      expectedReturn,
      maturityDate: maturityDate.toISOString(),
      durationDays,
    });
    
    res.json({
      success: true,
      message: `Invested ₱${parsedAmount.toLocaleString()} in Option ${option}!`,
      newBalance: balanceResult.newBalance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getTransactionHistory(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    const [orders, investments, redemptions, recharges, withdrawals] = await Promise.all([
      sheetsService.getUserOrders(user.phone),
      sheetsService.getUserCreditInvestments(user.phone),
      sheetsService.getUserRedemptions(user.phone),
      sheetsService.getUserRecharges(user.phone),
      sheetsService.getUserWithdrawals(user.phone),
    ]);
    
    // Combine all transactions similarly to orders.js
    const transactions: any[] = [];
    
    orders?.forEach((o: any) => {
      transactions.push({
        type: 'order', typeIcon: '📦', typeLabel: 'Order', typeColor: '#4caf50',
        timestamp: o.timestamp, date: new Date(o.timestamp).toLocaleString(),
        title: `Order #${(o.timestamp || '').substring(0, 8)}`,
        details: o.orderList, amount: `₱${parseFloat(o.totalPrice || 0).toLocaleString()}`,
        status: o.status || 'Pending',
      });
    });
    
    investments?.forEach((inv: any) => {
      transactions.push({
        type: 'investment', typeIcon: '📈', typeLabel: 'Investment', typeColor: '#9c27b0',
        timestamp: inv.timestamp, date: new Date(inv.timestamp).toLocaleString(),
        title: inv.investmentType, details: `Expected Return: ₱${parseFloat(inv.expectedReturn || 0).toLocaleString()}`,
        amount: `-₱${parseFloat(inv.amount || 0).toLocaleString()}`, status: inv.status || 'Active',
      });
    });
    
    redemptions?.forEach((red: any) => {
      const rewardMatch = red.reward?.match(/\d+/);
      const reward = rewardMatch ? parseInt(rewardMatch[0]) : 0;
      transactions.push({
        type: 'redemption', typeIcon: '🎫', typeLabel: 'Code Redemption', typeColor: '#ff9800',
        timestamp: red.timestamp, date: new Date(red.timestamp).toLocaleString(),
        title: `Code: ${red.codeInput}`, details: red.reward,
        amount: `+₱${reward}`, status: 'Completed',
      });
    });
    
    recharges?.forEach((rec: any) => {
      transactions.push({
        type: 'recharge', typeIcon: '💰', typeLabel: 'Recharge', typeColor: '#2196f3',
        timestamp: rec.timestamp, date: new Date(rec.timestamp).toLocaleString(),
        title: `${rec.method} Recharge`, details: rec.reference ? `Reference: ${rec.reference}` : '',
        amount: rec.status === 'Approved' ? `+₱${parseFloat(rec.amount || 0).toLocaleString()}` : `₱${parseFloat(rec.amount || 0).toLocaleString()}`,
        status: rec.status || 'Pending',
      });
    });
    
    withdrawals?.forEach((wd: any) => {
      transactions.push({
        type: 'withdrawal', typeIcon: '💸', typeLabel: 'Withdrawal', typeColor: '#f44336',
        timestamp: wd.timestamp, date: new Date(wd.timestamp).toLocaleString(),
        title: `${wd.method} Withdrawal`, details: wd.receiverName ? `To: ${wd.receiverName}` : '',
        amount: (wd.status === 'Completed' || wd.status === 'Approved') ? `-₱${parseFloat(wd.amount || 0).toLocaleString()}` : `₱${parseFloat(wd.amount || 0).toLocaleString()}`,
        status: wd.status || 'Pending',
      });
    });
    
    transactions.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}