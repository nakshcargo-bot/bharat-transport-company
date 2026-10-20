export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://bharat-transport-lite.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'API OK - Login working' });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const id = body.employeeId || body.email || 'admin';
      const password = body.password || '';

      // Simple check - koi bhi ID password chalega abhi ke liye
      if (id && password) {
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          token: 'btc-token-12345',
          user: { 
            id: id, 
            name: 'Admin User', 
            role: 'admin', 
            employeeId: id,
            email: id + '@bharattransport.com'
          }
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID and Password required' 
      });
      
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
