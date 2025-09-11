import React, { useState, useEffect } from 'react';
import { Send, Play, Pause, Users, MessageSquare, Settings, LogOut, Edit, Plus, User, Shield, Lock, CheckCircle, ChevronRight } from 'lucide-react';

const FinanceLivePlatform = () => {
  // 视图控制
  const [currentView, setCurrentView] = useState('viewer');
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [adminAccounts, setAdminAccounts] = useState([
    { id: 1, username: 'admin', email: 'admin@example.com', role: '超级管理员', active: true },
    { id: 2, username: 'editor', email: 'editor@example.com', role: '编辑', active: true },
    { id: 3, username: 'moderator', email: 'moderator@example.com', role: '主持人', active: false },
  ]);

  // 认证相关状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' 或 'register'
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 模拟用户进入和退出
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.2) {
        setUserCount(prev => {
          const change = Math.random() < 0.5 ? 1 : -1;
          return Math.max(0, prev + change);
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 发送验证码倒计时
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && codeSent) {
      setCodeSent(false);
    }

    return () => clearInterval(timer);
  }, [countdown, codeSent]);

  // 发送消息
  const sendMessage = () => {
    if (newMessage.trim() && isAuthenticated && currentUser) {
      const message = {
        id: Date.now(),
        text: newMessage.trim(),
        user: currentUser.username,
        timestamp: new Date(),
        role: userRole
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  // 删除消息（仅管理员）
  const deleteMessage = (messageId) => {
    if (userRole === 'admin' || userRole === 'editor') {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    }
  };

  // 添加管理员账户（仅超级管理员）
  const addAdminAccount = () => {
    const newAdmin = {
      id: Date.now(),
      username: 'newadmin',
      email: `newadmin${Date.now()}@example.com`,
      role: '编辑',
      active: true
    };
    setAdminAccounts(prev => [...prev, newAdmin]);
  };

  // 切换管理员状态（启用/禁用）
  const toggleAdminStatus = (adminId) => {
    setAdminAccounts(prev => prev.map(admin => 
      admin.id === adminId ? { ...admin, active: !admin.active } : admin
    ));
  };

  // 发送验证码
  const handleSendVerificationCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setErrorMessage('请输入有效的手机号码');
      return;
    }

    try {
      setSendingCode(true);
      setErrorMessage('');
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('验证码已发送到：', phone);
      setCodeSent(true);
      setCountdown(300); // 5分钟倒计时
    } catch (error) {
      setErrorMessage('发送验证码失败，请重试');
      console.error('发送验证码失败：', error);
    } finally {
      setSendingCode(false);
    }
  };

  // 处理登录
  const handleLogin = async () => {
    if (!phone || !verificationCode) {
      setErrorMessage('请填写手机号码和验证码');
      return;
    }

    try {
      setErrorMessage('');
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 验证逻辑（模拟）
      const isAdminPhone = phone === '13800138000'; // 假设这个是管理员手机号
      const role = isAdminPhone ? 'admin' : 'user';
      const user = {
        id: Date.now(),
        username: isAdminPhone ? 'admin' : `user${phone.slice(-4)}`,
        phone: phone
      };
      
      // 设置认证状态
      setIsAuthenticated(true);
      setUserRole(role);
      setCurrentUser(user);
      setCurrentView('viewer');
      
      console.log('登录成功，用户角色：', role);
    } catch (error) {
      setErrorMessage('登录失败，请检查手机号码和验证码');
      console.error('登录失败：', error);
    }
  };

  // 处理注册
  const handleRegister = async () => {
    if (!phone || !username || !verificationCode) {
      setErrorMessage('请填写完整信息');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setErrorMessage('用户名必须为3-20位字母、数字或下划线');
      return;
    }

    try {
      setErrorMessage('');
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = {
        id: Date.now(),
        username: username,
        phone: phone
      };
      
      // 设置认证状态
      setIsAuthenticated(true);
      setUserRole('user');
      setCurrentUser(user);
      setCurrentView('viewer');
      
      console.log('注册成功');
    } catch (error) {
      setErrorMessage('注册失败，请重试');
      console.error('注册失败：', error);
    }
  };

  // 退出登录
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentUser(null);
    setPhone('');
    setUsername('');
    setVerificationCode('');
    setAuthMode('login');
  };

  // 观众界面组件
  const ViewerInterface = () => (
    <div className="live-stream-container">
      {/* 用户信息栏 */}
      {isAuthenticated && currentUser && (
        <div className="user-info-bar">
          <div className="user-details">
            <span className="user-icon">
              <User size={16} className="mr-1" />
              {currentUser.username}
            </span>
            {userRole === 'admin' && (
              <span className="admin-badge ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                管理员
              </span>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className="logout-btn text-gray-500 hover:text-gray-700"
            title="退出登录"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}

      {/* 视频播放区域 */}
      <div className="video-area">
        <div className="video-overlay">
          <div className="video-info">
            <h1 className="text-white text-2xl font-bold mb-4">财经分析直播</h1>
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center">
                <Users size={16} className="mr-2" />
                <span>{userCount} 在线观众</span>
              </div>
            </div>
          </div>
          <div className="video-controls">
            <button onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause size={24} color="white" /> : <Play size={24} color="white" />}
            </button>
          </div>
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="chat-area">
        <div className="chat-header">
          <h3>
            <MessageSquare size={18} className="inline-block mr-2" />
            聊天区
          </h3>
          <div className="user-count">{messages.length} 条消息</div>
        </div>
        <div className="chat-messages">
          {messages.map(message => (
            <div key={message.id} className="chat-message">
              <div className="chat-message-avatar">
                {message.role === 'admin' ? 'A' : 'U'}
              </div>
              <div className="chat-message-content">
                <div className="chat-message-header">
                  <span className={`chat-message-username ${message.role === 'admin' ? 'admin' : ''}`}>
                    {message.user}
                  </span>
                  <span className="chat-message-time">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="chat-message-text">{message.text}</p>
              </div>
              {/* 只有管理员可以删除消息 */}
              {(userRole === 'admin' || userRole === 'editor') && (
                <button 
                  onClick={() => deleteMessage(message.id)}
                  className="delete-btn text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="chat-input-area">
          <div className="chat-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isAuthenticated ? '发送消息...' : '请先登录'} 
              disabled={!isAuthenticated}
              className="chat-input-field"
            />
            <button 
              onClick={sendMessage}
              disabled={!isAuthenticated || !newMessage.trim()}
              className="chat-input-button"
            >
              <Send size={16} color="white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 管理员界面组件
  const AdminInterface = () => (
    <div className="admin-layout">
      {/* 侧边栏 */}
      <div className="admin-sidebar">
        <h2>管理员中心</h2>
        <button className="admin-sidebar-item">
          <Settings className="admin-sidebar-icon" size={18} />
          <span>系统设置</span>
        </button>
        <button className="admin-sidebar-item">
          <Users className="admin-sidebar-icon" size={18} />
          <span>用户管理</span>
        </button>
        <button className="admin-sidebar-item">
          <MessageSquare className="admin-sidebar-icon" size={18} />
          <span>聊天管理</span>
        </button>
      </div>

      {/* 主内容区域 */}
      <div className="admin-content">
        {/* 管理员账户管理 */}
        <div className="card">
          <div className="card-header">
            <h3>管理员账户管理</h3>
            <button 
              onClick={addAdminAccount}
              className="btn btn-primary"
            >
              <Plus size={14} />
              <span>添加管理员</span>
            </button>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>用户名</th>
                    <th>邮箱</th>
                    <th>角色</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {adminAccounts.map(admin => (
                    <tr key={admin.id}>
                      <td>{admin.username}</td>
                      <td>{admin.email}</td>
                      <td>{admin.role}</td>
                      <td>
                        <span className={`badge ${admin.active ? 'badge-success' : 'badge-danger'}`}>
                          {admin.active ? '活跃' : '禁用'}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => toggleAdminStatus(admin.id)}
                          className="text-primary-blue hover:text-primary-blue-hover mr-3"
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 认证界面组件 - 国泰海通证券风格
  const AuthInterface = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* 顶部导航 */}
      <header className="py-4 px-6 md:px-12 flex justify-between items-center border-b border-blue-100">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-lg bg-blue-800 flex items-center justify-center">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-900">国泰海通证券</h1>
            <p className="text-xs text-blue-600">专业·诚信·卓越</p>
          </div>
        </div>
        <nav>
          <ul className="flex space-x-6 text-sm text-blue-800">
            <li className="hover:text-blue-600 transition-colors cursor-pointer">首页</li>
            <li className="hover:text-blue-600 transition-colors cursor-pointer">直播日程</li>
            <li className="hover:text-blue-600 transition-colors cursor-pointer">首席观点</li>
            <li className="hover:text-blue-600 transition-colors cursor-pointer">关于我们</li>
          </ul>
        </nav>
      </header>

      {/* 主内容区 */}
      <main className="flex-grow flex flex-col md:flex-row items-center justify-center px-6 py-12 md:py-20 gap-12">
        {/* 左侧宣传区 */}
        <div className="w-full md:w-1/2 max-w-lg space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-900 leading-tight">
              首席来了<br />
              <span className="text-blue-700">洞察市场先机</span>
            </h2>
            <p className="text-gray-600 text-lg">
              国泰海通证券首席分析师团队，实时解读市场动态，
              分享独家投资策略，助您把握投资机遇。
            </p>
          </div>

          {/* 直播亮点 */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0 mt-1">
                <CheckCircle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">首席分析师实时解读</h3>
                <p className="text-gray-600 mt-1">每日市场动态分析，政策解读，投资机会挖掘</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0 mt-1">
                <CheckCircle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">互动问答环节</h3>
                <p className="text-gray-600 mt-1">与首席分析师直接交流，解答您的投资疑问</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0 mt-1">
                <CheckCircle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">专业投资策略分享</h3>
                <p className="text-gray-600 mt-1">独家研究报告，市场趋势预测，投资组合建议</p>
              </div>
            </div>
          </div>
          
          {/* 安全保障 */}
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Lock size={16} className="text-blue-600" />
            <span>国泰海通证券保障您的信息安全与隐私</span>
          </div>
        </div>

        {/* 右侧表单区 */}
        <div className="w-full md:w-1/2 max-w-md">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transform transition-all hover:shadow-xl">
            {/* 表单头部 */}
            <div className="bg-blue-800 p-6">
              <h3 className="text-white text-xl font-bold">
                {authMode === 'login' ? '账户登录' : '新用户注册'}
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                {authMode === 'login' ? '请登录您的账户观看直播' : '注册后即可观看首席分析师直播'}
              </p>
            </div>
            
            {/* 切换标签 */}
            <div className="flex border-b border-gray-100">
              <button 
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  authMode === 'login' 
                    ? 'text-blue-800 border-b-2 border-blue-800' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                登录
              </button>
              <button 
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  authMode === 'register' 
                    ? 'text-blue-800 border-b-2 border-blue-800' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                注册
              </button>
            </div>
            
            {/* 表单内容 */}
            <div className="p-6 space-y-5">
              {errorMessage && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-md flex items-start gap-3 animate-fade-in">
                  <span className="text-red-500">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}
              
              {/* 手机号码 */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  手机号码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">+86</span>
                  </div>
                  <input 
                    id="phone"
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号码"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>
              
              {/* 用户名（仅注册） */}
              {authMode === 'register' && (
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    用户名
                  </label>
                  <input 
                    id="username"
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请设置用户名"
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>
              )}
              
              {/* 验证码 */}
              <div className="space-y-2">
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                  验证码
                </label>
                <div className="flex gap-3">
                  <input 
                    id="verificationCode"
                    type="text" 
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="请输入验证码"
                    className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                  <button 
                    onClick={handleSendVerificationCode}
                    disabled={sendingCode || codeSent}
                    className={`whitespace-nowrap px-4 py-3 rounded-lg font-medium transition-all ${
                      sendingCode || codeSent
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-700 text-white hover:bg-blue-800'
                    }`}
                  >
                    {sendingCode ? '发送中...' : codeSent ? `${countdown}秒后重发` : '获取验证码'}
                  </button>
                </div>
              </div>
              
              {/* 提交按钮 */}
              <button 
                onClick={authMode === 'login' ? handleLogin : handleRegister}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 group"
              >
                <span>{authMode === 'login' ? '登录' : '注册'}</span>
                <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
              
              {/* 条款说明 */}
              <p className="text-xs text-gray-500 text-center mt-4">
                点击{authMode === 'login' ? '登录' : '注册'}，即表示您同意
                <a href="#" className="text-blue-700 hover:underline mx-1">《服务条款》</a>
                和
                <a href="#" className="text-blue-700 hover:underline mx-1">《隐私政策》</a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-50 border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              © 2023 国泰海通证券股份有限公司 版权所有
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-blue-700 transition-colors">关于我们</a>
              <a href="#" className="hover:text-blue-700 transition-colors">联系客服</a>
              <a href="#" className="hover:text-blue-700 transition-colors">法律声明</a>
              <a href="#" className="hover:text-blue-700 transition-colors">风险提示</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  // 主渲染逻辑
  return (
    <div className="min-h-screen">
      {isAuthenticated ? (
        <>
          {/* 视图切换控制 - 只有管理员可以看到 */}
          {userRole === 'admin' && (
            <div className="fixed top-4 left-4 z-50">
              <div className="bg-white rounded-lg shadow-lg border p-2 flex space-x-2">
                <button
                  onClick={() => setCurrentView('viewer')}
                  className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'viewer' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  观众视图
                </button>
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  管理后台
                </button>
              </div>
            </div>
          )}
          
          {/* 根据当前视图显示不同界面 */}
          {currentView === 'viewer' ? <ViewerInterface /> : <AdminInterface />}
        </>
      ) : (
        // 未登录用户显示认证界面
        <AuthInterface />
      )}
    </div>
  );
};

export default FinanceLivePlatform;
