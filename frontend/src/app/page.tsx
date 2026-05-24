"use client"

import { memo, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Bell,
  Briefcase,
  CaretDown,
  ChartLineUp,
  ClockCounterClockwise,
  Database,
  DownloadSimple,
  FileText,
  Function,
  Gauge,
  Gear,
  GitFork,
  House,
  MagnifyingGlass,
  Moon,
  Play,
  Question,
  Sun,
  TerminalWindow,
  Warning,
} from "@phosphor-icons/react"
import { Geist, Geist_Mono } from "next/font/google"
import { useMutation } from "@tanstack/react-query"
import { getApiErrorMessage, scenarioApi } from "@/lib/api"
import type { RegressionResult, RollingCorrelationResult, StressTestResult } from "@/types"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500", "600"],
})

const scenarioOptions = [
  { label: "Rates Shock", value: "rates", ticker: "^GSPC", shock: -15, note: "Macro rates repricing" },
  { label: "Liquidity Gap", value: "liquidity", ticker: "QQQ", shock: -24, note: "Forced de-risking" },
  { label: "Credit Freeze", value: "credit", ticker: "JNK", shock: -19.5, note: "High yield spread stress" },
  { label: "Energy Relief", value: "energy", ticker: "XLE", shock: 12, note: "Commodity-led upside" },
  { label: "Dollar Spike", value: "dollar", ticker: "UUP", shock: 9, note: "FX pressure regime" },
]

const tickerOptions = [
  { label: "^GSPC", value: "^GSPC" },
  { label: "QQQ", value: "QQQ" },
  { label: "AAPL", value: "AAPL" },
  { label: "MSFT", value: "MSFT" },
  { label: "NVDA", value: "NVDA" },
  { label: "GLD", value: "GLD" },
  { label: "TLT", value: "TLT" },
]

const periodOptions = [
  { label: "1Y", value: "1y" },
  { label: "2Y", value: "2y" },
  { label: "5Y", value: "5y" },
]

const windowOptions = [
  { label: "30D", value: "30" },
  { label: "60D", value: "60" },
  { label: "90D", value: "90" },
  { label: "120D", value: "120" },
]

const navItems = [
  { label: "Dashboard", icon: House, disabled: true },
  { label: "Portfolio", icon: Briefcase, disabled: true },
  { label: "Stress Test", icon: ChartLineUp, value: "stress" },
  { label: "Correlation", icon: GitFork, value: "correlation" },
  { label: "Regression", icon: Function, value: "regression" },
  { label: "Settings", icon: Gear, disabled: true },
] as const

type TabKey = "stress" | "correlation" | "regression"
type Period = "1y" | "2y" | "5y"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)

const pct = (value: number, decimals = 1) =>
  Number.isFinite(value) ? `${(value * 100).toFixed(decimals)}%` : "0.0%"

const signedPct = (value: number, decimals = 1) => {
  if (!Number.isFinite(value)) return "0.0%"
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  return `${sign}${Math.abs(value * 100).toFixed(decimals)}%`
}

const spring = { type: "spring", stiffness: 400, damping: 30 } as const

export default function ScenarioPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("stress")

  return (
    <div
      className={`${geist.variable} ${geistMono.variable} min-h-screen bg-[var(--bg)] text-[var(--text-primary)] antialiased`}
      style={{
        "--ease-out": "cubic-bezier(0.23, 1, 0.32, 1)",
        "--ease-in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
        "--ease-drawer": "cubic-bezier(0.32, 0.72, 0, 1)",
        fontFamily: "var(--font-geist)",
        lineHeight: 1.65,
      } as React.CSSProperties}
    >
      <DashboardStyles />
      <Sidebar activeTab={activeTab} onChange={setActiveTab} />
      <Header />
      <main className="min-h-screen bg-[var(--canvas)] pl-16 pt-[60px] lg:pl-60">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.02em] text-[var(--text-secondary)]">
              Risk / Scenario / <span className="text-[var(--text-primary)]">{activeTab.replace("-", " ")}</span>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-[32px] font-bold leading-none tracking-tighter text-[var(--text-primary)]">
                  QuantLens Scenario Analysis
                </h1>
                <p className="mt-2 max-w-2xl text-[15px] font-normal leading-[1.65] text-[var(--text-secondary)]">
                  Shock response, covariance drift, and factor sensitivity in one restrained risk workspace.
                </p>
              </div>
              <TabNav activeTab={activeTab} onChange={setActiveTab} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.section
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="grid gap-5 xl:grid-cols-[minmax(320px,38%)_1fr]"
            >
              {activeTab === "stress" && <StressWorkspace />}
              {activeTab === "correlation" && <CorrelationWorkspace />}
              {activeTab === "regression" && <RegressionWorkspace />}
            </motion.section>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

