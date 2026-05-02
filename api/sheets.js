export default async function handler(req, res) {
  const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL;

  try {
    let fetchUrl;
    let fetchOptions = {};

    if (req.method === 'GET') {
      const { action, ...params } = req.query;
      fetchUrl = new URL(GOOGLE_SHEETS_URL);
      fetchUrl.searchParams.set('action', action);
      Object.entries(params).forEach(([key, value]) => {
        fetchUrl.searchParams.set(key, value);
      });
    } else if (req.method === 'POST') {
      const body = req.body;
      const formData = new URLSearchParams();
      Object.entries(body).forEach(([key, value]) => {
        formData.append(key, value);
      });

      fetchUrl = GOOGLE_SHEETS_URL;
      fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      };
    } else {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const response = await fetch(fetchUrl.toString(), fetchOptions);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}