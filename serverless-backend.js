// ==================== AWS Lambda 后端架构 ====================

// serverless.yml - Serverless Framework 配置
service: finance-live-api

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: ${opt:region, 'us-east-1'}
  stage: ${opt:stage, 'dev'}
  memorySize: 512
  timeout: 30
  
  environment:
    MONGODB_URI: ${env:MONGODB_URI}
    JWT_SECRET: ${env:JWT_SECRET}
    JWT_EXPIRE: ${env:JWT_EXPIRE, '30d'}
    STAGE: ${self:provider.stage}
    
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
          Resource: 
            - "arn:aws:dynamodb:${self:provider.region}:*:table/finance-live-*"
        - Effect: Allow
          Action:
            - execute-api:ManageConnections
          Resource:
            - "arn:aws:execute-api:${self:provider.region}:*:*/@connections/*"

plugins:
  - serverless-webpack
  - serverless-offline
  - serverless-dotenv-plugin

custom:
  webpack:
    webpackConfig: ./webpack.config.js
    includeModules: true
  
  customDomain:
    domainName: api.yourdomain.com
    basePath: ''
    stage: ${self:provider.stage}
    createRoute53Record: true

functions:
  # 认证相关函数
  auth:
    handler: src/handlers/auth.handler
    events:
      - http:
          path: /auth/{proxy+}
          method: ANY
          cors: true

  # 直播相关函数
  stream:
    handler: src/handlers/stream.handler
    events:
      - http:
          path: /stream/{proxy+}
          method: ANY
          cors: true
    
  # 聊天相关函数
  chat:
    handler: src/handlers/chat.handler
    events:
      - http:
          path: /chat/{proxy+}
          method: ANY
          cors: true
  
  # 管理员相关函数
  admin:
    handler: src/handlers/admin.handler
    events:
      - http:
          path: /admin/{proxy+}
          method: ANY
          cors: true

  # WebSocket 连接管理
  websocketConnect:
    handler: src/handlers/websocket.connectHandler
    events:
      - websocket:
          route: $connect
          
  websocketDisconnect:
    handler: src/handlers/websocket.disconnectHandler
    events:
      - websocket:
          route: $disconnect
          
  websocketDefault:
    handler: src/handlers/websocket.defaultHandler
    events:
      - websocket:
          route: $default

resources:
  Resources:
    # DynamoDB 表用于 WebSocket 连接管理
    WebSocketConnectionsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: finance-live-websocket-connections
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: connectionId
            AttributeType: S
        KeySchema:
          - AttributeName: connectionId
            KeyType: HASH
        TimeToLiveSpecification:
          AttributeName: ttl
          Enabled: true

    # DynamoDB 表用于消息缓存
    MessagesTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: finance-live-messages
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: streamId
            AttributeType: S
          - AttributeName: timestamp
            AttributeType: N
        KeySchema:
          - AttributeName: streamId
            KeyType: HASH
          - AttributeName: timestamp
            KeyType: RANGE
        TimeToLiveSpecification:
          AttributeName: ttl
          Enabled: true

# ==================== 数据库连接管理 ====================

// src/utils/database.js
const mongoose = require('mongoose');

let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 1, // Lambda 环境下限制连接数
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false, // 禁用 mongoose 缓冲
      bufferMaxEntries: 0
    });

    cachedDb = connection;
    console.log('Connected to MongoDB');
    return cachedDb;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

module.exports = { connectToDatabase };

// ==================== Lambda 处理器基础类 ====================

// src/utils/lambdaHandler.js
const { connectToDatabase } = require('./database');

class LambdaHandler {
  constructor() {
    this.db = null;
  }

  async initialize() {
    if (!this.db) {
      this.db = await connectToDatabase();
    }
  }

