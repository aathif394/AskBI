from pydantic import BaseModel
from typing import Literal, Optional, Dict, List
from datetime import datetime
import uuid


class TableDesc(BaseModel):
    data_source_id: int
    table_name: str
    table_description: str


class ColumnDesc(BaseModel):
    data_source_id: int
    table_name: str
    column_name: str
    column_description: str


class DescriptionPayload(BaseModel):
    data_source_id: int
    tables: Dict[str, str]  # table_name -> table_description
    columns: Dict[str, str]


class VisualizationRequest(BaseModel):
    query_id: str
    prompt: str = "Find trends, comparisons, and key relationships in the data."
    num_charts: int = 3
    model: str = "gpt-3.5-turbo"
    temperature: float = 0.3


# Response schema
class VisualizationResponse(BaseModel):
    summary: str
    charts: list[dict]


class FixSqlRequest(BaseModel):
    question: str
    broken_sql: str
    error_message: Optional[str] = None  # optionally pass in the error


class UserQuery(BaseModel):
    question: str
    datasource_id: int


class DBConfig(BaseModel):
    dialect: str  # e.g., "postgresql", "mysql", "sqlite"
    username: str  # e.., "myuser"
    password: str  # e.g., "mypassword"
    host: str  # e.g., "localhost"
    port: int  # e.g., 5432
    database: str  # e.g., "mydb"
    sql: Optional[str] = ""  # The query to run
    user_query: Optional[str] = ""


class DataSourceSchema(BaseModel):
    name: str
    type: Literal["database", "file"]
    config: dict  # contains db info or file info


class MessageContent(BaseModel):
    text: Optional[str] = None
    sql: Optional[str] = None
    steps: Optional[List[dict]] = None
    result: Optional[dict] = None
    original_question: Optional[str] = None
    visualization: Optional[dict] = None


class ChatMessageIn(BaseModel):
    role: str
    type: str
    content: MessageContent


class ChatSessionSchema(BaseModel):
    id: uuid.UUID
    title: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class RenameChatRequest(BaseModel):
    title: str
