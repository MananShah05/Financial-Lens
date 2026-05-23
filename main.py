from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import scenario
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Scenario & Sensitivity Analysis API",
    description="Stateless quant analytics — stress tests, rolling correlation, OLS regression",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scenario.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
