const number = (value: number, decimals = 2) => {
  if (!Number.isFinite(value)) return "—"
  return value.toFixed(decimals)
}

const pct = (value: number, decimals = 2) => {
  if (!Number.isFinite(value)) return "—"
  return `${(value * 100).toFixed(decimals)}%`
}

const pctSigned = (value: number, decimals = 2) => {
  if (!Number.isFinite(value)) return "—"
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${Math.abs(value * 100).toFixed(decimals)}%`
}

const currency = (value: number) => {
  if (!Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

const pValue = (value: number) => {
  if (!Number.isFinite(value)) return "—"
  if (value < 0.001) return "<0.001"
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")
}

export const fmt = {
  number,
  pct,
  pctSigned,
  currency,
  pValue,
}
