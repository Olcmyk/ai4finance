"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-08-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import sys
from pathlib import Path

# Add parent directory to path to import seed data
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from app.core.seed_data import CATEGORY_SEED_DATA

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create enum types if they don't exist
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inputmethod') THEN CREATE TYPE inputmethod AS ENUM ('manual', 'natural_language'); END IF; END $$;")
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messagerole') THEN CREATE TYPE messagerole AS ENUM ('user', 'assistant'); END IF; END $$;")

    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Create categories table
    op.create_table('categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Seed categories
    op.execute(CATEGORY_SEED_DATA)

    # Create transactions table
    op.create_table('transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('input_method', sa.Enum('manual', 'natural_language', name='inputmethod', create_type=False), nullable=False),
        sa.Column('original_input', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'])
    op.create_index(op.f('ix_transactions_transaction_date'), 'transactions', ['transaction_date'])

    # Create ai_conversations table
    op.create_table('ai_conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.Enum('user', 'assistant', name='messagerole', create_type=False), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_conversations_user_id'), 'ai_conversations', ['user_id'])
    op.create_index(op.f('ix_ai_conversations_session_id'), 'ai_conversations', ['session_id'])

def downgrade():
    op.drop_table('ai_conversations')
    op.drop_table('transactions')
    op.drop_table('categories')
    op.drop_table('users')

    # Drop enum types
    op.execute('DROP TYPE IF EXISTS messagerole')
    op.execute('DROP TYPE IF EXISTS inputmethod')
