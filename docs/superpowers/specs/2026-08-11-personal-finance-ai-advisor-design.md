# 个人财务AI顾问 - 设计文档

## 项目概述

**项目名称**: AI Personal Finance Advisor（个人财务AI顾问）

**项目定位**: 一个结合传统记账功能和AI智能分析的全栈Web应用，用于展示AI全栈开发能力，适合技术面试演示。

**核心价值**:
- 简化个人财务记录（支持自然语言输入）
- 提供智能财务分析和建议
- 通过对话式交互获取财务洞察

**目标用户**: 需要简单记账和智能分析的个人用户

---

## 技术栈

### Frontend
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: TailwindCSS
- **图表**: Recharts
- **状态管理**: React Context API + useReducer
- **HTTP客户端**: Axios
- **WebSocket**: native WebSocket API

### Backend
- **语言**: Python 3.11
- **Web框架**: FastAPI
- **ORM**: SQLAlchemy 2.0
- **AI框架**: LangChain
- **认证**: JWT (python-jose)
- **密码加密**: bcrypt
- **数据验证**: Pydantic V2

### Database & Cache
- **关系数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **向量数据库**: 不使用（简化设计）

### AI & LLM
- **LLM提供商**: OpenAI
- **模型**: GPT-4o-mini
- **AI框架**: LangChain (conversation, structured output)

### DevOps & Deployment
- **部署平台**: Railway
- **容器化**: Docker (本地开发)
- **版本控制**: Git + GitHub

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────┐
│              Frontend (React + TS)                  │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │Dashboard │ │Transaction│ │   AI Advisor       │  │
│  │  Page    │ │   Pages   │ │   Chat Page        │  │
│  └──────────┘ └──────────┘ └────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │ REST API / WebSocket
┌────────────────────▼────────────────────────────────┐
│              API Layer (FastAPI)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │Auth Endpoints│  │Transaction   │  │AI Chat    │ │
│  │              │  │Endpoints     │  │WebSocket  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│           Business Logic Layer                      │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │User Service  │ │Transaction   │ │AI Service   │ │
│  │              │ │Service       │ │(LangChain)  │ │
│  └──────────────┘ └──────────────┘ └─────────────┘ │
│  ┌──────────────┐ ┌──────────────┐                 │
│  │Analytics     │ │NLP Parser    │                 │
│  │Service       │ │              │                 │
│  └──────────────┘ └──────────────┘                 │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              Data Layer                             │
│  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │   PostgreSQL        │  │      Redis           │ │
│  │ - users             │  │ - sessions           │ │
│  │ - transactions      │  │ - ai_context         │ │
│  │ - categories        │  │ - analytics_cache    │ │
│  │ - ai_conversations  │  │ - rate_limiting      │ │
│  └─────────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 架构特点

1. **分层架构**: 清晰的职责分离，便于维护和测试
2. **前后端分离**: 独立开发和部署
3. **RESTful设计**: 标准的HTTP API，易于理解
4. **WebSocket实时通信**: AI对话流式响应
5. **缓存策略**: Redis减轻数据库压力
6. **服务层封装**: 业务逻辑独立于API层

---

## 数据库设计

### ER图概念

```
users (1) ────< (N) transactions
users (1) ────< (N) ai_conversations
transactions (N) ────> (1) categories
```

### 表结构

#### 1. users 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 用户ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱（登录用） |
| password_hash | VARCHAR(255) | NOT NULL | 密码hash |
| username | VARCHAR(100) | NOT NULL | 用户名 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE INDEX (email)

#### 2. transactions 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 交易ID |
| user_id | UUID | FK, NOT NULL | 用户ID |
| amount | DECIMAL(10,2) | NOT NULL | 金额（正数收入，负数支出） |
| category | VARCHAR(50) | NOT NULL | 类别 |
| description | TEXT | | 备注说明 |
| transaction_date | DATE | NOT NULL | 交易日期 |
| input_method | ENUM | NOT NULL | 'manual' 或 'natural_language' |
| original_input | TEXT | | 原始自然语言输入 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (transaction_date)
- COMPOSITE INDEX (user_id, transaction_date)

**外键**:
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

#### 3. categories 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | SERIAL | PK | 类别ID |
| name | VARCHAR(50) | UNIQUE, NOT NULL | 类别名称 |
| icon | VARCHAR(50) | | emoji或图标名 |
| color | VARCHAR(20) | | 十六进制颜色 |

**预设数据**:
```sql
INSERT INTO categories (name, icon, color) VALUES
('餐饮', '🍔', '#FF6B6B'),
('交通', '🚇', '#4ECDC4'),
('购物', '🛍️', '#95E1D3'),
('娱乐', '🎮', '#F9CA24'),
('住房', '🏠', '#6C5CE7'),
('医疗', '💊', '#A29BFE'),
('教育', '📚', '#74B9FF'),
('通讯', '📱', '#00B894'),
('其他', '📦', '#B2BEC3');
```

#### 4. ai_conversations 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 消息ID |
| user_id | UUID | FK, NOT NULL | 用户ID |
| session_id | UUID | NOT NULL | 会话ID（区分不同对话） |
| role | ENUM | NOT NULL | 'user' 或 'assistant' |
| message | TEXT | NOT NULL | 消息内容 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id, session_id, created_at)

**外键**:
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

### Redis数据结构

#### 1. Session缓存
```
Key: session:{user_id}
Type: Hash
Fields: {user_id, email, username}
TTL: 24 hours
```

#### 2. AI对话上下文
```
Key: ai_context:{user_id}:{session_id}
Type: List (FIFO, 保留最近10条)
Value: JSON serialized messages
TTL: 1 hour
```

#### 3. 分析结果缓存
```
Key: analytics:{user_id}:{year}-{month}
Type: String (JSON)
Value: Cached analysis result
TTL: 1 hour
```

#### 4. Rate Limiting
```
Key: rate_limit:{user_id}:ai
Type: String (counter)
TTL: 1 minute
Limit: 10 requests/minute
```

---

## API设计

### 认证相关 API

#### POST /api/auth/register
注册新用户

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "张三"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "张三",
  "created_at": "2026-08-11T10:00:00Z"
}
```

#### POST /api/auth/login
用户登录

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 900
}
```

#### POST /api/auth/refresh
刷新访问令牌

**Request**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 900
}
```

#### GET /api/auth/me
获取当前用户信息

**Headers**: `Authorization: Bearer {access_token}`

**Response** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "张三",
  "created_at": "2026-08-11T10:00:00Z"
}
```

---

### 交易记录 API

#### POST /api/transactions
创建交易记录

**Headers**: `Authorization: Bearer {access_token}`

**Request (手动输入)**:
```json
{
  "input_method": "manual",
  "amount": -45.00,
  "category": "餐饮",
  "description": "午餐",
  "transaction_date": "2026-08-11"
}
```

**Request (自然语言)**:
```json
{
  "input_method": "natural_language",
  "original_input": "今天中午肯德基花了45块"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "amount": -45.00,
  "category": "餐饮",
  "description": "肯德基",
  "transaction_date": "2026-08-11",
  "input_method": "natural_language",
  "original_input": "今天中午肯德基花了45块",
  "created_at": "2026-08-11T12:30:00Z"
}
```

#### GET /api/transactions
获取交易列表

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `page` (int, default=1): 页码
- `page_size` (int, default=20): 每页条数
- `start_date` (date, optional): 开始日期
- `end_date` (date, optional): 结束日期
- `category` (string, optional): 类别筛选

