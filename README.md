# 🧠 AskBI – Text-to-SQL Analytics Assistant

Ask natural questions. Get SQL. Visualize results.  
Built for teams who need instant insights from their data.

![AskBI Demo](./demo/screenshot.png)

## 🎥 Demo Video
▶️ [Watch Full Demo](./demo/demo.mp4)

## 🚀 Features
- 💬 Ask natural questions like _"What were last month’s top products?"_
- 🧠 LLM-powered SQL generation (OpenAI, local LLM optional)
- 🧾 Query execution engine (SQLite, PostgreSQL, etc.)
- 📊 Parquet result previews + Recharts visualizations
- 🧪 Query log, execution stats, result summaries
- 🧱 Built with modular backend (FastAPI or Go) + React UI

## 🧠 Ideal For
- Solo devs exploring LLM + BI tooling
- Internal dashboards for support/ops/PM teams
- Lightweight alternative to Hex, Superset, or dbt Cloud

## 🛠 Stack
- **Frontend**: React + Tailwind
- **Backend**: FastAPI 
- **Storage**: Parquet files
- **AI**: OpenAI API (plug in your key) / Local model via config

## 🧪 Running Locally

```bash
git clone https://github.com/aathif394/AskBI.git
cd AskBI

# Backend
cd api
cp .env.example .env
uvicorn main:app --reload

# Frontend
cd ../ui
npm install
npm run dev
