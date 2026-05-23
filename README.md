# QuantLens — Scenario & Sensitivity Analysis Tool

Stateless quantitative analytics tool for financial time-series data.
Three analysis modules: Stress Test, Rolling Correlation, OLS Regression.

**Stack:** Next.js 14 · FastAPI · Finnhub · pandas · statsmodels · Recharts

---

## Setup

### Backend

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/scenario/stress-test | Shock analysis + P&L + distribution |
| POST | /api/scenario/rolling-correlation | Rolling corr between two assets |
| POST | /api/scenario/regression | OLS regression with alpha/beta/R² |
| GET  | /api/scenario/ticker-info?q= | Validate ticker + metadata |
| GET  | /health | Health check |

---

## Features

- **Stress Test** — apply % shock to any asset, see portfolio P&L, historical frequency of the shock occurring, and a 30-day return distribution histogram
- **Rolling Correlation** — visualise how correlation between two assets evolves; reference lines at ±0.7 for hedge/co-movement zones
- **OLS Regression** — compute alpha, beta, R², p-values; scatter plot with regression line overlay; auto-generated interpretation strings

All data live from Finnhub. No database. Fully stateless.
