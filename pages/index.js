import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Users,
  Send,
  Video,
  Shield,
  Edit,
  Plus,
  Eye,
  UserCheck
} from 'lucide-react';

const FinanceLivePlatform = () => {
  const [currentView, setCurrentView] = useState('viewer');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: '财经分析师', message: '欢迎大家来到今天的市场分析直播', time: '14:30', isAdmin: true },
    { id: 2, user: '投资者A', message: '今天的A股走势如何看？', time: '14:31', isAdmin: false },
    { id: 3, user: '市场专家', message: '从技术面来看，大盘呈现震荡上行态势', time: '14:32', isAdmin: true }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(1247);
  const [streamSource, setStreamSource] = useState('camera');
  const [adminAccounts, setAdminAccounts] = useState([
    { id: 1, username: '财经分析师', email: 'analyst@finance.com', role: 'moderator', active: true },
    { id: 2, username: '市场专家', email: 'expert@finance.com', role: 'admin', active: true }
  ]);
  const [chatSettings, setChatSettings] = useState({
    allowGuests: true,
    moderateMessages: false,
    slowMode: false,
    slowModeDelay: 10
  });

  // 模拟用户数变化
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => prev + Math.floor(Math.random() * 10 - 5));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: Date.now(),
        user: '观众用户',
        message: newMessage,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isAdmin: false
      };
      setChatMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    }
  };

  const deleteMessage = (messageId) => {
    setChatMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const addAdminAccount = () => {
    const newAdmin = {
      id: Date.now(),
      username: '新管理员',
      email: 'new@admin.com',
      role: 'moderator',
      active: true
    };
    setAdminAccounts(prev => [...prev, newAdmin]);
  };

  const toggleAdminStatus = (adminId) => {
    setAdminAccounts(prev => 
      prev.map(admin => 
        admin.id === adminId ? { ...admin, active: !admin.active } : admin
      )
    );
  };

  const ViewerInterface = () => (
    <div className="live-stream-container">
      {/* 主播放区域 */}
      <div className="video-area">
        {/* 视频播放器 */}
        <div className="video-overlay">
          <div className="video-info text-center text-white">
            <Video size={64} className="mx-auto mb-4 opacity-70" />
            <h3 className="text-xl font-medium mb-2">财经市场分析直播</h3>
            <p className="text-blue-200">2024年第四季度投资策略解读</p>
          </div>
          
          {/* 播放控制 */}
          <div className="video-controls">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
            >
              {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white ml-1" />}
            </button>
            
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
            </button>
            
            <div className="flex items-center bg-white/20 px-3 py-1 rounded-full">
              <Users size={16} className="text-white mr-1" />
              <span className="text-white text-sm">{onlineUsers}</span>
            </div>
            
            <button 
              onClick={() => setCurrentView('admin')}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
            >
              <Settings size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>
      
      {/* 聊天区域 */}
      <div className="chat-area">
        <div className="chat-header">
          <h3 className="font-medium text-gray-800">直播聊天</h3>
          <button 
            onClick={() => setCurrentView('admin')}
            className="text-primary-blue text-sm hover:underline"
          >
            管理
          </button>
        </div>
        
        <div className="chat-messages">
          {chatMessages.map(msg => (
            <div key={msg.id} className="chat-message fade-in">
              <div className="chat-message-avatar">
                <UserCheck size={16} />
              </div>
              <div className="chat-message-content">
                <div className="chat-message-header">
                  <span className={`chat-message-username ${msg.isAdmin ? 'text-primary-blue' : 'text-gray-700'}`}>{msg.user}</span>
                  <span className="chat-message-time">{msg.time}</span>
                </div>
                <p className="chat-message-text">{msg.message}</p>
              </div>
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
              placeholder="输入消息..."
              className="chat-input-field"
            />
            <button 
              onClick={sendMessage}
              className="chat-input-button"
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AdminInterface = () => (
    <div className="admin-layout">
      {/* 侧边栏 */}
      <div className="admin-sidebar">
        <h2 className="text-lg font-bold text-gray-800 mb-6">直播管理后台</h2>
        <div className="space-y-1">
          <button 
            onClick={() => setCurrentView('viewer')}
            className="admin-sidebar-item"
          >
            <Eye size={18} className="admin-sidebar-icon" />
            <span>返回直播</span>
          </button>
          <div className="pt-4 border-t border-gray-200 mt-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">设置</p>
            <button className="admin-sidebar-item">
              <Shield size={18} className="admin-sidebar-icon" />
              <span>管理员账户</span>
            </button>
            <button className="admin-sidebar-item">
              <Settings size={18} className="admin-sidebar-icon" />
              <span>聊天设置</span>
            </button>
            <button className="admin-sidebar-item">
              <Video size={18} className="admin-sidebar-icon" />
              <span>直播设置</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 主内容区域 */}
      <div className="admin-content">
        <div className="card m-6">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">管理员账户</h3>
              <button 
                onClick={addAdminAccount}
                className="btn btn-primary"
              >
                <Plus size={14} className="mr-1" />
                <span>添加管理员</span>
              </button>
            </div>
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

  return (
    <div className="min-h-screen">
      {/* 视图切换控制 */}
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

      {/* 根据当前视图显示不同界面 */}
      {currentView === 'viewer' ? <ViewerInterface /> : <AdminInterface />}
    </div>
  );
};

export default FinanceLivePlatform;