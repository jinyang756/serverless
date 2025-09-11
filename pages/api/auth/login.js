// 用户登录API
export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { phone, code } = req.body;

      // 验证输入
      if (!phone || !code) {
        return res.status(400).json({ success: false, message: '请填写完整信息' });
      }

      // 模拟验证码验证 (实际应用中应该使用真实的短信验证码服务)
      if (code !== '1234') {
        return res.status(400).json({ success: false, message: '验证码错误' });
      }

      // 模拟用户登录 (实际应用中应该从数据库验证用户)
      // 这里假设电话为特定号码的用户是管理员
      const isAdmin = phone === '13800138000';
      const user = {
        id: Date.now(),
        phone,
        username: isAdmin ? '管理员' : '普通用户',
        role: isAdmin ? 'admin' : 'user',
        createTime: new Date().toISOString()
      };

      // 这里应该生成JWT或其他认证token
      const token = `mock-jwt-token-${Date.now()}`;

      // 为了演示，我们直接返回成功信息和token
      return res.status(200).json({
        success: true,
        message: '登录成功',
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        token
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: '服务器错误', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}