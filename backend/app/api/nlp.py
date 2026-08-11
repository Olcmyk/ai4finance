"""NLP API endpoints for natural language transaction parsing"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.security import get_current_user
from app.services.langchain_service import LangChainService
from app.schemas.transaction import ParseNaturalLanguageRequest, ParsedTransactionResponse


router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/parse-transaction", response_model=ParsedTransactionResponse)
@limiter.limit("20/minute")
async def parse_transaction(
    request: Request,
    parse_request: ParseNaturalLanguageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Parse natural language input into structured transaction data

    Rate limit: 20 requests per minute per IP address

    Example inputs:
    - "今天午餐花了50块"
    - "昨天打车去机场花了120"
    - "工资到账5000元"
    - "买了一件衣服299"
    """
    try:
        service = LangChainService()
        parsed = await service.parse_transaction(parse_request.input)

        # Convert to response schema
        return ParsedTransactionResponse(
            amount=service.convert_to_decimal(parsed.amount),
            category=parsed.category,
            description=parsed.description,
            transaction_date=datetime.fromisoformat(parsed.transaction_date).date(),
            confidence=parsed.confidence
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse transaction: {str(e)}"
        )
