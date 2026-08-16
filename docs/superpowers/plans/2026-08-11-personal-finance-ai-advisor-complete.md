# Personal Finance AI Advisor - Complete Implementation Plan

> **Status:** This is a complete implementation plan that builds on the existing MVP foundation to deliver the full AI-powered personal finance application with natural language transaction parsing and AI advisory chat.

## Overview

**Goal:** Complete the AI-powered personal finance application with natural language transaction input and intelligent financial advisory chat capabilities.

**Current Status:**
- ✅ User authentication (register, login, JWT tokens)
- ✅ Manual transaction management (CRUD)
- ✅ Categories API (9 predefined categories)
- ✅ Basic analytics (monthly summary, category breakdown)
- ✅ Frontend (React + TypeScript, auth, transactions, dashboard)
- ❌ Natural language transaction parsing
- ❌ AI financial advisor chat
- ❌ Advanced analytics and insights

**Remaining Work:**
1. LangChain integration for transaction parsing
2. AI conversation system with streaming responses
3. Advanced analytics and AI-generated insights
4. Frontend chat interface with WebSocket
5. Enhanced dashboard with AI insights

请注意,你可以使用chrome dev tool来实时查看当前前端的效果.甚至通过截图的方式来查看当前前端是否美观.

**Tech Stack:**
- Backend: Python 3.11+, FastAPI, SQLAlchemy 2.0, LangChain, OpenAI GPT-4o-mini
- Frontend: React 18, TypeScript, Vite, TailwindCSS
- Database: PostgreSQL 15, Redis 7
- AI: LangChain + OpenAI GPT-4o-mini

---

## Global Constraints

- Python >= 3.11
- All passwords hashed with bcrypt
- JWT tokens: access token 15min, refresh token 7 days
- PostgreSQL >= 15 with timezone-aware datetime columns
- All dates in ISO 8601 format
- All monetary amounts as Decimal with 2 decimal places
- Redis caching: analytics 1h, AI insights 1h
- Rate limiting: AI endpoints max 10 req/min, transaction parsing max 20 req/min
- OpenAI API key required (set in environment)
- WebSocket for real-time AI chat streaming
- LangChain for AI orchestration

---

## Task 1: Fix Analytics Summary Bug

**Priority:** Critical (blocking current functionality)

**Issue:** Backend `/api/analytics/summary` returns all zeros even when transactions exist. The `/api/analytics/by-category` endpoint works correctly, indicating the bug is specific to the summary calculation.

**Files:**
- Fix: `backend/app/services/analytics_service.py`
- Test: `backend/tests/test_analytics.py`

**Root Cause Analysis Required:**
- Check SQL query in `get_summary()` method
- Verify user_id filtering
- Verify date range filtering (year/month extraction)
- Check Decimal to float conversion

**Steps:**

- [ ] **Step 1: Add debug test to reproduce bug**

```python
# backend/tests/test_analytics.py
@pytest.mark.asyncio
async def test_summary_with_real_transaction(db_session, test_user):
    """Test that summary correctly aggregates actual transactions"""
    from app.services.transaction_service import TransactionService
    from app.services.analytics_service import AnalyticsService
    from app.schemas.transaction import TransactionCreate
    from app.models.transaction import InputMethod
    from decimal import Decimal
    from datetime import date
    
    # Create a real transaction
    trans_service = TransactionService(db_session)
    transaction = await trans_service.create_transaction(
        user_id=str(test_user.id),
        data=TransactionCreate(
            input_method=InputMethod.MANUAL,
            amount=Decimal("-150.00"),
            category="餐饮",
            transaction_date=date.today()
        )
    )
    
    # Get summary
    analytics_service = AnalyticsService(db_session)
    month = date.today().strftime("%Y-%m")
    summary = await analytics_service.get_summary(str(test_user.id), month)
    
    # This should NOT be zero!
    assert summary["total_expense"] == 150.00, f"Expected 150.00, got {summary['total_expense']}"
    assert summary["transaction_count"] == 1
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pytest tests/test_analytics.py::test_summary_with_real_transaction -v
```

Expected: FAIL with assertion error showing zeros

- [ ] **Step 3: Debug and fix the analytics service**

Review `backend/app/services/analytics_service.py` - likely issues:
- UUID conversion problem
- Date filtering not working
- Query not committed/flushed

- [ ] **Step 4: Run test to verify fix**

