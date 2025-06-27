# Standard library
import io
import os
import uuid
import json
import time

from datetime import datetime as dt

# Third-party packages
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import altair as alt
import altair_saver

import openai

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, Session

# LIDA (custom or third-party)
from lida import Manager, llm

from models import *
from utils import *

# --- Config ---
load_dotenv()  # Load from .env file

DATABASE_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- Setup ---

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(engine)

openai.api_key = OPENAI_API_KEY

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic ---
class UserQuery(BaseModel):
    question: str


class DBConfig(BaseModel):
    dialect: str  # e.g., "postgresql", "mysql", "sqlite"
    username: str  # e.g., "myuser"
    password: str  # e.g., "mypassword"
    host: str  # e.g., "localhost"
    port: int  # e.g., 5432
    database: str  # e.g., "mydb"
    sql: Optional[str] = ""  # The query to run


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


# --- 1. /tables ---
# @app.get("/tables")
# def get_tables():
#     engine = create_engine(DATABASE_URL)
#     SessionLocal = sessionmaker(bind=engine)
#     session = SessionLocal()
#     rows = session.execute(
#         text("SELECT table_name, table_description FROM table_metadata")
#     ).fetchall()
#     session.close()
#     # return [{"name": r.table_name, "description": r.table_description} for r in rows]
#     return {r.table_name: r.table_description for r in rows}


@app.get("/tables")
def get_tables():
    return fetch_table_descriptions()


# --- 2. /schema?tables=tripdata,zones ---
@app.get("/schema")
def get_schema(tables: str = Query(...)):
    table_list = [t.strip() for t in tables.split(",")]
    return fetch_schema_for_tables(table_list)


# @app.get("/schema")
# def get_schema(tables: str = Query(...)):
#     table_list = [t.strip() for t in tables.split(",")]

#     session = SessionLocal()
#     inspector = inspect(session.bind)

#     # Load all column metadata (assumed internal to your app)
#     meta_rows = session.execute(
#         text(
#             """
#             SELECT table_name, column_name, column_description
#             FROM column_metadata
#             WHERE table_name IN :tables
#         """
#         ),
#         {"tables": tuple(table_list)},
#     ).fetchall()

#     session.close()

#     # Convert metadata rows to lookup dict
#     column_meta = {
#         (row.table_name, row.column_name): row.column_description for row in meta_rows
#     }

#     schema = []

#     for table_name in table_list:
#         try:
#             columns = inspector.get_columns(table_name)
#             pk_columns = set(
#                 inspector.get_pk_constraint(table_name).get("constrained_columns", [])
#             )

#             schema.append(
#                 {
#                     table_name: {
#                         col["name"]: column_meta.get(
#                             (table_name, col["name"]), "No description"
#                         )
#                         for col in columns
#                     }
#                 }
#             )

#             # schema.append({
#             #     # "table": table_name,
#             #     # "columns": [
#             #     #     {
#             #     #         # "name": col["name"],
#             #     #         # "data_type": str(col["type"]),
#             #     #         # Optional fields:
#             #     #         # "nullable": col["nullable"],
#             #     #         # "default": col.get("default"),
#             #     #         # "is_primary_key": col["name"] in pk_columns,
#             #     #         "description": column_meta.get((table_name, col["name"]), "No description")
#             #     #     }
#             #     #     for col in columns
#             #     # ]

#             # })

#             # for col in columns:
#             #     schema.append(
#             #         {col["name"]: column_meta.get((table_name, col["name"]), "No description")}
#             #     )

#         except Exception as e:
#             schema.append({"table": table_name, "error": str(e), "columns": []})

#     return schema


# --- 3. /generate-sql ---
# @app.post("/generate_sql")
# def generate_sql(payload: UserQuery):
#     session = SessionLocal()

#     # Step 1: Get table descriptions
#     tables = session.execute(
#         text("SELECT table_name, table_description FROM table_metadata")
#     ).fetchall()
#     table_descriptions = "\n".join(
#         [f"{t.table_name}: {t.table_description}" for t in tables]
#     )

#     # Step 2: Ask LLM to select relevant tables
#     table_selector_prompt = f"""
#     You're a SQL assistant. Based on the user question below, which tables are relevant?
#     Tables:
#     {table_descriptions}

#     User question: "{payload.question}"
#     Return a comma-separated list of table names only.
#     """
#     table_selection = openai.chat.completions.create(
#         model="gpt-3.5-turbo",
#         messages=[{"role": "user", "content": table_selector_prompt}],
#     )
#     selected_tables = (
#         table_selection.choices[0].message.content.strip().replace(" ", "").split(",")
#     )

#     # Step 3: Use SQLAlchemy Inspector to get schema
#     inspector = inspect(session.bind)
#     schema_info = ""

#     for table in selected_tables:
#         columns = inspector.get_columns(table)
#         pk_columns = {
#             col["name"]
#             for col in inspector.get_pk_constraint(table).get("constrained_columns", [])
#         }

