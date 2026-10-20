export default function handler(req, res) {
  // CORS headers - sabse important
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Login API working! Use POST' });
  }

  if (req.method === 'POST') {
    try {
      const { employeeId, password } = req.body;

      if (employeeId && password) {
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          token: 'btc-token-123',
          user: { id: employeeId, name: 'Admin', role: 'admin' }
        });
      }

      return res.status(400).json({
        success: false,
        message: 'ID Password dalo'
      });

    } catch (e) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