```bash
pytest tests/test_analytics.py -v
```

Expected: PASS

- [ ] **Step 5: Manual test via browser**

Create transaction via frontend, check dashboard shows correct values

- [ ] **Step 6: Commit fix**

```bash
git add backend/
git commit -m "fix: analytics summary returns correct aggregated values"
```

---

## Task 2: Natural Language Transaction Parsing with LangChain

**Goal:** Allow users to input transactions in natural language (e.g., "今天午餐花了50块") and automatically parse into structured transaction data.

**Files:**
- Create: `backend/app/services/langchain_service.py`
- Create: `backend/app/api/nlp.py`
- Create: `backend/tests/test_nlp.py`
- Modify: `backend/app/main.py` (register NLP router)
- Modify: `backend/requirements.txt` (add LangChain dependencies)

**Interfaces:**
- Consumes: OpenAI API, categories from database
- Produces: POST /api/nlp/parse-transaction → parsed TransactionCreate object

**Dependencies to add:**
```
langchain==0.1.0
langchain-openai==0.0.5
pydantic>=2.0.0
```

**Steps:**

- [ ] **Step 1: Install LangChain dependencies**

```bash
cd backend
echo "langchain==0.1.0" >> requirements.txt
echo "langchain-openai==0.0.5" >> requirements.txt
pip install -r requirements.txt
```

- [ ] **Step 2: Add OpenAI API key to environment**

```bash
# backend/.env
OPENAI_API_KEY=sk-your-key-here
```

- [ ] **Step 3: Create LangChain service with transaction parser**

```python
# backend/app/services/langchain_service.py
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
import os

class ParsedTransaction(BaseModel):
    """Structured transaction data parsed from natural language"""
    amount: float = Field(description="交易金额，支出为负数，收入为正数")
    category: str = Field(description="交易类别，必须是以下之一：餐饮、交通、购物、娱乐、住房、医疗、教育、通讯、其他")
    description: Optional[str] = Field(description="交易描述或备注")
    transaction_date: str = Field(description="交易日期，格式YYYY-MM-DD")

class LangChainService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.parser = PydanticOutputParser(pydantic_object=ParsedTransaction)
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """你是一个专业的财务助手，负责解析用户输入的交易信息。

可用类别：
- 餐饮：餐厅、外卖、食物、饮料、咖啡
- 交通：打车、公交、地铁、加油、停车
- 购物：衣服、鞋子、包、日用品、电子产品
- 娱乐：电影、游戏、KTV、旅游
- 住房：房租、水电、物业、装修
- 医疗：看病、买药、体检
- 教育：学费、培训、书籍
- 通讯：话费、网费
- 其他：无法归类的其他支出

时间处理规则：
- "今天" → 当前日期
- "昨天" → 当前日期-1天
- "前天" → 当前日期-2天
- 具体日期直接使用
- 今天是 {today}

金额规则：
- 支出用负数（如 -50.00）
- 收入用正数（如 +5000.00）

{format_instructions}"""),
            ("user", "{input}")
        ])
    
    async def parse_transaction(self, user_input: str) -> ParsedTransaction:
        """Parse natural language input into structured transaction"""
        chain = self.prompt | self.llm | self.parser
        
        result = await chain.ainvoke({
            "input": user_input,
            "today": date.today().isoformat(),
            "format_instructions": self.parser.get_format_instructions()
        })
        
        return result
```

- [ ] **Step 4: Create NLP API endpoint**

```python
# backend/app/api/nlp.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.langchain_service import LangChainService
from app.services.transaction_service import TransactionService
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.models.transaction import InputMethod
from pydantic import BaseModel
from decimal import Decimal

router = APIRouter(prefix="/nlp", tags=["nlp"])

class ParseTransactionRequest(BaseModel):
    text: str

class ParseTransactionResponse(BaseModel):
    parsed: dict
    transaction: TransactionResponse

@router.post("/parse-transaction", response_model=ParseTransactionResponse)
async def parse_and_create_transaction(
    request: ParseTransactionRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Parse natural language and create transaction"""
    try:
        # Parse with LangChain
        langchain_service = LangChainService()
        parsed = await langchain_service.parse_transaction(request.text)
        
        # Create transaction
        transaction_service = TransactionService(db)
        transaction_data = TransactionCreate(
            input_method=InputMethod.AI_PARSED,
            amount=Decimal(str(parsed.amount)),
            category=parsed.category,
            description=parsed.description,
            transaction_date=parsed.transaction_date
        )
        
        transaction = await transaction_service.create_transaction(
            user_id=current_user["user_id"],
            data=transaction_data
        )
        
        return ParseTransactionResponse(
            parsed=parsed.dict(),
            transaction=transaction
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse: {str(e)}")
```

