export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Login API working! Use POST' });
  }
  if (req.method === 'POST') {
    try {
      const { employeeId, password, email } = req.body || {};
      const id = employeeId || email;
      if (id && password) {
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          token: 'btc-token-123',
          user: { id: id, name: 'Admin', role: 'admin', employeeId: id }
        });
      }
      return res.status(400).json({ success: false, message: 'ID Password dalo' });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
  return res.status(405).json({ message: 'Method not allowed' });
}
