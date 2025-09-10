# Serverless 项目常见问题诊断和解决方案

## 🏗️ 项目架构概览

本项目是一个财经直播平台，采用前后端分离架构：
- **前端**：基于 Next.js 14.1.0 和 React 18.2.0 开发，部署在 Vercel 上
- **后端**：基于 AWS Lambda 和 Serverless Framework 实现，提供 API 和 WebSocket 服务
- **数据库**：使用 MongoDB 作为主数据库，DynamoDB 用于 WebSocket 连接管理

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel/Netlify│───▶│  AWS API Gateway │───▶│  Lambda Functions│
│   (前端静态)     │    │  (API 路由)      │    │  (业务逻辑)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                ┌────────────────────────────────┐
                │     AWS API Gateway WebSocket   │
                │     (实时通信)                  │
                └────────────────────────────────┘
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                 │
  ┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐
  │   MongoDB     │  │   DynamoDB      │  │   CloudWatch    │
  │   (主数据库)  │  │   (WebSocket)   │  │   (日志监控)    │
  └───────────────┘  └─────────────────┘  └─────────────────┘
```

## 🔍 常见问题类别

### 1. 部署相关问题

#### 问题：前端 Vercel 部署失败
```bash
# 错误示例
Error: No build command found in package.json
Error: Failed to compile production build
Error: Environment variables are missing
```

**解决方案：**
```bash
# 1. 确保项目根目录有正确的 package.json
# 2. 检查 next.config.js 配置是否正确
# 3. 设置必要的环境变量
vercel env add REACT_APP_API_URL production
vercel env add REACT_APP_WS_URL production

# 4. 重新部署
vercel --prod
```

#### 问题：Serverless 后端部署失败或超时
```bash
# 错误示例
Error: The CloudFormation template is invalid
Error: Request timeout
Error: Rate exceeded
```

**解决方案：**
```bash
# 1. 增加部署超时时间
serverless deploy --stage dev --timeout 300

# 2. 分批部署函数
serverless deploy function --function auth
serverless deploy function --function stream

# 3. 清理之前的部署
serverless remove --stage dev
serverless deploy --stage dev

# 4. 检查 AWS 限制
aws service-quotas get-service-quota --service-code lambda --quota-code L-B99A9384
```

#### 问题：权限不足
```bash
# 错误示例
Error: User is not authorized to perform: iam:PassRole
Error: Access Denied
```

**解决方案：**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "lambda:*",
        "apigateway:*",
        "iam:GetRole",
        "iam:PassRole",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "dynamodb:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2. 配置文件问题

#### 问题：serverless-backend.js 配置问题
```javascript
// 错误的配置示例
// 在 serverless-backend.js 中的错误配置
functions: {
  // 缺少必要的 cors 配置
}
```

**修正后的配置参考：**
```javascript
// serverless-backend.js - Serverless Framework 配置
service: finance-live-api

frameworkVersion: '3'

provider: {
  name: aws,
  runtime: nodejs18.x,
  region: ${opt:region, 'us-east-1'},
  stage: ${opt:stage, 'dev'},
  memorySize: 512,
  timeout: 30,
  
  environment: {
    MONGODB_URI: ${env:MONGODB_URI},
    JWT_SECRET: ${env:JWT_SECRET},
    JWT_EXPIRE: ${env:JWT_EXPIRE, '30d'},
    STAGE: ${self:provider.stage}
  },
  
  iam: {
    role: {
      statements: [
        {
          Effect: Allow,
          Action: [
            dynamodb:Query,
            dynamodb:Scan,
            dynamodb:GetItem,
            dynamodb:PutItem,
            dynamodb:UpdateItem,
            dynamodb:DeleteItem
          ],
          Resource: [
            "arn:aws:dynamodb:${self:provider.region}:*:table/finance-live-*"
          ]
        },
        {
          Effect: Allow,
          Action: [
            execute-api:ManageConnections
          ],
          Resource: [
            "arn:aws:execute-api:${self:provider.region}:*:*/@connections/*"
          ]
        }
      ]
    }
  }
}

plugins: [
  serverless-webpack,
  serverless-offline,
  serverless-dotenv-plugin
]