- [ ] **Step 5: Register NLP router**

```python
# backend/app/main.py (add to existing imports and router registration)
from app.api import nlp

app.include_router(nlp.router, prefix="/api")
```

- [ ] **Step 6: Write tests**

```python
# backend/tests/test_nlp.py
import pytest
from app.services.langchain_service import LangChainService

@pytest.mark.asyncio
async def test_parse_simple_expense():
    service = LangChainService()
    result = await service.parse_transaction("今天午餐花了50块")
    
    assert result.amount < 0  # Expense is negative
    assert abs(result.amount) == 50.0
    assert result.category == "餐饮"
    
@pytest.mark.asyncio
async def test_parse_income():
    service = LangChainService()
    result = await service.parse_transaction("收到工资5000元")
    
    assert result.amount > 0  # Income is positive
    assert result.amount == 5000.0

@pytest.mark.asyncio
async def test_parse_with_date():
    service = LangChainService()
    result = await service.parse_transaction("昨天打车花了30块")
    
    assert result.category == "交通"
    assert result.amount == -30.0
```

- [ ] **Step 7: Test via API**

```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# Test endpoint
curl -X POST http://localhost:8000/api/nlp/parse-transaction \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"text": "今天午餐花了50块"}'
```

- [ ] **Step 8: Commit**

```bash
git add backend/
git commit -m "feat: add natural language transaction parsing with LangChain"
```

---

## Task 3: AI Conversation System with Streaming

**Goal:** Implement AI financial advisor chat with streaming responses using WebSocket. Users can ask questions like "我这个月花哪最多" and get real-time AI analysis.

**Files:**
- Create: `backend/app/services/ai_advisor_service.py`
- Create: `backend/app/api/chat.py`
- Create: `backend/tests/test_chat.py`
- Modify: `backend/app/main.py` (register chat WebSocket endpoint)

**Interfaces:**
- Consumes: User's transaction data, conversation history, OpenAI API
- Produces: WebSocket /api/chat/ws → streaming AI responses
- Stores: AIConversation model for conversation history

**Steps:**

- [ ] **Step 1: Create AI Advisor service with context**

