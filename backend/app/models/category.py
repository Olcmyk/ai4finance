"""Category model"""

from sqlalchemy import Column, Integer, String

from app.core.database import Base


class Category(Base):
    """Category model for transaction categories"""

    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    icon = Column(String(50), nullable=True)
    color = Column(String(20), nullable=True)

    def __repr__(self):
        return f"<Category {self.name}>"
