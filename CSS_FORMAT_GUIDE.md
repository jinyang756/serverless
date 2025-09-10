# CSS样式格式指南 - 财经直播平台

本文档提供了为财经直播平台创建和使用CSS样式的规范和指导。

## 样式文件结构

新创建的CSS文件遵循以下结构：

```
/* 财经直播平台专用样式 */

/* 直播相关CSS变量 */
:root {
  /* 主题色彩变量 */
  --live-primary: #1a73e8;
  --live-primary-hover: #1557b0;
  /* 其他变量... */
}

/* 主容器样式 */
.live-container {
  /* 样式定义 */
}

/* 各个组件样式 */
.video-player {
  /* 样式定义 */
}

/* 响应式设计 */
@media (max-width: 1024px) {
  /* 响应式样式 */
}

/* 工具类 */
.flex {
  /* 样式定义 */
}
```

## CSS变量使用规范

1. **主题色彩变量**：使用`--live-`前缀定义所有直播平台相关的CSS变量
2. **变量分类**：
   - 主题色彩（primary, secondary等）
   - 背景色（background, dark-bg等）
   - 文本颜色（text-primary, text-secondary等）
   - 边框颜色（border）
   - 状态颜色（success, warning, danger）
   - 组件特定样式变量

3. **使用方法**：在样式中通过`var(--live-primary)`方式引用变量

## 类命名规范

1. **BEM-like命名约定**：
   - 主组件：`.live-container`, `.video-player`, `.chat-area`
   - 子组件：`.video-controls__buttons`, `.chat-message__username`
   - 修饰符：`.chat-message__username--admin`

2. **语义化命名**：使用清晰描述组件功能的名称

3. **小写字母+连字符**：所有类名都使用小写字母，单词之间用连字符连接

## 组件样式结构

每个主要组件都遵循以下样式结构：

```css
/* 组件容器 */
.component-name {
  display: flex;
  flex-direction: column;
  /* 其他容器样式 */
}

/* 组件子元素 */
.component-name__child-element {
  /* 子元素样式 */
}

/* 组件状态 */
.component-name:hover {
  /* 悬停状态 */
}
```

## 如何在React组件中使用

1. **导入CSS文件**：

```javascript
import '../styles/finance-live.css';
```

2. **应用类名**：

```jsx
<div className="live-container">
  <div className="live-player-area">
    <div className="video-player">
      {/* 播放器内容 */}
    </div>
  </div>
  <div className="chat-area">
    {/* 聊天区域内容 */}
  </div>
</div>
```

3. **状态条件类名**：

```jsx
<button className={`control-btn ${isPlaying ? 'playing' : 'paused'}`}>
  {/* 按钮内容 */}
</button>
```

## 响应式设计规范

1. **断点设置**：
   - 大屏：默认样式
   - 中屏：`@media (max-width: 1024px)`
   - 小屏：`@media (max-width: 768px)`

2. **响应式策略**：
   - 中屏：调整侧边栏宽度
   - 小屏：切换为垂直布局，聊天区域位于底部

## 动画效果

为提升用户体验，添加了适度的动画效果：

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-message {
  animation: fadeIn 0.3s ease;
}
```

## 工具类

为方便布局，提供了常用的工具类：

```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
/* 其他工具类... */
```

## 示例：完整的组件样式应用

下面是一个完整的组件示例，展示如何应用这些CSS样式：

```jsx
import React from 'react';
import { Play, Pause, Send } from 'lucide-react';
import '../styles/finance-live.css';

const LiveStreamComponent = ({ isPlaying, onTogglePlay, messages, onSendMessage }) => {
  const [message, setMessage] = React.useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="live-container">
      {/* 视频播放区域 */}
      <div className="live-player-area">
        <div className="video-player">
          <div className="video-player__placeholder">
            <div className="video-player__placeholder-content">
              <h3>财经市场分析直播</h3>
              <p>2024年投资策略解读</p>
            </div>
          </div>
          
          {/* 视频控制栏 */}
          <div className="video-controls">
            <div className="video-controls__progress">
              <div className="video-controls__progress-filled"></div>
            </div>
            <div className="video-controls__buttons">
              <div className="video-controls__left">
                <button className="control-btn" onClick={onTogglePlay}>
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="chat-area">
        <div className="chat-header">
          <h2 className="chat-header__title">直播聊天</h2>
          <div className="chat-header__users">
            <span>1247 人在线</span>
          </div>
        </div>
        
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className="chat-message">
              <div className="chat-message__header">
                <span className={`chat-message__username ${msg.isAdmin ? 'chat-message__username--admin' : ''}`}>
                  {msg.user}
                </span>
                <span className="chat-message__time">{msg.time}</span>
              </div>
              <div className="chat-message__content">{msg.message}</div>
            </div>
          ))}
        </div>
        
        <div className="chat-input">
          <form className="chat-input__form" onSubmit={handleSend}>
            <input
              type="text"
              className="chat-input__field"
              placeholder="发送消息..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" className="chat-input__button" disabled={!message.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamComponent;
```

按照上述规范创建和使用CSS样式，可以确保财经直播平台的UI一致性和可维护性。