```python
# backend/app/services/ai_advisor_service.py
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models import Transaction, AIConversation
from datetime import datetime, date
from typing import List, AsyncGenerator
import json

class AIAdvisorService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            streaming=True
        )
    
    async def get_user_context(self, user_id: str, month: str = None) -> str:
        """Get user's financial context for AI"""
        if not month:
            month = date.today().strftime("%Y-%m")
        
        year, month_num = map(int, month.split("-"))
        
        # Get monthly summary
        income_query = select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            func.extract('year', Transaction.transaction_date) == year,
            func.extract('month', Transaction.transaction_date) == month_num,
            Transaction.amount > 0
        )
        expense_query = select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            func.extract('year', Transaction.transaction_date) == year,
            func.extract('month', Transaction.transaction_date) == month_num,
            Transaction.amount < 0
        )
        
        total_income = (await self.db.execute(income_query)).scalar() or 0
        total_expense = abs((await self.db.execute(expense_query)).scalar() or 0)
        
        # Get category breakdown
        category_query = select(
            Transaction.category,
            func.sum(func.abs(Transaction.amount)).label('total'),
            func.count(Transaction.id).label('count')
        ).where(
            Transaction.user_id == user_id,
            func.extract('year', Transaction.transaction_date) == year,
            func.extract('month', Transaction.transaction_date) == month_num,
            Transaction.amount < 0
        ).group_by(Transaction.category).order_by(func.sum(func.abs(Transaction.amount)).desc())
        
        categories = (await self.db.execute(category_query)).all()
        
        # Format context
        context = f"""当前用户财务状况（{month}）：
- 总收入：¥{total_income:.2f}
- 总支出：¥{total_expense:.2f}
- 结余：¥{(total_income - total_expense):.2f}

支出分类明细：
"""
        for cat in categories:
            percentage = (cat.total / total_expense * 100) if total_expense > 0 else 0
            context += f"- {cat.category}：¥{cat.total:.2f} ({percentage:.1f}%)，{cat.count}笔交易\n"
        
        return context
    
    async def get_conversation_history(self, user_id: str, limit: int = 10) -> List:
        """Get recent conversation history"""
        query = select(AIConversation).where(
            AIConversation.user_id == user_id
        ).order_by(AIConversation.created_at.desc()).limit(limit)
        
        result = await self.db.execute(query)
        conversations = result.scalars().all()
        
        # Convert to LangChain messages (reverse order for chronological)
        messages = []
        for conv in reversed(conversations):
            messages.append(HumanMessage(content=conv.user_message))
            messages.append(AIMessage(content=conv.ai_response))
        
        return messages
    
    async def save_conversation(self, user_id: str, user_message: str, ai_response: str):
        """Save conversation to database"""
        conversation = AIConversation(
            user_id=user_id,
            user_message=user_message,
            ai_response=ai_response
        )
        self.db.add(conversation)
        await self.db.commit()
    
    async def chat_stream(
        self, 
        user_id: str, 
        user_message: str
    ) -> AsyncGenerator[str, None]:
        """Stream AI response with user context"""
        # Get context
        context = await self.get_user_context(user_id)
        history = await self.get_conversation_history(user_id)
        
        # Build prompt
        system_message = f"""你是一个专业的个人财务顾问AI助手。你的任务是：
1. 分析用户的财务数据
2. 回答用户的财务问题
3. 提供实用的理财建议
4. 用简洁、友好的中文回答

用户当前财务状况：
{context}

回答规则：
- 基于用户的实际数据给出建议
- 语气友好、专业
- 给出具体可执行的建议
- 如果数据不足，明确告知用户
"""
        
        messages = [
            SystemMessage(content=system_message),
            *history,
            HumanMessage(content=user_message)
        ]
        
        # Stream response
        full_response = ""
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                full_response += chunk.content
                yield chunk.content
        
        # Save conversation
        await self.save_conversation(user_id, user_message, full_response)
```

- [ ] **Step 2: Create WebSocket chat endpoint**

```python
# backend/app/api/chat.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_token
from app.services.ai_advisor_service import AIAdvisorService
import json

router = APIRouter(prefix="/chat", tags=["chat"])

@router.websocket("/ws")
async def chat_websocket(
    websocket: WebSocket,
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """WebSocket endpoint for AI chat with streaming"""
    await websocket.accept()
    
    try:
        # Verify token
        payload = verify_token(token)
        user_id = payload.get("user_id")
        
        if not user_id:
            await websocket.send_json({"error": "Invalid token"})
            await websocket.close()
            return
        
        # Initialize AI service
        ai_service = AIAdvisorService(db)
        
        # Chat loop
        while True:
            # Receive user message
            data = await websocket.receive_text()
            message_data = json.loads(data)
            user_message = message_data.get("message")
            
            if not user_message:
                continue
            
            # Send typing indicator
            await websocket.send_json({"type": "typing", "content": True})
            
            # Stream AI response
            await websocket.send_json({"type": "start"})
            
            async for chunk in ai_service.chat_stream(user_id, user_message):
                await websocket.send_json({
                    "type": "chunk",
                    "content": chunk
                })
            
            await websocket.send_json({"type": "end"})
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()
```

- [ ] **Step 3: Register WebSocket route**

```python
# backend/app/main.py
from app.api import chat

app.include_router(chat.router, prefix="/api")
```

- [ ] **Step 4: Write tests**

```python
# backend/tests/test_chat.py
import pytest
from app.services.ai_advisor_service import AIAdvisorService

@pytest.mark.asyncio
async def test_get_user_context(db_session, test_user):
    """Test context generation from user transactions"""
    service = AIAdvisorService(db_session)
    context = await service.get_user_context(str(test_user.id))
    
    assert "总收入" in context
    assert "总支出" in context
    assert "结余" in context

@pytest.mark.asyncio
async def test_save_conversation(db_session, test_user):
    """Test conversation history saving"""
    service = AIAdvisorService(db_session)
    
    await service.save_conversation(
        str(test_user.id),
        "我这个月花哪最多？",
        "根据您的数据，餐饮支出最多..."
    )
    
    history = await service.get_conversation_history(str(test_user.id))
    assert len(history) > 0
```

- [ ] **Step 5: Test WebSocket manually**

