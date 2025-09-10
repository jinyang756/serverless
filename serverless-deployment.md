# Serverless 部署指南

## 🏗️ 架构概览

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

## 🚀 部署步骤

### 1. 前端部署 (Vercel)

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录 Vercel
vercel login

# 初始化项目
cd finance-live-frontend
vercel init

# 配置环境变量
vercel env add REACT_APP_API_URL production
vercel env add REACT_APP_WS_URL production

# 部署到生产环境
vercel --prod
```

**Vercel 环境变量配置：**
```
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_WS_URL=wss://ws.yourdomain.com
```

### 2. 前端部署 (Netlify)

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录 Netlify
netlify login

# 构建项目
cd finance-live-frontend
npm run build

# 部署
netlify deploy --prod --dir=build

# 或使用 Git 自动部署
netlify init
```

**Netlify 环境变量配置：**
- 在 Netlify 控制台设置环境变量
- Site settings → Environment variables

### 3. 后端部署 (AWS Lambda)

```bash
# 安装 Serverless Framework
npm install -g serverless

# 配置 AWS 凭证
aws configure
# 或
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key

# 初始化后端项目
cd finance-live-backend
npm install

# 创建环境变量文件
cp .env.example .env

# 部署到开发环境
serverless deploy --stage dev

# 部署到生产环境
serverless deploy --stage prod
```

### 4. 域名配置

#### 4.1 API 网关自定义域名

```bash
# 通过 Serverless Framework 配置
# 在 serverless.yml 中添加：
plugins:
  - serverless-domain-manager

custom:
  customDomain:
    domainName: api.yourdomain.com
    basePath: ''
    stage: ${self:provider.stage}
    createRoute53Record: true
    certificateName: '*.yourdomain.com'

# 创建域名
serverless create_domain --stage prod

# 部署
serverless deploy --stage prod
```

#### 4.2 WebSocket 自定义域名

```yaml
# 在 serverless.yml 中添加 WebSocket 域名
resources:
  Resources:
    WebSocketDomainName:
      Type: AWS::ApiGatewayV2::DomainName
      Properties:
        DomainName: ws.yourdomain.com
        DomainNameConfigurations:
          - SecurityPolicy: TLS_1_2
            CertificateArn: arn:aws:acm:region:account:certificate/certificate-id
    
    WebSocketMapping:
      Type: AWS::ApiGatewayV2::ApiMapping
      Properties:
        DomainName: !Ref WebSocketDomainName
        ApiId: !Ref WebsocketsApi
        Stage: !Ref WebsocketsDeploymentStage
```

## ⚙️ 环境配置

### .env 文件示例

```env
# 数据库配置
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance_live

# JWT 配置
JWT_SECRET=your_super_secure_jwt_secret_key_here_at_least_32_characters
JWT_EXPIRE=30d

# AWS 配置
AWS_REGION=us-east-1
WEBSOCKET_ENDPOINT=your-websocket-api-id.execute-api.us-east-1.amazonaws.com/prod

# 其他配置
LOG_LEVEL=info
```

### AWS 权限配置 (IAM)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/finance-live-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "execute-api:ManageConnections"
      ],
      "Resource": [
        "arn:aws:execute-api:*:*:*/@connections/*"
      ]
    }
  ]
}
```

## 🔧 配置优化

### Lambda 函数优化

```yaml
# serverless.yml 性能配置
provider:
  name: aws
  runtime: nodejs18.x
  memorySize: 1024  # 增加内存提升性能
  timeout: 30       # 设置超时时间
  
  environment:
    NODE_OPTIONS: '--enable-source-maps'
  
  # VPC 配置（如果数据库在 VPC 内）
  vpc:
    securityGroupIds:
      - sg-xxxxxxxxx
    subnetIds:
      - subnet-xxxxxxxxx
      - subnet-xxxxxxxxx

functions:
  auth:
    handler: src/handlers/auth.handler
    reservedConcurrency: 100  # 限制并发数
    events:
      - http:
          path: /auth/{proxy+}
          method: ANY
          cors: true
```

### 数据库连接优化

```javascript
// src/utils/database.js - MongoDB 连接池优化
const mongoose = require('mongoose');