custom: {
  webpack: {
    webpackConfig: ./webpack.config.js,
    includeModules: true
  }
}

// 函数配置示例
functions: {
  auth: {
    handler: src/handlers/auth.handler,
    events: [
      {
        http: {
          path: /auth/{proxy+},
          method: ANY,
          cors: true
        }
      }
    ]
  }
}
```

### 3. 依赖和打包问题

#### 问题：前端 Next.js 依赖安装失败
```bash
# 错误示例
Error: Cannot find module 'next'
Error: Failed to install dependencies
```

**解决方案：**
```bash
# 删除 node_modules 和 package-lock.json 重新安装
rm -rf node_modules package-lock.json
npm install

# 检查是否有版本冲突
npm list

# 如果仍有问题，尝试使用较新的 npm 版本
npm install -g npm@latest
npm install
```

#### 问题：Lambda 包过大或打包错误
```bash
# 错误示例
Error: Code storage limit exceeded
Error: Request entity too large
Error: Webpack compilation failed
```

**解决方案：**
```javascript
// 在 serverless-backend.js 中配置
plugins: [
  serverless-webpack,
  // 注意：避免使用过多插件导致配置复杂
]

custom: {
  webpack: {
    webpackConfig: './webpack.config.js',
    includeModules: {
      forceExclude: [
        'aws-sdk', // AWS Lambda 环境已自带
      ]
    },
    packager: 'npm',
    excludeFiles: 'src/**/*.test.js'
  }
}
```

```javascript
// webpack.config.js 示例
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
  entry: {
    'handlers/auth': './src/handlers/auth.js',
    'handlers/stream': './src/handlers/stream.js',
    'handlers/chat': './src/handlers/chat.js',
    'handlers/websocket': './src/handlers/websocket.js'
  },
  target: 'node',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  optimization: {
    minimize: true
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js'
  }
};
```

### 4. 本地开发问题

#### 问题：Next.js 开发服务器启动失败
```bash
# 错误示例
Error: Cannot find module 'next'
Error: Port 3000 is already in use
Error: Failed to compile
```

**解决方案：**
```bash
# 1. 确保已安装依赖
npm install

# 2. 检查端口占用情况并关闭占用的进程
# Windows 系统
netstat -ano | findstr :3000
# 找到 PID 后结束进程
taskkill /PID <PID> /F

# 3. 使用不同端口启动
npm run dev -p 3001

# 4. 清理缓存后重新启动
rm -rf .next
npm run dev
```

#### 问题：serverless-offline 启动失败或 API 端点不可用
```bash
# 错误示例
Error: Cannot find module 'serverless-offline'
Error: Port 3000 is already in use
Error: Missing environment variables
```

**解决方案：**
```bash
# 1. 安装依赖
cd serverless-backend
npm install

# 2. 检查环境变量配置
# 确保 .env 文件存在且包含必要的环境变量
cat .env
# 如果不存在，创建 .env 文件
cp .env.example .env

# 3. 指定端口启动
serverless offline start --port 3001

# 4. 检查 API 是否正常工作
curl http://localhost:3001/dev/api/test
```

### 5. 数据库连接问题

#### 问题：MongoDB 连接超时或失败
```javascript
// 错误示例日志
MongoDB connection error: Error: connect ETIMEDOUT
MongoDB connection error: Error: Authentication failed
```

**解决方案：**

首先，确保环境变量配置正确：
```bash
# 检查 .env 文件中的 MongoDB 连接字符串
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/finance_live?retryWrites=true&w=majority
```

然后，使用本项目中已实现的数据库连接管理方式：
```javascript
// 正确的连接方式 (基于项目中现有的 database.js)
const mongoose = require('mongoose');

let cachedDb = null;

const connectToDatabase = async () => {
  // Lambda 环境复用连接
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 1, // Lambda 限制连接数
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    };

    const connection = await mongoose.connect(process.env.MONGODB_URI, options);
    cachedDb = connection;
    
    return cachedDb;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = { connectToDatabase };
```

**修正后的连接方式：**
```javascript
const mongoose = require('mongoose');

let cachedDb = null;

const connectDB = async () => {
  // Lambda 环境复用连接
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 1, // Lambda 限制连接数
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    };

    const connection = await mongoose.connect(process.env.MONGODB_URI, options);
    cachedDb = connection;
    
    return cachedDb;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = connectDB;
