import os
import time
import httpx
import pandas as pd
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

QUOTE_TYPE_MAP = {
    "EQUITY": "equity",
    "ETF": "equity",
    "MUTUALFUND": "equity",
    "INDEX": "index",
    "CURRENCY": "fx",
    "FUTURE": "commodity",
    "CRYPTOCURRENCY": "crypto",
}


def _normalize_ticker(ticker: str) -> tuple[str, str]:
    """
    Map common symbol conventions to Finnhub symbol conventions and asset classes.
    Returns: (finnhub_symbol, asset_class)
    """
    # 1. Forex / Currency Pairs (e.g. USDINR=X, EURUSD=X)
    if ticker.endswith("=X"):
        symbol = ticker.replace("=X", "")
        if len(symbol) == 6:
            base, quote = symbol[:3], symbol[3:]
            return f"OANDA:{base}_{quote}", "forex"
        return f"OANDA:{symbol}", "forex"

    # 2. Cryptocurrencies (e.g. BTC-USD, ETH-USD)
    if "-" in ticker:
        parts = ticker.split("-")
        if len(parts) == 2 and parts[1] in ("USD", "USDT", "BTC", "ETH", "EUR", "GBP"):
            base, quote = parts[0], parts[1]
            if quote == "USD":
                quote = "USDT"  # Binance USDT pair is standard and highly liquid
            return f"BINANCE:{base}{quote}", "crypto"

    # 3. Market Indices (e.g. ^GSPC, ^NSEI, ^BSESN)
    if ticker in {"GSPC", "^GSPC", "SPX", "SP500"}:
        return "^GSPC", "index"
    if ticker in {"NSEI", "^NSEI"}:
        return "^NSEI", "index"
    if ticker in {"BSESN", "^BSESN"}:
        return "^BSESN", "index"
    if ticker.startswith("^"):
        # Finnhub handles standard US indices directly under stock candles with caretaker
        return ticker, "index"

    # 4. Standard Equities / ETFs (e.g. AAPL, TSLA, GLD)
    return ticker, "equity"


def _get_timestamps(period: str) -> tuple[int, int]:
    """
    Calculate from/to UNIX timestamps based on the period string.
    """
    to_ts = int(time.time())
    if period == "1y":
        days = 365
    elif period == "2y":
        days = 2 * 365
    elif period == "5y":
        days = 5 * 365
    else:
        days = 365
    from_ts = to_ts - (days * 24 * 60 * 60)
    return from_ts, to_ts


def _fetch_single_series(ticker: str, from_ts: int, to_ts: int, token: str, period: str) -> pd.Series:
    """
    Fetch daily close candles from Finnhub for a single ticker.
    """
    symbol, asset_class = _normalize_ticker(ticker)
    
    # Route to the appropriate Finnhub candle endpoint
    if asset_class == "crypto":
        endpoint = "crypto"
    elif asset_class == "forex":
        endpoint = "forex"
    else:
        endpoint = "stock"  # equities and indices utilize stock candle endpoint

    url = f"https://finnhub.io/api/v1/{endpoint}/candle"
    params = {
        "symbol": symbol,
        "resolution": "D",
        "from": from_ts,
        "to": to_ts,
        "token": token,
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            r = client.get(url, params=params)
            
            # Fallback for cryptos if Binance fails, try Coinbase format
            if r.status_code != 200 and asset_class == "crypto" and "BINANCE" in symbol:
                alt_symbol = symbol.replace("BINANCE:", "COINBASE:").replace("USDT", "-USD")
                params["symbol"] = alt_symbol
                r = client.get(url, params=params)

            if r.status_code != 200:
                if r.status_code == 403 and asset_class == "index":
                    raise HTTPException(
                        status_code=422,
                        detail={
                            "message": f"Finnhub returned HTTP 403 for index ticker '{ticker}' (resolved as '{params['symbol']}'). Your Finnhub plan or token may not allow index candles.",
                            "code": "TICKER_FETCH_FAILED",
                        },
                    )
                raise HTTPException(
                    status_code=422,
                    detail={
                        "message": f"Finnhub API returned HTTP {r.status_code} for ticker '{ticker}' (resolved as '{params['symbol']}').",
                        "code": "TICKER_FETCH_FAILED"
                    }
                )

            data = r.json()
            if data.get("s") != "ok" or not data.get("c"):
                # Try raw symbol under stock endpoint as absolute index fallback
                if endpoint != "stock":
                    params["symbol"] = ticker
                    r = client.get("https://finnhub.io/api/v1/stock/candle", params=params)
                    if r.status_code == 200:
                        data = r.json()

                if data.get("s") != "ok" or not data.get("c"):
                    raise HTTPException(
                        status_code=422,
                        detail={
                            "message": f"Ticker '{ticker}' (resolved as '{symbol}') returned no historical data from Finnhub.",
                            "code": "TICKER_NO_DATA"
                        }
                    )

            # Parse close prices ('c') and timestamps ('t')
            closes = data["c"]
            timestamps = data["t"]

            # Convert timestamps to pandas DatetimeIndex normalized to midnight
            dates = pd.to_datetime(timestamps, unit="s").normalize()
            series = pd.Series(closes, index=dates, name=ticker)
            return series

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail={
                "message": f"Unexpected error loading ticker '{ticker}': {str(e)}",
                "code": "TICKER_FETCH_FAILED"
            }
        )