**Response** (200):
```json
{
  "total": 150,
  "page": 1,
  "page_size": 20,
  "data": [
    {
      "id": "uuid",
      "amount": -45.00,
      "category": "餐饮",
      "description": "肯德基",
      "transaction_date": "2026-08-11",
      "created_at": "2026-08-11T12:30:00Z"
    }
  ]
}
```

#### GET /api/transactions/{id}
获取单条交易详情

**Headers**: `Authorization: Bearer {access_token}`

**Response** (200):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "amount": -45.00,
  "category": "餐饮",
  "description": "肯德基",
  "transaction_date": "2026-08-11",
  "input_method": "natural_language",
  "original_input": "今天中午肯德基花了45块",
  "created_at": "2026-08-11T12:30:00Z",
  "updated_at": "2026-08-11T12:30:00Z"
}
```

#### PUT /api/transactions/{id}
更新交易记录

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "amount": -50.00,
  "category": "餐饮",
  "description": "肯德基午餐",
  "transaction_date": "2026-08-11"
}
```

**Response** (200): 返回更新后的交易对象

#### DELETE /api/transactions/{id}
删除交易记录

**Headers**: `Authorization: Bearer {access_token}`

**Response** (204): No Content

#### POST /api/transactions/parse
解析自然语言（预览模式）

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "input": "昨天晚上看电影花了80"
}
```

**Response** (200):
```json
{
  "amount": -80.00,
  "category": "娱乐",
  "description": "看电影",
  "transaction_date": "2026-08-10",
  "confidence": 0.95
}
```

---

### 数据分析 API

#### GET /api/analytics/summary
获取财务概览

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `month` (string, format: YYYY-MM): 月份，默认当前月

**Response** (200):
```json
{
  "month": "2026-08",
  "total_income": 8000.00,
  "total_expense": 3450.00,
  "balance": 4550.00,
  "transaction_count": 45,
  "top_category": {
    "name": "餐饮",
    "amount": 1250.00,
    "percentage": 36.2
  }
}
```

#### GET /api/analytics/by-category
按类别统计

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `month` (string, format: YYYY-MM): 月份

**Response** (200):
```json
{
  "month": "2026-08",
  "categories": [
    {
      "name": "餐饮",
      "amount": 1250.00,
      "percentage": 36.2,
      "count": 28
    },
    {
      "name": "交通",
      "amount": 450.00,
      "percentage": 13.0,
      "count": 15
    }
  ]
}
```

#### GET /api/analytics/trend
获取趋势数据

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `start_month` (string): 开始月份
- `end_month` (string): 结束月份
- `granularity` (string): 'daily' 或 'monthly'

**Response** (200):
```json
{
  "period": "2026-01 to 2026-08",
  "granularity": "monthly",
  "data": [
    {
      "date": "2026-01",
      "income": 8000.00,
      "expense": 3200.00
    },
    {
      "date": "2026-02",
      "income": 8000.00,
      "expense": 3450.00
    }
  ]
}
```

#### GET /api/analytics/insights
获取AI生成的洞察

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `month` (string): 月份

**Response** (200):
```json
{
  "month": "2026-08",
  "insights": [
    {
      "type": "anomaly",
      "title": "餐饮支出异常",
      "description": "本月餐饮支出1250元，比上月高30%",
      "severity": "warning"
    },
    {
      "type": "pattern",
      "title": "周末消费习惯",
      "description": "每周六外卖支出平均150元",
      "severity": "info"
    }
  ],
  "generated_at": "2026-08-11T10:00:00Z"
}
```

---

### AI顾问 API

#### WebSocket /api/ai/chat
AI对话（流式响应）

**Connection**: WebSocket upgrade
**Headers**: `Authorization: Bearer {access_token}`

**Client Message**:
```json
{
  "type": "message",
  "content": "我这个月餐饮花了多少钱？",
  "session_id": "uuid"
}
```

**Server Streaming Response**:
```json
{"type": "token", "content": "根据"}
{"type": "token", "content": "你的"}
{"type": "token", "content": "记录"}
...
{
  "type": "done",
  "full_response": "根据你的记录，这个月餐饮支出共1250元，占总支出的36%...",
  "session_id": "uuid"
}
```

#### GET /api/ai/history
获取对话历史

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `session_id` (uuid, optional): 会话ID，不提供则返回所有会话

**Response** (200):
```json
{
  "sessions": [
    {
      "session_id": "uuid",
      "messages": [
        {
          "role": "user",
          "content": "我这个月餐饮花了多少？",
          "created_at": "2026-08-11T10:00:00Z"
        },
        {
          "role": "assistant",
          "content": "根据你的记录...",
          "created_at": "2026-08-11T10:00:05Z"
        }
      ]
    }
  ]
}
```

#### DELETE /api/ai/history
清空对话历史

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `session_id` (uuid, optional): 清空指定会话，不提供则清空所有

**Response** (204): No Content

---

### 类别 API

#### GET /api/categories
获取所有类别

**Response** (200):
```json
{
  "categories": [
    {
      "id": 1,
      "name": "餐饮",
      "icon": "🍔",
      "color": "#FF6B6B"
    },
    {
      "id": 2,
      "name": "交通",
      "icon": "🚇",
      "color": "#4ECDC4"
    }
  ]
}
```

---

### 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

**常见错误码**:
- `UNAUTHORIZED` (401): 未授权
- `FORBIDDEN` (403): 禁止访问
- `NOT_FOUND` (404): 资源不存在
- `VALIDATION_ERROR` (422): 输入验证失败
- `RATE_LIMIT_EXCEEDED` (429): 请求过于频繁
- `INTERNAL_ERROR` (500): 服务器内部错误

---

## LangChain AI服务设计

### AI服务架构

```
AIService
├── TransactionParser (自然语言解析)
│   └── parse_natural_language(input: str) -> ParsedTransaction
│
├── FinancialAdvisor (对话顾问)
│   ├── chat(user_id, message, session_id) -> AsyncGenerator[str]
│   ├── get_conversation_history(user_id, session_id) -> List[Message]
│   └── clear_history(user_id, session_id) -> None
│
└── InsightsGenerator (洞察生成)
    └── generate_insights(user_id, month) -> List[Insight]
```

### 1. TransactionParser（自然语言交易解析）

**功能**: 将用户的自然语言输入解析为结构化的交易数据

**LangChain组件**:
- **LLM**: OpenAI GPT-4o-mini
- **Temperature**: 0.1（低温度保证稳定输出）
- **Output**: Structured output (Pydantic model)

**Prompt Template**:
```python
TRANSACTION_PARSER_PROMPT = """
你是一个专业的财务记录解析助手。
用户会用自然语言描述一笔交易，你需要提取以下信息：

- amount: 金额（数字，支出为负数，收入为正数）
- category: 类别（必须从以下选择：餐饮、交通、购物、娱乐、住房、医疗、教育、通讯、其他）
- description: 简短描述
- transaction_date: 日期（YYYY-MM-DD格式）

用户输入: {input}
今天日期: {today}

规则:
1. 如果用户说"今天"、"昨天"，根据今天日期计算
2. 如果没说收入/支出，默认是支出（负数）
3. 金额只保留数字部分
4. 类别必须从给定列表选择，找最接近的
"""
```

**输出Schema**:
```python
class ParsedTransaction(BaseModel):
    amount: float
    category: str
    description: str
    transaction_date: date
    confidence: float  # 解析置信度 0-1