```python
# Test with Python client
import asyncio
import websockets
import json

async def test_chat():
    token = "your-jwt-token"
    uri = f"ws://localhost:8000/api/chat/ws?token={token}"
    
    async with websockets.connect(uri) as websocket:
        # Send message
        await websocket.send(json.dumps({
            "message": "我这个月花哪最多？"
        }))
        
        # Receive streaming response
        while True:
            response = await websocket.recv()
            data = json.loads(response)
            
            if data.get("type") == "chunk":
                print(data["content"], end="", flush=True)
            elif data.get("type") == "end":
                break

asyncio.run(test_chat())
```

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: add AI advisor chat with WebSocket streaming"
```

---

## Task 4: Frontend - NLP Transaction Input

**Goal:** Add natural language input field to transaction creation page, allowing users to type "今天午餐花了50块" and auto-fill the form.

**Files:**
- Create: `frontend/src/api/nlp.ts`
- Modify: `frontend/src/pages/NewTransaction.tsx`

**Interfaces:**
- Consumes: POST /api/nlp/parse-transaction
- Produces: Enhanced transaction form with NLP input

**Steps:**

- [ ] **Step 1: Create NLP API client**

```typescript
// frontend/src/api/nlp.ts
import apiClient from './client';

export interface ParseTransactionRequest {
  text: string;
}

export interface ParsedTransaction {
  amount: number;
  category: string;
  description?: string;
  transaction_date: string;
}

export interface ParseTransactionResponse {
  parsed: ParsedTransaction;
  transaction: any; // Full transaction response
}

export const nlpApi = {
  parseTransaction: async (text: string): Promise<ParseTransactionResponse> => {
    const response = await apiClient.post<ParseTransactionResponse>(
      '/api/nlp/parse-transaction',
      { text }
    );
    return response.data;
  },
};
```

- [ ] **Step 2: Update NewTransaction page with NLP input**

```typescript
// frontend/src/pages/NewTransaction.tsx
// Add at the top of the component
const [nlpInput, setNlpInput] = useState('');
const [isParsingNLP, setIsParsingNLP] = useState(false);
const [showNLP, setShowNLP] = useState(true); // Toggle between NLP and manual

const handleNLPParse = async () => {
  if (!nlpInput.trim()) return;
  
  setIsParsingNLP(true);
  try {
    const result = await nlpApi.parseTransaction(nlpInput);
    const parsed = result.parsed;
    
    // Auto-fill form
    setTransactionType(parsed.amount < 0 ? 'expense' : 'income');
    setAmount(Math.abs(parsed.amount).toString());
    setCategory(parsed.category);
    setDate(parsed.transaction_date);
    setDescription(parsed.description || '');
    
    // Show manual form
    setShowNLP(false);
    
    // Show success message
    alert('交易信息已解析！请检查并保存');
    
  } catch (error: any) {
    alert('解析失败：' + (error.response?.data?.detail || error.message));
  } finally {
    setIsParsingNLP(false);
  }
};

// Add to JSX before existing form
{showNLP ? (
  <div className="bg-white shadow rounded-lg p-6 mb-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-gray-900">🤖 智能输入</h2>
      <button
        onClick={() => setShowNLP(false)}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        手动输入
      </button>
    </div>
    
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          用自然语言描述这笔交易
        </label>
        <textarea
          value={nlpInput}
          onChange={(e) => setNlpInput(e.target.value)}
          placeholder="例如：今天午餐花了50块&#10;昨天打车花了30&#10;收到工资5000元"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={4}
        />
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleNLPParse}
          disabled={isParsingNLP || !nlpInput.trim()}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          {isParsingNLP ? '解析中...' : '✨ AI 解析'}
        </button>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 提示：</strong>使用自然语言输入，AI 会自动识别金额、类别、日期等信息
        </p>
      </div>
    </div>
  </div>
) : (
  <div className="bg-white shadow rounded-lg p-6 mb-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-gray-900">手动输入</h2>
      <button
        onClick={() => setShowNLP(true)}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        🤖 智能输入
      </button>
    </div>
    {/* Existing manual form */}
  </div>
)}
```

- [ ] **Step 3: Add examples and better UX**

```typescript
// Add example buttons for quick demo
const examples = [
  "今天午餐花了50块",
  "昨天打车30元",
  "收到工资5000元",
];

