from fastapi import APIRouter
from schemas import (
    StressTestRequest, StressTestResult,
    RollingCorrelationRequest, RollingCorrelationResult,
    RegressionRequest, RegressionResult,
    TickerInfo,
)
from market_data import fetch_prices, get_ticker_info
from analytics import compute_stress_test, compute_rolling_correlation, compute_regression

router = APIRouter(tags=["scenario"])


@router.post("/scenario/stress-test", response_model=StressTestResult)
async def stress_test(req: StressTestRequest):
    prices = fetch_prices([req.ticker], req.period)
    result = compute_stress_test(prices, req.ticker, req.shock_pct, req.portfolio_value)
    result.period = req.period
    return result


@router.post("/scenario/rolling-correlation", response_model=RollingCorrelationResult)
async def rolling_correlation(req: RollingCorrelationRequest):
    tickers = list({req.ticker1, req.ticker2})
    prices = fetch_prices(tickers, req.period)
    result = compute_rolling_correlation(prices, req.ticker1, req.ticker2, req.window)
    result.period = req.period
    return result


@router.post("/scenario/regression", response_model=RegressionResult)
async def regression(req: RegressionRequest):
    tickers = list({req.dependent, req.independent})
    prices = fetch_prices(tickers, req.period)
    result = compute_regression(prices, req.dependent, req.independent)
    result.period = req.period
    return result


@router.get("/scenario/ticker-info", response_model=TickerInfo)
async def ticker_info(q: str):
    return get_ticker_info(q.strip().upper())