```

**示例**:
```python
Input: "今天中午肯德基花了45块"
Output: {
    "amount": -45.00,
    "category": "餐饮",
    "description": "肯德基",
    "transaction_date": "2026-08-11",
    "confidence": 0.95
}
```

**错误处理**:
- 如果无法解析，返回 `confidence < 0.5`
- API层检查confidence，低于0.5时提示用户手动输入

---

### 2. FinancialAdvisor（AI财务顾问）

**功能**: 通过对话方式回答用户的财务问题并提供建议

**LangChain组件**:
- **LLM**: OpenAI GPT-4o-mini
- **Temperature**: 0.7（适中，保持专业又不死板）
- **Memory**: ConversationBufferMemory（保留最近10轮对话）
- **Tools**: 自定义工具访问用户数据
- **Chain**: ConversationalRetrievalChain

**System Prompt**:
```python
FINANCIAL_ADVISOR_PROMPT = """
你是一位专业、友好的个人财务顾问AI助手。

你的职责:
1. 回答用户关于他们财务数据的问题
2. 分析用户的消费习惯并提供建议
3. 用清晰、简洁的语言解释财务概念
4. 保持专业但不说教

你可以访问的数据:
- 用户的交易记录
- 按类别的支出统计
- 月度趋势数据

回答风格:
- 直接回答问题，不要过度解释
- 使用具体数字而不是模糊描述
- 给建议时说明理由
- 如果数据不足，明确告知

当前日期: {today}
用户名: {username}
"""
```

**Tools定义**:
```python
tools = [
    Tool(
        name="get_transactions",
        description="获取用户的交易记录。参数: start_date, end_date, category",
        func=transaction_service.get_transactions
    ),
    Tool(
        name="get_category_summary",
        description="获取按类别汇总的支出数据。参数: month",
        func=analytics_service.get_category_summary
    ),
    Tool(
        name="get_monthly_trend",
        description="获取月度趋势数据。参数: start_month, end_month",
        func=analytics_service.get_monthly_trend
    )
]
```

**对话流程**:
```
User: "我这个月餐饮花了多少？"
    ↓
Agent思考: 需要调用 get_category_summary
    ↓
Tool Call: get_category_summary(month="2026-08")
    ↓
Tool Result: {"餐饮": 1250.00, ...}
    ↓
Agent生成回复: "根据你的记录，这个月餐饮支出共1250元，占总支出的36%。
               相比上月增加了30%，主要是外卖订单增多..."
    ↓
Streaming Response to User
```

**Memory管理**:
- **存储**: Redis (key: `ai_context:{user_id}:{session_id}`)
- **容量**: 最近10轮对话
- **TTL**: 1小时
- **格式**: JSON serialized message list

**流式响应实现**:
```python
async def chat_stream(user_id: str, message: str, session_id: str):
    # 加载历史
    memory = load_memory_from_redis(user_id, session_id)
    
    # 创建chain
    chain = ConversationalRetrievalChain(
        llm=llm,
        memory=memory,
        tools=tools
    )
    
    # 流式输出
    async for token in chain.astream(message):
        yield token
    
    # 保存历史
    save_memory_to_redis(user_id, session_id, memory)
```

---

### 3. InsightsGenerator（智能洞察生成）

**功能**: 定期或按需分析用户数据，生成财务洞察和建议

**LangChain组件**:
- **LLM**: OpenAI GPT-4o-mini
- **Temperature**: 0.5
- **Output**: Structured output (List of insights)

**Prompt Template**:
```python
INSIGHTS_PROMPT = """
你是一位数据分析专家，负责分析用户的财务数据并生成有价值的洞察。

用户数据摘要:
- 本月总支出: {total_expense}
- 上月总支出: {last_month_expense}
- 类别分布: {category_breakdown}
- 每日平均: {daily_average}
- 最大单笔: {max_transaction}

请生成3-5条洞察，每条包含:
1. type: "anomaly"(异常), "pattern"(习惯), "suggestion"(建议), "achievement"(成就)
2. title: 简短标题
3. description: 详细说明（1-2句话）
4. severity: "info", "warning", "success"

洞察规则:
- 只报告有意义的发现（变化>20%）
- 用具体数字支撑结论
- 建议要可执行
- 保持积极的语气
"""
```

**输出Schema**:
```python
class Insight(BaseModel):
    type: Literal["anomaly", "pattern", "suggestion", "achievement"]
    title: str
    description: str
    severity: Literal["info", "warning", "success"]
    
class InsightsResponse(BaseModel):
    insights: List[Insight]
```

**示例输出**:
```json
{
  "insights": [
    {
      "type": "anomaly",
      "title": "餐饮支出显著上升",
      "description": "本月餐饮支出1250元，比上月高30%（增加289元），主要原因是外卖频次增加",
      "severity": "warning"
    },
    {
      "type": "pattern",
      "title": "周五消费高峰",
      "description": "数据显示你每周五的平均支出是平日的2倍，主要集中在娱乐和餐饮",
      "severity": "info"
    },
    {
      "type": "suggestion",
      "title": "考虑减少外卖频次",
      "description": "本月外卖22次共850元，如果减少到15次可节约约270元",
      "severity": "info"
    }
  ]
}
```

**生成时机**:
1. 用户访问Dashboard时自动生成（缓存1小时）
2. 用户在AI对话中明确询问
3. 后台定时任务（每月1号生成上月总结）

---

### AI服务通用配置

**OpenAI配置**:
```python
OPENAI_CONFIG = {
    "model": "gpt-4o-mini",
    "api_key": os.getenv("OPENAI_API_KEY"),
    "max_tokens": 1000,
    "timeout": 30
}
```

**Rate Limiting**:
```python
# 每用户每分钟限制
AI_RATE_LIMITS = {
    "transaction_parse": 20,  # 解析请求
    "chat": 10,               # 对话请求
    "insights": 5             # 洞察生成
}
```

**错误处理**:
```python
# 1. API超时
- 超时时间: 30秒
- 重试: 1次
- 降级: 返回预设模板回复

# 2. API额度超限
- 捕获异常并友好提示
- 记录日志用于监控

# 3. 解析失败
- TransactionParser confidence < 0.5
- 提示用户使用手动输入

# 4. Tool调用失败
- Agent捕获tool错误
- 返回: "抱歉，暂时无法获取该数据"
```

**成本优化**:
```python
# 1. 使用GPT-4o-mini（成本低）
# 2. Prompt精简，减少token消耗
# 3. 缓存insights结果（1小时）
# 4. 对话历史限制10轮
# 5. Rate limiting防滥用
```

---

## 前端设计

### 页面结构

```
/
├── /login                  # 登录页
├── /register               # 注册页
└── /app (需要认证)
    ├── /dashboard          # 数据概览（默认页）
    ├── /transactions       # 交易列表
    ├── /transactions/new   # 新建交易
    ├── /analytics          # 数据分析
    ├── /ai-advisor         # AI顾问
    └── /profile            # 个人设置