def fetch_prices(tickers: list[str], period: str) -> pd.DataFrame:
    """
    Download daily close prices from Finnhub for a list of tickers.
    Returns DataFrame: index=date, columns=tickers.
    Raises HTTPException 422 if any ticker returns empty data.
    """
    token = os.getenv("FINNHUB_API_KEY")
    if not token:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Finnhub API Key is missing. Please set FINNHUB_API_KEY in your .env file.",
                "code": "CONFIG_ERROR"
            }
        )

    from_ts, to_ts = _get_timestamps(period)
    series_list = []

    for ticker in tickers:
        series = _fetch_single_series(ticker, from_ts, to_ts, token, period)
        series_list.append(series)

    # Merge all Series into a single DataFrame aligned on DatetimeIndex
    prices = pd.concat(series_list, axis=1)

    # Drop rows where ALL elements are NaN, forward-fill minor gaps (e.g. timezone overlap)
    prices = prices.dropna(how="all").ffill().dropna()

    # Verify all requested tickers are present in the final dataset
    missing = [t for t in tickers if t not in prices.columns]
    if missing:
        raise HTTPException(
            status_code=422,
            detail={
                "message": f"Completed merge failed. No data compiled for: {missing}",
                "code": "TICKER_NO_DATA"
            }
        )

    return prices


def get_ticker_info(ticker: str) -> dict:
    """
    Fetch metadata profile for a single ticker via Finnhub.
    Returns dict with name, exchange, asset_class, currency, valid.
    """
    token = os.getenv("FINNHUB_API_KEY")
    if not token:
        return {
            "ticker": ticker,
            "name": ticker,
            "asset_class": "unknown",
            "exchange": "unknown",
            "currency": "USD",
            "valid": False,
            "error": "Finnhub API key is missing. Add FINNHUB_API_KEY to .env",
        }

    symbol, asset_class = _normalize_ticker(ticker)

    try:
        url = "https://finnhub.io/api/v1/stock/profile2"
        params = {"symbol": symbol, "token": token}

        with httpx.Client(timeout=10.0) as client:
            r = client.get(url, params=params)
            
            if r.status_code == 200:
                data = r.json()
                if data and data.get("name"):
                    return {
                        "ticker": ticker,
                        "name": data.get("name"),
                        "asset_class": "equity",
                        "exchange": data.get("exchange", "unknown"),
                        "currency": data.get("currency", "USD"),
                        "valid": True,
                        "error": None,
                    }

            # Return robust fallback profiles for non-equity assets (crypto, index, forex)
            display_exchange = "Crypto Exchange" if asset_class == "crypto" else "Index Provider" if asset_class == "index" else "OANDA" if asset_class == "forex" else "unknown"
            return {
                "ticker": ticker,
                "name": ticker,
                "asset_class": asset_class,
                "exchange": display_exchange,
                "currency": "USD" if asset_class != "forex" else ticker[:3],
                "valid": True,
                "error": None,
            }

    except Exception as e:
        return {
            "ticker": ticker,
            "name": ticker,
            "asset_class": "unknown",
            "exchange": "unknown",
            "currency": "USD",
            "valid": False,
            "error": str(e),
        }
