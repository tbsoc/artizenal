import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { X, Sparkles, History } from "lucide-react"
import { cn, initials, num } from "@/lib/utils"
import type { Mechanism, User } from "@/lib/types"
import { MECHANISM_INFO } from "@/lib/matching"
import type { CampaignStatus } from "@/lib/store"

type DivProps = React.HTMLAttributes<HTMLDivElement>
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement>

const BTN_VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:brightness-95 shadow-sm",
  dark: "bg-foreground text-background hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-wheat/40",
  outline: "border border-border bg-card hover:bg-muted",
  ghost: "bg-transparent hover:bg-muted",
  community: "bg-community text-community-foreground hover:brightness-95 shadow-sm",
}
const BTN_SIZES = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
  icon: "h-9 w-9",
}
type BtnStyle = { variant?: keyof typeof BTN_VARIANTS; size?: keyof typeof BTN_SIZES }

function btnClass({ variant = "primary", size = "md" }: BtnStyle, className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] cursor-pointer whitespace-nowrap",
    BTN_VARIANTS[variant],
    BTN_SIZES[size],
    className
  )
}

export function Button({ className, variant, size, ...props }: BtnProps & BtnStyle) {
  return <button className={btnClass({ variant, size }, className)} {...props} />
}

export function LinkButton({
  className,
  variant,
  size,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & BtnStyle) {
  return <a className={btnClass({ variant, size }, className)} {...props} />
}

export function Badge({
  className,
  tone = "muted",
  ...props
}: DivProps & { tone?: "muted" | "primary" | "community" | "success" | "outline" | "ink" | "dark" }) {
  const tones: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary/12 text-primary",
    community: "bg-community/12 text-community",
    success: "bg-success/12 text-success",
    outline: "border border-border text-muted-foreground bg-card",
    ink: "bg-coop-ink/10 text-coop-ink",
    dark: "bg-foreground/85 text-background backdrop-blur",
  }
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-sans text-[11px] font-semibold leading-5 tracking-normal whitespace-nowrap",
        tones[tone],
        className
      )}
      {...props}
    />
  )
}

export function Card({ className, ...props }: DivProps) {
  return <div className={cn("rounded-2xl border border-border bg-card text-card-foreground", className)} {...props} />
}

export function Progress({
  value,
  extra = 0,
  className,
  barClass = "bg-primary",
}: {
  value: number
  extra?: number
  className?: string
  barClass?: string
}) {
  const v = Math.max(0, Math.min(100, value))
  const e = Math.max(0, Math.min(100 - v, extra))
  return (
    <div className={cn("flex h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full transition-all", barClass)} style={{ width: `${v}%` }} />
      {e > 0 && <div className="h-full bg-community/70 transition-all" style={{ width: `${e}%` }} />}
    </div>
  )
}

export function Avatar({ user, size = 32, className }: { user?: User; size?: number; className?: string }) {
  const name = user?.name ?? "Artizenal"
  const hue = user?.hue ?? 26
  return (
    <div
      title={name}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-card", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 62% 52%), hsl(${(hue + 40) % 360} 58% 38%))`,
      }}
    >
      {initials(name)}
    </div>
  )
}

export function AvatarStack({ users, max = 5 }: { users: (User | undefined)[]; max?: number }) {
  const shown = users.slice(0, max)
  return (
    <div className="flex -space-x-2">
      {shown.map((u, i) => (
        <Avatar key={u?.id ?? i} user={u} size={26} />
      ))}
      {users.length > max && (
        <div className="inline-flex h-[26px] items-center rounded-full bg-muted px-2 text-[11px] font-semibold text-muted-foreground ring-2 ring-card">
          +{users.length - max}
        </div>
      )}
    </div>
  )
}

const fieldBase =
  "w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15 placeholder:text-muted-foreground/70"

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-11", className)} {...props} />
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-28 py-3 leading-relaxed", className)} {...props} />
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, "h-11 cursor-pointer", className)} {...props} />
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <div className="text-sm font-semibold">{label}</div>
      {children}
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </label>
  )
}