```

### 核心页面设计

#### 1. Dashboard（主页）

**布局**:
```
┌─────────────────────────────────────────────────┐
│  Header (用户名, 退出)                           │
├─────────────────────────────────────────────────┤
│  Sidebar  │  Main Content                       │
│           │  ┌──────────────────────────────┐   │
│  📊 概览  │  │  本月财务概览                │   │
│  💰 交易  │  │  收入: ¥8,000  支出: ¥3,450 │   │
│  📈 分析  │  │  结余: ¥4,550              │   │
│  🤖 顾问  │  └──────────────────────────────┘   │
│  👤 设置  │  ┌──────────────────────────────┐   │
│           │  │  📊 支出类别分布（饼图）     │   │
│           │  │                              │   │
│           │  └──────────────────────────────┘   │
│           │  ┌──────────────────────────────┐   │
│           │  │  📈 月度趋势（折线图）       │   │
│           │  │                              │   │
│           │  └──────────────────────────────┘   │
│           │  ┌──────────────────────────────┐   │
│           │  │  💡 AI洞察                   │   │
│           │  │  ⚠️ 餐饮支出比上月高30%     │   │
│           │  │  ℹ️ 周五消费是平日2倍       │   │
│           │  └──────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**关键组件**:
- `SummaryCard`: 收入/支出/结余卡片
- `PieChart`: 支出类别饼图（Recharts）
- `TrendChart`: 月度趋势折线图（Recharts）
- `InsightCard`: AI洞察卡片列表

**数据获取**:
```typescript
// 页面加载时并行请求
Promise.all([
  api.analytics.getSummary(currentMonth),
  api.analytics.getByCategory(currentMonth),
  api.analytics.getTrend(last6Months),
  api.analytics.getInsights(currentMonth)
])
```

#### 2. Transactions（交易列表）

**布局**:
```
┌─────────────────────────────────────────────────┐
│  [+ 新建交易]  [类别▼]  [月份: 2026-08 ▼]      │
├─────────────────────────────────────────────────┤
│  📅 2026-08-11                                  │
│  🍔 餐饮  -¥45.00  肯德基       [编辑] [删除]   │
│  🚇 交通  -¥15.00  地铁         [编辑] [删除]   │
│                                                 │
│  📅 2026-08-10                                  │
│  🎮 娱乐  -¥80.00  电影院       [编辑] [删除]   │
│  🛍️ 购物  -¥200.00 京东        [编辑] [删除]   │
├─────────────────────────────────────────────────┤
│  [上一页]  第1页/共8页  [下一页]                │
└─────────────────────────────────────────────────┘
```

**功能**:
- 按日期分组显示
- 类别图标和颜色标识
- 筛选（类别、日期范围）
- 分页（20条/页）
- 编辑/删除操作

**关键组件**:
- `TransactionList`: 列表容器
- `TransactionItem`: 单条交易
- `TransactionFilter`: 筛选器
- `Pagination`: 分页组件

#### 3. New Transaction（新建交易）

**布局**:
```
┌─────────────────────────────────────────────────┐
│  新建交易                                        │
├─────────────────────────────────────────────────┤
│  输入方式： ○ 手动输入  ● 自然语言              │
├─────────────────────────────────────────────────┤
│  【自然语言输入】                                │
│  ┌─────────────────────────────────────────┐   │
│  │ 今天中午肯德基花了45块                   │   │
│  └─────────────────────────────────────────┘   │
│                 [解析]                           │
│                   ↓                              │
│  【解析结果】                                    │
│  金额:     -¥45.00                              │
│  类别:     餐饮 ▼                               │
│  日期:     2026-08-11 📅                        │
│  备注:     肯德基                               │
│                                                 │
│         [保存] [取消]                            │
└─────────────────────────────────────────────────┘
```

**两种模式**:

**手动输入模式**:
```typescript
<form>
  <input type="number" placeholder="金额" />
  <select>类别选择</select>
  <input type="date" placeholder="日期" />
  <textarea placeholder="备注" />
  <button>保存</button>
</form>
```

**自然语言模式**:
```typescript
<div>
  <textarea 
    placeholder="用自然语言描述，如：今天午饭花了50块"
    onChange={debounce(handleInput, 500)}
  />
  <button onClick={parseInput}>解析</button>
  
  {parsed && (
    <div>
      <input value={parsed.amount} />
      <select value={parsed.category} />
      <input value={parsed.date} />
      <input value={parsed.description} />
      <button onClick={save}>确认保存</button>
    </div>
  )}
</div>
```

**交互逻辑**:
1. 用户输入自然语言
2. 点击"解析"或自动触发解析（防抖500ms）
3. 显示解析结果，可编辑修正
4. 确认后保存

#### 4. AI Advisor（AI顾问）

**布局**:
```
┌─────────────────────────────────────────────────┐
│  💬 AI财务顾问                    [清空对话]    │
├─────────────────────────────────────────────────┤
│  [对话历史区域 - 可滚动]                        │
│                                                 │
│  你: 我这个月餐饮花了多少？                      │
│  10:15                                          │
│                                                 │
│  🤖: 根据你的记录，本月餐饮支出共1250元，       │
│      占总支出的36%。相比上月增加了30%...        │
│  10:15                                          │
│                                                 │
│  你: 有什么建议吗？                             │
│  10:16                                          │
│                                                 │
│  🤖: [流式输出中...]                            │
│                                                 │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   │
│  │ 输入你的问题...                         │   │
│  └─────────────────────────────────────────┘   │
│                                    [发送] 📤    │
└─────────────────────────────────────────────────┘
```

**功能**:
- WebSocket实时通信
- 流式响应显示
- 对话历史保存
- 自动滚动到底部
- Markdown渲染（支持加粗、列表等）

**关键组件**:
- `ChatInterface`: 对话容器
- `MessageBubble`: 消息气泡
- `StreamingText`: 流式文本显示
- `ChatInput`: 输入框

**WebSocket实现**:
```typescript
const ws = useRef<WebSocket>();

useEffect(() => {
  ws.current = new WebSocket(
    `${WS_URL}/api/ai/chat?token=${accessToken}`
  );
  
  ws.current.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'token') {
      appendToLastMessage(data.content);
    } else if (data.type === 'done') {
      finalizeMessage(data.full_response);
    }
  };
  
  return () => ws.current?.close();
}, []);

const sendMessage = (message: string) => {
  ws.current?.send(JSON.stringify({
    type: 'message',
    content: message,
    session_id: currentSessionId
  }));
};
```

#### 5. Analytics（数据分析）

**布局**:
```
┌─────────────────────────────────────────────────┐
│  数据分析              [时间范围: 最近6个月 ▼]   │
├─────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐   │
│  │  📊 类别支出对比（柱状图）               │   │
│  │                                          │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │  📈 收支趋势（双折线图）                 │   │
│  │                                          │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │  类别详细列表                            │   │
│  │  🍔 餐饮    ¥1,250  (36%)  ■■■■■■■■    │   │
│  │  🚇 交通    ¥450    (13%)  ■■■          │   │
│  │  🛍️ 购物    ¥800    (23%)  ■■■■■        │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**图表类型**:
- 饼图（类别占比）
- 柱状图（类别对比）
- 折线图（趋势）
- 进度条（百分比）

---

### 状态管理

**架构选择**: React Context API + useReducer（不使用Redux）

**Context结构**:
```typescript
// AuthContext - 认证状态
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

// AppContext - 应用状态
interface AppState {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: string;
  loading: boolean;
  error: string | null;
}

// AIContext - AI对话状态
interface AIState {
  messages: Message[];
  currentSessionId: string;
  isStreaming: boolean;
}
```

**Provider结构**:
```tsx
<AuthProvider>
  <AppProvider>
    <AIProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AIProvider>
  </AppProvider>
