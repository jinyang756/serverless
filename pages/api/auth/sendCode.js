// 发送验证码API
export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { phone } = req.body;

      // 验证输入
      if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        return res.status(400).json({ success: false, message: '请输入正确的手机号码' });
      }

      // 模拟发送短信验证码 (实际应用中应该调用真实的短信服务API)
      const verificationCode = '1234'; // 实际应用中应该生成随机验证码
      const expireTime = Date.now() + 5 * 60 * 1000; // 5分钟后过期

      // 这里应该调用短信服务商的API发送验证码
      console.log(`向手机号 ${phone} 发送验证码: ${verificationCode}，有效期至: ${new Date(expireTime).toLocaleString()}`);

      // 为了演示，我们直接返回成功信息
      return res.status(200).json({
        success: true,
        message: '验证码已发送，请注意查收',
        expireTime: expireTime
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: '发送验证码失败', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}