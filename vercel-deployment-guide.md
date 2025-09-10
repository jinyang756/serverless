# Vercel部署详细指南

## 使用提供的Vercel账户进行部署

### 登录Vercel账户

1. 访问Vercel官方网站：[https://vercel.com](https://vercel.com)
2. 点击右上角的"Log in"按钮
3. 使用以下凭据登录：
   - 用户名/邮箱：guanyu432hz@gmail.com
   - 密码：GDragon19888..

### 导入项目到Vercel

1. 登录成功后，点击仪表板上的"New Project"按钮
2. 在"Import Git Repository"页面，您可以通过以下两种方式导入项目：
   - **方式一：通过Git仓库URL导入**
     - 输入您的GitHub仓库URL（例如：`https://github.com/jinyang756/serverless.git`）
     - 点击"Import"按钮
   - **方式二：从已连接的Git账户导入**
     - 如果您已将GitHub账户连接到Vercel，可以直接从列表中选择仓库
     - 找到您的财经直播平台仓库，点击"Import"按钮

### 项目配置

1. 在配置页面，设置以下选项：
   - **项目名称**：可自定义，建议使用`finance-live-platform`
   - **Framework Preset**：Vercel会自动识别为Next.js，保持默认即可
   - **Root Directory**：保持默认
   - **Environment Variables**：根据需要添加环境变量，例如：
     - `NEXT_PUBLIC_API_URL`: API基础URL，默认为`https://${VERCEL_URL}/api`
     - `NEXT_PUBLIC_WS_URL`: WebSocket URL，默认为`wss://${VERCEL_URL}`

### 部署项目

1. 确认配置信息无误后，点击"Deploy"按钮开始部署
2. 等待部署过程完成，您可以在部署日志中查看实时进度
3. 部署成功后，您将看到一个成功的提示页面，显示项目的URL（例如：`https://finance-live-platform.vercel.app`）

### 访问和验证项目

1. 点击Vercel提供的URL访问已部署的项目
2. 验证以下功能是否正常工作：
   - 前端页面能否正常加载
   - 测试API端点 `/api/test` 是否能正常响应
   - 模拟数据是否正确显示

## 部署后管理

### 查看部署历史

1. 在Vercel仪表板中，进入您的项目
2. 点击"Deployments"选项卡，可以查看所有的部署记录和状态

### 配置自定义域名

1. 在项目页面中，点击"Settings" > "Domains"
2. 点击"Add"按钮，输入您的自定义域名
3. 按照Vercel提供的指引，在您的域名注册商处配置DNS记录
4. 等待DNS记录生效后，您的项目将可以通过自定义域名访问

### 查看API日志

1. 在项目页面中，点击"Logs"选项卡
2. 在这里可以查看API路由的执行日志，帮助排查问题

## 常见问题解决

### 部署失败

- 检查部署日志，查看具体的错误信息
- 常见问题包括依赖安装失败、构建脚本错误等
- 确保您的代码已成功推送到GitHub仓库
- 确认`package.json`中的依赖和脚本配置正确

### API路由不响应

- 检查Vercel的日志，查看是否有API执行错误
- 确保您的API路由代码正确无误
- 注意Vercel的免费计划有一些限制，如API路由的执行时间上限为10秒

### 环境变量未生效

- 检查Vercel项目设置中的环境变量配置是否正确
- 确保变量名称与代码中的引用一致
- 修改环境变量后，需要重新部署项目才能使更改生效

## 部署状态监控

- 您可以在Vercel仪表板中实时监控项目的部署状态
- 每次推送代码到GitHub仓库，Vercel会自动触发新的部署
- 如果部署失败，Vercel会发送通知邮件

---

现在您已经拥有了详细的Vercel部署指南，可以使用提供的登录信息顺利完成财经直播平台的部署。如有任何问题，请查看Vercel的官方文档或联系技术支持。