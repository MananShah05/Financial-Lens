import numpy as np
import pandas as pd
import statsmodels.api as sm
from schemas import (
    StressTestResult,
    RollingCorrelationResult,
    CorrelationDataPoint,
    RegressionResult,
    RegressionDataPoint,
)


RISK_FREE_RATE = 0.065  # 6.5% India 91-day T-bill, annualised
TRADING_DAYS = 252


# ── Helpers ──────────────────────────────────────────────────────────────────

def _returns(prices: pd.Series) -> pd.Series:
    return prices.pct_change().dropna()


def _annualised_return(returns: pd.Series) -> float:
    n_years = len(returns) / TRADING_DAYS
    if n_years == 0:
        return 0.0
    total = (1 + returns).prod() - 1
    return float((1 + total) ** (1 / n_years) - 1)


def _annualised_vol(returns: pd.Series) -> float:
    return float(returns.std() * np.sqrt(TRADING_DAYS))


def _max_drawdown(returns: pd.Series) -> float:
    cumulative = (1 + returns).cumprod()
    rolling_max = cumulative.cummax()
    drawdown = (cumulative / rolling_max) - 1
    return float(drawdown.min())


def _sharpe(ann_return: float, ann_vol: float) -> float:
    if ann_vol == 0:
        return 0.0
    return (ann_return - RISK_FREE_RATE) / ann_vol


# ── Stress Test ──────────────────────────────────────────────────────────────

def compute_stress_test(
    prices: pd.DataFrame,
    ticker: str,
    shock_pct: float,
    portfolio_value: float,
) -> StressTestResult:
    s = prices[ticker]
    rets = _returns(s)

    ann_ret = _annualised_return(rets)
    ann_vol = _annualised_vol(rets)
    max_dd = _max_drawdown(rets)
    sharpe = _sharpe(ann_ret, ann_vol)

    current_price = float(s.iloc[-1])
    shock_factor = shock_pct / 100
    shocked_price = current_price * (1 + shock_factor)
    pnl_pct = shock_factor
    pnl_absolute = portfolio_value * shock_factor

    # Rolling 30-day returns for distribution + historical context
    rolling_30d = (s / s.shift(30) - 1).dropna()
    threshold = shock_pct / 100
    if threshold < 0:
        occurrences = int((rolling_30d <= threshold).sum())
    else:
        occurrences = int((rolling_30d >= threshold).sum())

    return StressTestResult(
        ticker=ticker,
        period="",
        shock_pct=shock_pct,
        portfolio_value=portfolio_value,
        current_price=round(current_price, 2),
        annualized_return=round(ann_ret, 4),
        annualized_volatility=round(ann_vol, 4),
        max_drawdown=round(max_dd, 4),
        sharpe_ratio=round(sharpe, 4),
        shocked_price=round(shocked_price, 2),
        pnl_absolute=round(pnl_absolute, 2),
        pnl_pct=round(pnl_pct, 4),
        historical_occurrences=occurrences,
        worst_historical_30d_return=round(float(rolling_30d.min()), 4),
        best_historical_30d_return=round(float(rolling_30d.max()), 4),
        return_distribution=[round(float(x), 4) for x in rolling_30d.tolist()],
    )


# ── Rolling Correlation ───────────────────────────────────────────────────────

def compute_rolling_correlation(
    prices: pd.DataFrame,
    ticker1: str,
    ticker2: str,
    window: int,
) -> RollingCorrelationResult:
    r1 = _returns(prices[ticker1])
    r2 = _returns(prices[ticker2])

    # Align on common dates
    combined = pd.concat([r1, r2], axis=1).dropna()
    combined.columns = [ticker1, ticker2]

    rolling_corr = combined[ticker1].rolling(window).corr(combined[ticker2]).dropna()

    current = float(rolling_corr.iloc[-1])
    avg = float(rolling_corr.mean())
    min_c = float(rolling_corr.min())
    max_c = float(rolling_corr.max())

    # Generate insight text
    if current > 0.7:
        relationship = f"Strong positive correlation ({current:.2f}) — assets move together; limited diversification benefit"
    elif current > 0.3:
        relationship = f"Moderate positive correlation ({current:.2f}) — partial co-movement; some diversification benefit"
    elif current > -0.3:
        relationship = f"Near-zero correlation ({current:.2f}) — largely independent assets; good diversification"
    elif current > -0.7:
        relationship = f"Moderate negative correlation ({current:.2f}) — partial hedge; meaningful diversification benefit"
    else:
        relationship = f"Strong negative correlation ({current:.2f}) — strong hedge; significant portfolio risk reduction"

    data = [
        CorrelationDataPoint(
            date=str(idx.date()),
            correlation=round(float(val), 4),
        )
        for idx, val in rolling_corr.items()
    ]

    return RollingCorrelationResult(
        ticker1=ticker1,
        ticker2=ticker2,
        window=window,
        period="",
        current_correlation=round(current, 4),
        avg_correlation=round(avg, 4),
        min_correlation=round(min_c, 4),
        max_correlation=round(max_c, 4),
        relationship=relationship,
        data=data,
    )


