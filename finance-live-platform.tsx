import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Users, 
  Send, 
  Video, 
  Monitor, 
  Camera,
  UserCheck,
  Shield,
  Trash2,
  Edit,
  Plus,
  Eye,
  EyeOff
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
    <div className="h-screen bg-gray-50 flex">
      {/* 主播放区域 */}
      <div className="flex-1 flex flex-col">
        {/* 视频播放器 */}
        <div className="flex-1 bg-gray-900 relative">
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-800">
            <div className="text-center text-white">
              <Video size={64} className="mx-auto mb-4 opacity-70" />
              <h3 className="text-xl font-medium mb-2">财经市场分析直播</h3>
              <p className="text-blue-200">2024年第四季度投资策略解读</p>
            </div>
          </div>
          
          {/* 播放控制栏 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              >
                {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white" />}
              </button>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 bg-gray-600 hover:bg-gray-700 rounded-full transition-colors"
              >
                {isMuted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
              </button>
              <div className="flex-1 bg-gray-600 h-1 rounded">
                <div className="bg-blue-500 h-1 rounded" style={{ width: '35%' }}></div>
              </div>
              <span className="text-white text-sm">12:35 / 36:00</span>
            </div>
          </div>
        </div>

        {/* 直播信息栏 */}
        <div className="bg-white border-t p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">A股市场深度解析 - 机构持仓变化分析</h2>
              <p className="text-gray-600 text-sm">主讲：资深财经分析师 | 实时解读市场动态</p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                直播中
              </div>
              <div className="flex items-center">
                <Users size={16} className="mr-1" />
                {onlineUsers.toLocaleString()} 在线
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 聊天室 */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <h3 className="font-semibold text-white">实时互动</h3>
          <p className="text-blue-100 text-sm">{onlineUsers.toLocaleString()} 人在线</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((msg) => (
            <div key={msg.id} className="group">
              <div className={`p-3 rounded-lg ${msg.isAdmin ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${msg.isAdmin ? 'text-blue-700' : 'text-gray-700'}`}>
                      {msg.user}
                    </span>
                    {msg.isAdmin && <Shield size={12} className="text-blue-600" />}
                  </div>
                  <span className="text-xs text-gray-500">{msg.time}</span>
                </div>
                <p className="text-gray-800 text-sm">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="参与讨论..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AdminInterface = () => (
    <div className="h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-800">直播管理后台</h1>
          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              系统状态正常
            </div>
            <div>当前观众：{onlineUsers.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* 侧边栏 */}
        <div className="w-64 bg-white shadow-sm border-r">
          <nav className="mt-6">
            <div className="px-4 space-y-1">
              <button className="w-full flex items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg">
                <Video size={18} className="mr-3" />
                直播源管理
              </button>
              <button className="w-full flex items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg">
                <Users size={18} className="mr-3" />
                聊天室管理
              </button>
              <button className="w-full flex items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg">
                <UserCheck size={18} className="mr-3" />
                管理员账户
              </button>
              <button className="w-full flex items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg">
                <Settings size={18} className="mr-3" />
                系统设置
              </button>
            </div>
          </nav>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* 直播源管理 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">直播源管理</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${streamSource === 'camera' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                     onClick={() => setStreamSource('camera')}>
                  <Camera size={24} className={`mb-2 ${streamSource === 'camera' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <h3 className="font-medium">摄像头</h3>
                  <p className="text-sm text-gray-600">使用本地摄像头</p>
                </div>
                <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${streamSource === 'screen' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                     onClick={() => setStreamSource('screen')}>
                  <Monitor size={24} className={`mb-2 ${streamSource === 'screen' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <h3 className="font-medium">屏幕分享</h3>
                  <p className="text-sm text-gray-600">分享屏幕内容</p>
                </div>
                <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${streamSource === 'video' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                     onClick={() => setStreamSource('video')}>
                  <Video size={24} className={`mb-2 ${streamSource === 'video' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <h3 className="font-medium">视频文件</h3>
                  <p className="text-sm text-gray-600">播放本地视频</p>
                </div>
              </div>
            </div>

            {/* 聊天室设置 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">聊天室设置</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">允许游客发言</h3>
                    <p className="text-sm text-gray-600">未登录用户可以发送消息</p>
                  </div>
                  <button 
                    onClick={() => setChatSettings(prev => ({...prev, allowGuests: !prev.allowGuests}))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${chatSettings.allowGuests ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${chatSettings.allowGuests ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">消息审核</h3>
                    <p className="text-sm text-gray-600">新消息需要管理员审核后显示</p>
                  </div>
                  <button 
                    onClick={() => setChatSettings(prev => ({...prev, moderateMessages: !prev.moderateMessages}))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${chatSettings.moderateMessages ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${chatSettings.moderateMessages ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">慢速模式</h3>
                    <p className="text-sm text-gray-600">限制用户发消息频率</p>
                  </div>
                  <button 
                    onClick={() => setChatSettings(prev => ({...prev, slowMode: !prev.slowMode}))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${chatSettings.slowMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${chatSettings.slowMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* 消息管理 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">实时消息管理</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-sm font-medium ${msg.isAdmin ? 'text-blue-600' : 'text-gray-700'}`}>
                          {msg.user}
                        </span>
                        {msg.isAdmin && <Shield size={12} className="text-blue-600" />}
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </div>
                      <p className="text-sm text-gray-800">{msg.message}</p>
                    </div>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 管理员账户管理 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">管理员账户</h2>
                <button 
                  onClick={addAdminAccount}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  添加管理员
                </button>
              </div>
              <div className="space-y-3">
                {adminAccounts.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-medium text-gray-800">{admin.username}</h3>
                          <p className="text-sm text-gray-600">{admin.email}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${admin.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {admin.role === 'admin' ? '超级管理员' : '版主'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleAdminStatus(admin.id)}
                        className={`p-2 rounded-lg transition-colors ${admin.active ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}
                      >
                        {admin.active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-sans">
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