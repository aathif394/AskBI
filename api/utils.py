from sqlalchemy import create_engine, text, inspect, bindparam
from sqlalchemy.orm import sessionmaker

import os
import json
import openai

from dotenv import load_dotenv
from pydantic_models import *

load_dotenv()  # Load from .env file

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def build_db_url(cfg: DBConfig) -> str:
    if cfg.dialect == "snowflake":
        # Expecting cfg.config to contain schema, warehouse, role
        config = json.loads(cfg.model_dump_json())  # cfg.config is a JSON string
        db_url = (
            f"snowflake://{cfg.username}:{cfg.password}"
            f"@{cfg.host}.ap-southeast-1.aws.snowflakecomputing.com/{cfg.database}/public"
            f"?warehouse=compute_wh&role=public&account={cfg.host}"
        )
        print(f"{db_url=}")
        return db_url
    else:
        return f"{cfg.dialect}://{cfg.username}:{cfg.password}@{cfg.host}:{cfg.port}/{cfg.database}"


def fetch_table_descriptions(format="json"):
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)

    with SessionLocal() as session:
        result = session.execute(
            text("SELECT table_name, table_description FROM table_metadata")
        )
        rows = result.fetchall()

    # Safe conversion to dictionary with fallback for missing values
    descriptions = {
        str(row.table_name): str(row.table_description or "").strip() for row in rows
    }

    if format == "markdown":
        lines = ["# Tables:"]
        for name, desc in descriptions.items():
            lines.append(f"- `{name}`: {desc or 'No description'}")
        return "\n".join(lines)

    return descriptions


def generate_llm_schema(schema: list) -> str:
    """
    Takes a list of table schemas and returns a compact, LLM-optimized
    markdown-style schema string with PK/FK/type/description info.

    Input format for each table:
    {
        "table_name": "appointments",
        "columns": [
            {
                "name": "appointment_id",
                "description": "Unique identifier for the appointment",
                "type": "INTEGER",
                "is_primary_key": True,
                "is_foreign_key": False
            },
            {
                "name": "patient_id",
                "description": "ID of the patient",
                "type": "INTEGER",
                "is_primary_key": False,
                "is_foreign_key": True,
                "references": "patients(patient_id)"
            },
            ...
        ]
    }

    Returns:
        A string you can inject into the LLM prompt directly.
    """
    lines = []

    for table in schema:
        table_name = table.get("table_name", "UNKNOWN_TABLE")
        columns = table.get("columns", [])
        lines.append(f"# Table: {table_name}")

        for col in columns:
            name = col.get("name", "UNKNOWN_COL")
            dtype = col.get("type", "UNKNOWN_TYPE")
            desc = col.get("description", "No description").strip().rstrip(".")
            flags = []

            if col.get("is_primary_key", False):
                flags.append("PK")
            if col.get("is_foreign_key", False):
                ref = col.get("references")
                if ref:
                    flags.append(f"FK → {ref}")
                else:
                    flags.append("FK")

            flag_str = f" ({dtype}"
            if flags:
                flag_str += ", " + ", ".join(flags)
            flag_str += ")"

            lines.append(f"- {name}{flag_str}: {desc}")

        lines.append("")  # add blank line between tables

    return "\n".join(lines).strip()


def fetch_schema_for_tables(table_list, datasource_id):
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    inspector = inspect(engine)

    protected_tables = {
        "query_logs",
        "table_metadata",
        "column_metadata",
        "data_sources",
    }

    # Step 1: Get list of relevant tables
    if table_list == "all":
        table_list = [
            t for t in inspector.get_table_names() if t not in protected_tables
        ]
    elif isinstance(table_list, str):
        table_list = [table_list]

    # Step 2: Fetch column descriptions
    query = text(
        """
        SELECT table_name, column_name, column_description 
        FROM column_metadata 
        WHERE table_name IN :tables AND data_source_id = :datasource_id
    """
    ).bindparams(bindparam("tables", expanding=True))

    params = {"tables": table_list, "datasource_id": datasource_id}
    meta_rows = session.execute(query, params).fetchall()

    # Step 3: Build lookup map for descriptions
    column_meta = {
        (row.table_name, row.column_name): row.column_description for row in meta_rows
    }

    schema = []

    # Step 4: Build full schema
    for table_name in table_list:
        try:
            columns = inspector.get_columns(table_name)
            pk_columns = set(
                inspector.get_pk_constraint(table_name).get("constrained_columns", [])
            )
            foreign_keys = {
                fk["constrained_columns"][0]: {
                    "referred_table": fk["referred_table"],
                    "referred_column": fk["referred_columns"][0],
                }
                for fk in inspector.get_foreign_keys(table_name)
                if fk.get("constrained_columns") and fk.get("referred_columns")
            }

            column_list = []
            for col in columns:
                col_name = col["name"]
                column_info = {
                    "name": col_name,
                    "description": column_meta.get(
                        (table_name, col_name), "No description"
                    ),
                    "type": str(col["type"]),
                    "is_primary_key": col_name in pk_columns,
                    "is_foreign_key": col_name in foreign_keys,
                }
                if col_name in foreign_keys:
                    fk = foreign_keys[col_name]
                    column_info["references"] = (
                        f"{fk['referred_table']}({fk['referred_column']})"
                    )
                column_list.append(column_info)

            schema.append({"table_name": table_name, "columns": column_list})

        except Exception as e:
            schema.append({"table_name": table_name, "error": str(e), "columns": []})

    session.close()

    if not schema:
        return {"status": "error", "message": "No schema could be generated."}

    return schema


def get_suggested_queries(table_list, datasource_id) -> list[str]:
    if table_list == "all":
        table_descriptions = fetch_schema_for_tables("all", datasource_id)
    else:
        table_descriptions = fetch_schema_for_tables(table_list, datasource_id)

    if isinstance(table_descriptions, dict):
        if table_descriptions["status"]:
            return {
                "status": "error",
                "message": "Cannot suggest queries for the requested tables and data source.",
            }

    prompt = f"""
You are a helpful assistant integrated into a business analytics platform.

Your task is to suggest **4 relevant and insightful natural language queries** a business user might ask, based on the following table descriptions. These queries should be useful for data analysis, reporting, or decision-making.

Guidelines:
- Use information from multiple tables when possible (join logic assumed).
- Do not include bullet points or numbering.
- Only output the queries, one per line.
- Keep the queries clear and concise.

Table Descriptions:
{table_descriptions}
"""

    response = openai.chat.completions.create(
        model="gpt-3.5-turbo", messages=[{"role": "user", "content": prompt}]
    )

    suggestions_raw = response.choices[0].message.content.strip().split("\n")
    return [s.strip("- ").strip() for s in suggestions_raw if s.strip()]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
