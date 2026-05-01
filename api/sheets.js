export default async function handler(req, res) {
  const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL;

  try {
    let url;
    let fetchOptions = {};

    if (req.method === 'GET') {
      // Handle GET requests (query params)
      const { action, ...params } = req.query;
      url = new URL(GOOGLE_SHEETS_URL);
      url.searchParams.set('action', action);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    } else if (req.method === 'POST') {
      // Handle POST requests (form body)
      const body = req.body;
      const formData = new URLSearchParams();
      
      // Add all body fields as form data
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
    } else {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const response = await fetch(url.toString(), fetchOptions);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}