</AuthProvider>
```

---

### 组件设计原则

**1. 单一职责**
- 每个组件只做一件事
- 容器组件 vs 展示组件分离

**2. 可复用性**
- 通用组件放在 `components/common/`
- 业务组件放在 `components/features/`

**3. 性能优化**
- 使用 `React.memo` 防止不必要的重渲染
- 懒加载路由组件
- 虚拟滚动（交易列表长时）

**4. 类型安全**
- 所有组件使用TypeScript
- 定义完整的Props interface
- API响应类型定义

---

### 样式方案

**TailwindCSS + CSS Modules混合**

```typescript
// 基础样式用Tailwind
<button className="px-4 py-2 bg-blue-500 text-white rounded">
  保存
</button>

// 复杂样式用CSS Modules
import styles from './TransactionItem.module.css';
<div className={styles.transactionCard}>
  ...
</div>
```

**主题配置**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        income: '#10B981',
        expense: '#EF4444'
      }
    }
  }
}
```

---

### 路由设计

```typescript
// App.tsx
<Routes>
  {/* 公开路由 */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* 受保护路由 */}
  <Route element={<ProtectedRoute />}>
    <Route path="/app" element={<Layout />}>
      <Route index element={<Navigate to="/app/dashboard" />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="transactions" element={<TransactionList />} />
      <Route path="transactions/new" element={<NewTransaction />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="ai-advisor" element={<AIAdvisor />} />
      <Route path="profile" element={<Profile />} />
    </Route>
  </Route>
  
  {/* 404 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

### HTTP客户端配置

```typescript
// src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
});

// Request拦截器 - 添加JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response拦截器 - 处理401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token过期，尝试refresh
      const refreshed = await refreshToken();
      if (refreshed) {
        // 重试原请求
        return apiClient(error.config);
      } else {
        // Refresh失败，跳转登录
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 后端架构设计

### 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI应用入口
│   ├── config.py               # 配置管理
│   ├── dependencies.py         # 依赖注入
│   │
│   ├── api/                    # API路由层
│   │   ├── __init__.py
│   │   ├── auth.py             # 认证端点
│   │   ├── transactions.py     # 交易端点
│   │   ├── analytics.py        # 分析端点
│   │   ├── ai.py               # AI端点
│   │   └── categories.py       # 类别端点
│   │
│   ├── services/               # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── transaction_service.py
│   │   ├── analytics_service.py
│   │   └── ai_service.py       # LangChain封装
│   │
│   ├── models/                 # SQLAlchemy模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── transaction.py
│   │   ├── category.py
│   │   └── ai_conversation.py
│   │
│   ├── schemas/                # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── transaction.py
│   │   ├── analytics.py
│   │   └── ai.py
│   │
│   ├── core/                   # 核心功能
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, 密码加密
│   │   ├── database.py         # 数据库连接
│   │   ├── redis_client.py     # Redis客户端
│   │   └── rate_limit.py       # 限流器
│   │
│   └── utils/                  # 工具函数
│       ├── __init__.py
│       ├── date_utils.py
│       └── validators.py
│
├── tests/                      # 测试
│   ├── test_api/
│   ├── test_services/
│   └── conftest.py
│
├── alembic/                    # 数据库迁移
│   ├── versions/
│   └── env.py
│
├── requirements.txt            # Python依赖
├── .env.example               # 环境变量示例
└── README.md
```

### 核心模块实现

#### 1. main.py（应用入口）

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import auth, transactions, analytics, ai, categories
from app.core.database import engine
from app.core.redis_client import redis_client
from app.models import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await redis_client.connect()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await redis_client.disconnect()
    await engine.dispose()

app = FastAPI(
    title="Personal Finance AI Advisor",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])

@app.get("/")
async def root():
    return {"message": "Personal Finance AI Advisor API"}
```

#### 2. security.py（认证安全）

```python
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return {"user_id": user_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
```

#### 3. database.py（数据库连接）

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")

# 转换为async URL
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

AsyncSessionLocal = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

#### 4. redis_client.py（Redis客户端）

```python
import redis.asyncio as redis
import json
from typing import Optional, Any

class RedisClient:
    def __init__(self):
        self.redis: Optional[redis.Redis] = None
    
    async def connect(self):
        self.redis = await redis.from_url(
            os.getenv("REDIS_URL"),
            encoding="utf-8",
            decode_responses=True
        )
    
    async def disconnect(self):
        if self.redis:
            await self.redis.close()
    
    async def get(self, key: str) -> Optional[Any]:
        value = await self.redis.get(key)
        if value:
            return json.loads(value)
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600):
        await self.redis.set(key, json.dumps(value), ex=ttl)
    
    async def delete(self, key: str):
        await self.redis.delete(key)
    
    async def lpush(self, key: str, value: Any):
        await self.redis.lpush(key, json.dumps(value))
    
    async def lrange(self, key: str, start: int, end: int):
        values = await self.redis.lrange(key, start, end)
        return [json.loads(v) for v in values]
    
    async def incr(self, key: str) -> int:
        return await self.redis.incr(key)
    
    async def expire(self, key: str, ttl: int):
        await self.redis.expire(key, ttl)

redis_client = RedisClient()
```

#### 5. rate_limit.py（限流器）

```python
from fastapi import HTTPException, Request
from app.core.redis_client import redis_client

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
    
    async def check_rate_limit(self, user_id: str, endpoint: str):
        key = f"rate_limit:{user_id}:{endpoint}"
        
        count = await redis_client.incr(key)
        
        if count == 1:
            await redis_client.expire(key, self.window_seconds)
        
        if count > self.max_requests:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Max {self.max_requests} requests per {self.window_seconds}s"
            )

# 预定义限流器
ai_chat_limiter = RateLimiter(max_requests=10, window_seconds=60)
transaction_parse_limiter = RateLimiter(max_requests=20, window_seconds=60)
```

---

### Service层设计

#### transaction_service.py

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate
from typing import List, Optional
from datetime import date

class TransactionService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_transaction(
        self, 
        user_id: str, 
        data: TransactionCreate
    ) -> Transaction:
        transaction = Transaction(
            user_id=user_id,
            **data.dict()
        )
        self.db.add(transaction)
        await self.db.flush()
        return transaction
    
    async def get_transactions(
        self,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[Transaction]:
        query = select(Transaction).where(Transaction.user_id == user_id)
        
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        if category:
            query = query.where(Transaction.category == category)
        
        query = query.order_by(Transaction.transaction_date.desc())
        query = query.offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def update_transaction(
        self,
        transaction_id: str,
        user_id: str,
        data: dict
    ) -> Optional[Transaction]:
        query = select(Transaction).where(
            and_(
                Transaction.id == transaction_id,
                Transaction.user_id == user_id
            )
        )
        result = await self.db.execute(query)
        transaction = result.scalar_one_or_none()
        
        if transaction:
            for key, value in data.items():
                setattr(transaction, key, value)
            await self.db.flush()
        
        return transaction
    
    async def delete_transaction(
        self,
        transaction_id: str,
        user_id: str
    ) -> bool:
        query = select(Transaction).where(
            and_(
                Transaction.id == transaction_id,
                Transaction.user_id == user_id
            )
        )
        result = await self.db.execute(query)
        transaction = result.scalar_one_or_none()
        
        if transaction:
            await self.db.delete(transaction)
            await self.db.flush()
            return True
        return False
```

#### analytics_service.py

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from app.models.transaction import Transaction
from app.core.redis_client import redis_client
from datetime import date
from typing import Dict, List

class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_summary(self, user_id: str, month: str) -> Dict:
        # 尝试从缓存获取
        cache_key = f"analytics:{user_id}:{month}"
        cached = await redis_client.get(cache_key)
        if cached:
            return cached
        
        # 解析月份
        year, month_num = map(int, month.split('-'))
        
        # 查询数据
        query = select(
            func.sum(Transaction.amount).label('total'),
            func.count(Transaction.id).label('count')
        ).where(
            and_(
                Transaction.user_id == user_id,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month_num
            )
        )
        
        result = await self.db.execute(query)
        row = result.first()
        
        # 分别计算收入和支出
        income_query = select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.user_id == user_id,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month_num,
                Transaction.amount > 0
            )
        )
        expense_query = select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.user_id == user_id,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month_num,
                Transaction.amount < 0
            )
        )
        
        income = (await self.db.execute(income_query)).scalar() or 0
        expense = abs((await self.db.execute(expense_query)).scalar() or 0)
        
        summary = {
            "month": month,
            "total_income": float(income),
            "total_expense": float(expense),
            "balance": float(income - expense),
            "transaction_count": row.count or 0
        }
        
        # 缓存1小时
        await redis_client.set(cache_key, summary, ttl=3600)
        
        return summary
    
    async def get_by_category(
        self, 
        user_id: str, 
        month: str
    ) -> List[Dict]:
        year, month_num = map(int, month.split('-'))
        
        query = select(
            Transaction.category,
            func.sum(Transaction.amount).label('amount'),
            func.count(Transaction.id).label('count')
        ).where(
            and_(
                Transaction.user_id == user_id,
                extract('year', Transaction.transaction_date) == year,
                extract('month', Transaction.transaction_date) == month_num,
                Transaction.amount < 0  # 只统计支出
            )
        ).group_by(Transaction.category)
        
        result = await self.db.execute(query)
        categories = []
        total = 0
        
        for row in result:
            amount = abs(float(row.amount))
            total += amount
            categories.append({
                "name": row.category,
                "amount": amount,
                "count": row.count
            })
        
        # 计算百分比
        for cat in categories:
            cat["percentage"] = round((cat["amount"] / total * 100), 1) if total > 0 else 0
        
        # 按金额排序
        categories.sort(key=lambda x: x["amount"], reverse=True)
        
        return categories
```

---

## 部署架构

### Railway部署方案

#### 服务配置

**1. Backend Service**

```yaml
# railway.json (backend)
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**环境变量**:
```bash
DATABASE_URL=<Railway PostgreSQL自动提供>
REDIS_URL=<Railway Redis自动提供>
OPENAI_API_KEY=<手动配置>
JWT_SECRET=<手动配置，随机字符串>
FRONTEND_URL=<Frontend部署后的URL>
ENVIRONMENT=production
```

**2. Frontend Service**

```yaml
# railway.json (frontend)
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run preview"
  }
}
```

**环境变量**:
```bash
VITE_API_URL=<Backend部署后的URL>
```

**3. PostgreSQL Service**
- Railway内置服务，一键添加
- 自动提供DATABASE_URL

**4. Redis Service**
- Railway内置服务，一键添加
- 自动提供REDIS_URL

#### 部署流程

1. **创建Railway项目**
   ```bash
   # 连接GitHub仓库
   railway link
   ```

2. **添加服务**
   - New Service → GitHub Repo → 选择backend目录
   - New Service → GitHub Repo → 选择frontend目录
   - Add PostgreSQL
   - Add Redis

3. **配置环境变量**
   - Backend: 添加OPENAI_API_KEY, JWT_SECRET, FRONTEND_URL
   - Frontend: 添加VITE_API_URL

4. **自动部署**
   - Push到main分支自动触发部署
   - Railway自动构建和部署

5. **获取域名**
   - Railway自动分配域名
   - 或绑定自定义域名

---

### 本地开发环境

#### Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: finance_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### 启动命令

```bash
# 启动数据库服务
docker-compose up -d

