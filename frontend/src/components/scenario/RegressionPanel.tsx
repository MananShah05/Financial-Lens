"use client"
import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { getApiErrorMessage, scenarioApi } from "@/lib/api"
import { fmt } from "@/lib/utils"
import type { RegressionResult } from "@/types"
import { PanelGrid, Input, Select, Button, StatCard, ErrorBanner, EmptyState } from "./UI"
import * as Icons from "./Icons"
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from "recharts"

const PERIOD_OPTIONS = [
  { label: "1 Year", value: "1y" },
  { label: "2 Years", value: "2y" },
  { label: "5 Years", value: "5y" },
]

const PRESET_PAIRS = [
  { label: "NIFTY vs S&P 500", dep: "^NSEI", ind: "^GSPC" },
  { label: "Gold vs USD/INR", dep: "GLD", ind: "USDINR=X" },
  { label: "NIFTY vs USD/INR", dep: "^NSEI", ind: "USDINR=X" },
  { label: "HDFC vs NIFTY", dep: "HDFCBANK.NS", ind: "^NSEI" },
]

export default function RegressionPanel() {
  const [dep, setDep] = useState("^NSEI")
  const [ind, setInd] = useState("^GSPC")
  const [period, setPeriod] = useState<"1y" | "2y" | "5y">("2y")
  const [isPolling, setIsPolling] = useState(false)

  const mutation = useMutation({
    mutationFn: () => scenarioApi.regression({ dependent: dep, independent: ind, period }),
  })

  // Simulated polling indicator state when input changes
  useEffect(() => {
    setIsPolling(true)
    const t = setTimeout(() => setIsPolling(false), 1000)
    return () => clearTimeout(t)
  }, [dep, ind, period])

  const result = mutation.data

  return (
    <PanelGrid
      left={
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-4">
            <h3 className="font-display text-headline-md uppercase tracking-wider text-on-surface">Inputs</h3>
            <Icons.Tune className="w-5 h-5 text-primary" />
          </div>

          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Preset Pairs</p>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESET_PAIRS.map(p => (
                <button
                  key={p.label}
                  onClick={() => { setDep(p.dep); setInd(p.ind) }}
                  className={`font-label-caps text-[10px] px-2.5 py-2 rounded border transition-all text-left ${
                    dep === p.dep && ind === p.ind
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase">DEPENDENT VARIABLE (Y)</label>
            <Input label="" value={dep} onChange={e => setDep(e.target.value.toUpperCase())} placeholder="e.g. ^NSEI" />
          </div>

          <div className="space-y-2">
            <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase">INDEPENDENT VARIABLE (X)</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-surface-container-highest border border-outline-variant rounded-lg p-2 text-sm">
                <span className="font-mono text-xs text-on-surface font-semibold">{ind}</span>
                <Icons.Close className="w-4 h-4 text-error cursor-pointer hover:scale-110 active:scale-95 transition-transform" onClick={() => setInd("")} />
              </div>
              <button 
                onClick={() => setInd("^GSPC")}
                className="w-full border border-dashed border-outline-variant rounded-lg p-2 text-[10px] font-label-caps text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1 font-semibold"
              >
                <Icons.Plus className="w-3.5 h-3.5" /> Add Variable
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Range" value={period} onChange={e => setPeriod(e.target.value as "1y" | "2y" | "5y")} options={PERIOD_OPTIONS} />
            <div className="space-y-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase">Frequency</label>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-sm text-body-sm text-on-surface-variant/80">Daily</div>
            </div>
          </div>

          <Button loading={mutation.isPending} onClick={() => mutation.mutate()} disabled={!dep || !ind} className="mt-4">
            RUN OLS ANALYSIS
          </Button>

          {isPolling ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 flex items-center justify-center gap-3">
              <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">POLLING RECENT DATA...</span>
            </div>
          ) : null}

          {mutation.isError && (
            <ErrorBanner message={getApiErrorMessage(mutation.error, "Regression failed")} />
          )}

          {result && (
            <div className="bg-surface-container-low p-4 border border-outline-variant border-l-4 border-l-primary rounded-xl">
              <div className="flex items-start">
                <Icons.Info className="w-[18px] h-[18px] text-primary mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-display text-on-surface text-sm mb-1 uppercase tracking-wide">Significance</h4>
                  <p className="text-body-sm text-[12px] text-on-surface-variant leading-relaxed">
                    The p-value for Beta is <span className="text-secondary font-mono font-bold">{fmt.pValue(result.p_value_beta)}</span>, indicating {result.p_value_beta < 0.05 ? "high statistical significance" : "moderate or low statistical significance"} for this model.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      }
      right={
        result ? <RegressionResultView result={result} /> : (
          mutation.isPending
            ? <div className="flex flex-col items-center justify-center h-full gap-3 text-on-surface-variant font-mono text-xs py-16">
                <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="font-label-caps uppercase tracking-wider opacity-60">Running OLS Regression…</span>
              </div>
            : <EmptyState message="Select dependent and independent assets to run OLS regression" />
        )
      }
    />
  )
}

function RegressionResultView({ result }: { result: RegressionResult }) {
  const betaColor = result.beta > 1.2 ? "text-error" : result.beta > 0 ? "text-secondary" : "text-tertiary"
  const r2Color = result.r_squared > 0.6 ? "text-secondary" : result.r_squared > 0.3 ? "text-tertiary" : "text-error"
  const annAlpha = result.alpha * 252

  // Thin scatter data for optimal charting
  const step = Math.max(1, Math.floor(result.scatter_data.length / 150))
  const chartData = result.scatter_data.filter((_, i) => i % step === 0)

  // Dynamic values for coefficient table calculation
  const tStatAlpha = result.alpha / (result.std_err_alpha || 0.0001)
  const tStatBeta = result.beta / (result.std_err_beta || 0.0001)

  // 95% Confidence Interval dynamic calculation
  const confIntervalAlphaLo = result.alpha - 1.96 * (result.std_err_alpha || 0)
  const confIntervalAlphaHi = result.alpha + 1.96 * (result.std_err_alpha || 0)
  const confIntervalBetaLo = result.beta - 1.96 * (result.std_err_beta || 0)
  const confIntervalBetaHi = result.beta + 1.96 * (result.std_err_beta || 0)

  return (
    <div className="space-y-6">
      {/* High Density Stats Cards (Pro) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="R-SQUARED" value={fmt.number(result.r_squared)} color={r2Color} sub="FIT QUALITY (R²)" />
        <StatCard label="ALPHA (α)" value={fmt.pctSigned(annAlpha)} color={annAlpha > 0 ? "text-secondary" : "text-error"} sub="ANNUALIZED JENSEN" />
        <StatCard label="BETA (β)" value={fmt.number(result.beta)} color={betaColor} sub="MARKET SENSITIVITY" />
        <StatCard label="STD ERROR" value={fmt.number(result.std_err_beta, 4)} color="text-error" sub="SLOPE STANDARD ERR" />
      </div>

      {/* Main chart + equation card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Scatter + Regression Line */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex flex-col justify-between min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-display text-headline-md text-on-surface uppercase tracking-wider">Regressional Relationship</h3>
              <p className="text-[11px] text-on-surface-variant font-mono mt-0.5 uppercase tracking-wide">
                Daily return correlation scatter & OLS line
              </p>
            </div>
            <div className="flex gap-4 font-label-caps text-[9px] text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-primary rounded-sm opacity-60"></span>
                <span>OBSERVATIONS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-secondary"></span>
                <span>REGRESSION LINE</span>
              </div>
            </div>
          </div>

          <div className="h-[220px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.15} />
                <XAxis
                  dataKey="x"
                  type="number"
                  name={result.independent}
                  tick={{ fill: "var(--text-secondary)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                  tickFormatter={v => `${(v * 100).toFixed(1)}%`}
                  stroke="var(--color-outline-variant)"
                />
                <YAxis
                  dataKey="y"
                  type="number"
                  name={result.dependent}
                  tick={{ fill: "var(--text-secondary)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                  tickFormatter={v => `${(v * 100).toFixed(1)}%`}
                  stroke="var(--color-outline-variant)"
                />
                <Tooltip
                  contentStyle={{ background: "var(--surf)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-primary)" }}
                  formatter={(value: any, name: any) => [`${(Number(value) * 100).toFixed(2)}%`, String(name)]}
                />
                <Scatter
                  data={chartData}
                  fill="var(--color-primary)"
                  fillOpacity={0.4}
                  r={2.5}
                />
                <Scatter
                  data={result.regression_line.map(p => ({ x: p.x, y: p.y_hat }))}
                  fill="var(--color-secondary)"
                  line={{ stroke: "var(--color-secondary)", strokeWidth: 1.8, strokeDasharray: "4 3" }}
                  fillOpacity={0}
                  r={0}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pro Styled Equation Card */}
        <div className="lg:col-span-4 bg-surface-container border border-outline-variant p-6 rounded-xl flex flex-col justify-center items-center text-center">
          <label className="font-label-caps text-label-caps text-on-surface-variant mb-4 flex items-center gap-2 tracking-[0.2em] text-[10px] font-semibold uppercase">
            <Icons.Functions className="w-3.5 h-3.5 text-on-surface-variant" />
            ESTIMATED EQUATION
          </label>
          <div className="font-mono text-sm text-primary bg-surface-container-lowest px-4 py-6 border border-outline-variant rounded-xl w-full select-all text-center tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none font-bold">
            y = <span className="text-tertiary">{result.alpha.toFixed(4)}</span> + <span className="text-secondary">{result.beta.toFixed(4)}</span>x + ε
          </div>
          <p className="text-[9px] font-mono text-on-surface-variant mt-3 italic">Robust standard errors applied</p>
        </div>
      </div>

      {/* Pro Coefficient Details statistical matrix table */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 bg-surface-container/60 border-b border-outline-variant">
          <p className="font-label-caps text-label-caps text-on-surface font-bold tracking-wider">COEFFICIENT DETAILS</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest text-[10px] font-mono uppercase tracking-widest text-outline">
                <th className="px-6 py-3.5 border-b border-outline-variant font-semibold">COEFFICIENT</th>
                <th className="px-6 py-3.5 border-b border-outline-variant font-semibold text-right">ESTIMATE</th>
                <th className="px-6 py-3.5 border-b border-outline-variant font-semibold text-right">STD. ERROR</th>
                <th className="px-6 py-3.5 border-b border-outline-variant font-semibold text-right">T-STATISTIC</th>
                <th className="px-6 py-3.5 border-b border-outline-variant font-semibold text-right">P-VALUE</th>
                <th className="px-6 py-3.5 border-b border-outline-variant font-semibold text-right">95% CONF. INTERVAL</th>
              </tr>
            </thead>
            <tbody className="text-xs font-mono select-text divide-y divide-outline-variant/30">
              <tr className="hover:bg-surface-container-high/40 transition-colors">
                <td className="px-6 py-4 font-sans text-on-surface font-semibold">Intercept (Alpha)</td>
                <td className="px-6 py-4 text-right">{result.alpha.toFixed(5)}</td>
                <td className="px-6 py-4 text-right text-outline">{result.std_err_alpha.toFixed(5)}</td>
                <td className={`px-6 py-4 text-right font-bold ${Math.abs(tStatAlpha) > 1.96 ? "text-tertiary" : "text-on-surface-variant"}`}>
                  {tStatAlpha.toFixed(3)}
                </td>
                <td className="px-6 py-4 text-right">{result.p_value_alpha.toFixed(4)}</td>
                <td className="px-6 py-4 text-right text-on-surface-variant">
                  [{confIntervalAlphaLo.toFixed(4)}, {confIntervalAlphaHi.toFixed(4)}]
                </td>
              </tr>
              <tr className="hover:bg-surface-container-high/40 transition-colors">
                <td className="px-6 py-4 font-sans text-on-surface font-semibold">{result.independent} (Beta Slope)</td>
                <td className="px-6 py-4 text-right">{result.beta.toFixed(4)}</td>
                <td className="px-6 py-4 text-right text-outline">{result.std_err_beta.toFixed(4)}</td>
                <td className={`px-6 py-4 text-right font-bold ${Math.abs(tStatBeta) > 1.96 ? "text-tertiary" : "text-on-surface-variant"}`}>
                  {tStatBeta.toFixed(3)}
                </td>
                <td className="px-6 py-4 text-right">{fmt.pValue(result.p_value_beta)}</td>
                <td className="px-6 py-4 text-right text-on-surface-variant">
                  [{confIntervalBetaLo.toFixed(4)}, {confIntervalBetaHi.toFixed(4)}]
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Beta Interpretation (Pro) */}
      <div className="bg-surface-container border border-outline-variant rounded-xl">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container/60">
          <h4 className="font-display text-on-surface uppercase text-sm tracking-wider font-semibold">Beta Interpretation</h4>
          <span className={`font-mono px-2.5 py-0.5 rounded text-[10px] border font-bold uppercase tracking-wide ${
            result.beta > 1.2
              ? "bg-error/10 text-error border-error/20"
              : "bg-secondary/10 text-secondary border-secondary/20"
          }`}>
            {result.beta > 1.2 ? "Aggressive (High Vol Sensitivity)" : "Defensive / Muted Sensitivity"}
          </span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {result.beta_interpretation}
            </p>
            <p className="text-xs text-on-surface-variant/70 italic leading-relaxed">
              {result.alpha_interpretation} {result.fit_quality}
            </p>
          </div>
          <div className="bg-surface-container-lowest p-4 border border-outline-variant text-center min-w-[140px] rounded-xl font-mono">
            <p className="text-[10px] text-outline tracking-wider uppercase mb-1">Relative Volatility</p>
            <p className={`text-2xl font-bold ${result.beta > 1 ? "text-error" : "text-secondary"}`}>
              {result.beta > 0 ? `+${((result.beta - 1) * 100).toFixed(0)}%` : `${(result.beta * 100).toFixed(0)}%`}
            </p>
            <p className="text-[9px] text-outline uppercase opacity-60 mt-0.5">Estimated Beta</p>
          </div>
        </div>
      </div>
    </div>
  )
}