```

### 6. 环境变量问题

#### 问题：环境变量未加载或不正确
```bash
# 错误示例
Error: Cannot read property 'MONGODB_URI' of undefined
Error: Invalid MongoDB URI
Error: JWT_SECRET is not defined
```

**解决方案：**

**对于前端 Next.js 项目：**
```bash
# 1. 创建 .env 文件
# 注意：Next.js 环境变量需要以 NEXT_PUBLIC_ 开头才能在客户端访问
touch .env.local

echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" >> .env.local
echo "NEXT_PUBLIC_WS_URL=ws://localhost:3001" >> .env.local

# 2. 重启开发服务器使环境变量生效
npm run dev
```

**对于 Serverless 后端项目：**
```bash
# 1. 创建 .env 文件
cd serverless-backend
touch .env

# 2. 添加必要的环境变量
echo "MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/finance_live" >> .env
echo "JWT_SECRET=your_secure_jwt_secret_here" >> .env
echo "JWT_EXPIRE=30d" >> .env

# 3. 确保 serverless-backend.js 中已配置插件
# 应该包含：serverless-dotenv-plugin

# 4. 部署时检查环境变量是否正确
serverless deploy --stage dev --verbose
```

**在 Vercel 生产环境：**
```bash
# 设置 Vercel 环境变量
vercel env add NEXT_PUBLIC_API_URL production
your-api-url-here
vercel env add NEXT_PUBLIC_WS_URL production
your-websocket-url-here

# 查看已设置的环境变量
vercel env ls
```
```

### 7. CORS 跨域问题

#### 问题：前端无法访问 API
```javascript
// 错误示例
Access to fetch at 'xxx' from origin 'xxx' has been blocked by CORS policy
```

**解决方案：**
```yaml
# serverless.yml
functions:
  api:
    handler: src/handler.api
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors:
            origin: 'https://yourdomain.com'  # 或 '*' 允许所有域名
            headers:
              - Content-Type
              - Authorization
              - X-Requested-With
            allowCredentials: true
```

```javascript
// Lambda 函数中手动设置 CORS
module.exports.api = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // 处理 OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // 业务逻辑
    const result = await processRequest(event);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### 7. WebSocket 连接问题

#### 问题：WebSocket 连接断开或无法建立
```bash
# 错误示例
WebSocket connection failed: Error in connection establishment: net::ERR_CONNECTION_REFUSED
WebSocket is closed before the connection is established.
```

**解决方案：**

**对于前端：**
```javascript
// 确保使用正确的 WebSocket URL 格式
// 错误方式
const ws = new WebSocket('http://localhost:3000');

// 正确方式 (包含连接查询字符串)
const ws = new WebSocket(`ws://localhost:3001?token=${userToken}`);

// 添加错误处理
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // 实现重连逻辑
  setTimeout(() => {
    reconnectWebSocket();
  }, 3000);
};

// 实现重连机制
function reconnectWebSocket() {
  // 重新建立连接的逻辑
}
```

**对于后端：**

检查 DynamoDB 表配置和 WebSocket 处理函数（基于项目中已实现的 WebSocket 连接管理）：
```javascript
// serverless-backend.js 中的 WebSocket 事件配置
functions: {
  disconnectHandler: {
    handler: 'handlers/websocket.disconnectHandler',
    events: [
      {
        websocket: {
          route: '$disconnect'
        }
      }
    ]
  },
  defaultHandler: {
    handler: 'handlers/websocket.defaultHandler',
    events: [
      {
        websocket: {
          route: '$default'
        }
      }
    ]
  }
}

