export default function handler(req, res) {
  res.json({
    adminPhone: process.env.ADMIN_PHONE,
    adminPassword: process.env.ADMIN_PASSWORD,
  });
}