function Sidebar({ activeTab, onChange }: { activeTab: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col border-r border-[var(--border-subtle)] bg-[var(--surf-low)] transition-[width] duration-[220ms] ease-[var(--ease-drawer)] lg:w-60">
      <div className="flex h-[60px] items-center bg-[var(--surf-lowest)] px-4 lg:px-5">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.02em] text-[var(--text-primary)] lg:block">QuantLens</div>
          <div className="hidden font-mono text-[11px] uppercase tracking-[0.02em] text-[var(--text-secondary)] lg:block">v4.8.0</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = "value" in item && item.value === activeTab
          const disabled = "disabled" in item && item.disabled
          return (
            <button
              key={item.label}
              type="button"
              disabled={disabled}
              onClick={() => "value" in item && onChange(item.value)}
              className={[
                "group flex h-9 w-full items-center gap-3 rounded-md px-2 text-[13px] font-medium",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
                "transition-colors duration-[160ms] ease-[var(--ease-out)]",
                isActive ? "bg-[var(--surf-high)] text-[var(--accent)]" : "text-[var(--text-secondary)]",
                disabled ? "cursor-not-allowed opacity-[0.45]" : "cursor-pointer hover:bg-[var(--surf-high)] hover:text-[var(--text-primary)]",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} weight="regular" className={isActive ? "text-[var(--accent)]" : ""} />
              <span className="hidden whitespace-nowrap opacity-0 transition-opacity duration-[80ms] ease-[var(--ease-out)] lg:block lg:opacity-100">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="space-y-3 border-t border-[var(--border-subtle)] p-3 lg:p-4">
        <button
          type="button"
          className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-3 text-[13px] font-medium text-[var(--accent-on)] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] transition-[transform,opacity] duration-[160ms] ease-[var(--ease-out)]"
        >
          <DownloadSimple size={18} weight="regular" />
          <span className="hidden opacity-0 transition-opacity duration-[80ms] ease-[var(--ease-out)] lg:inline lg:opacity-100">Export</span>
        </button>
        <div className="flex items-center gap-2 px-1 text-[13px] text-[var(--positive)]">
          <StatusPulse />
          <span className="hidden lg:inline">Systems stable</span>
        </div>
        <button
          type="button"
          className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-[13px] text-[var(--text-secondary)] transition-colors duration-[160ms] ease-[var(--ease-out)] hover:bg-[var(--surf-high)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <TerminalWindow size={18} weight="regular" />
          <span className="hidden lg:inline">System Logs</span>
        </button>
      </div>
    </aside>
  )
}

function Header() {
  return (
    <header className="fixed left-16 right-0 top-0 z-30 flex h-[60px] items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--header-bg)] px-4 backdrop-blur-[20px] lg:left-60 lg:px-8">
      <div className="flex items-center gap-6">
        <label className="group flex h-9 w-[min(56vw,280px)] items-center gap-2 rounded-md border border-[var(--border-default)] bg-[var(--surf)] px-3 transition-colors duration-[120ms] ease-[var(--ease-out)] focus-within:border-[var(--accent-border)]">
          <MagnifyingGlass size={18} className="text-[var(--text-secondary)]" />
          <input
            className="w-full bg-transparent font-mono text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
            placeholder="Search ticker"
          />
        </label>
        <nav className="hidden items-center gap-5 font-mono text-[11px] uppercase tracking-[0.02em] text-[var(--text-secondary)] lg:flex">
          <a className="transition-colors duration-[120ms] ease-[var(--ease-out)] hover:text-[var(--text-primary)]" href="#">
            Market Data
          </a>
          <a className="transition-colors duration-[120ms] ease-[var(--ease-out)] hover:text-[var(--text-primary)]" href="#">
            Risk Models
          </a>
          <a className="transition-colors duration-[120ms] ease-[var(--ease-out)] hover:text-[var(--text-primary)]" href="#">
            Reports
          </a>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        {[Bell, ClockCounterClockwise, Question].map((Icon, index) => (
          <button
            key={index}
            type="button"
            className="hidden h-9 w-9 place-items-center rounded-md text-[var(--text-secondary)] transition-colors duration-[160ms] ease-[var(--ease-out)] hover:bg-[var(--surf-high)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:grid"
          >
            <Icon size={18} weight="regular" />
          </button>
        ))}
        <ThemeToggle />
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surf-high)] font-mono text-[11px] text-[var(--text-primary)] transition-[border-color] duration-[160ms] ease-[var(--ease-out)] hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          QL
        </button>
      </div>
    </header>
  )
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof document === "undefined") return "dark"
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"
  })
  const isDark = theme === "dark"

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark"
    const root = document.documentElement
    if (next === "light") {
      root.setAttribute("data-theme", "light")
    } else {
      root.removeAttribute("data-theme")
    }
    localStorage.setItem("quantlens-theme", next)
    setTheme(next)
  }

  return (
    <div className="flex items-center gap-2">
      <Sun
        size={15}
        weight="regular"
        className={`transition-colors duration-[150ms] ease-[var(--ease-out)] ${theme === "light" ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}
      />
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={toggleTheme}
        className="h-5 w-9 cursor-pointer rounded-[10px] p-0.5 transition-[background] duration-[200ms] ease-[var(--ease-out)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        style={{ background: isDark ? "color-mix(in srgb, var(--accent) 80%, transparent)" : "var(--border-default)" }}
      >
        <span
          className="block h-4 w-4 rounded-full bg-white transition-transform duration-[200ms] ease-[var(--ease-out)]"
          style={{ transform: isDark ? "translateX(16px)" : "translateX(0px)" }}
        />
      </button>
      <Moon
        size={15}
        weight="regular"
        className={`transition-colors duration-[150ms] ease-[var(--ease-out)] ${isDark ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}
      />
    </div>
  )
}

