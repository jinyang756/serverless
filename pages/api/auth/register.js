// 用户注册API
export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { phone, code, username } = req.body;

      // 验证输入
      if (!phone || !code || !username) {
        return res.status(400).json({ success: false, message: '请填写完整信息' });
      }

      // 模拟验证码验证 (实际应用中应该使用真实的短信验证码服务)
      if (code !== '1234') {
        return res.status(400).json({ success: false, message: '验证码错误' });
      }

      // 模拟用户注册 (实际应用中应该存储到数据库)
      const user = {
        id: Date.now(),
        phone,
        username,
        role: 'user', // 默认为普通用户
        createTime: new Date().toISOString()
      };

      // 这里应该将用户信息保存到数据库
      // 为了演示，我们直接返回成功信息
      return res.status(200).json({
        success: true,
        message: '注册成功',
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: '服务器错误', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}