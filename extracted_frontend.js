import React, { useState, useEffect } from 'react';
import { 
  Video, Mic, Pause, Share2, MessageSquare, MoreHorizontal, 
  Monitor, Eye, Users, BarChart2, DollarSign, TrendingUp 
} from 'lucide-react';

// 从HTML文件提取的财经直播平台前端代码

export default function FinanceLivePlatform() {
  const [isLive, setIsLive] = useState(true);
  const [viewerCount, setViewerCount] = useState(1860000);
  const [currentTime, setCurrentTime] = useState('12:40');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // 模拟观众数量波动
  useEffect(() => {
    const viewerTimer = setInterval(() => {
      setViewerCount(prev => Math.max(1800000, prev + Math.floor(Math.random() * 10000) - 5000));
    }, 5000);

    return () => clearInterval(viewerTimer);
  }, []);

  const formatViewerCount = (count) => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      {/* 股票图表背景装饰 */}
      <svg className="stock-chart absolute w-full h-36 opacity-20" viewBox="0 0 1000 150" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,100 Q250,50 500,120 T1000,80" fill="none" stroke="#1E40AF" strokeWidth="2" />
        <path d="M0,80 Q250,120 500,60 T1000,100" fill="none" stroke="#E60012" strokeWidth="2" />
      </svg>

      {/* 顶部导航栏 */}
      <header className="relative z-10 bg-gray-900 bg-opacity-90 backdrop-filter backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-blue-500" />
            <span className="text-lg font-bold text-blue-500">国泰海通证券</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm md:text-base mr-4 font-medium">2025国泰海通财富领航特别节目——首席来了</span>
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div> 直播中
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
              <Users className="h-5 w-5 text-gray-300" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
              <BarChart2 className="h-5 w-5 text-gray-300" />
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-grow relative">
        {/* 视频播放区域 */}
        <div className="live-stream-container relative w-full aspect-video bg-black overflow-hidden">
          {/* 视频播放占位符 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-20 w-20 mx-auto text-blue-500 mb-4 opacity-80" />
              <p className="text-xl text-gray-400">国泰海通证券直播视频</p>
            </div>
          </div>

          {/* 直播控制按钮 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center bg-gray-900 bg-opacity-70 rounded-full px-4 py-2">
            <button className="control-btn mr-2 active" id="camera-btn" title="摄像头" onClick={() => setIsCameraOn(!isCameraOn)}>
              <Video className={`h-5 w-5 ${isCameraOn ? 'text-white' : 'text-red-500'}`} />
            </button>
            <button className="control-btn mr-2" id="mute-btn" title="麦克风" onClick={() => setIsMuted(!isMuted)}>
              <Mic className={`h-5 w-5 ${isMuted ? 'text-red-500' : 'text-white'}`} />
            </button>
            <button className="control-btn" id="pause-btn" title="暂停" onClick={() => setIsPaused(!isPaused)}>
              <Pause className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* 直播信息卡片 */}
          <div className="tag-card absolute bottom-0 left-0 right-0 p-4 md:p-6 rounded-b-lg bg-gradient-to-t from-gray-900 to-transparent">
            <div className="text-white text-center">
              <div className="text-xl md:text-2xl font-bold mb-2 tracking-wide">国泰海通证券 财富领航特别节目</div>
              <div className="text-lg md:text-xl mb-3 text-gray-100">专业投资顾问 助您财富增长</div>
              <div className="text-sm md:text-base text-gray-300">资深分析师在线解读市场热点，与您面对面交流</div>
            </div>
          </div>
        </div>

        {/* 直播详情和互动区域 */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 直播详情区域 */}
            <div className="lg:col-span-2 bg-gray-800 bg-opacity-80 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Monitor className="h-5 w-5 mr-2 text-blue-500" />
                直播详情
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  欢迎观看国泰海通证券2025财富领航特别节目！今天我们邀请到了资深分析师张教授，为大家深入解析当前市场走势，分享投资策略和风险防范措施。
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-3 py-1 bg-blue-900 bg-opacity-50 rounded-full text-sm text-blue-200">#市场分析</span>
                  <span className="px-3 py-1 bg-blue-900 bg-opacity-50 rounded-full text-sm text-blue-200">#投资策略</span>
                  <span className="px-3 py-1 bg-blue-900 bg-opacity-50 rounded-full text-sm text-blue-200">#风险管理</span>
                  <span className="px-3 py-1 bg-blue-900 bg-opacity-50 rounded-full text-sm text-blue-200">#财富增长</span>
                </div>
              </div>
            </div>

            {/* 在线观众和互动统计 */}
            <div className="bg-gray-800 bg-opacity-80 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Eye className="h-5 w-5 mr-2 text-blue-500" />
                观众互动
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                  <span className="text-gray-300">在线观众</span>
                  <span className="text-white font-bold text-xl">{formatViewerCount(viewerCount)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                  <span className="text-gray-300">互动消息</span>
                  <span className="text-white font-bold">2,536</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                  <span className="text-gray-300">点赞数</span>
                  <span className="text-white font-bold">12,874</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 底部信息栏 */}
      <footer className="footer-gradient text-white py-3 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center text-sm text-gray-300 mb-3 md:mb-0">
              <span className="mr-4"><i className="fas fa-clock mr-1"></i> <span id="live-time">{currentTime}</span></span>
              <span><i className="fas fa-user mr-1"></i> {formatViewerCount(viewerCount)}观众</span>
            </div>
            <div className="flex space-x-4">
              <button className="text-gray-300 hover:text-white transition-colors btn-effect" title="聊天">
                <MessageSquare className="h-5 w-5" />
              </button>
              <button className="text-gray-300 hover:text-white transition-colors btn-effect" title="分享">
                <Share2 className="h-5 w-5" />
              </button>
              <button className="text-gray-300 hover:text-white transition-colors btn-effect" title="更多">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 聊天面板按钮 - 固定在右下角 */}
      <button className="fixed bottom-20 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-20">
        <MessageSquare className="h-6 w-6" />
      </button>
    </div>
  );
}