let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 5,        // Lambda 环境限制连接数
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,    // 禁用 mongoose 缓冲
      bufferMaxEntries: 0,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000
    };

    const connection = await mongoose.connect(process.env.MONGODB_URI, options);
    cachedDb = connection;
    
    // 设置连接事件监听
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    return cachedDb;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = { connectToDatabase };
```

### DynamoDB 表设计

```yaml
# serverless.yml - DynamoDB 表配置
resources:
  Resources:
    # WebSocket 连接表
    WebSocketConnectionsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:service}-websocket-connections-${self:provider.stage}
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
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES

    # 消息缓存表
    MessagesTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:service}-messages-${self:provider.stage}
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
        GlobalSecondaryIndexes:
          - IndexName: TimestampIndex
            KeySchema:
              - AttributeName: timestamp
                KeyType: HASH
            Projection:
              ProjectionType: ALL

    # 用户会话表
    UserSessionsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:service}-user-sessions-${self:provider.stage}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: userId
            AttributeType: S
          - AttributeName: sessionId
            AttributeType: S
        KeySchema:
          - AttributeName: userId
            KeyType: HASH
          - AttributeName: sessionId
            KeyType: RANGE
        TimeToLiveSpecification:
          AttributeName: ttl
          Enabled: true
```

## 📊 监控和日志

### CloudWatch 配置

```yaml
# serverless.yml - 监控配置
custom:
  alerts:
    - functionErrors
    - functionThrottles
    - functionDuration
  
provider:
  logs:
    restApi: true
    websocket: true
  
  tracing:
    lambda: true
    apiGateway: true

functions:
  auth:
    handler: src/handlers/auth.handler
    environment:
      LOG_LEVEL: ${opt:stage, 'dev'}
    alarms:
      - functionErrors:
          threshold: 10
          period: 300
      - functionDuration:
          threshold: 30000
          period: 300
```

### 结构化日志

```javascript
// src/utils/logger.js - Serverless 日志工具
const createLogger = (functionName) => {
  const logLevel = process.env.LOG_LEVEL || 'info';
  
  const log = (level, message, meta = {}) => {
    if (shouldLog(level, logLevel)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        function: functionName,
        requestId: meta.requestId,
        message,
        ...meta
      };
      console.log(JSON.stringify(logEntry));
    }
  };

  return {
    error: (message, meta) => log('error', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    info: (message, meta) => log('info', message, meta),
    debug: (message, meta) => log('debug', message, meta)
  };
};

const shouldLog = (level, configLevel) => {
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  return levels[level] <= levels[configLevel];
};

module.exports = { createLogger };
```

## 🔒 安全配置

### API 网关安全

```yaml
# serverless.yml - API Gateway 安全配置
provider:
  apiGateway:
    restApiId: ${opt:restApiId}
    restApiRootResourceId: ${opt:restApiRootResourceId}
    
  httpApi:
    cors:
      allowedOrigins:
        - 'https://yourdomain.com'
        - 'https://www.yourdomain.com'
      allowedHeaders:
        - Content-Type
        - Authorization
      allowedMethods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
      maxAge: 86400

functions:
  auth:
    events:
      - http:
          path: /auth/{proxy+}
          method: ANY
          cors: true
          authorizer:
            name: customAuthorizer
            resultTtlInSeconds: 300
```

### WAF 配置

```yaml
# CloudFormation 模板 - WAF 配置
resources:
  Resources:
    WebACL:
      Type: AWS::WAFv2::WebACL
      Properties:
        Name: ${self:service}-waf-${self:provider.stage}
        Scope: REGIONAL
        DefaultAction:
          Allow: {}
        Rules:
          - Name: RateLimitRule
            Priority: 1
            Statement:
              RateBasedStatement:
                Limit: 2000
                AggregateKeyType: IP
            Action:
              Block: {}
            VisibilityConfig:
              SampledRequestsEnabled: true
              CloudWatchMetricsEnabled: true
              MetricName: RateLimitRule
          
          - Name: SQLInjectionRule
            Priority: 2
            Statement:
              SqliMatchStatement:
                FieldToMatch:
                  AllQueryArguments: {}
                TextTransformations:
                  - Priority: 1
                    Type: URL_DECODE
            Action:
              Block: {}
            VisibilityConfig:
              SampledRequestsEnabled: true
              CloudWatchMetricsEnabled: true
              MetricName: SQLInjectionRule
```

## 💰 成本优化

### Lambda 成本优化

```yaml
# serverless.yml - 成本优化配置
provider:
  memorySize: 512      # 根据实际需求调整内存
  timeout: 15          # 减少超时时间
  
functions:
  # 高频访问函数
  auth:
    handler: src/handlers/auth.handler
    memorySize: 1024    # 增加内存提升性能
    timeout: 10
    reservedConcurrency: 50
    
  # 低频访问函数
  admin:
    handler: src/handlers/admin.handler
    memorySize: 256     # 降低内存节省成本
    timeout: 30
    reservedConcurrency: 10

plugins:
  - serverless-plugin-warmup

custom:
  warmup:
    enabled: true
    events:
      - schedule: rate(5 minutes)
    timeout: 20
