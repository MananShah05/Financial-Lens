import axios from "axios"
import type {
  StressTestRequest, StressTestResult,
  RollingCorrelationRequest, RollingCorrelationResult,
  RegressionRequest, RegressionResult,
  TickerInfo,
} from "@/types"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
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