function TabNav({ activeTab, onChange }: { activeTab: TabKey; onChange: (tab: TabKey) => void }) {
  const tabs: { label: string; value: TabKey }[] = [
    { label: "Stress", value: "stress" },
    { label: "Correlation", value: "correlation" },
    { label: "Regression", value: "regression" },
  ]

  return (
    <div className="flex h-10 items-center gap-1 border-b border-[var(--border-subtle)]">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className="relative h-10 px-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors duration-[160ms] ease-[var(--ease-out)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] data-[active=true]:text-[var(--text-primary)]"
          data-active={activeTab === tab.value}
        >
          {tab.label}
          {activeTab === tab.value && (
            <motion.span
              layoutId="tab-indicator"
              className="absolute inset-x-2 bottom-[-1px] h-px bg-[var(--accent)]"
              transition={spring}
            />
          )}
        </button>
      ))}
    </div>
  )
}

function StressWorkspace() {
  const [scenario, setScenario] = useState("rates")
  const selectedScenario = scenarioOptions.find((item) => item.value === scenario) ?? scenarioOptions[0]
  const [ticker, setTicker] = useState(selectedScenario.ticker)
  const [shock, setShock] = useState(selectedScenario.shock)
  const [period, setPeriod] = useState<Period>("2y")
  const [portfolio, setPortfolio] = useState(1250000)

  const mutation = useMutation({
    mutationFn: () =>
      scenarioApi.stressTest({
        ticker,
        shock_pct: shock,
        period,
        portfolio_value: portfolio,
      }),
  })

  const changeScenario = (value: string) => {
    const next = scenarioOptions.find((item) => item.value === value)
    setScenario(value)
    if (next) {
      setTicker(next.ticker)
      setShock(next.shock)
    }
  }

  return (
    <>
      <Panel title="Scenario Engine" eyebrow="Input">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.02em] text-[var(--text-secondary)]">Runbook</span>
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surf-high)] px-2 py-1 font-mono text-[11px] text-[var(--text-secondary)]">
              V4.8.0
            </span>
          </div>

          <CustomSelect label="Scenario Type" value={scenario} options={scenarioOptions} onChange={changeScenario} />
          <CustomSelect label="Primary Ticker" value={ticker} options={tickerOptions} onChange={setTicker} mono />
          <RangeSlider label="Shock Magnitude" value={shock} min={-50} max={50} step={0.5} onChange={setShock} />

          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Portfolio Value" value={portfolio} onChange={setPortfolio} prefix="$" />
            <CustomSelect
              label="Period"
              value={period}
              options={periodOptions}
              onChange={(value) => setPeriod(value as Period)}
              mono
            />
          </div>

          <RunButton
            loading={mutation.isPending}
            disabled={!ticker || !Number.isFinite(portfolio)}
            onClick={() => mutation.mutate()}
          >
            Run Simulation
          </RunButton>

          {mutation.isError && (
            <ErrorBanner message={getApiErrorMessage(mutation.error, "Scenario run failed. Check ticker and API status.")} />
          )}
        </div>
      </Panel>

      <ResultShell loading={mutation.isPending} hasResult={Boolean(mutation.data)}>
        {mutation.data ? (
          <StressResults result={mutation.data} portfolio={portfolio} scenarioName={selectedScenario.label} note={selectedScenario.note} />
        ) : (
          <EmptyState message="Configure scenario parameters and run simulator" />
        )}
      </ResultShell>
    </>
  )
}