  createResponse(statusCode, body, headers = {}) {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...headers
      },
      body: JSON.stringify(body)
    };
  }

  handleError(error) {
    console.error('Lambda handler error:', error);
    
    if (error.name === 'ValidationError') {
      return this.createResponse(400, {
        success: false,
        message: '输入数据验证失败',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    if (error.name === 'UnauthorizedError') {
      return this.createResponse(401, {
        success: false,
        message: '未授权访问'
      });
    }

    return this.createResponse(500, {
      success: false,
      message: '服务器内部错误'
    });
  }

  async handleRequest(event, context, handler) {
    // 设置 Lambda 上下文
    context.callbackWaitsForEmptyEventLoop = false;

    try {
      await this.initialize();
      return await handler(event, context);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

module.exports = LambdaHandler;

// ==================== 认证 Lambda 函数 ====================

// src/handlers/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const LambdaHandler = require('../utils/lambdaHandler');

class AuthHandler extends LambdaHandler {
  async handler(event, context) {
    return this.handleRequest(event, context, async () => {
      const { httpMethod, path, pathParameters, body: requestBody } = event;
      const action = pathParameters?.proxy || path.split('/').pop();

      switch (httpMethod) {
        case 'POST':
          switch (action) {
            case 'login':
              return this.login(JSON.parse(requestBody));
            case 'register':
              return this.register(JSON.parse(requestBody));
            case 'refresh':
              return this.refreshToken(event.headers);
            default:
              return this.createResponse(404, { message: 'Endpoint not found' });
          }
        case 'GET':
          switch (action) {
            case 'me':
              return this.getProfile(event.headers);
            default:
              return this.createResponse(404, { message: 'Endpoint not found' });
          }
        default:
          return this.createResponse(405, { message: 'Method not allowed' });
      }
    });
  }

  async login(body) {
    const { login, password } = body;

    if (!login || !password) {
      return this.createResponse(400, {
        success: false,
        message: '请提供用户名和密码'
      });
    }

    const user = await User.findOne({
      $or: [
        { email: login.toLowerCase() },
        { username: login }
      ]
    }).select('+password');

    if (!user || !await bcrypt.compare(password, user.password)) {
      return this.createResponse(401, {
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (!user.isActive) {
      return this.createResponse(401, {
        success: false,
        message: '账户已被禁用'
      });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user._id);

    return this.createResponse(200, {
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  }

  async register(body) {
    const { username, email, password } = body;

    // 基本验证
    if (!username || !email || !password) {
      return this.createResponse(400, {
        success: false,
        message: '请填写所有必填字段'
      });
    }

    if (password.length < 6) {
      return this.createResponse(400, {
        success: false,
        message: '密码长度至少为6个字符'
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      return this.createResponse(400, {
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // 创建新用户
    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
      role: 'viewer'
    });

    await user.save();

    const token = this.generateToken(user._id);

    return this.createResponse(201, {
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  }

  async getProfile(headers) {
    const user = await this.verifyToken(headers);
    if (!user) {
      return this.createResponse(401, {
        success: false,
        message: '无效的访问令牌'
      });
    }

    return this.createResponse(200, {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  }

  async refreshToken(headers) {
    const user = await this.verifyToken(headers);
    if (!user) {
      return this.createResponse(401, {
        success: false,
        message: '无效的访问令牌'
      });
    }

    const token = this.generateToken(user._id);

    return this.createResponse(200, {
      success: true,
      token
    });
  }

  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
  }

  async verifyToken(headers) {
    const authHeader = headers.Authorization || headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      return user;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }
}

const authHandler = new AuthHandler();
module.exports.handler = authHandler.handler.bind(authHandler);

// ==================== 直播 Lambda 函数 ====================

// src/handlers/stream.js
const Stream = require('../models/Stream');
const LambdaHandler = require('../utils/lambdaHandler');

class StreamHandler extends LambdaHandler {
  async handler(event, context) {
    return this.handleRequest(event, context, async () => {
      const { httpMethod, pathParameters, body: requestBody, headers } = event;
      const action = pathParameters?.proxy || 'info';

      switch (httpMethod) {
        case 'GET':
          switch (action) {
            case 'info':
              return this.getStreamInfo();
            default:
              return this.createResponse(404, { message: 'Endpoint not found' });
          }
        case 'POST':
          // 需要管理员权限的操作
          const user = await this.verifyToken(headers);
          if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return this.createResponse(403, {
              success: false,
              message: '权限不足'
            });
          }

          switch (action) {
            case 'start':
              return this.startStream(JSON.parse(requestBody));
            case 'stop':
              return this.stopStream();
            default:
              return this.createResponse(404, { message: 'Endpoint not found' });
          }
        case 'PUT':
          const adminUser = await this.verifyToken(headers);
          if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
            return this.createResponse(403, {
              success: false,
              message: '权限不足'
            });
          }

          switch (action) {
            case 'settings':
              return this.updateStreamSettings(JSON.parse(requestBody));
            default:
              return this.createResponse(404, { message: 'Endpoint not found' });
          }
        default:
          return this.createResponse(405, { message: 'Method not allowed' });
      }
    });
  }

  async getStreamInfo() {
    try {
      const stream = await Stream.findOne({ isLive: true });
      
      if (!stream) {
        return this.createResponse(200, {
          success: true,
          data: {
            title: '暂无直播',
            description: '当前没有正在进行的直播',
            isLive: false,
            viewerCount: 0
          }
        });
      }

      return this.createResponse(200, {
        success: true,
        data: {
          title: stream.title,
          description: stream.description,
          isLive: stream.isLive,
          viewerCount: stream.viewerCount,
          startedAt: stream.startedAt,
          quality: stream.quality,
          settings: stream.settings
        }
      });
    } catch (error) {
      console.error('Get stream info error:', error);
      return this.createResponse(500, {
        success: false,
        message: '获取直播信息失败'
      });
    }
  }

  async startStream(body) {
    try {
      const { title, description, source = 'camera', quality = '1080p' } = body;

      if (!title || title.trim().length === 0) {
        return this.createResponse(400, {
          success: false,
          message: '直播标题不能为空'
        });
      }

      // 结束现有的直播
      await Stream.updateMany(
        { isLive: true }, 
        { 
          isLive: false, 
          endedAt: new Date() 
        }
      );

      // 创建新的直播
      const streamKey = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const stream = new Stream({
        title: title.trim(),
        description: description || '',
        streamKey,
        source,
        quality,
        isLive: true,
        startedAt: new Date(),
        viewerCount: 0,
        maxViewers: 0
      });

      await stream.save();

      return this.createResponse(200, {
        success: true,
        data: {
          id: stream._id,
          title: stream.title,
          streamKey: stream.streamKey,
          isLive: stream.isLive,
          startedAt: stream.startedAt
        }
      });
    } catch (error) {
      console.error('Start stream error:', error);
      return this.createResponse(500, {
        success: false,
        message: '开始直播失败'
      });
    }
  }

  async stopStream() {
    try {
      const stream = await Stream.findOneAndUpdate(
        { isLive: true },
        { 
          isLive: false, 
          endedAt: new Date() 
        },
        { new: true }
      );

      if (!stream) {
        return this.createResponse(404, {
          success: false,
          message: '没有正在进行的直播'
        });
      }

      return this.createResponse(200, {
        success: true,
        message: '直播已停止',
        data: {
          id: stream._id,
          endedAt: stream.endedAt
        }
      });
    } catch (error) {
      console.error('Stop stream error:', error);
      return this.createResponse(500, {
        success: false,
        message: '停止直播失败'
      });
    }
  }

  async updateStreamSettings(body) {
    try {
      const { allowChat, allowGuests, moderateMessages, slowMode, slowModeDelay } = body;

      const stream = await Stream.findOneAndUpdate(
        { isLive: true },
        {
          'settings.allowChat': allowChat,
          'settings.allowGuests': allowGuests,
          'settings.moderateMessages': moderateMessages,
          'settings.slowMode': slowMode,
          'settings.slowModeDelay': slowModeDelay || 10
        },
        { new: true }
      );

      if (!stream) {
        return this.createResponse(404, {
          success: false,
          message: '没有正在进行的直播'
        });
      }

      return this.createResponse(200, {
        success: true,
        data: stream.settings
      });
    } catch (error) {
      console.error('Update stream settings error:', error);
      return this.createResponse(500, {
        success: false,
        message: '更新设置失败'
      });
    }
  }

  async verifyToken(headers) {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    
    const authHeader = headers.Authorization || headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      return user;
    } catch (error) {
      return null;
    }
  }
}

const streamHandler = new StreamHandler();
module.exports.handler = streamHandler.handler.bind(streamHandler);

// ==================== WebSocket Lambda 函数 ====================

// src/handlers/websocket.js
const AWS = require('aws-sdk');
const Message = require('../models/Message');
const Stream = require('../models/Stream');
const LambdaHandler = require('../utils/lambdaHandler');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const apiGateway = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

class WebSocketHandler extends LambdaHandler {
  async connectHandler(event, context) {
    return this.handleRequest(event, context, async () => {
      const connectionId = event.requestContext.connectionId;
      const timestamp = Date.now();
      
      try {
        // 保存连接信息到 DynamoDB
        await dynamodb.put({
          TableName: 'finance-live-websocket-connections',
          Item: {
            connectionId,
            timestamp,
            ttl: Math.floor(timestamp / 1000) + 86400 // 24小时过期
          }
        }).promise();

        // 更新在线用户数
        await this.updateViewerCount(1);

        console.log(`WebSocket connected: ${connectionId}`);
        return { statusCode: 200 };
      } catch (error) {
        console.error('WebSocket connect error:', error);
        return { statusCode: 500 };
      }
    });
  }

  async disconnectHandler(event, context) {
    return this.handleRequest(event, context, async () => {
      const connectionId = event.requestContext.connectionId;
      
      try {
        // 从 DynamoDB 删除连接信息
        await dynamodb.delete({
          TableName: 'finance-live-websocket-connections',
          Key: { connectionId }
        }).promise();

        // 更新在线用户数
        await this.updateViewerCount(-1);

        console.log(`WebSocket disconnected: ${connectionId}`);
        return { statusCode: 200 };
      } catch (error) {
        console.error('WebSocket disconnect error:', error);
        return { statusCode: 500 };
      }
    });
  }

  async defaultHandler(event, context) {
    return this.handleRequest(event, context, async () => {
      const connectionId = event.requestContext.connectionId;
      const body = JSON.parse(event.body || '{}');
      const action = body.action;

      try {
        switch (action) {
          case 'sendMessage':
            return await this.handleSendMessage(connectionId, body.data);
          case 'joinStream':
            return await this.handleJoinStream(connectionId, body.data);
          case 'deleteMessage':
            return await this.handleDeleteMessage(connectionId, body.data);
          default:
            console.log('Unknown WebSocket action:', action);
            return { statusCode: 400 };
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        await this.sendToConnection(connectionId, {
          type: 'error',
          message: '消息处理失败'
        });
        return { statusCode: 500 };
      }
    });
  }

  async handleSendMessage(connectionId, data) {
    const { text, username, isAdmin, userId } = data;

    // 验证消息内容
    if (!text || text.trim().length === 0 || text.length > 500) {
      await this.sendToConnection(connectionId, {
        type: 'messageError',
        message: '消息内容无效'
      });
      return { statusCode: 400 };
    }

    // 检查直播设置
    const stream = await Stream.findOne({ isLive: true });
    if (stream && !stream.settings.allowChat) {
      await this.sendToConnection(connectionId, {
        type: 'messageError',
        message: '当前直播间禁止发言'
      });
      return { statusCode: 403 };
    }

    // 创建消息
    const message = new Message({
      text: text.trim(),
      username: username || `访客${Math.floor(Math.random() * 1000)}`,
      userId: userId || null,
      isAdmin: isAdmin || false,
      streamId: 'main'
    });

    await message.save();

    // 同时保存到 DynamoDB 用于快速访问
    await dynamodb.put({
      TableName: 'finance-live-messages',
      Item: {
        streamId: 'main',
        timestamp: message.createdAt.getTime(),
        messageId: message._id.toString(),
        text: message.text,
        username: message.username,
        isAdmin: message.isAdmin,
        ttl: Math.floor(Date.now() / 1000) + 604800 // 7天过期
      }
    }).promise();

    const messageObj = {
      type: 'message',
      data: {
        id: message._id,
        text: message.text,
        username: message.username,
        isAdmin: message.isAdmin,
        timestamp: message.createdAt
      }
    };

    // 广播消息给所有连接
    await this.broadcastMessage(messageObj);

    return { statusCode: 200 };
  }

  async handleJoinStream(connectionId, data) {
    try {
      // 发送消息历史
      const messages = await this.getRecentMessages();
      await this.sendToConnection(connectionId, {
        type: 'messageHistory',
        data: messages
      });

      // 发送当前在线人数
      const userCount = await this.getCurrentUserCount();
      await this.sendToConnection(connectionId, {
        type: 'userCount',
        data: userCount
      });

      return { statusCode: 200 };
    } catch (error) {
      console.error('Handle join stream error:', error);
      return { statusCode: 500 };
    }
  }

  async handleDeleteMessage(connectionId, data) {
    try {
      const { messageId, adminId } = data;

      // 验证管理员权限（这里简化处理）
      await Message.findByIdAndUpdate(messageId, {
        isDeleted: true,
        deletedBy: adminId
      });

      // 广播消息删除事件
      await this.broadcastMessage({
        type: 'messageDeleted',
        data: messageId
      });

      return { statusCode: 200 };
    } catch (error) {
      console.error('Delete message error:', error);
      return { statusCode: 500 };
    }
  }

  async getRecentMessages() {
    try {
      // 先尝试从 DynamoDB 获取
      const result = await dynamodb.query({
        TableName: 'finance-live-messages',
        KeyConditionExpression: 'streamId = :streamId',
        ExpressionAttributeValues: {
          ':streamId': 'main'
        },
        ScanIndexForward: false,
        Limit: 50
      }).promise();

      if (result.Items && result.Items.length > 0) {
        return result.Items.map(item => ({
          id: item.messageId,
          text: item.text,
          username: item.username,
          isAdmin: item.isAdmin,
          timestamp: new Date(item.timestamp)
        })).reverse();
      }

      // 如果 DynamoDB 没有数据，从 MongoDB 获取
      const messages = await Message.find({ 
        isDeleted: false,
        streamId: 'main'
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

      return messages.map(msg => ({
        id: msg._id,
        text: msg.text,
        username: msg.username,
        isAdmin: msg.isAdmin,
        timestamp: msg.createdAt
      })).reverse();
    } catch (error) {
      console.error('Get recent messages error:', error);
      return [];
    }
  }

  async getCurrentUserCount() {
    try {
      const result = await dynamodb.scan({
        TableName: 'finance-live-websocket-connections',
        Select: 'COUNT'
      }).promise();

      return result.Count || 0;
    } catch (error) {
      console.error('Get user count error:', error);
      return 0;
    }
  }

  async updateViewerCount(change) {
    try {
      await Stream.updateOne(
        { isLive: true },
        { 
          $inc: { viewerCount: change },
          $max: { maxViewers: '$viewerCount' }
        }
      );
    } catch (error) {
      console.error('Update viewer count error:', error);
    }
  }

  async broadcastMessage(message) {
    try {
      // 获取所有活跃连接
      const connections = await dynamodb.scan({
        TableName: 'finance-live-websocket-connections',
        ProjectionExpression: 'connectionId'
      }).promise();

      const sendPromises = connections.Items.map(async (connection) => {
        try {
          await this.sendToConnection(connection.connectionId, message);
        } catch (error) {
          if (error.statusCode === 410) {
            // 连接已断开，从数据库删除
            await dynamodb.delete({
              TableName: 'finance-live-websocket-connections',
              Key: { connectionId: connection.connectionId }
            }).promise();
          }
        }
      });

      await Promise.allSettled(sendPromises);
    } catch (error) {
      console.error('Broadcast message error:', error);
    }
  }

  async sendToConnection(connectionId, data) {
    try {
      await apiGateway.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(data)
      }).promise();
    } catch (error) {
      if (error.statusCode === 410) {
        console.log(`Connection ${connectionId} is no longer available`);
        throw error;
      }
      console.error(`Failed to send message to ${connectionId}:`, error);
      throw error;
    }
  }
}

const webSocketHandler = new WebSocketHandler();

module.exports.connectHandler = webSocketHandler.connectHandler.bind(webSocketHandler);
module.exports.disconnectHandler = webSocketHandler.disconnectHandler.bind(webSocketHandler);
module.exports.defaultHandler = webSocketHandler.defaultHandler.bind(webSocketHandler);

// ==================== 聊天 Lambda 函数 ====================

// src/handlers/chat.js
const Message = require('../models/Message');
const LambdaHandler = require('../utils/lambdaHandler');

class ChatHandler extends LambdaHandler {
  async handler(event, context) {
    return this.handleRequest(event, context, async () => {
      const { httpMethod, pathParameters, queryStringParameters, headers } = event;
      const action = pathParameters?.proxy || 'messages';

      switch (httpMethod) {
        case 'GET':
          switch (action) {
            case 'messages':
              return this.getMessages(queryStringParameters || {});
            case 'stats':
              const user = await this.verifyToken(headers);
              if (!user || !['admin', 'super_admin'].includes(user.role)) {
                return this.createResponse(403, {
                  success: false,
                  message: '权限不足'
                });
              }
              return this.getChatStats();
            default:
              return this.createResponse(404, { message: 'Endpoint not found' });
          }
        case 'DELETE':
          if (action.startsWith('messages/')) {
            const messageId = action.split('/')[1];
            const user = await this.verifyToken(headers);
            if (!user || !['moderator', 'admin', 'super_admin'].includes(user.role)) {
              return this.createResponse(403, {
                success: false,
                message: '权限不足'
              });
            }
            return this.deleteMessage(messageId, user.id);
          }
          return this.createResponse(404, { message: 'Endpoint not found' });
        default:
          return this.createResponse(405, { message: 'Method not allowed' });
      }
    });
  }

  async getMessages(queryParams) {
    try {
      const limit = Math.min(parseInt(queryParams.limit) || 50, 100);
      const skip = parseInt(queryParams.skip) || 0;
      
      const messages = await Message.find({ 
        isDeleted: false,
        streamId: 'main'
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'username role')
      .lean();

      return this.createResponse(200, {
        success: true,
        data: messages.reverse(),
        pagination: {
          limit,
          skip,
          total: await Message.countDocuments({ isDeleted: false, streamId: 'main' })
        }
      });
    } catch (error) {
      console.error('Get messages error:', error);
      return this.createResponse(500, {
        success: false,
        message: '获取消息失败'
      });
    }
  }

  async deleteMessage(messageId, adminId) {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { 
          isDeleted: true,
          deletedBy: adminId 
        },
        { new: true }
      );

      if (!message) {
        return this.createResponse(404, {
          success: false,
          message: '消息不存在'
        });
      }

      return this.createResponse(200, {
        success: true,
        message: '消息已删除'
      });
    } catch (error) {
      console.error('Delete message error:', error);
      return this.createResponse(500, {
        success: false,
        message: '删除消息失败'
      });
    }
  }

  async getChatStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalMessages, todayMessages, deletedMessages] = await Promise.all([
        Message.countDocuments({ isDeleted: false }),
        Message.countDocuments({ 
          isDeleted: false, 
          createdAt: { $gte: today } 
        }),
        Message.countDocuments({ isDeleted: true })
      ]);

      return this.createResponse(200, {
        success: true,
        data: {
          totalMessages,
          todayMessages,
          deletedMessages,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Get chat stats error:', error);
      return this.createResponse(500, {
        success: false,
        message: '获取统计信息失败'
      });
    }
  }

  async verifyToken(headers) {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    
    const authHeader = headers.Authorization || headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      return user;
    } catch (error) {
      return null;
    }
  }
}

const chatHandler = new ChatHandler();
module.exports.handler = chatHandler.handler.bind(chatHandler);

// ==================== package.json ====================
{
  "name": "finance-live-serverless",
  "version": "1.0.0",
  "description": "Serverless backend for finance live platform",
  "main": "handler.js",
  "scripts": {
    "deploy": "serverless deploy",
    "deploy-dev": "serverless deploy --stage dev",
    "deploy-prod": "serverless deploy --stage prod",
    "remove": "serverless remove",
    "logs": "serverless logs -f auth",
    "offline": "serverless offline start",
    "test": "jest"
  },
  "dependencies": {
    "aws-sdk": "^2.1450.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.5.0",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "serverless": "^3.34.0",
    "serverless-webpack": "^5.13.0",
    "serverless-offline": "^12.0.4",
    "serverless-dotenv-plugin": "^6.0.0",
    "webpack": "^5.88.0",
    "webpack-node-externals": "^3.0.0",
    "jest": "^29.6.0"
  }
}