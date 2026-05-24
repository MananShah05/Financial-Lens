import axios from "axios"
import type {
  StressTestRequest, StressTestResult,
  RollingCorrelationRequest, RollingCorrelationResult,
  RegressionRequest, RegressionResult,
  TickerInfo,
} from "@/types"

// In development prefer relative requests so Next's rewrites (proxy) handle
// routing to the backend. In production use NEXT_PUBLIC_API_URL if provided.
const baseURL = process.env.NODE_ENV !== "production"
  ? "" // relative -> /api/.. will be rewritten by next.config.ts during dev
  : (process.env.NEXT_PUBLIC_API_URL || "")

const api = axios.create({
  baseURL,
  timeout: 60_000,
})


export const scenarioApi = {
  stressTest: (body: StressTestRequest) =>
    api.post<StressTestResult>("/api/scenario/stress-test", body).then(r => r.data),

  rollingCorrelation: (body: RollingCorrelationRequest) =>
    api.post<RollingCorrelationResult>("/api/scenario/rolling-correlation", body).then(r => r.data),

  regression: (body: RegressionRequest) =>
    api.post<RegressionResult>("/api/scenario/regression", body).then(r => r.data),

  tickerInfo: (q: string) =>
    api.get<TickerInfo>(`/api/scenario/ticker-info?q=${encodeURIComponent(q)}`).then(r => r.data),
}

type ApiError = {
  detail?: {
    message?: string
  }
}

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<ApiError>(error)) {
    return error.response?.data?.detail?.message || fallback
  }
  return fallback
}

export default api