export function Modal({
  open,
  onClose,
  children,
  width = 520,
  title,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  width?: number
  title?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const on = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", on)
    return () => window.removeEventListener("keydown", on)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-3 sm:p-6 backdrop-blur-[2px] animate-in" onMouseDown={onClose}>
      <div
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl pop-in"
        style={{ maxWidth: width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-card/95 px-5 pt-5 pb-3 backdrop-blur sm:px-6">
          <div className="font-display text-xl font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pb-6 sm:px-6">{children}</div>
      </div>
    </div>
  )
}

export function Stat({ label, value, sub, className }: { label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn("inline-flex rounded-full bg-muted p-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition cursor-pointer",
            value === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** A little loaf, used wherever artUSD appears. */
export function Loaf({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cn("inline-block shrink-0", className)} aria-hidden>
      <path
        d="M4 11.5C4 7.9 7.6 5 12 5s8 2.9 8 6.5c0 1-.6 1.7-1.5 2V18a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-4.5c-.9-.3-1.5-1-1.5-2Z"
        fill="var(--wheat)"
        stroke="var(--crust)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 9.5l1.2 1.6M12.4 8.8l1.2 1.6M15.6 9.6l.9 1.2" stroke="var(--crust)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function Bread({
  value,
  digits = 0,
  className,
  unitClass,
  unit = "artUSD",
}: {
  value: number
  digits?: number
  className?: string
  unitClass?: string
  unit?: string
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-1 tabular-nums", className)}>
      {num(value, digits)}
      <span className={cn("text-[0.62em] font-bold tracking-wide text-crust", unitClass)}>{unit}</span>
    </span>
  )
}

export function Pts({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", className)}>
      <Sparkles size={13} className="text-coop-ink" />
      {num(value)}
    </span>
  )
}

export function ArtizenBadge({ season, className }: { season?: string; className?: string }) {
  return (
    <Badge tone="dark" className={cn("gap-1.5", className)} title={season ? `Previously funded on ${season}` : "Previously on Artizen"}>
      <History size={11} />
      Artizen alumni
    </Badge>
  )
}

export function MechanismBadge({ m, className }: { m: Mechanism; className?: string }) {
  const label = m.type === "qf" ? "Quadratic" : m.type === "match" ? `1:1 up to ${m.cap}` : `${m.x}× match`
  return (
    <Badge tone="ink" className={className} title={MECHANISM_INFO[m.type].explain}>
      {label}
    </Badge>
  )
}

export function StatusPill({ status }: { status: CampaignStatus }) {
  if (status === "live")
    return (
      <Badge tone="success" className="gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" />
        Live
      </Badge>
    )
  if (status === "upcoming") return <Badge tone="primary">Upcoming</Badge>
  return <Badge>Ended</Badge>
}

export function SectionTitle({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl leading-tight md:text-[28px] font-semibold tracking-tight">{title}</h2>
        {sub && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{children}</div>
}

const BREAD_MARK =
  "M20 0C31.0457 0 39.9999 8.95421 40 20C40 31.0459 31.0457 40 20 40C8.9543 39.9999 0 31.0458 0 20C8.24632e-05 8.95424 8.95435 5.25753e-05 20 0ZM24.6816 6.58496C20.9513 2.773 14.4934 4.62406 14.0166 10.1357C13.4214 16.4275 8.85619 13.0113 5.46484 16.5107C4.46239 17.6659 3.86527 19.2814 4.06543 20.8008C4.35857 22.914 5.99941 24.7165 8.09277 25.2275C10.4737 25.8629 12.9424 25.5824 13.748 28.5078C14.2079 30.4452 14.0501 32.2355 15.6523 33.7471C18.4496 36.38 23.5172 36.0617 25.332 32.502C25.9642 31.3881 26.0581 30.0724 26.292 28.8398C26.5292 27.5322 27.3122 26.4841 28.543 26.0381C30.2134 25.3804 32.2957 25.4971 33.833 24.417C35.4464 23.3267 36.3142 21.2439 36.0244 19.3301L36.0215 19.3096L36.0225 19.3105C35.7057 17.2422 33.9972 15.5159 32.0381 14.9053C30.8767 14.5176 29.5876 14.545 28.4531 14.0732C27.4295 13.6832 26.7349 12.8319 26.4238 11.791C25.9047 9.94326 26.134 8.10776 24.6816 6.58496ZM19.126 15.4727C23.0544 15.0457 25.7199 17.0824 25.0889 21.1914L25.084 21.2119V21.2109C24.7562 23.108 23.4449 24.3204 21.5674 24.5703C20.4297 24.7495 19.1356 24.7197 18.0146 24.4531C17.4026 24.303 16.8413 24.0578 16.3926 23.6992C14.8397 22.4017 14.5858 19.8311 15.3174 17.999C15.9439 16.4674 17.5071 15.633 19.126 15.4727Z"

/** The Bread Cooperative mark. */
export function BreadLogo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={cn("shrink-0", className)} role="img" aria-label="Bread Cooperative">
      <path d={BREAD_MARK} fill="#EA5817" />
    </svg>
  )
}

/** Minus / value / plus control, like the voting rows on fund.bread.coop. */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Infinity,
  className,
  label,
}: {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  className?: string
  label?: string
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v) || 0))
  const btn =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-lg font-semibold transition hover:bg-muted disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <button type="button" className={btn} onClick={() => onChange(clamp(value - step))} disabled={value <= min} aria-label={`Decrease ${label ?? ""}`}>
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="h-9 w-16 rounded-xl border border-input bg-card text-center text-sm font-semibold tabular-nums outline-none focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        aria-label={label}
      />
      <button type="button" className={btn} onClick={() => onChange(clamp(value + step))} disabled={value >= max} aria-label={`Increase ${label ?? ""}`}>
        +
      </button>
    </div>
  )
}

/** Switches between the two halves of the Points section. */
export function PointsTabs({ active }: { active: "give" | "earn" }) {
  const tab = (on: boolean) =>
    cn("rounded-full px-4 py-1.5 text-sm font-semibold transition", on ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
  return (
    <div className="mb-6 inline-flex rounded-full bg-muted p-1">
      <a href="#/allocate" className={tab(active === "give")}>
        Give points
      </a>
      <a href="#/points" className={tab(active === "earn")}>
        Earn & invite
      </a>
    </div>
  )
}

/** Yield accrues every second in reality; tick it up live between simulated days. */
export function LiveYield({ base, perDay, className }: { base: number; perDay: number; className?: string }) {
  const [value, setValue] = useState(base)
  useEffect(() => {
    const start = Date.now()
    setValue(base)
    const id = setInterval(() => setValue(base + ((Date.now() - start) / 1000) * (perDay / 86400)), 250)
    return () => clearInterval(id)
  }, [base, perDay])
  // Inter's tabular digits keep every character the same width, so nothing shifts as it ticks.
  return <Bread value={value} digits={2} className={cn("font-sans tracking-tight [font-variant-numeric:tabular-nums]", className)} />
}