# ── OLS Regression ───────────────────────────────────────────────────────────

def compute_regression(
    prices: pd.DataFrame,
    dependent: str,
    independent: str,
) -> RegressionResult:
    r_y = _returns(prices[dependent])
    r_x = _returns(prices[independent])

    combined = pd.concat([r_y, r_x], axis=1).dropna()
    combined.columns = [dependent, independent]

    y = combined[dependent]
    x = sm.add_constant(combined[independent])

    model = sm.OLS(y, x).fit()

    alpha = float(model.params["const"])
    beta = float(model.params[independent])
    r2 = float(model.rsquared)
    p_beta = float(model.pvalues[independent])
    p_alpha = float(model.pvalues["const"])
    se_beta = float(model.bse[independent])
    se_alpha = float(model.bse["const"])

    # Interpretation strings
    if beta > 1.2:
        beta_interp = f"Beta {beta:.2f} — highly aggressive; amplifies {independent} moves by {beta:.1f}×"
    elif beta > 0.8:
        beta_interp = f"Beta {beta:.2f} — near market-neutral; moves closely with {independent}"
    elif beta > 0:
        beta_interp = f"Beta {beta:.2f} — defensive; lower sensitivity to {independent}"
    elif beta > -0.5:
        beta_interp = f"Beta {beta:.2f} — mild inverse relationship with {independent}"
    else:
        beta_interp = f"Beta {beta:.2f} — strong inverse; acts as a partial hedge against {independent}"

    ann_alpha = alpha * TRADING_DAYS
    if ann_alpha > 0.02 and p_alpha < 0.05:
        alpha_interp = f"Significant positive alpha ({ann_alpha*100:.1f}% annualised) — excess return above {independent}-implied expectation"
    elif ann_alpha < -0.02 and p_alpha < 0.05:
        alpha_interp = f"Significant negative alpha ({ann_alpha*100:.1f}% annualised) — underperforms {independent}-implied expectation"
    else:
        alpha_interp = f"Alpha not statistically significant (p={p_alpha:.2f}) — return largely explained by {independent}"

    if r2 > 0.7:
        fit_quality = f"Strong fit (R² = {r2:.2f}) — {independent} explains {r2*100:.0f}% of {dependent} variance"
    elif r2 > 0.4:
        fit_quality = f"Moderate fit (R² = {r2:.2f}) — {independent} is an important but partial driver"
    else:
        fit_quality = f"Weak fit (R² = {r2:.2f}) — {dependent} largely driven by other factors"

    # Scatter data (sample up to 300 points for performance)
    sample = combined.sample(min(300, len(combined)), random_state=42).sort_index()
    scatter = [
        RegressionDataPoint(
            x=round(float(row[independent]), 5),
            y=round(float(row[dependent]), 5),
            date=str(idx.date()),
        )
        for idx, row in sample.iterrows()
    ]

    # Regression line: min to max x
    x_vals = np.linspace(float(combined[independent].min()), float(combined[independent].max()), 50)
    reg_line = [{"x": round(float(xv), 5), "y_hat": round(float(alpha + beta * xv), 5)} for xv in x_vals]

    return RegressionResult(
        dependent=dependent,
        independent=independent,
        period="",
        alpha=round(alpha, 6),
        beta=round(beta, 4),
        r_squared=round(r2, 4),
        p_value_beta=round(p_beta, 4),
        p_value_alpha=round(p_alpha, 4),
        std_err_beta=round(se_beta, 4),
        std_err_alpha=round(se_alpha, 6),
        beta_interpretation=beta_interp,
        alpha_interpretation=alpha_interp,
        fit_quality=fit_quality,
        scatter_data=scatter,
        regression_line=reg_line,
    )
