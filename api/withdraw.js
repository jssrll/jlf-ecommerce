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
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}