# 后端开发
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端开发
cd frontend
npm install
npm run dev
```

#### 环境变量（本地）

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_db
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-xxx
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development

# frontend/.env
VITE_API_URL=http://localhost:8000
```

---

### 安全配置

#### 1. CORS配置

```python
# 生产环境严格限制
CORS_ORIGINS = [
    os.getenv("FRONTEND_URL"),  # 只允许前端域名
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

#### 2. JWT配置

```python
# Token过期时间
ACCESS_TOKEN_EXPIRE_MINUTES = 15    # 访问令牌15分钟
REFRESH_TOKEN_EXPIRE_DAYS = 7       # 刷新令牌7天

# 密钥要求
# - 至少32字符
# - 随机生成
# - 存储在环境变量
JWT_SECRET = os.getenv("JWT_SECRET")
assert len(JWT_SECRET) >= 32, "JWT_SECRET must be at least 32 characters"
```

#### 3. 密码策略

```python
# 密码要求（前端验证）
PASSWORD_MIN_LENGTH = 8
PASSWORD_REQUIRE_UPPERCASE = True
PASSWORD_REQUIRE_LOWERCASE = True
PASSWORD_REQUIRE_DIGIT = True

# Bcrypt配置
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # 适中的计算成本
)
```

#### 4. Rate Limiting

```python
# API限流
API_RATE_LIMIT = 100  # 100请求/分钟/IP
AI_RATE_LIMIT = 10    # 10次AI请求/分钟/用户

# 实现
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/transactions")
@limiter.limit("100/minute")
async def get_transactions():
    ...
```

#### 5. SQL注入防护

```python
# 使用SQLAlchemy ORM，自动防护SQL注入
# 永远不要拼接SQL字符串

# ✅ 正确
query = select(Transaction).where(Transaction.user_id == user_id)

# ❌ 错误
query = f"SELECT * FROM transactions WHERE user_id = '{user_id}'"
```

#### 6. 敏感信息处理

```python
# 日志中隐藏敏感字段
class SensitiveFormatter(logging.Formatter):
    SENSITIVE_FIELDS = ['password', 'token', 'api_key']
    
    def format(self, record):
        msg = super().format(record)
        for field in self.SENSITIVE_FIELDS:
            msg = re.sub(f'{field}=[^\\s]+', f'{field}=***', msg)
        return msg

# 响应中不返回敏感字段
class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    # 不包含 password_hash
    
    class Config:
        from_attributes = True
```

---

### 性能优化

#### 1. 数据库优化

```python
# 索引策略
class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(UUID, primary_key=True)
    user_id = Column(UUID, index=True)  # 单列索引
    transaction_date = Column(Date, index=True)  # 单列索引
    
    __table_args__ = (
        Index('idx_user_date', 'user_id', 'transaction_date'),  # 复合索引
    )

# 查询优化
# 使用joinedload避免N+1查询
query = select(Transaction).options(
    joinedload(Transaction.user)
).where(Transaction.user_id == user_id)
```

#### 2. Redis缓存策略

```python
# 缓存热点数据
CACHE_STRATEGY = {
    'analytics_summary': 3600,      # 1小时
    'category_summary': 3600,       # 1小时
    'ai_insights': 3600,           # 1小时
    'conversation_history': 3600,  # 1小时
    'user_session': 86400,         # 24小时
}

# 缓存失效策略
async def invalidate_analytics_cache(user_id: str, month: str):
    """创建/更新/删除交易时，清除相关缓存"""
    await redis_client.delete(f"analytics:{user_id}:{month}")
