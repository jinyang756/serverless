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
          
          {/* 播放控制 */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
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
      </div>
      
      {/* 聊天区域 */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-medium text-gray-800">直播聊天</h3>
          <button 
            onClick={() => setCurrentView('admin')}
            className="text-blue-600 text-sm hover:underline"
          >
            管理
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isAdmin ? 'bg-blue-50 p-2 rounded-lg' : ''}`}>
              <div className="mr-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  <UserCheck size={16} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className={`font-medium text-sm ${msg.isAdmin ? 'text-blue-700' : 'text-gray-700'}`}>{msg.user}</span>
                  <span className="text-xs text-gray-400">{msg.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="输入消息..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button 
              onClick={sendMessage}
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition-colors"
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AdminInterface = () => (
    <div className="h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-6">直播管理后台</h2>
        <div className="space-y-1">
          <button 
            onClick={() => setCurrentView('viewer')}
            className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Eye size={18} />
            <span>返回直播间</span>
          </button>
          <div className="pt-4 border-t border-gray-200 mt-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">设置</p>
            <button className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <Shield size={18} />
              <span>管理员账户</span>
            </button>
            <button className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <Settings size={18} />
              <span>聊天设置</span>
            </button>
            <button className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <Video size={18} />
              <span>直播设置</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 主内容区域 */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">管理员账户</h3>
            <button 
              onClick={addAdminAccount}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} />
              <span>添加管理员</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminAccounts.map(admin => (
                  <tr key={admin.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{admin.username}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{admin.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{admin.role}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${admin.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {admin.active ? '活跃' : '禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => toggleAdminStatus(admin.id)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
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