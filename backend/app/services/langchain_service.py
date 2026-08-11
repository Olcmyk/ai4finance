"""LangChain service for natural language processing"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings


class ParsedTransaction(BaseModel):
    """Structured output for parsed transaction"""
    amount: float = Field(description="Transaction amount. Positive for income, negative for expenses.")
    category: str = Field(description="Transaction category. Must be one of: 餐饮、交通、购物、娱乐、住房、医疗、教育、通讯、其他")
    description: str = Field(description="Transaction description summarizing what the transaction was for")
    transaction_date: str = Field(description="Transaction date in YYYY-MM-DD format")
    confidence: float = Field(description="Confidence score between 0 and 1", ge=0, le=1)


class LangChainService:
    """Service for natural language processing using LangChain"""

    def __init__(self):
        """Initialize LangChain service with OpenAI model"""
        llm_kwargs = {
            "model": settings.openai_model,
            "temperature": settings.openai_temperature,
            "api_key": settings.openai_api_key,
            "timeout": settings.openai_timeout
        }

        # Add base_url if configured (for DeepSeek or other providers)
        if settings.openai_base_url:
            llm_kwargs["base_url"] = settings.openai_base_url

        self.llm = ChatOpenAI(**llm_kwargs)

        # Create structured output parser
        self.structured_llm = self.llm.with_structured_output(ParsedTransaction)

        # Create prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """你是一个专业的个人财务助手，负责解析自然语言输入并提取交易信息。

今天的日期是：{today}

可用的类别：
- 餐饮：餐厅、快餐、咖啡、外卖等
- 交通：地铁、公交、打车、加油等
- 购物：服装、日用品、电子产品等
- 娱乐：电影、游戏、运动、旅游等
- 住房：房租、物业费、水电费等
- 医疗：看病、买药、体检等
- 教育：学费、培训、书籍等
- 通讯：话费、网费等
- 其他：无法归类的其他支出

规则：
1. 金额：支出为负数（例如：-50.00），收入为正数（例如：1000.00）
2. 如果没有明确提到日期，使用今天的日期
3. 如果日期是相对的（如"昨天"、"上周"），计算实际日期
4. 描述应该简洁明了，总结交易的内容
5. 根据交易内容选择最合适的类别
6. 置信度：如果信息完整清晰，给0.9-1.0；如果有推测成分，给0.7-0.8；如果很不确定，给0.5-0.6

例子：
- "今天午餐花了50块" → amount: -50.00, category: "餐饮", description: "午餐", date: 今天, confidence: 0.95
- "昨天打车去机场花了120" → amount: -120.00, category: "交通", description: "打车去机场", date: 昨天, confidence: 0.95
- "工资到账5000元" → amount: 5000.00, category: "其他", description: "工资", date: 今天, confidence: 0.9
- "买了一件衣服299" → amount: -299.00, category: "购物", description: "买衣服", date: 今天, confidence: 0.9
"""),
            ("human", "{input}")
        ])

        # Create the chain
        self.chain = self.prompt | self.structured_llm

    async def parse_transaction(self, input_text: str) -> ParsedTransaction:
        """
        Parse natural language input into structured transaction data

        Args:
            input_text: Natural language description of the transaction

        Returns:
            ParsedTransaction object with extracted information

        Raises:
            ValueError: If parsing fails
        """
        try:
            # Get today's date for context
            today = date.today().isoformat()

            # Invoke the chain
            result = await self.chain.ainvoke({
                "input": input_text,
                "today": today
            })

            return result

        except Exception as e:
            raise ValueError(f"Failed to parse transaction: {str(e)}")

    def convert_to_decimal(self, amount: float) -> Decimal:
        """Convert float amount to Decimal with 2 decimal places"""
        return Decimal(str(round(amount, 2)))
