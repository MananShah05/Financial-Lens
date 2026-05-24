import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import scenario

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app = FastAPI(
    title="Scenario & Sensitivity Analysis API",
    description="Stateless financial analytics — stress tests, rolling correlation, OLS regression",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    # Allow Vercel subdomains in production and permit any localhost/127.0.0.1 origin during development.
    # Uses ENV environment variable to detect production; default is development.
    # In production only allow Vercel subdomains via regex; in development allow
    # localhost, 127.0.0.1, and common private network ranges so the app works
    # on LAN addresses (e.g. http://192.168.x.x:3000) used by Next's network URL.
    allow_origin_regex=(
        (r"https://.*\.vercel\.app")
        if os.getenv("ENV", "development") == "production"
        else (
            r"https?://(localhost|127\.0\.0\.1|192\.168\.[0-9]{1,3}\.[0-9]{1,3}" \
            r"|10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3})(:\d+)?|https://.*\.vercel\.app"
        )
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scenario.router, prefix="/api")


@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok"}