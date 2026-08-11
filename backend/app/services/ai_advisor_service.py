"""AI Advisor service for financial chat assistance"""

import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any, AsyncIterator, Optional
from sqlalchemy import select, and_, func, extract
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.config import settings
from app.models.ai_conversation import AIConversation, MessageRole
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.user import User


class AIAdvisorService:
    """Service for AI-powered financial advice with conversation history"""

    def __init__(self):
        """Initialize AI advisor service with streaming-enabled LLM"""
        llm_kwargs = {
            "model": settings.openai_model,
            "temperature": 0.7,
            "api_key": settings.openai_api_key,
            "streaming": True,
            "timeout": settings.openai_timeout
        }

        # Add base_url if configured (for DeepSeek or other providers)
        if settings.openai_base_url:
            llm_kwargs["base_url"] = settings.openai_base_url

        self.llm = ChatOpenAI(**llm_kwargs)

    async def get_user_context(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        month: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get user's financial context for the specified month

        Args:
            db: Database session
            user_id: User ID
            month: Optional month in YYYY-MM format. If None, uses current month

        Returns:
            Dictionary containing financial summary and transaction details
        """
        # Parse month or use current month
        if month:
            year, month_num = map(int, month.split('-'))
        else:
            now = datetime.now()
            year, month_num = now.year, now.month

        # Query transactions for the specified month
        query = (
            select(Transaction)
            .options(selectinload(Transaction.category))
            .where(
                and_(
                    Transaction.user_id == user_id,
                    extract('year', Transaction.transaction_date) == year,
                    extract('month', Transaction.transaction_date) == month_num
                )
            )
            .order_by(Transaction.transaction_date.desc())
        )

        result = await db.execute(query)
        transactions = result.scalars().all()

        # Calculate summary statistics
        total_income = Decimal('0')
        total_expense = Decimal('0')
        category_expenses = {}

        for txn in transactions:
            if txn.amount > 0:
                total_income += txn.amount
            else:
                total_expense += abs(txn.amount)
                category_name = txn.category.name if txn.category else "未分类"
                category_expenses[category_name] = category_expenses.get(category_name, Decimal('0')) + abs(txn.amount)

        # Sort categories by expense amount
        sorted_categories = sorted(
            category_expenses.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return {
            "month": f"{year}-{month_num:02d}",
            "total_income": float(total_income),
            "total_expense": float(total_expense),
            "balance": float(total_income - total_expense),
            "transaction_count": len(transactions),
            "top_categories": [
                {"category": cat, "amount": float(amt)}
                for cat, amt in sorted_categories[:5]
            ],
            "transactions": [
                {
                    "date": txn.transaction_date.isoformat(),
                    "amount": float(txn.amount),
                    "category": txn.category.name if txn.category else "未分类",
                    "description": txn.description or ""
                }
                for txn in transactions[:20]  # Limit to recent 20 transactions
            ]
        }

    async def get_conversation_history(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        session_id: uuid.UUID,
        limit: int = 10
    ) -> List[Dict[str, str]]:
        """
        Get conversation history for the user session

        Args:
            db: Database session
            user_id: User ID
            session_id: Session ID
            limit: Maximum number of messages to retrieve

        Returns:
            List of conversation messages
        """
        query = (
            select(AIConversation)
            .where(
                and_(
                    AIConversation.user_id == user_id,
                    AIConversation.session_id == session_id
                )
            )
            .order_by(AIConversation.created_at.desc())
            .limit(limit)
        )

        result = await db.execute(query)
        conversations = result.scalars().all()

        # Reverse to get chronological order
        return [
            {
                "role": conv.role.value,
                "message": conv.message
            }
            for conv in reversed(conversations)
        ]

    async def save_conversation(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        session_id: uuid.UUID,
        user_message: str,
        ai_response: str
    ) -> None:
        """
        Save conversation messages to database

        Args:
            db: Database session
            user_id: User ID
            session_id: Session ID
            user_message: User's message
            ai_response: AI's response
        """
        # Save user message
        user_conv = AIConversation(
            user_id=user_id,
            session_id=session_id,
            role=MessageRole.USER,
            message=user_message
        )
        db.add(user_conv)

        # Save assistant message
        assistant_conv = AIConversation(
            user_id=user_id,
            session_id=session_id,
            role=MessageRole.ASSISTANT,
            message=ai_response
        )
        db.add(assistant_conv)

        await db.commit()

    async def chat_stream(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        session_id: uuid.UUID,
        user_message: str
    ) -> AsyncIterator[str]:
        """
        Generate streaming AI response to user's message

        Args:
            db: Database session
            user_id: User ID
            session_id: Session ID
            user_message: User's message

        Yields:
            Response chunks as they are generated
        """
        # Get user's financial context for current month
        context = await self.get_user_context(db, user_id)

        # Get conversation history
        history = await self.get_conversation_history(db, user_id, session_id)

        # Build system message with context
        system_prompt = f"""你是一个专业的个人财务顾问助手，帮助用户分析和管理他们的财务状况。

当前用户的财务数据（{context['month']}）：
- 总收入：¥{context['total_income']:.2f}
- 总支出：¥{context['total_expense']:.2f}
- 结余：¥{context['balance']:.2f}
- 交易笔数：{context['transaction_count']}

主要支出类别：
{chr(10).join([f"- {cat['category']}: ¥{cat['amount']:.2f}" for cat in context['top_categories']])}

最近交易记录：
{chr(10).join([f"- {txn['date']}: {txn['category']} ¥{txn['amount']:.2f} ({txn['description']})" for txn in context['transactions'][:10]])}

请根据以上数据回答用户的问题，提供实用的财务建议。回答要：
1. 准确引用用户的实际数据
2. 简洁明了，突出重点
3. 提供可操作的建议
4. 使用友好、专业的语气
"""

        # Build message list with history
        messages = [SystemMessage(content=system_prompt)]

        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["message"]))
            else:
                messages.append(AIMessage(content=msg["message"]))

        # Add current user message
        messages.append(HumanMessage(content=user_message))

        # Stream the response
        full_response = ""
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                full_response += chunk.content
                yield chunk.content

        # Save conversation after streaming completes
        await self.save_conversation(
            db=db,
            user_id=user_id,
            session_id=session_id,
            user_message=user_message,
            ai_response=full_response
        )
