"""Input validation utilities"""

import re
from typing import Optional


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength

    Requirements:
    - At least 8 characters
    - Contains uppercase letter
    - Contains lowercase letter
    - Contains digit

    Args:
        password: Password to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "密码至少需要8个字符"

    if not re.search(r'[A-Z]', password):
        return False, "密码必须包含至少一个大写字母"

    if not re.search(r'[a-z]', password):
        return False, "密码必须包含至少一个小写字母"

    if not re.search(r'\d', password):
        return False, "密码必须包含至少一个数字"

    return True, None


def validate_category(category: str, valid_categories: list[str]) -> bool:
    """
    Validate if category is in the valid list

    Args:
        category: Category to validate
        valid_categories: List of valid categories

    Returns:
        True if valid, False otherwise
    """
    return category in valid_categories


# Predefined valid categories
VALID_CATEGORIES = [
    "餐饮",
    "交通",
    "购物",
    "娱乐",
    "住房",
    "医疗",
    "教育",
    "通讯",
    "其他"
]