function CorrelationWorkspace() {
  const [ticker1, setTicker1] = useState("QQQ")
  const [ticker2, setTicker2] = useState("^GSPC")
  const [window, setWindow] = useState("60")
  const [period, setPeriod] = useState<Period>("2y")
  const mutation = useMutation({
    mutationFn: () =>
      scenarioApi.rollingCorrelation({
        ticker1,
        ticker2,
        window: Number(window),
        period,
      }),
  })

  return (
    <>
      <Panel title="Correlation Engine" eyebrow="Input">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Asset A" value={ticker1} options={tickerOptions} onChange={setTicker1} mono />
            <CustomSelect label="Asset B" value={ticker2} options={tickerOptions} onChange={setTicker2} mono />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Rolling Window" value={window} options={windowOptions} onChange={setWindow} mono />
            <CustomSelect label="Period" value={period} options={periodOptions} onChange={(value) => setPeriod(value as Period)} mono />
          </div>
          <RunButton loading={mutation.isPending} disabled={!ticker1 || !ticker2} onClick={() => mutation.mutate()}>
            Run Correlation
          </RunButton>
          {mutation.isError && <ErrorBanner message={getApiErrorMessage(mutation.error, "Correlation run failed.")} />}
        </div>
      </Panel>

      <ResultShell loading={mutation.isPending} hasResult={Boolean(mutation.data)}>
        {mutation.data ? <CorrelationResults result={mutation.data} /> : <EmptyState message="Run a rolling window correlation analysis" />}
      </ResultShell>
    </>
  )
}