```

#### 3. 分页优化

```python
# 使用cursor-based分页（大数据集）
async def get_transactions_cursor(
    user_id: str,
    cursor: Optional[str] = None,
    limit: int = 20
):
    query = select(Transaction).where(Transaction.user_id == user_id)
    
    if cursor:
        query = query.where(Transaction.id < cursor)
    
    query = query.order_by(Transaction.id.desc()).limit(limit + 1)
    
    results = await db.execute(query)
    transactions = results.scalars().all()
    
    has_next = len(transactions) > limit
    if has_next:
        transactions = transactions[:limit]
    
    next_cursor = str(transactions[-1].id) if has_next else None
    
    return transactions, next_cursor
```

#### 4. API响应优化

```python
# 使用Gzip压缩
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 字段选择（只返回需要的字段）
@app.get("/api/transactions")
async def get_transactions(
    fields: Optional[str] = None  # ?fields=id,amount,category
):
    if fields:
        selected_fields = fields.split(',')
        # 只查询指定字段
```

#### 5. 连接池配置

```python
# SQLAlchemy连接池
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,           # 连接池大小
    max_overflow=10,        # 最大溢出连接
    pool_pre_ping=True,     # 连接健康检查
    pool_recycle=3600,      # 1小时回收连接
)

# Redis连接池
redis_client = redis.from_url(
    REDIS_URL,
    max_connections=50
)
```

---

### 监控和日志

#### 1. 日志配置

```python
import logging
from logging.handlers import RotatingFileHandler

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('app.log', maxBytes=10485760, backupCount=5),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# 关键事件日志
@app.post("/api/transactions")
async def create_transaction(...):
    logger.info(f"User {user_id} created transaction {transaction.id}")
    ...
```

#### 2. 错误追踪

```python
# Railway自动收集日志
# 关键错误记录
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "Internal server error"}}
    )
```

#### 3. 性能监控

```python
# 简单的请求计时中间件
import time

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # 慢请求日志
    if process_time > 1.0:
        logger.warning(f"Slow request: {request.url} took {process_time:.2f}s")
    
    return response
```

#### 4. 健康检查

```python
@app.get("/health")
async def health_check():
    """健康检查端点，Railway用于监控"""
    # 检查数据库连接
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    # 检查Redis连接
    try:
        await redis_client.redis.ping()
        redis_status = "healthy"
    except Exception:
        redis_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == redis_status == "healthy" else "degraded",
        "database": db_status,
        "redis": redis_status
    }
```

---

### 成本估算

#### Railway免费额度
- **$5/月免费credit**
- **估算使用量**:
  - Backend: ~$3/月
  - Frontend: ~$1/月
  - PostgreSQL: 免费（共享）
  - Redis: 免费（共享）

**总计**: 约$4-5/月，在免费额度内

#### OpenAI API成本
- **GPT-4o-mini定价**:
  - Input: $0.15/1M tokens
  - Output: $0.60/1M tokens

- **估算**（假设每天10次对话）:
  - 每次对话约500 input + 200 output tokens
  - 每月: 10 * 30 * 700 = 210K tokens
  - 成本: ~$0.15/月

**总成本**: ~$5-6/月（demo项目）

---

## 开发计划

### 开发阶段划分

#### 阶段1：基础架构搭建（2-3天）

**后端**:
- [x] 项目结构搭建
- [x] FastAPI应用初始化
- [x] 数据库模型定义
- [x] SQLAlchemy配置
- [x] Redis客户端封装
- [x] JWT认证实现
- [x] 基础中间件（CORS、日志）

**前端**:
- [x] Vite + React + TypeScript项目初始化
- [x] TailwindCSS配置
- [x] 路由配置
- [x] Context状态管理搭建
- [x] Axios客户端封装
- [x] 认证流程实现

**完成标志**: 用户可以注册、登录，前后端通信正常

---

#### 阶段2：交易管理功能（2-3天）

**后端**:
- [x] Transaction CRUD API
- [x] TransactionService实现
- [x] 分页和筛选
- [x] 数据验证

**前端**:
- [x] 交易列表页
- [x] 新建交易页（手动输入模式）
- [x] 交易编辑/删除
- [x] 日期和类别筛选

**完成标志**: 用户可以完整地管理交易记录

---

#### 阶段3：自然语言解析（1-2天）

**后端**:
- [x] LangChain集成
- [x] TransactionParser实现
- [x] 结构化输出配置
- [x] Parse API端点

**前端**:
- [x] 自然语言输入组件
- [x] 解析结果预览
- [x] 输入模式切换

**完成标志**: 用户可以用自然语言记账

---

#### 阶段4：数据分析功能（2天）

**后端**:
- [x] AnalyticsService实现
- [x] Summary API
- [x] Category统计API
- [x] Trend API
- [x] Redis缓存实现

**前端**:
- [x] Dashboard页面
- [x] Recharts图表集成
- [x] 饼图（类别占比）
- [x] 折线图（趋势）
- [x] 数据卡片组件

**完成标志**: 用户可以看到可视化的财务数据

---

#### 阶段5：AI财务顾问（2-3天）

**后端**:
- [x] FinancialAdvisor Agent实现
- [x] Tools定义（数据查询）
- [x] ConversationMemory管理
- [x] WebSocket端点
- [x] 流式响应实现
- [x] 对话历史存储

**前端**:
- [x] AI顾问页面
- [x] WebSocket连接
- [x] 流式消息显示
- [x] 对话历史加载
- [x] Markdown渲染

**完成标志**: 用户可以和AI对话询问财务问题

---

#### 阶段6：AI洞察生成（1-2天）

**后端**:
- [x] InsightsGenerator实现
- [x] 数据分析逻辑
- [x] Insights API
- [x] 缓存策略

**前端**:
- [x] Dashboard集成洞察卡片
- [x] 洞察列表样式
- [x] 刷新功能

**完成标志**: Dashboard显示AI生成的财务建议

---

#### 阶段7：优化和测试（2天）

**后端**:
- [x] Rate limiting实现
- [x] 错误处理完善
- [x] 日志配置
- [x] 性能优化（查询、缓存）
- [x] 安全检查

**前端**:
- [x] Loading状态
- [x] 错误边界
- [x] 响应式优化
- [x] 性能优化
- [x] 浏览器兼容性测试

**测试**:
- [x] API端点测试
- [x] 前端组件测试
- [x] 集成测试
- [x] 用户流程测试

**完成标志**: 应用稳定可用，无明显bug

---

#### 阶段8：部署上线（1天）

**部署**:
- [x] Railway项目配置
- [x] 环境变量设置
- [x] 数据库迁移
- [x] 前后端部署
- [x] 域名配置（可选）

**文档**:
- [x] README.md
- [x] API文档
- [x] 部署文档
- [x] 开发指南

**完成标志**: 应用在线可访问，文档完整

---

### 总时间估算

**最快**: 10-12天（全职开发）
**正常**: 14-16天（每天4-6小时）
**舒适**: 20天（每天2-4小时）

---

## 测试策略

### 后端测试

#### 1. 单元测试

```python
# tests/test_services/test_transaction_service.py
import pytest
from app.services.transaction_service import TransactionService

