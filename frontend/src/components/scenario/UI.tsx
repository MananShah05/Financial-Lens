"use client"
import { ReactNode } from "react"
import * as Icons from "./Icons"

// ── Panel shell ───────────────────────────────────────────────────────────────
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface-container border border-outline-variant p-5 rounded-xl flex flex-col ${className}`}>
      {children}
    </div>
  )
}

// ── Two-column form + result layout ──────────────────────────────────────────
export function PanelGrid({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 items-stretch">
      <div className="bg-surface-container border border-outline-variant p-5 rounded-xl">
        {left}
      </div>
      <div className="bg-surface-container border border-outline-variant p-5 rounded-xl">
        {right}
      </div>
    </div>
  )
}

// ── Form input ────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}
export function Input({ label, hint, className = "", ...props }: InputProps) {
  return (
    <div className="space-y-2">
      <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase">
        {label}
      </label>
      <input
        {...props}
        className={`w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 
          font-data-sm text-data-sm text-on-surface placeholder:text-outline/40
          focus:outline-none focus:border-primary focus:ring-0
          transition-colors ${className}`}
      />
      {hint && <p className="text-on-surface-variant/60 font-body-sm text-[11px] italic">{hint}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { label: string; value: string }[]
}
export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <div className="space-y-2">
      <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase">
        {label}
      </label>
      <div className="relative">
        <select
          {...props}
          className={`w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
            font-body-sm text-body-sm text-on-surface appearance-none
            focus:outline-none focus:border-primary focus:ring-0
            transition-colors ${className}`}
        >
          {options.map(o => (
            <option key={o.value} value={o.value} className="bg-surface-container-lowest">
              {o.label}
            </option>
          ))}
        </select>
        <Icons.ExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none w-4 h-4" />
      </div>
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  children: ReactNode
}
export function Button({ loading, children, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`w-full bg-primary text-on-primary py-3 rounded-lg
        font-label-caps text-label-caps font-bold hover:opacity-90
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-opacity flex items-center justify-center gap-2 ${className}`}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Icons.Bolt className="w-4 h-4" />
      )}
      {children}
    </button>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  sub,
  color = "text-on-surface",
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  // Determine left border color based on the text color or value!
  let borderLeftColor = "border-l-primary"
  const lColor = color.toLowerCase()
  const lVal = value.toLowerCase()
  
  if (lColor.includes("red") || lColor.includes("error") || lVal.startsWith("-")) {
    borderLeftColor = "border-l-error"
  } else if (lColor.includes("green") || lColor.includes("secondary") || lVal.includes("↑") || lVal.startsWith("+")) {
    borderLeftColor = "border-l-secondary"
  } else if (lColor.includes("yellow") || lColor.includes("tertiary") || lColor.includes("warn")) {
    borderLeftColor = "border-l-tertiary"
  } else if (lColor.includes("slate") || lColor.includes("gray") || lColor.includes("outline")) {
    borderLeftColor = "border-l-outline"
  }

  return (
    <div className={`bg-surface-container border border-outline-variant border-l-4 ${borderLeftColor} p-4 flex flex-col justify-between rounded-lg`}>
      <p className="font-label-caps text-label-caps text-on-surface-variant mb-2 uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-1 mt-auto">
        <span className={`font-data-lg text-[22px] font-bold ${color}`}>{value}</span>
      </div>
      {sub && <p className="font-label-caps text-[10px] text-on-surface-variant opacity-60 mt-1 uppercase tracking-wider">{sub}</p>}
    </div>
  )
}

// ── Error banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3">
      <p className="font-label-caps text-data-sm text-error">{message}</p>
    </div>
  )
}

// ── Empty/placeholder ─────────────────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-center border border-dashed border-outline-variant bg-surface-container-low/30 rounded-xl">
      <div>
        <div className="w-8 h-8 border border-dashed border-outline rounded-full mx-auto mb-3 flex items-center justify-center">
          <Icons.Analytics className="w-4 h-4 text-on-surface-variant/40" />
        </div>
        <p className="font-label-caps text-label-caps text-on-surface-variant/50 uppercase tracking-widest">{message}</p>
      </div>
    </div>
  )
}

// ── Interpretation card ───────────────────────────────────────────────────────
export function InterpCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="border-l-2 border-primary/40 pl-3 py-1">
      <p className="font-label-caps text-label-caps text-on-surface-variant mb-1 uppercase tracking-widest">{label}</p>
      <p className="font-body-sm text-body-sm text-on-surface-variant/90 leading-relaxed">{text}</p>
    </div>
  )
}