function RegressionWorkspace() {
  const [dependent, setDependent] = useState("AAPL")
  const [independent, setIndependent] = useState("^GSPC")
  const [period, setPeriod] = useState<Period>("2y")
  const mutation = useMutation({
    mutationFn: () =>
      scenarioApi.regression({
        dependent,
        independent,
        period,
      }),
  })

  return (
    <>
      <Panel title="Regression Engine" eyebrow="Input">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Dependent" value={dependent} options={tickerOptions} onChange={setDependent} mono />
            <CustomSelect label="Independent" value={independent} options={tickerOptions} onChange={setIndependent} mono />
          </div>
          <CustomSelect label="Period" value={period} options={periodOptions} onChange={(value) => setPeriod(value as Period)} mono />
          <RunButton loading={mutation.isPending} disabled={!dependent || !independent} onClick={() => mutation.mutate()}>
            Run Regression
          </RunButton>
          {mutation.isError && <ErrorBanner message={getApiErrorMessage(mutation.error, "Regression run failed.")} />}
        </div>
      </Panel>

      <ResultShell loading={mutation.isPending} hasResult={Boolean(mutation.data)}>
        {mutation.data ? <RegressionResults result={mutation.data} /> : <EmptyState message="Run factor regression against a benchmark" />}
      </ResultShell>
    </>
  )
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surf-low)] p-5">
      <div className="mb-5">
        <div className="font-mono text-[11px] uppercase tracking-[0.02em] text-[var(--text-secondary)]">{eyebrow}</div>
        <h2 className="mt-1 text-[20px] font-bold leading-none tracking-tight text-[var(--text-primary)]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ResultShell({ loading, hasResult, children }: { loading: boolean; hasResult: boolean; children: React.ReactNode }) {
  return (
    <section className="min-h-[620px] rounded-lg border border-[var(--border-subtle)] bg-[var(--surf-low)] p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.02em] text-[var(--text-secondary)]">Output</div>
          <h2 className="mt-1 text-[20px] font-bold leading-none tracking-tight text-[var(--text-primary)]">Scenario Results</h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.02em] text-[var(--text-secondary)]">
          <Database size={16} /> Live API
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          >
            <MachineAnalysisSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key={hasResult ? "results" : "empty"}
            initial={{ opacity: 0, y: hasResult ? 12 : 0, scale: hasResult ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: hasResult ? 0.22 : 0.16, ease: [0.23, 1, 0.32, 1] }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function CustomSelect({
  label,
  value,
  options,
  onChange,
  mono = false,
}: {
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (value: string) => void
  mono?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find((item) => item.value === value)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  return (
    <div ref={ref} className="relative">
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        className={[
          "mt-2 flex h-9 w-full items-center justify-between rounded-md border border-[var(--border-default)] bg-[var(--surf)] px-3 text-left text-[13px] text-[var(--text-primary)] focus:border-[var(--accent-border)]",
          "transition-colors duration-[120ms] ease-[var(--ease-out)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
          mono ? "font-mono" : "font-medium",
        ].join(" ")}
        aria-expanded={open}
      >
        <span>{current?.label ?? value}</span>
        <CaretDown
          size={16}
          className="text-[var(--text-secondary)] transition-transform duration-[120ms] ease-[var(--ease-out)]"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: "top center" }}
            className="absolute z-20 mt-2 max-h-52 w-full overflow-y-auto rounded-md border border-[var(--border-default)] bg-[var(--surf)] p-1 shadow-2xl select-menu"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={[
                  "flex h-8 w-full items-center rounded px-2 text-left text-[13px] text-[var(--text-primary)]",
                  "transition-colors duration-[120ms] ease-[var(--ease-out)] hover:bg-[var(--surf-high)]",
                  option.value === value ? "font-medium" : "font-normal",
                  mono ? "font-mono" : "",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RangeSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  const [dragging, setDragging] = useState(false)
  const progress = ((value - min) / (max - min)) * 100
  const valueColor = value < -15 ? "text-[var(--error)]" : value > 10 ? "text-[var(--positive)]" : "text-[var(--accent)]"

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className={`font-mono text-[13px] ${valueColor}`}>{value > 0 ? "+" : ""}{value.toFixed(1)}%</span>
      </div>
      <div className="relative mt-4 pt-4">
        {dragging && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="pointer-events-none absolute top-0 rounded bg-[var(--surf-high)] px-2 py-1 font-mono text-[11px] text-[var(--accent)]"
            style={{ left: `calc(${progress}% - 18px)` }}
          >
            {value.toFixed(1)}
          </motion.div>
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onBlur={() => setDragging(false)}
          className="quant-range w-full"
          style={{ "--range-progress": `${progress}%` } as React.CSSProperties}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] uppercase tracking-[0.02em] text-[var(--text-secondary)]">
        <span>{min}%</span>
        <span>0%</span>
        <span>+{max}%</span>
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  prefix?: string
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="mt-2 flex h-9 items-center rounded-md border border-[var(--border-default)] bg-[var(--surf)] px-3 focus-within:border-[var(--accent-border)]">
        {prefix && <span className="mr-1 font-mono text-[13px] text-[var(--text-secondary)]">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full bg-transparent font-mono text-[13px] text-[var(--text-primary)] outline-none"
        />
      </div>
    </label>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] font-medium uppercase tracking-[0.02em] text-[var(--text-secondary)]">{children}</span>
}

function RunButton({
  children,
  loading,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  loading: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="run-button relative flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-[13px] font-medium text-[var(--accent-on)] ring-1 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surf-low)] transition-[transform,opacity] duration-[160ms] ease-[var(--ease-out)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      {loading ? <span className="button-spinner" aria-hidden /> : <Play size={16} weight="fill" />}
      <span className="relative grid">
        <span className={`col-start-1 row-start-1 transition-opacity duration-[160ms] ease-[var(--ease-out)] ${loading ? "opacity-0" : "opacity-100"}`}>
          {children}
        </span>
        <span className={`col-start-1 row-start-1 transition-opacity duration-[160ms] ease-[var(--ease-out)] ${loading ? "opacity-100" : "opacity-0"}`}>
          Processing
        </span>
      </span>
    </button>
  )
}

function StressResults({
  result,
  portfolio,
  scenarioName,
  note,
}: {
  result: StressTestResult
  portfolio: number
  scenarioName: string
  note: string
}) {
  const var99 = portfolio * 2.33 * (result.annualized_volatility / Math.sqrt(252))
  const recoveryDays = Math.max(18, Math.round(Math.abs(result.pnl_pct) * 260))
  const betaProxy = Math.max(0.35, Math.min(2.9, result.annualized_volatility / 0.14))
  const confidence = Math.min(96, Math.max(76, 92 - Math.abs(result.shock_pct) * 0.2 + result.historical_occurrences * 0.08))

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="show" className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="PnL Impact" value={signedPct(result.pnl_pct)} delta={formatCurrency(result.pnl_absolute)} tone={result.pnl_pct >= 0 ? "positive" : "negative"} />
        <StatCard label="VaR 99%" value={formatCurrency(var99)} delta="Daily" />
        <StatCard label="Recovery" value={`${recoveryDays}D`} delta="Mean" />
        <StatCard label="Beta Proxy" value={betaProxy.toFixed(2)} delta="Vol sensitivity" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_180px]">
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surf)] p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.02em] text-[var(--text-secondary)]">Distribution</div>
              <h3 className="mt-1 text-[20px] font-bold leading-none tracking-tight text-[var(--text-primary)]">
                30-Day Return Histogram
              </h3>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.02em] text-[var(--text-secondary)]">{result.ticker}</div>
          </div>
          <Histogram values={result.return_distribution} shockPct={result.shock_pct} />
        </div>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surf)] p-4">
          <ConfidenceScore value={confidence} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surf)] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Gauge size={18} className="text-[var(--accent)]" />
            <h3 className="text-[20px] font-bold leading-none tracking-tight">Machine Analysis</h3>
          </div>
          <p className="text-[15px] font-normal leading-[1.65] text-[var(--text-secondary)]">
            {scenarioName} maps {result.ticker} to a {signedPct(result.pnl_pct)} modeled portfolio response. {note} implies a
            liquidity-aware hedge budget near <span className="font-mono text-[var(--text-primary)]">{formatCurrency(Math.abs(var99))}</span>,
            with drawdown pressure concentrated around the shock reference band.
          </p>
        </div>
        <InlineStats
          rows={[
            ["Annual Return", signedPct(result.annualized_return)],
            ["Annual Vol", pct(result.annualized_volatility)],
            ["Max Drawdown", pct(result.max_drawdown)],
            ["Sharpe", result.sharpe_ratio.toFixed(2)],
          ]}
        />
      </div>
    </motion.div>
  )
}