#         for col in columns:
#             col_name = col["name"]
#             col_type = str(col["type"])
#             # nullable = "nullable" if col["nullable"] else "not null"
#             pk = "PK" if col_name in pk_columns else ""
#             description_row = session.execute(
#                 text(
#                     "SELECT column_description FROM column_metadata WHERE table_name = :t AND column_name = :c"
#                 ),
#                 {"t": table, "c": col_name},
#             ).fetchone()
#             description = (
#                 description_row.column_description
#                 if description_row
#                 else "No description"
#             )
#             schema_info += (
#                 # f"{table}.{col_name} ({col_type}, {nullable}, {pk}): {description}\n"
#                 f"{table}.{col_name} ({col_type}): {description}\n"
#             )

#     session.close()

#     # print(schema_info)

#     # Step 4: Generate SQL with LLM
#     sql_prompt = f"""
#     You're an expert SQL Query Builder. Based on the following schema and question, generate an accurate SQL query (use standard SQL syntax that works across engines when possible).
#     Limit to 1000 always.

#     User question: "{payload.question}"

#     Schema:
#     {schema_info}

#     SQL:
#     """


#     sql_response = openai.chat.completions.create(
#         model="gpt-3.5-turbo", messages=[{"role": "user", "content": sql_prompt}]
#     )
#     sql = sql_response.choices[0].message.content.strip().replace("\n", " ")
#     return {
#         "sql": sql,
#         "used_tables": selected_tables,
#     }
@app.post("/generate_sql")
def generate_sql(payload: UserQuery):
    session = SessionLocal()

    table_descriptions = fetch_table_descriptions()

    # Step 2: Ask LLM to select relevant tables
    table_selector_prompt = f"""
    You're a SQL assistant. Based on the user question below, which tables are relevant?
    Tables:
    {table_descriptions}

    User question: "{payload.question}"
    Return a comma-separated list of table names only.
    """
    table_selection = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": table_selector_prompt}],
    )
    selected_tables = (
        table_selection.choices[0].message.content.strip().replace(" ", "").split(",")
    )

    # Step 3: Use SQLAlchemy Inspector to get schema
    schema_info = fetch_schema_for_tables(selected_tables)
    # print(schema_info)

    # Step 4: Generate SQL with LLM
    # sql_prompt = f"""
    # You're an expert SQL Query Builder. Based on the following schema and question, generate an accurate SQL query (use standard SQL syntax that works across engines when possible).
    # - Limit to 1000 always. If the query already has a limit, ignore.

    # User question: "{payload.question}"

    # Schema:
    # {schema_info}

    # SQL:
    # """
    sql_prompt = f"""
You are a world-class SQL query generator.

Given the schema and the user question below, write a syntactically correct and semantically accurate SQL query. Follow these instructions strictly:

1. Use standard SQL syntax that works across major engines (e.g., PostgreSQL, MySQL, SQLite).
2. Use explicit joins with ON conditions, not NATURAL JOIN or USING.
3. Use aliases where helpful for clarity.
4. Always add `LIMIT 1000` unless a limit is already present.
5. Do not explain the query. Just return the final SQL.

User Question:
"{payload.question}"

Database Schema:
{schema_info}

SQL Query:
"""

    print(sql_prompt)

    sql_response = openai.chat.completions.create(
        model="gpt-3.5-turbo", messages=[{"role": "user", "content": sql_prompt}]
    )
    sql = sql_response.choices[0].message.content.strip().replace("\n", " ")
    return {
        "sql": sql,
        "used_tables": selected_tables,
    }


