"""Date utility functions"""

from datetime import datetime, date, timedelta
from typing import Optional


def parse_relative_date(text: str, reference_date: Optional[date] = None) -> date:
    """
    Parse relative date expressions like '今天', '昨天', '上周'

    Args:
        text: Date expression in Chinese
        reference_date: Reference date (defaults to today)

    Returns:
        Parsed date
    """
    if reference_date is None:
        reference_date = date.today()

    text = text.lower().strip()

    if text in ['今天', '今日']:
        return reference_date
    elif text in ['昨天', '昨日']:
        return reference_date - timedelta(days=1)
    elif text in ['前天']:
        return reference_date - timedelta(days=2)
    elif text in ['明天']:
        return reference_date + timedelta(days=1)
    elif text in ['后天']:
        return reference_date + timedelta(days=2)
    elif text in ['上周', '上星期']:
        return reference_date - timedelta(weeks=1)
    elif text in ['下周', '下星期']:
        return reference_date + timedelta(weeks=1)

    # If not a relative date, return today
    return reference_date


def get_month_range(year: int, month: int) -> tuple[date, date]:
    """
    Get the start and end date of a month

    Args:
        year: Year
        month: Month (1-12)

    Returns:
        Tuple of (start_date, end_date)
    """
    start_date = date(year, month, 1)

    # Get last day of month
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)

    return start_date, end_date


def format_month(dt: date) -> str:
    """Format date as YYYY-MM"""
    return dt.strftime("%Y-%m")


def parse_month(month_str: str) -> tuple[int, int]:
    """
    Parse month string (YYYY-MM) to year and month

    Args:
        month_str: Month string in YYYY-MM format

    Returns:
        Tuple of (year, month)
    """
    year, month = map(int, month_str.split('-'))
    return year, month
