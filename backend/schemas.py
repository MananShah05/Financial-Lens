from pydantic import BaseModel, Field, field_validator
from typing import Literal


# ── Stress Test ──────────────────────────────────────────────────────────────

class StressTestRequest(BaseModel):
    ticker: str = Field(..., description="Primary asset ticker, e.g. ^NSEI")
    shock_pct: float = Field(..., ge=-100, le=100, description="Shock as percentage, e.g. -15 means -15%")
    portfolio_value: float = Field(default=1_000_000, ge=1, description="Portfolio value in INR")
    period: Literal["1y", "2y", "5y"] = Field(default="2y")

    @field_validator("ticker")
    @classmethod
    def ticker_upper(cls, v: str) -> str:
        return v.strip().upper()


class StressTestResult(BaseModel):
    ticker: str
    period: str
    shock_pct: float
    portfolio_value: float

    # Current stats
    current_price: float
    annualized_return: float
    annualized_volatility: float
    max_drawdown: float
    sharpe_ratio: float

    # Shock impact
    shocked_price: float
    pnl_absolute: float
    pnl_pct: float

    # Historical context: how many times this shock has occurred
    historical_occurrences: int
    worst_historical_30d_return: float
    best_historical_30d_return: float

    # Distribution data for histogram (30-day rolling returns)
    return_distribution: list[float]


# ── Rolling Correlation ───────────────────────────────────────────────────────

class RollingCorrelationRequest(BaseModel):
    ticker1: str = Field(..., description="First asset ticker")
    ticker2: str = Field(..., description="Second asset ticker")
    window: int = Field(default=30, ge=10, le=252, description="Rolling window in trading days")
    period: Literal["1y", "2y", "5y"] = Field(default="2y")

    @field_validator("ticker1", "ticker2")
    @classmethod
    def tickers_upper(cls, v: str) -> str:
        return v.strip().upper()


class CorrelationDataPoint(BaseModel):
    date: str
    correlation: float


class RollingCorrelationResult(BaseModel):
    ticker1: str
    ticker2: str
    window: int
    period: str

    current_correlation: float
    avg_correlation: float
    min_correlation: float
    max_correlation: float

    # Insight
    relationship: str  # e.g. "Moderate negative correlation — partial hedge"

    data: list[CorrelationDataPoint]


# ── OLS Regression ───────────────────────────────────────────────────────────

class RegressionRequest(BaseModel):
    dependent: str = Field(..., description="Dependent variable ticker (Y)")
    independent: str = Field(..., description="Independent variable ticker (X)")
    period: Literal["1y", "2y", "5y"] = Field(default="2y")

    @field_validator("dependent", "independent")
    @classmethod
    def tickers_upper(cls, v: str) -> str:
        return v.strip().upper()


class RegressionDataPoint(BaseModel):
    x: float
    y: float
    date: str


class RegressionResult(BaseModel):
    dependent: str
    independent: str
    period: str

    # OLS coefficients
    alpha: float       # intercept (Jensen's alpha equivalent)
    beta: float        # slope (market sensitivity)
    r_squared: float
    p_value_beta: float
    p_value_alpha: float
    std_err_beta: float
    std_err_alpha: float

    # Interpretation
    beta_interpretation: str   # e.g. "Beta > 1: amplifies market moves"
    alpha_interpretation: str  # e.g. "Positive alpha: excess return above expected"
    fit_quality: str           # e.g. "Strong fit (R² = 0.78)"

    # Scatter data for chart
    scatter_data: list[RegressionDataPoint]
    regression_line: list[dict]  # [{x: float, y_hat: float}]


# ── Ticker Validate ───────────────────────────────────────────────────────────

class TickerInfo(BaseModel):
    ticker: str
    name: str
    asset_class: str
    exchange: str
    currency: str
    valid: bool
    error: str | None = None