function CorrelationResults({ result }: { result: RollingCorrelationResult }) {
  const confidence = Math.min(94, Math.max(68, Math.abs(result.current_correlation) * 100))
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Current" value={result.current_correlation.toFixed(2)} delta={result.relationship} tone={result.current_correlation >= 0 ? "positive" : "negative"} />
        <StatCard label="Average" value={result.avg_correlation.toFixed(2)} delta="Window mean" />
        <StatCard label="Minimum" value={result.min_correlation.toFixed(2)} delta="Observed low" tone="negative" />
        <StatCard label="Maximum" value={result.max_correlation.toFixed(2)} delta="Observed high" tone="positive" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_180px]">
        <MiniLineChart data={result.data.map((point) => point.correlation)} />
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surf)] p-4">
          <ConfidenceScore value={confidence} />
        </div>
      </div>
      <InlineStats
        rows={[
          ["Pair", `${result.ticker1}/${result.ticker2}`],
          ["Window", `${result.window}D`],
          ["Period", result.period.toUpperCase()],
        ]}
      />
    </div>
  )
}

function RegressionResults({ result }: { result: RegressionResult }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Beta" value={result.beta.toFixed(2)} delta="Factor loading" tone={result.beta >= 0 ? "positive" : "negative"} />
        <StatCard label="Alpha" value={signedPct(result.alpha)} delta="Intercept" tone={result.alpha >= 0 ? "positive" : "negative"} />
        <StatCard label="R Squared" value={pct(result.r_squared)} delta={result.fit_quality} />
        <StatCard label="P Value" value={result.p_value_beta.toFixed(3)} delta="Beta" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_180px]">
        <ScatterPlot result={result} />
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surf)] p-4">
          <ConfidenceScore value={Math.min(96, Math.max(52, result.r_squared * 100))} />
        </div>
      </div>
      <InlineStats
        rows={[
          ["Dependent", result.dependent],
          ["Independent", result.independent],
          ["Beta stderr", result.std_err_beta.toFixed(3)],
          ["Alpha stderr", result.std_err_alpha.toFixed(3)],
        ]}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string
  value: string
  delta: string
  tone?: "neutral" | "positive" | "negative"
}) {
  const toneClass =
    tone === "positive"
      ? "bg-[var(--positive-tint)] text-[var(--positive)]"
      : tone === "negative"
        ? "bg-[var(--error-tint)] text-[var(--error)]"
        : "bg-[var(--accent-tint)] text-[var(--accent)]"

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] } },
      }}
      className="relative min-h-[118px] rounded-lg border border-[var(--border-subtle)] bg-[var(--surf)] p-4"
    >
      <div className="text-[11px] font-normal uppercase tracking-[0.02em] text-[var(--text-secondary)]">{label}</div>
      <div className="mt-4 font-mono text-[24px] font-medium leading-none text-[var(--text-primary)]">{value}</div>
      <div className={`absolute bottom-3 right-3 rounded-full px-2 py-1 font-mono text-[11px] font-medium ${toneClass}`}>{delta}</div>
    </motion.div>
  )
}

function InlineStats({ rows }: { rows: [string, string][] }) {
  return (
    <div className="divide-y divide-[var(--border-subtle)] rounded-lg border border-[var(--border-subtle)] p-1">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between px-3 py-3">
          <span className="text-[11px] font-normal uppercase tracking-[0.02em] text-[var(--text-secondary)]">{label}</span>
          <span className="font-mono text-[14px] font-normal text-[var(--text-primary)]">{value}</span>
        </div>
      ))}
    </div>
  )
}