```

### DynamoDB 成本优化

```yaml
resources:
  Resources:
    MessagesTable:
      Type: AWS::DynamoDB::Table
      Properties:
        BillingMode: PAY_PER_REQUEST  # 按请求付费，适合不规律访问
        # 或使用预置容量
        # BillingMode: PROVISIONED
        # ProvisionedThroughput:
        #   ReadCapacityUnits: 5
        #   WriteCapacityUnits: 5
        
        # 启用 Point-in-time recovery（可选）
        PointInTimeRecoverySpecification:
          PointInTimeRecoveryEnabled: false
```

## 🚀 CI/CD 流水线

### GitHub Actions 配置

```yaml
# .github/workflows/deploy.yml
name: Deploy Finance Live Platform

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build
        run: |
          cd frontend
          npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}
          REACT_APP_WS_URL: ${{ secrets.REACT_APP_WS_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
          npm install -g serverless
      
      - name: Deploy
        run: |
          cd backend
          serverless deploy --stage prod
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

## 🔍 测试和监控

### 集成测试

```javascript
// tests/integration/api.test.js
const AWS = require('aws-sdk');

// 配置测试环境
AWS.config.update({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000' // DynamoDB Local
});

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // 设置测试数据库
    await setupTestDatabase();
  });

  afterAll(async () => {
    // 清理测试数据
    await cleanupTestDatabase();
  });

  test('User authentication flow', async () => {
    // 注册用户
    const registerResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })
    });

    expect(registerResponse.status).toBe(201);
    const registerData = await registerResponse.json();
    expect(registerData.success).toBe(true);
    expect(registerData.token).toBeDefined();

    // 登录测试
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: 'testuser',
        password: 'password123'
      })
    });

    expect(loginResponse.status).toBe(200);
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    expect(loginData.token).toBeDefined();
  });
});
```

### 性能监控

```javascript
// src/utils/metrics.js
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

const recordMetric = async (metricName, value, unit = 'Count', dimensions = {}) => {
  const params = {
    Namespace: 'FinanceLive/Application',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({
        Name,
        Value: String(Value)
      }))
    }]
  };

  try {
    await cloudwatch.putMetricData(params).promise();
  } catch (error) {
    console.error('Failed to record metric:', error);
  }
};

// 使用示例
const recordUserLogin = async (userId) => {
  await recordMetric('UserLogin', 1, 'Count', {
    UserId: userId,
    Environment: process.env.STAGE
  });
};

module.exports = { recordMetric, recordUserLogin };
```

## 📈 扩展性考虑

### 多区域部署

```yaml
# serverless.yml - 多区域配置
provider:
  name: aws
  runtime: nodejs18.x
  region: ${opt:region, 'us-east-1'}
  
custom:
  stages:
    prod:
      regions:
        - us-east-1
        - eu-west-1
        - ap-southeast-1

# 为每个区域创建独立的部署
# serverless deploy --stage prod --region us-east-1
# serverless deploy --stage prod --region eu-west-1
```

### 缓存策略

```javascript
// src/utils/cache.js
const AWS = require('aws-sdk');
const elasticache = new AWS.ElastiCache();

class CacheManager {
  constructor() {
    this.redis = require('redis').createClient({
      host: process.env.REDIS_ENDPOINT,
      port: 6379
    });
  }

  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
}

module.exports = new CacheManager();
```

## 🚨 故障恢复

### 健康检查

```javascript
// src/handlers/health.js
const { connectToDatabase } = require('../utils/database');

module.exports.handler = async (event, context) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    region: process.env.AWS_REGION,
    stage: process.env.STAGE
  };

  try {
    // 检查数据库连接
    await connectToDatabase();
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify(health)
  };
};
```

### 断路器模式

```javascript
// src/utils/circuitBreaker.js
class CircuitBreaker {
  constructor(threshold = 5, timeout = 10000, resetTimeout = 30000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.resetTimeout = resetTimeout;
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await this.callFunction(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  async callFunction(fn) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Function timeout'));
      }, this.timeout);

      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }
}

module.exports = CircuitBreaker;
```

---

这个 Serverless 方案提供了：

✅ **完全无服务器架构** - 自动扩缩容，按使用付费  
✅ **高可用性** - 多区域部署，自动故障转移  
✅ **实时通信** - WebSocket API Gateway + Lambda  
✅ **安全性** - WAF、API 网关限流、JWT 认证  
✅ **监控** - CloudWatch 日志和指标  
✅ **CI/CD** - 自动化部署流水线  
✅ **成本优化** - 按需付费，无空闲成本

需要我详细解释任何特定的配置或帮助您解决部署过程中的问题吗？