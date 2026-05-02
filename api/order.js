export default async function handler(req, res) {
  const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = req.body;
  const formData = new URLSearchParams();
  Object.entries(body).forEach(([key, value]) => {
    formData.append(key, value);
  });

  try {
    // First deduct balance
    const balanceForm = new URLSearchParams();
    balanceForm.append('action', 'updateBalance');
    balanceForm.append('phone', body.phone);
    balanceForm.append('amount', body.totalPrice);
    balanceForm.append('operation', 'deduct');

    const balanceRes = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: balanceForm.toString(),
    });
    const balanceData = await balanceRes.json();

    if (!balanceData.success) {
      return res.json(balanceData);
    }

    // Then record order
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
    const orderData = await response.json();

    res.json({
      success: orderData.success,
      newBalance: balanceData.newBalance,
      message: orderData.message || 'Order placed',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}