function Histogram({ values, shockPct }: { values: number[]; shockPct: number }) {
  const bins = useMemo(() => {
    const safe = values.length ? values : [-0.05, -0.02, 0.01, 0.03]
    const min = Math.min(...safe, shockPct / 100)
    const max = Math.max(...safe, shockPct / 100)
    const count = 28
    const width = (max - min || 0.1) / count
    return Array.from({ length: count }, (_, index) => {
      const low = min + index * width
      const high = low + width
      return {
        low,
        mid: (low + high) / 2,
        count: safe.filter((value) => value >= low && value < high).length,
      }
    })
  }, [values, shockPct])

  const maxCount = Math.max(...bins.map((bin) => bin.count), 1)
  const shockX = ((shockPct / 100 - bins[0].low) / (bins[bins.length - 1].low - bins[0].low || 1)) * 680 + 40

  return (
    <svg viewBox="0 0 760 260" className="h-[260px] w-full overflow-visible" role="img" aria-label="Return distribution histogram">
      <defs>
        <filter id="shock-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="var(--error)" floodOpacity="0.4" />
        </filter>
      </defs>
      <line x1="40" y1="220" x2="720" y2="220" stroke="var(--border-subtle)" />
      <motion.g initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.03 } } }}>
        {bins.map((bin, index) => {
          const barHeight = (bin.count / maxCount) * 170
          const x = 46 + index * 24
          const fill = bin.mid < 0 ? "var(--error)" : "var(--positive)"
          return (
            <motion.rect
              key={`${bin.mid}-${index}`}
              x={x}
              y={220 - barHeight}
              width="16"
              height={barHeight}
              rx="2"
              fill={fill}
              fillOpacity="0.72"
              style={{ transformOrigin: `${x + 8}px 220px` }}
              variants={{
                hidden: { scaleY: 0, opacity: 0 },
                show: { scaleY: 1, opacity: 1, transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] } },
              }}
            />
          )
        })}
      </motion.g>
      <line x1={shockX} y1="34" x2={shockX} y2="220" stroke="var(--error)" strokeDasharray="5 5" filter="url(#shock-shadow)" />
      <text x={shockX + 8} y="48" fill="var(--error)" className="font-mono text-[11px]">
        {shockPct.toFixed(1)}%
      </text>
      {[0, 7, 14, 21, 27].map((index) => (
        <text key={index} x={46 + index * 24} y="244" fill="var(--text-secondary)" className="font-mono text-[11px]">
          {(bins[index].mid * 100).toFixed(0)}%
        </text>
      ))}
    </svg>
  )
}

function ConfidenceScore({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const radius = 58
  const circumference = 2 * Math.PI * radius
  const dash = circumference - (value / 100) * circumference

  useEffect(() => {
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 600)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(value * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center">
      <svg viewBox="0 0 150 150" className="h-[150px] w-[150px]" aria-label="Confidence score">
        <defs>
          <linearGradient id="confidence-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--positive)" />
          </linearGradient>
        </defs>
        <circle cx="75" cy="75" r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
        <motion.circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="url(#confidence-gradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dash }}
          transition={{ type: "spring", duration: 0.6, bounce: 0, stiffness: 90, damping: 22 }}
          style={{ rotate: -90, transformOrigin: "75px 75px" }}
        />
        <text x="75" y="80" textAnchor="middle" className="fill-[var(--text-primary)] font-mono text-[32px] font-medium">
          {display}
        </text>
      </svg>
      <div className="font-mono text-[11px] uppercase tracking-[0.02em] text-[var(--text-secondary)]">Confidence Score</div>
    </div>
  )
}

function MiniLineChart({ data }: { data: number[] }) {
  const points = useMemo(() => {
    const safe = data.length ? data : [0, 0.2, 0.1, 0.4]
    const min = Math.min(...safe)
    const max = Math.max(...safe)
    return safe
      .map((value, index) => {
        const x = 40 + (index / Math.max(1, safe.length - 1)) * 660
        const y = 210 - ((value - min) / (max - min || 1)) * 160
        return `${x},${y}`
      })
      .join(" ")
  }, [data])

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surf)] p-4">
      <h3 className="mb-4 text-[20px] font-bold leading-none tracking-tight">Rolling Correlation Path</h3>
      <svg viewBox="0 0 740 250" className="h-[250px] w-full">
        <line x1="40" y1="210" x2="700" y2="210" stroke="var(--border-subtle)" />
        <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" />
      </svg>
    </div>
  )
}