<div className="flex gap-2 flex-wrap">
  {examples.map((ex) => (
    <button
      key={ex}
      onClick={() => setNlpInput(ex)}
      className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
    >
      {ex}
    </button>
  ))}
</div>
```

- [ ] **Step 4: Test manually**

```
1. Navigate to /app/transactions/new
2. See "智能输入" section
3. Type "今天午餐花了50块"
4. Click "AI 解析"
5. Verify form auto-fills correctly
6. Click save to create transaction
```

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: add NLP transaction input with AI parsing"
```

---

## Task 5: Frontend - AI Chat Interface

**Goal:** Create chat page with WebSocket connection for real-time AI financial advisory conversations.

**Files:**
- Create: `frontend/src/pages/Chat.tsx`
- Create: `frontend/src/hooks/useWebSocket.ts`
- Modify: `frontend/src/App.tsx` (add chat route)
- Modify: `frontend/src/components/Layout.tsx` (add chat link to nav)

**Interfaces:**
- Consumes: WebSocket ws://localhost:8000/api/chat/ws
- Produces: Chat UI with streaming responses

**Steps:**

- [ ] **Step 1: Create WebSocket hook**

```typescript
// frontend/src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseWebSocketReturn {
  messages: Message[];
  isConnected: boolean;
  isTyping: boolean;
  sendMessage: (message: string) => void;
}

export const useWebSocket = (token: string | null): UseWebSocketReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const currentResponseRef = useRef<string>('');

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:8000/api/chat/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'typing':
          setIsTyping(data.content);
          break;

        case 'start':
          currentResponseRef.current = '';
          break;

        case 'chunk':
          currentResponseRef.current += data.content;
          // Update last message with accumulated content
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === 'assistant' && !lastMsg.content) {
              // Update empty assistant message
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: currentResponseRef.current },
              ];
            } else {
              // Add new assistant message
              return [
                ...prev,
                {
                  role: 'assistant',
                  content: currentResponseRef.current,
                  timestamp: new Date(),
                },
              ];
            }
          });
          break;

        case 'end':
          setIsTyping(false);
          currentResponseRef.current = '';
          break;

        case 'error':
          console.error('WebSocket error:', data.error);
          alert('Chat error: ' + data.error);
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [token]);

  const sendMessage = useCallback((message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('WebSocket not connected');
      return;
    }

    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: message, timestamp: new Date() },
    ]);

    // Add empty assistant message (will be filled by streaming)
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', timestamp: new Date() },
    ]);

    // Send to server
    wsRef.current.send(JSON.stringify({ message }));
  }, []);

  return { messages, isConnected, isTyping, sendMessage };
};
```

- [ ] **Step 2: Create Chat page**

