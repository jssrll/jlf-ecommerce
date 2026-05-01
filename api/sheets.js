export default async function handler(req, res) {
  const { action, ...params } = req.query;

  const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL;

  const url = new URL(GOOGLE_SHEETS_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}