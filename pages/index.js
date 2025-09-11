import React, { useState, useEffect } from 'react';
import { Send, Play, Pause, Users, MessageSquare, Settings, LogOut, Edit, Plus, User } from 'lucide-react';

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
      // 20%的概率增减用户数
      if (Math.random() < 0.2) {
        setUserCount(prev => {
          // 确保用户数不会小于0
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

  // 认证界面组件
  const AuthInterface = () => (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <div className="auth-header">
          <h2 className="text-2xl font-bold text-gray-800">财经直播平台</h2>
          <p className="text-gray-600">请登录或注册以继续</p>
        </div>
        
        <div className="auth-tabs">
          <button 
            onClick={() => setAuthMode('login')}
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
          >
            登录
          </button>
          <button 
            onClick={() => setAuthMode('register')}
            className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
          >
            注册
          </button>
        </div>
        
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}
        
        <div className="auth-form">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号码</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号码"
              className="form-input"
            />
          </div>
          
          {authMode === 'register' && (
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请设置用户名"
                className="form-input"
              />
            </div>
          )}
          
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="请输入验证码"
                className="form-input"
              />
              <button 
                onClick={handleSendVerificationCode}
                disabled={sendingCode || codeSent}
                className={`send-code-btn ${sendingCode || codeSent ? 'disabled' : ''}`}
              >
                {sendingCode ? '发送中...' : codeSent ? `${countdown}秒后重发` : '获取验证码'}
              </button>
            </div>
          </div>
          
          <button 
            onClick={authMode === 'login' ? handleLogin : handleRegister}
            className="submit-btn"
          >
            {authMode === 'login' ? '登录' : '注册'}
          </button>
        </div>
      </div>
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