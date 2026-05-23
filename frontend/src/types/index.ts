// ── Stress Test ──────────────────────────────────────────────────────────────

export interface StressTestRequest {
  ticker: string
  shock_pct: number
  portfolio_value: number
  period: "1y" | "2y" | "5y"
}

export interface StressTestResult {
  ticker: string
  period: string
  shock_pct: number
  portfolio_value: number
  current_price: number
  annualized_return: number
  annualized_volatility: number
  max_drawdown: number
  sharpe_ratio: number
  shocked_price: number
  pnl_absolute: number
  pnl_pct: number
  historical_occurrences: number
  worst_historical_30d_return: number
  best_historical_30d_return: number
  return_distribution: number[]
}

// ── Rolling Correlation ───────────────────────────────────────────────────────

export interface RollingCorrelationRequest {
  ticker1: string
  ticker2: string
  window: number
  period: "1y" | "2y" | "5y"
}

export interface CorrelationDataPoint {
  date: string
  correlation: number
}

export interface RollingCorrelationResult {
  ticker1: string
  ticker2: string
  window: number
  period: string
  current_correlation: number
  avg_correlation: number
  min_correlation: number
  max_correlation: number
  relationship: string
  data: CorrelationDataPoint[]
}

// ── OLS Regression ───────────────────────────────────────────────────────────

export interface RegressionRequest {
  dependent: string
  independent: string
  period: "1y" | "2y" | "5y"
}

export interface RegressionDataPoint {
  x: number
  y: number
  date: string
}

export interface RegressionResult {
  dependent: string
  independent: string
  period: string
  alpha: number
  beta: number
  r_squared: number
  p_value_beta: number
  p_value_alpha: number
  std_err_beta: number
  std_err_alpha: number
  beta_interpretation: string
  alpha_interpretation: string
  fit_quality: string
  scatter_data: RegressionDataPoint[]
  regression_line: { x: number; y_hat: number }[]
}

// ── Ticker Info ───────────────────────────────────────────────────────────────

export interface TickerInfo {
  ticker: string
  name: string
  asset_class: string
  exchange: string
  currency: string
  valid: boolean
  error?: string
}
