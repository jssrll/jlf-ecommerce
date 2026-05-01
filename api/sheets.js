export default async function handler(req, res) {
  const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL;
  const ADMIN_PHONE = process.env.ADMIN_PHONE || "101007101007";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "101007101007";

  try {
    let url;
    let fetchOptions = {};

    if (req.method === 'GET') {
      const { action, ...params } = req.query;
      url = new URL(GOOGLE_SHEETS_URL);
      url.searchParams.set('action', action);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    } else if (req.method === 'POST') {
      const body = req.body;
      const formData = new URLSearchParams();
      
      Object.entries(body).forEach(([key, value]) => {
        formData.append(key, value);
      });

      url = GOOGLE_SHEETS_URL;
      fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      };
    }

    const response = await fetch(url.toString(), fetchOptions);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}