@app.get("/visualize")
def visualize(query_id: str = Query(...)):
    try:
        # Step 1: Load saved query result
        df_path = f"/tmp/{query_id}.parquet"
        if not os.path.exists(df_path):
            return {"status": "error", "message": "Query result not found"}

        df = pd.read_parquet(df_path)

        # Step 2: Summarize with LIDA
        lida = Manager(text_gen=llm("openai"))
        summary = lida.summarize(df)
        goals = lida.goals(summary, n=2)  # exploratory data analysis

        # Step 3: Define Task and get visualizations
        charts = lida.visualize(
            summary=summary, goal=goals[0]
        )  # exploratory data analysis

        if not charts or not hasattr(charts[0], "spec"):
            return {"status": "error", "message": "No valid chart generated"}

        # Step 4: Save first chart as image
        chart_spec = charts[0].spec
        chart = alt.Chart.from_dict(chart_spec).configure_view(stroke=None)
        img_path = f"/tmp/{query_id}.png"
        altair_saver.save(chart, img_path)

        return {
            "status": "success",
            "image_path": img_path,
            "title": charts[0].title,
            "description": charts[0].summary,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


# @app.post("/execute_sql")
# def execute_sql(config: DBConfig):
#     session = SessionLocal()
#     try:
#         db_url = build_db_url(config)
#         engine = create_engine(db_url)
#         with engine.connect() as conn:
#             df = pd.read_sql(text(config.sql), conn)

#         # Clean and convert to JSON-safe types
#         df.replace([np.inf, -np.inf], np.nan, inplace=True)
#         df = df.astype(object).where(pd.notnull(df), None)

#         query_id = uuid.uuid4().hex
#         path = f"/tmp/{query_id}.parquet"
#         df.to_parquet(path, index=False)

#         return {
#             "status": "success",
#             "query_id": query_id,
#             "rows": len(df),
#             "data": df.values.tolist(),  # now safe
#             "columns": df.columns.tolist(),
#         }
#     except Exception as e:
#         return {"status": "error", "message": str(e)}


@app.post("/execute_sql")
def execute_sql(config: DBConfig):
    session = SessionLocal()
    start_time = time.time()
    query_id = uuid.uuid4().hex

    try:
        db_url = build_db_url(config)
        engine = create_engine(db_url)

        with engine.connect() as conn:
            df = pd.read_sql(text(config.sql), conn)

        execution_time_ms = int((time.time() - start_time) * 1000)

        # Clean and convert to JSON-safe types
        df.replace([np.inf, -np.inf], np.nan, inplace=True)
        df = df.astype(object).where(pd.notnull(df), None)

        path = f"/tmp/{query_id}.parquet"
        df.to_parquet(path, index=False)

        log = QueryLog(
            query_id=query_id,
            query_text=config.sql,
            status="success",
            execution_time_ms=execution_time_ms,
            created_at=dt.now(),
        )
        session.add(log)
        session.commit()

        return {
            "status": "success",
            "query_id": query_id,
            "rows": len(df),
            "data": df.values.tolist(),
            "columns": df.columns.tolist(),
        }

    except Exception as e:
        execution_time_ms = int((time.time() - start_time) * 1000)

        log = QueryLog(
            query_id=query_id,
            query_text=config.sql,
            status="error",
            execution_time_ms=execution_time_ms,
            created_at=dt.now(),
        )
        session.add(log)
        session.commit()

        return {"status": "error", "message": str(e)}

    finally:
        session.close()


@app.get("/get_query_result")
def get_query_data(query_id: str = Query(...), format: str = Query("json")):
    try:
        df_path = f"/tmp/{query_id}.parquet"
        if not os.path.exists(df_path):
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": "Query result not found"},
            )

        df = pd.read_parquet(df_path)

        if format == "csv":
            csv_io = io.StringIO()
            df.to_csv(csv_io, index=False)
            csv_io.seek(0)

            return StreamingResponse(
                csv_io,
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={query_id}.csv"},
            )

        # Default: return JSON
        data = df.to_dict(orient="records")
        return {"status": "success", "data": data}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/query_logs")
def get_all_query_logs():
    session: Session = SessionLocal()
    try:
        queries = session.query(QueryLog).all()
        # Parse config JSON string back to dict
        # for s in sources:
        #     s.config = json.loads(s.config)
        return {"status": "success", "queries": queries}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        session.close()


@app.post("/add_datasource")
def add_datasource(payload: DataSourceSchema):
    session = SessionLocal()
    existing = session.query(DataSource).filter_by(name=payload.name).first()
    if existing:
        return {"status": "error", "message": "Data source name already exists"}

    new_ds = DataSource(
        name=payload.name, type=payload.type, config=json.dumps(payload.config)
    )
    session.add(new_ds)
    session.commit()
    session.refresh(new_ds)

    return {"status": "success", "id": new_ds.id}


@app.get("/datasources")
def get_all_datasources():
    session: Session = SessionLocal()
    try:
        sources = session.query(DataSource).all()
        # Parse config JSON string back to dict
        for s in sources:
            s.config = json.loads(s.config)
        return {"status": "success", "data_sources": sources}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        session.close()


@app.get("/datasource/{id}/schema")
def get_schema(id: int):
    session = SessionLocal()
    try:
        ds = session.query(DataSource).filter_by(id=id).first()
        if not ds:
            raise HTTPException(status_code=404, detail="Data source not found")

        if ds.type != "database":
            raise HTTPException(
                status_code=400, detail="Only database sources supported for schema"
            )

        # Correct usage
        config = DBConfig.model_validate_json(ds.config)
        db_url = build_db_url(config)
        engine = create_engine(db_url)
        inspector = inspect(engine)

        schema = []
        for table_name in inspector.get_table_names():
            columns = inspector.get_columns(table_name)
            schema.append(
                {
                    "table": table_name,
                    "columns": [
                        {"name": col["name"], "type": str(col["type"])}
                        for col in columns
                    ],
                }
            )
        return schema
    finally:
        session.close()


@app.get("/datasource/{id}/config")
def get_schema(id: int):
    session = SessionLocal()
    try:
        ds = session.query(DataSource).filter_by(id=id).first()
        if not ds:
            raise HTTPException(status_code=404, detail="Data source not found")

        config = json.loads(ds.config)
        if ds.type != "database":
            raise HTTPException(
                status_code=400, detail="Only database sources supported for config"
            )

        return config
    finally:
        session.close()