```typescript
// frontend/src/pages/Chat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const accessToken = localStorage.getItem('accessToken');
  const { messages, isConnected, isTyping, sendMessage } = useWebSocket(accessToken);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage(input);
    setInput('');
  };

  const quickQuestions = [
    '我这个月花哪最多？',
    '给我一些理财建议',
    '帮我分析支出趋势',
    '我该如何控制开支？',
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white shadow rounded-t-lg p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💬 AI 财务顾问</h1>
            <p className="text-sm text-gray-600 mt-1">
              有任何财务问题，随时问我
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? '已连接' : '未连接'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-gray-50 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              开始和 AI 顾问对话
            </h3>
            <p className="text-gray-600 mb-6">
              我可以分析你的财务数据，提供个性化建议
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-blue-500 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl rounded-lg p-4 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 shadow'
              }`}
            >
              <div className="flex items-start gap-3">
                {msg.role === 'assistant' && (
                  <div className="text-2xl">🤖</div>
                )}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.content && (
                    <div className={`text-xs mt-2 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="text-2xl">👤</div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center gap-2">
                <div className="text-2xl">🤖</div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white shadow rounded-b-lg p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的问题..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            发送
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
```

- [ ] **Step 3: Add route to App.tsx**

```typescript
// frontend/src/App.tsx
import Chat from './pages/Chat';

// Add to routes
<Route
  path="/app/chat"
  element={
    <ProtectedRoute>
      <Layout>
        <Chat />
      </Layout>
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 4: Add chat link to navigation**

```typescript
// frontend/src/components/Layout.tsx
<nav className="flex gap-6">
  <Link to="/app/dashboard" className="...">概览</Link>
  <Link to="/app/transactions" className="...">交易</Link>
  <Link to="/app/chat" className="...">💬 AI 顾问</Link>
</nav>
```

- [ ] **Step 5: Test manually**

```
1. Navigate to /app/chat
2. See empty chat with quick questions
3. Click quick question or type your own
4. Verify AI responds with streaming text
5. Check conversation history persists
```

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: add AI chat interface with WebSocket streaming"
```

---

## Task 6: Enhanced Dashboard with AI Insights

**Goal:** Add AI-generated insights card to dashboard showing personalized financial analysis and suggestions.

**Files:**
- Create: `backend/app/services/insights_service.py`
- Create: `backend/app/api/insights.py`
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/api/analytics.ts`

**Steps:**

- [ ] **Step 1: Create AI Insights service**

```python
# backend/app/services/insights_service.py
from langchain_openai import ChatOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.analytics_service import AnalyticsService
from app.core.redis_client import get_redis
from typing import Dict
import json

class InsightsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.analytics_service = AnalyticsService(db)
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
    
    async def generate_insights(self, user_id: str, month: str) -> Dict:
        """Generate AI insights based on user's financial data"""
        # Check cache
        redis = await get_redis()
        cache_key = f"insights:{user_id}:{month}"
        cached = await redis.get(cache_key)
        if cached:
            return json.loads(cached)
        
        # Get analytics data
        summary = await self.analytics_service.get_summary(user_id, month)
        by_category = await self.analytics_service.get_by_category(user_id, month)
        
        # Build context
        context = f"""用户 {month} 财务数据：
- 总收入：¥{summary['total_income']:.2f}
- 总支出：¥{summary['total_expense']:.2f}
- 结余：¥{summary['balance']:.2f}
- 交易笔数：{summary['transaction_count']}

支出分类：
"""
        for cat in by_category.get('categories', []):
            context += f"- {cat['name']}：¥{cat['amount']:.2f} ({cat['percentage']:.1f}%)\n"
        
        # Generate insights
        prompt = f"""{context}

请分析以上财务数据，提供3条关键洞察：
1. 一条关于支出模式的观察
2. 一条节省建议
3. 一条理财建议

格式要求：
- 每条洞察简洁（不超过30字）
- 实用、可执行
- 语气友好、鼓励

返回JSON格式：
{{
  "insights": [
    {{"type": "observation", "text": "..."}},
    {{"type": "saving", "text": "..."}},
    {{"type": "advice", "text": "..."}}
  ]
}}
"""
        
        response = await self.llm.ainvoke(prompt)
        result = json.loads(response.content)
        
        # Cache for 1 hour
        await redis.setex(cache_key, 3600, json.dumps(result))
        
        return result
```

- [ ] **Step 2: Create insights API endpoint**

```python
# backend/app/api/insights.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.insights_service import InsightsService
from datetime import date

router = APIRouter(prefix="/insights", tags=["insights"])

@router.get("")
async def get_insights(
    month: str = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI-generated financial insights"""
    if not month:
        month = date.today().strftime("%Y-%m")
    
    service = InsightsService(db)
    insights = await service.generate_insights(
        current_user["user_id"], 
        month
    )
    
    return insights
```

- [ ] **Step 3: Register insights router**

```python
# backend/app/main.py
from app.api import insights

app.include_router(insights.router, prefix="/api")
```

- [ ] **Step 4: Update frontend analytics API**

```typescript
// frontend/src/api/analytics.ts
export interface Insight {
  type: 'observation' | 'saving' | 'advice';
  text: string;
}

export interface InsightsResponse {
  insights: Insight[];
}

export const analyticsApi = {
  // ... existing methods ...
  
  getInsights: async (month?: string): Promise<InsightsResponse> => {
    const params = month ? { month } : {};
    const response = await apiClient.get<InsightsResponse>(
      '/api/insights',
      { params }
    );
    return response.data;
  },
};
```

- [ ] **Step 5: Add insights card to Dashboard**

```typescript
// frontend/src/pages/Dashboard.tsx
import { analyticsApi, Insight } from '../api/analytics';

// Add state
const [insights, setInsights] = useState<Insight[]>([]);
const [loadingInsights, setLoadingInsights] = useState(false);

// Load insights
const loadInsights = async () => {
  setLoadingInsights(true);
  try {
    const data = await analyticsApi.getInsights();
    setInsights(data.insights);
  } catch (error) {
    console.error('Failed to load insights:', error);
  } finally {
    setLoadingInsights(false);
  }
};

// Call in useEffect
useEffect(() => {
  loadInsights();
}, []);

// Add to JSX after category breakdown
<div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
      <span>💡</span>
      AI 洞察
    </h3>
    <button
      onClick={loadInsights}
      disabled={loadingInsights}
      className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
    >
      {loadingInsights ? '生成中...' : '刷新'}
    </button>
  </div>

  {loadingInsights ? (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 bg-white/50 rounded animate-pulse" />
      ))}
    </div>
  ) : insights.length > 0 ? (
    <div className="space-y-3">
      {insights.map((insight, idx) => (
        <div
          key={idx}
          className="bg-white rounded-lg p-4 shadow-sm border border-purple-100"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {insight.type === 'observation' && '👀'}
              {insight.type === 'saving' && '💰'}
              {insight.type === 'advice' && '🎯'}
            </span>
            <p className="text-gray-800 flex-1">{insight.text}</p>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-gray-600 text-center py-4">
      暂无洞察数据
    </p>
  )}
  
  <div className="mt-4 pt-4 border-t border-purple-200">
    <Link
      to="/app/chat"
      className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
    >
      💬 与 AI 顾问深入交流
      <span>→</span>
    </Link>
  </div>
</div>
```

- [ ] **Step 6: Test manually**

```
1. Navigate to dashboard
2. See AI insights card with 3 insights
3. Click refresh to regenerate
4. Verify insights are relevant to transaction data
```

- [ ] **Step 7: Commit**

```bash
git add backend/ frontend/
git commit -m "feat: add AI-generated financial insights to dashboard"
```

---

## Task 7: Polish and Testing

**Goal:** Final polish, comprehensive testing, and documentation.

**Steps:**

- [ ] **Step 1: Fix any remaining bugs**

Run through entire app flow:
1. Register → Login
2. Create transactions (manual + NLP)
3. View transaction list
4. Check dashboard analytics
5. Chat with AI advisor
6. Check all insights

- [ ] **Step 2: Add loading states and error handling**

Ensure all API calls have:
- Loading indicators
- Error messages
- Retry logic where appropriate

- [ ] **Step 3: Update README.md**

```markdown
# AI Personal Finance Advisor

智能个人财务管理应用，支持自然语言记账和AI财务建议。

## Features

- 🔐 用户认证（JWT）
- 💰 交易管理（手动输入 + AI解析）
- 📊 数据分析（月度统计、分类占比）
- 🤖 AI财务顾问（实时对话）
- 💡 智能洞察（个性化建议）

## Tech Stack

**Backend:** Python 3.11, FastAPI, SQLAlchemy, LangChain, OpenAI
**Frontend:** React 18, TypeScript, TailwindCSS, WebSocket
**Database:** PostgreSQL 15, Redis 7

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15
- Redis 7
- OpenAI API Key

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add:
# - DATABASE_URL
# - REDIS_URL
# - OPENAI_API_KEY
# - SECRET_KEY

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Register at http://localhost:5173/register
2. Login and start tracking finances
3. Try NLP input: "今天午餐花了50块"
4. Chat with AI advisor for personalized advice

## Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/finance_db
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
SECRET_KEY=your-secret-key
```

## License

MIT
```

- [ ] **Step 4: Write deployment guide**

Document how to deploy to production (Docker, environment setup, etc.)

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "docs: update README and add deployment guide"
```

---

## Summary

**Completed Features:**
- ✅ User authentication with JWT
- ✅ Manual transaction CRUD
- ✅ Basic analytics (summary, categories)
- ✅ Frontend (auth, transactions, dashboard)
- ✅ Natural language transaction parsing (LangChain)
- ✅ AI financial advisor chat (WebSocket + streaming)
- ✅ AI-generated insights on dashboard

**Architecture Highlights:**
- Clean layered architecture (API → Service → Model)
- Redis caching for analytics and AI responses
- Real-time AI chat with WebSocket streaming
- LangChain for AI orchestration
- PostgreSQL with proper indexing and relationships

**Total Tasks:** 7
- Task 1: Fix analytics bug
- Task 2: NLP transaction parsing
- Task 3: AI chat backend
- Task 4: NLP frontend
- Task 5: Chat frontend
- Task 6: AI insights
- Task 7: Polish and testing

**Estimated Time:** 2-3 days for full implementation
