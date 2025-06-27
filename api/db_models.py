from sqlalchemy import Column, Integer, String, DateTime, Text, func, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID

from datetime import datetime
import uuid

Base = declarative_base()


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    type = Column(String, nullable=False)  # e.g., 'database' or 'file'
    config = Column(String, nullable=False)  # JSON-encoded config string


class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(String(32), unique=True, nullable=False)
    user_query = Column(String, nullable=False)
    sql_query = Column(String, nullable=False)
    status = Column(String(20), nullable=False)  # 'success', 'error', etc.
    execution_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.now)


class TableDescSchema(Base):
    __tablename__ = "table_metadata"
    data_source_id = Column(Integer, primary_key=True)
    table_name = Column(String, primary_key=True)
    table_description = Column(Text)


class ColumnDescSchema(Base):
    __tablename__ = "column_metadata"
    data_source_id = Column(Integer, primary_key=True)
    table_name = Column(String, primary_key=True)
    column_name = Column(String, primary_key=True)
    column_description = Column(Text)


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title = mapped_column(String, nullable=True)
    created_at = mapped_column(DateTime, default=datetime.now)

    messages = relationship(
        "ChatMessage", back_populates="session", cascade="all, delete-orphan"
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id = mapped_column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"))
    role = mapped_column(String, nullable=False)
    type = mapped_column(String, nullable=False)
    content = mapped_column(JSON, nullable=False)
    created_at = mapped_column(DateTime, default=datetime.now)

    session = relationship("ChatSession", back_populates="messages")
