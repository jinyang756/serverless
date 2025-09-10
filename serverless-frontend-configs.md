// ==================== Vercel 部署配置 ====================

// vercel.json
{
  "version": 2,
  "name": "finance-live-platform",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "https://your-api-domain.com/api",
    "REACT_APP_WS_URL": "wss://your-websocket-domain.com"
  }
}

// ==================== package.json 更新 ====================
{
  "name": "finance-live-frontend",
  "version": "1.0.0",
  "private": true,
  "homepage": "https://your-domain.com",
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-scripts": "5.0.1",
    "axios": "^1.4.0",
    "socket.io-client": "^4.7.1",
    "lucide-react": "^0.263.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build && npm run generate-sitemap",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "generate-sitemap": "node scripts/generate-sitemap.js",
    "deploy": "vercel --prod"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.0"
  }
}

// ==================== 环境变量配置 ====================

// .env.local (开发环境)
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001

// .env.production (生产环境，Vercel 会自动使用)
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_WS_URL=wss://ws.yourdomain.com

// ==================== 更新的 API 客户端配置 ====================

// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.yourdomain.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Serverless 函数可能需要更长时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证和重试机制
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加请求 ID 用于追踪
    config.headers['X-Request-ID'] = Date.now().toString();
    
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理 Serverless 特有的错误
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 处理 Lambda 冷启动超时
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      originalRequest._retry = true;
      return api(originalRequest);
    }
    
    // 处理认证错误
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // 处理 API Gateway 错误
    if (error.response?.status === 502 || error.response?.status === 503) {
      console.warn('API Gateway error, retrying...', error);
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待 1 秒
        return api(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

// Serverless 优化的 API 方法
export const streamAPI = {
  getStreamInfo: () => api.get('/stream/info'),
  updateStreamSettings: (settings) => api.put('/stream/settings', settings),
  startStream: (data) => api.post('/stream/start', data),
  stopStream: () => api.post('/stream/stop'),
};

export const chatAPI = {
  getMessages: (params = {}) => api.get('/chat/messages', { params }),
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
  updateChatSettings: (settings) => api.put('/chat/settings', settings),
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
};

export const adminAPI = {
  getAdmins: () => api.get('/admin/accounts'),
  createAdmin: (adminData) => api.post('/admin/accounts', adminData),
  updateAdmin: (adminId, adminData) => api.put(`/admin/accounts/${adminId}`, adminData),
  deleteAdmin: (adminId) => api.delete(`/admin/accounts/${adminId}`),
};

export default api;

// ==================== WebSocket 客户端优化 ====================

// src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const connectSocket = useCallback(() => {
    const WS_URL = process.env.REACT_APP_WS_URL || 'wss://ws.yourdomain.com';
    
    const newSocket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: maxReconnectAttempts,
      forceNew: true
    });
    
    newSocket.on('connect', () => {
      setConnected(true);
      setReconnectAttempts(0);
      console.log('WebSocket connected');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('WebSocket disconnected');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      setReconnectAttempts(attemptNumber);
      console.log(`WebSocket reconnection attempt: ${attemptNumber}`);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return newSocket;
  }, []);

  useEffect(() => {
    const socketInstance = connectSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [connectSocket]);

  // 手动重连功能
  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    setTimeout(() => {
      connectSocket();
    }, 1000);
  }, [socket, connectSocket]);

  const value = {
    socket,
    connected,
    reconnectAttempts,
    maxReconnectAttempts,
    reconnect
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// ==================== Netlify 配置 ====================

// netlify.toml
[build]
  publish = "build"
  command = "npm run build"

[[redirects]]
  from = "/api/*"
  to = "https://your-api-gateway-domain.execute-api.region.amazonaws.com/prod/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  REACT_APP_API_URL = "https://api.yourdomain.com/api"
  REACT_APP_WS_URL = "wss://ws.yourdomain.com"

# Headers for security
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache static assets
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# ==================== PWA 支持 ====================

// public/manifest.json
{
  "short_name": "财经直播",
  "name": "财经直播平台",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#2563eb",
  "background_color": "#ffffff"
}

// ==================== 性能优化配置 ====================

// src/utils/lazyLoading.js
import { lazy } from 'react';

// 懒加载组件
export const AdminPage = lazy(() => 
  import('../pages/AdminPage').then(module => ({
    default: module.default
  }))
);

export const ViewerPage = lazy(() => 
  import('../pages/ViewerPage')
);

// ==================== 错误边界 ====================

// src/components/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // 发送错误到监控服务
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToService(error, errorInfo);
    }
  }

  sendErrorToService = (error, errorInfo) => {
    // 集成错误监控服务（如 Sentry）
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: error.toString(),
        errorInfo: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(console.error);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">出现了一些问题</h3>
              <p className="mt-2 text-sm text-gray-500">
                应用程序遇到了错误。请刷新页面重试，或联系技术支持。
              </p>
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  刷新页面
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;