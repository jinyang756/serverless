// 测试API端点
export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'API服务正常运行',
    timestamp: new Date().toISOString()
  });
}