function ScatterPlot({ result }: { result: RegressionResult }) {
  const points = result.scatter_data.slice(0, 80)
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs, -0.05)
  const maxX = Math.max(...xs, 0.05)
  const minY = Math.min(...ys, -0.05)
  const maxY = Math.max(...ys, 0.05)
  const sx = (x: number) => 50 + ((x - minX) / (maxX - minX || 1)) * 620
  const sy = (y: number) => 210 - ((y - minY) / (maxY - minY || 1)) * 160

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surf)] p-4">
      <h3 className="mb-4 text-[20px] font-bold leading-none tracking-tight">Factor Scatter</h3>
      <svg viewBox="0 0 720 250" className="h-[250px] w-full">
        <line x1="50" y1="210" x2="670" y2="210" stroke="var(--border-subtle)" />
        {points.map((point, index) => (
          <circle key={`${point.date}-${index}`} cx={sx(point.x)} cy={sy(point.y)} r="3" fill="var(--accent)" fillOpacity="0.7" />
        ))}
        {result.regression_line.length > 1 && (
          <line
            x1={sx(result.regression_line[0].x)}
            y1={sy(result.regression_line[0].y_hat)}
            x2={sx(result.regression_line[result.regression_line.length - 1].x)}
            y2={sy(result.regression_line[result.regression_line.length - 1].y_hat)}
            stroke="var(--positive)"
            strokeWidth="2"
          />
        )}
      </svg>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--error-border)] bg-[var(--error-surface)] px-3 py-2 text-[13px] font-normal text-[var(--error)]">
      <Warning size={16} weight="regular" />
      <span>{message}</span>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid min-h-[520px] place-items-center rounded-lg border border-dashed border-[var(--empty-border)]">
      <div className="flex flex-col items-center gap-4 text-center">
        <FileText size={48} weight="thin" className="text-[var(--text-secondary)]" />
        <div className="max-w-xs text-[13px] font-medium uppercase tracking-[0.02em] text-[var(--text-secondary)]">{message}</div>
      </div>
    </div>
  )
}

const StatusPulse = memo(function StatusPulse() {
  return <span className="status-pulse h-2 w-2 rounded-full bg-[var(--positive)]" aria-hidden />
})

const MachineAnalysisSkeleton = memo(function MachineAnalysisSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[118px] rounded-lg border border-[var(--border-subtle)] bg-[var(--surf)] p-4">
            <div className="skeleton-line h-3 w-20 rounded" />
            <div className="skeleton-line mt-6 h-7 w-28 rounded" />
            <div className="skeleton-line ml-auto mt-5 h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surf)] p-5">
        <div className="skeleton-line h-4 w-44 rounded" />
        <div className="skeleton-line mt-5 h-3 w-full rounded" />
        <div className="skeleton-line mt-3 h-3 w-11/12 rounded" />
        <div className="skeleton-line mt-3 h-3 w-2/3 rounded" />
      </div>
    </div>
  )
})

function DashboardStyles() {
  return (
    <style jsx global>{`
      body {
        background: var(--bg);
        background-image: none;
      }

      .select-menu::-webkit-scrollbar {
        width: 6px;
      }

      .select-menu::-webkit-scrollbar-thumb {
        background: var(--border-subtle);
        border-radius: 999px;
      }

      .quant-range {
        appearance: none;
        height: 16px;
        background: transparent;
        cursor: pointer;
      }

      .quant-range:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      .quant-range::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 999px;
        background: linear-gradient(to right, var(--accent-progress) 0 var(--range-progress), var(--surf-highest) var(--range-progress) 100%);
      }

      .quant-range::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        margin-top: -6px;
        border-radius: 999px;
        background: var(--accent);
        border: 2px solid var(--surf-low);
      }

      .quant-range::-moz-range-track {
        height: 4px;
        border-radius: 999px;
        background: var(--surf-highest);
      }

      .quant-range::-moz-range-progress {
        height: 4px;
        border-radius: 999px;
        background: var(--accent-progress);
      }

      .quant-range::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 999px;
        background: var(--accent);
        border: 2px solid var(--surf-low);
      }

      @media (hover: hover) and (pointer: fine) {
        .run-button:hover {
          transform: translateY(-1px);
        }
      }

      @media (prefers-reduced-motion: no-preference) {
        @keyframes statusPulse {
          0%, 100% { opacity: 0.45; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1); }
        }

        @keyframes spinner {
          to { transform: rotate(360deg); }
        }

        @keyframes shimmer {
          from { background-position: 100% 0; }
          to { background-position: -100% 0; }
        }

        .status-pulse {
          animation: statusPulse 1.6s var(--ease-in-out) infinite;
        }

        .button-spinner {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          border: 2px solid var(--spinner-border);
          border-top-color: var(--accent-on);
          animation: spinner 700ms linear infinite;
        }

        .skeleton-line {
          background: linear-gradient(90deg, var(--shimmer-a), var(--shimmer-b), var(--shimmer-a));
          background-size: 200% 100%;
          animation: shimmer 1.4s linear infinite;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
        }
      }
    `}</style>
  )
}