@pytest.mark.asyncio
async def test_create_transaction(db_session, test_user):
    service = TransactionService(db_session)
    
    transaction = await service.create_transaction(
        user_id=test_user.id,
        data={
            "amount": -50.0,
            "category": "餐饮",
            "description": "午餐",
            "transaction_date": "2026-08-11",
            "input_method": "manual"
        }
    )
    
    assert transaction.id is not None
    assert transaction.amount == -50.0
    assert transaction.category == "餐饮"

@pytest.mark.asyncio
async def test_get_transactions_with_filter(db_session, test_user):
    service = TransactionService(db_session)
    
    transactions = await service.get_transactions(
        user_id=test_user.id,
        category="餐饮",
        limit=10
    )
    
    assert all(t.category == "餐饮" for t in transactions)
```

#### 2. API测试

```python
# tests/test_api/test_transactions.py
from httpx import AsyncClient
import pytest

@pytest.mark.asyncio
async def test_create_transaction_api(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/transactions",
        json={
            "input_method": "manual",
            "amount": -50.0,
            "category": "餐饮",
            "description": "午餐",
            "transaction_date": "2026-08-11"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == -50.0
    assert data["category"] == "餐饮"

@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    response = await client.get("/api/transactions")
    assert response.status_code == 401
```

#### 3. AI功能测试

```python
# tests/test_ai/test_parser.py
import pytest
from app.services.ai_service import TransactionParser

@pytest.mark.asyncio
async def test_parse_natural_language():
    parser = TransactionParser()
    
    result = await parser.parse_natural_language(
        "今天中午肯德基花了45块"
    )
    
    assert result.amount == -45.0
    assert result.category == "餐饮"
    assert "肯德基" in result.description
    assert result.confidence > 0.7
```

### 前端测试

#### 1. 组件测试

```typescript
// src/components/Transaction/TransactionItem.test.tsx
import { render, screen } from '@testing-library/react';
import TransactionItem from './TransactionItem';

test('renders transaction item correctly', () => {
  const transaction = {
    id: '1',
    amount: -45.0,
    category: '餐饮',
    description: '午餐',
    transaction_date: '2026-08-11'
  };
  
  render(<TransactionItem transaction={transaction} />);
  
  expect(screen.getByText('餐饮')).toBeInTheDocument();
  expect(screen.getByText('-¥45.00')).toBeInTheDocument();
  expect(screen.getByText('午餐')).toBeInTheDocument();
});
```

#### 2. 集成测试

```typescript
// src/pages/Dashboard.test.tsx
import { render, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/analytics/summary', (req, res, ctx) => {
    return res(ctx.json({
      total_income: 8000,
      total_expense: 3450,
      balance: 4550
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('dashboard loads and displays summary', async () => {
  render(<Dashboard />);
  
  await waitFor(() => {
    expect(screen.getByText('¥8,000')).toBeInTheDocument();
    expect(screen.getByText('¥3,450')).toBeInTheDocument();
  });
});
```

### 手动测试清单

#### 用户流程测试
- [ ] 注册新用户
- [ ] 登录已有用户
- [ ] Token刷新功能
- [ ] 退出登录

#### 交易管理测试
- [ ] 手动创建交易
- [ ] 自然语言创建交易
- [ ] 编辑交易
- [ ] 删除交易
- [ ] 筛选交易
- [ ] 分页功能

#### 数据分析测试
- [ ] Dashboard加载正确
- [ ] 图表数据准确
- [ ] 时间范围切换
- [ ] 缓存生效

#### AI功能测试
- [ ] 自然语言解析准确
- [ ] AI对话响应正常
- [ ] 流式输出正常
- [ ] 对话上下文保持
- [ ] AI洞察生成

#### 边界情况测试
- [ ] 无数据时的显示
- [ ] 网络错误处理
- [ ] Token过期处理
- [ ] 并发请求
- [ ] 大数据量

---

## 风险与挑战

### 技术风险

**1. OpenAI API稳定性**
- **风险**: API可能超时、限流或服务中断
- **缓解**:
  - 实现重试机制
  - 设置合理的超时时间
  - 提供降级方案（预设回复）
  - 监控API调用失败率

**2. WebSocket连接稳定性**
- **风险**: 网络不稳定导致连接断开
- **缓解**:
  - 实现自动重连机制
  - 心跳检测
  - 断线提示
  - 消息缓冲队列

**3. 数据库性能**
- **风险**: 交易数据量大时查询变慢
- **缓解**:
  - 合理的索引设计
  - 分页加载
  - Redis缓存热点数据
  - 定期数据归档（可选）

### 产品风险

**1. AI解析准确度**
- **风险**: 自然语言解析不准确，用户体验差
- **缓解**:
  - 提供解析预览，用户确认后保存
  - 保留手动输入选项
  - 持续优化prompt
  - 收集错误case改进

**2. AI成本控制**
- **风险**: 用户频繁调用AI导致成本超标
- **缓解**:
  - Rate limiting限制调用频次
  - 使用GPT-4o-mini降低成本
  - 缓存重复查询
  - 监控每日成本

**3. 用户隐私**
- **风险**: 财务数据敏感，泄露风险
- **缓解**:
  - 数据加密存储
  - HTTPS传输
  - 严格的认证授权
  - 不记录敏感信息到日志
  - 遵守数据保护法规

---

## 未来扩展方向

### 功能扩展

**1. 预算管理**
- 设置每月/类别预算
- 超支预警
- 预算执行分析

**2. 储蓄目标**
- 设置储蓄目标
- 进度追踪
- 达成预测

**3. 多币种支持**
- 支持多种货币
- 汇率转换
- 跨币种统计

**4. 报表导出**
- PDF报告生成
- Excel导出
- 邮件定时发送

**5. 移动端适配**
- 响应式设计优化
- PWA支持
- 原生App（React Native）

### 技术优化

**1. 性能优化**
- GraphQL替代REST
- 服务端渲染（SSR）
- CDN加速

**2. AI能力增强**
- 支持语音输入
- 图片识别（票据扫描）
- 更智能的建议（机器学习模型）

**3. 数据分析深化**
- 更多可视化图表
- 自定义报表
- 数据对比分析

**4. 社交功能**
- 家庭账本（多人协作）
- 匿名数据对比
- 社区分享

---

## 总结

### 项目亮点

**1. 技术栈全面**
- ✅ 前端: React + TypeScript + 现代化工具链
- ✅ 后端: Python + FastAPI + 异步架构
- ✅ AI: LangChain + OpenAI集成
- ✅ 数据库: PostgreSQL + Redis
- ✅ 部署: Railway云平台

**2. AI特色明显**
- ✅ 自然语言交易解析
- ✅ 对话式AI财务顾问
- ✅ 智能洞察生成
- ✅ 流式响应体验

**3. 工程质量**
- ✅ 清晰的分层架构
- ✅ 完整的认证授权
- ✅ 性能优化（缓存、索引）
- ✅ 安全防护（Rate limit、SQL注入防护）

**4. 面试友好**
- ✅ 功能完整可演示
- ✅ 架构清晰易讲解
- ✅ 技术深度适中
- ✅ 可扩展性强

### 适合展示的技术点

**面试时可以讲的亮点**:
1. LangChain的Agent和Tool使用
2. WebSocket流式响应实现
3. Redis缓存策略设计
4. JWT认证流程
5. 自然语言处理应用
6. 数据库索引优化
7. 前端状态管理
8. API设计规范
9. 部署和DevOps实践

---

## 文档版本

- **版本**: 1.0
- **创建日期**: 2026-08-11
- **作者**: AI Design Assistant
- **状态**: 已完成，待审核

---