// 检查 DynamoDB 表是否正确配置
resources: {
  Resources: {
    WebSocketConnectionsTable: {
      Type: 'AWS::DynamoDB::Table',
      Properties: {
        TableName: 'WebSocketConnections',
        AttributeDefinitions: [
          {
            AttributeName: 'connectionId',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'connectionId',
            KeyType: 'HASH'
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    }
  }
}

// 发送消息的正确方式
const sendMessageToClient = async (connectionId, message) => {
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`
  });
  
  try {
    await apigwManagementApi.postToConnection({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(message))
    }).promise();
  } catch (error) {
    // 常见错误处理
    if (error.statusCode === 410) {
      console.log(`Connection ${connectionId} is gone, removing from DB`);
      // 从数据库中删除断开的连接
      await removeConnection(connectionId);
    } else {
      console.error(`Failed to send message to ${connectionId}:`, error);
    }
  }
};
```

## 🛠️ 调试工具和技巧

### 1. 本地调试
```bash
# 启用详细日志
serverless offline start --verbose

# 查看 Lambda 日志
serverless logs -f functionName -t

# 使用 Node.js debugger
node --inspect-brk node_modules/.bin/serverless offline start
```

### 2. AWS 调试
```bash
# 实时查看 CloudWatch 日志
aws logs tail /aws/lambda/service-stage-functionName --follow

# 查看 CloudFormation 事件
aws cloudformation describe-stack-events --stack-name service-stage
```

### 3. 性能监控
```javascript
// 添加性能监控
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

const recordMetric = async (metricName, value, unit = 'Count') => {
  const params = {
    Namespace: 'FinanceLive/Lambda',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  };

  try {
    await cloudwatch.putMetricData(params).promise();
  } catch (error) {
    console.error('Failed to record metric:', error);
  }
};

// 使用示例
module.exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  try {
    // 业务逻辑
    const result = await processRequest(event);
    
    // 记录成功指标
    await recordMetric('SuccessfulRequests', 1);
    
    return result;
  } catch (error) {
    // 记录错误指标
    await recordMetric('FailedRequests', 1);
    throw error;
  } finally {
    // 记录执行时间
    const duration = Date.now() - startTime;
    await recordMetric('ExecutionDuration', duration, 'Milliseconds');
  }
};
```

## 🚀 最佳实践

### 1. 项目结构
```
serverless-finance-live/
├── src/
│   ├── handlers/
│   │   ├── auth.js
│   │   ├── stream.js
│   │   └── websocket.js
│   ├── models/
│   │   ├── User.js
│   │   └── Message.js
│   ├── utils/
│   │   ├── database.js
│   │   └── response.js
│   └── middleware/
│       └── auth.js
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── serverless.yml
├── package.json
└── README.md
```

### 2. 错误处理
```javascript
// 统一错误处理
const errorHandler = (error, event, context) => {
  console.error('Lambda Error:', {
    error: error.message,
    stack: error.stack,
    event: JSON.stringify(event),
    context: JSON.stringify(context)
  });

  return {
    statusCode: error.statusCode || 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: false,
      message: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    })
  };
};
```

### 8. API Gateway 问题

#### 问题：API Gateway 路径不匹配或权限问题
```bash
# 错误示例
{"message":"Missing Authentication Token"}
{"message":"Forbidden"}
{"message":"Not Found"}
HTTP 403 Forbidden
HTTP 404 Not Found
```

**解决方案：**

**检查路径配置：**
```javascript
// serverless-backend.js 中的路径配置示例
functions: {
  // 认证相关接口
  login: {
    handler: 'handlers/auth.login',
    events: [
      {
        http: {
          path: 'api/auth/login',
          method: 'post',
          cors: true
        }
      }
    ]
  },
  // WebSocket 相关接口
  disconnectHandler: {
    handler: 'handlers/websocket.disconnectHandler',
    events: [
      {
        websocket: {
          route: '$disconnect'
        }
      }
    ]
  }
}
```

**CORS 配置检查：**
```javascript
// 确保所有 HTTP 端点都配置了 CORS
// serverless-backend.js
provider: {
  // ...
  cors: {
    origin: '*', // 生产环境应限制为特定域名
    headers: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token', 'X-Amz-User-Agent'],
    allowCredentials: true
  }
}
```

**检查部署状态：**
```bash
# 查看 API Gateway 部署状态
serverless info

# 检查特定函数的 API 路径
serverless invoke -f login --data '{"httpMethod":"POST","body":"{}"}' --log

# 检查 API Gateway 日志
serverless logs -f login
```

---

如果您能提供具体的错误信息或者项目结构截图，我可以给出更精准的解决方案。请告诉我您遇到的具体问题是什么？