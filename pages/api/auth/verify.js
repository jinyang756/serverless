// 验证用户权限API
export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { token } = req.body;

      // 验证token
      if (!token) {
        return res.status(401).json({ success: false, message: '未授权', isAuthenticated: false });
      }

      // 模拟验证token (实际应用中应该使用JWT等标准方式验证)
      // 这里简单判断token格式是否符合我们的模拟格式
      const isValidToken = token.startsWith('mock-jwt-token-');
      
      if (!isValidToken) {
        return res.status(401).json({ success: false, message: '无效的token', isAuthenticated: false });
      }

      // 模拟从token中解析用户信息 (实际应用中应该从JWT中解析)
      // 这里为了演示，我们假设有一个特定的管理员token模式
      const isAdmin = token.includes('admin');
      
      return res.status(200).json({
        success: true,
        isAuthenticated: true,
        user: {
          role: isAdmin ? 'admin' : 'user'
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: '服务器错误', error: error.message, isAuthenticated: false });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}