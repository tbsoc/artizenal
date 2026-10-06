import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { ShoppingBasket, FastForward, RotateCcw, CalendarClock, ChevronDown, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { Avatar, Bread, BreadLogo, Button, Pts } from "./ui"
import { AboutModal, CartDrawer, Onboarding } from "./modals"
import { ME, dailyYield, getUser, pointsBalance, useStore } from "@/lib/store"
import { cn, num } from "@/lib/utils"

const NAV = [
  { href: "#/", label: "Discover", match: (p: string) => p === "/" },
  { href: "#/projects", label: "Projects", match: (p: string) => p.startsWith("/projects") || p.startsWith("/p/") },
  { href: "#/funds", label: "Funds", match: (p: string) => p.startsWith("/funds") || p.startsWith("/f/") || p.startsWith("/propose") },
  { href: "#/allocate", label: "Points", match: (p: string) => p.startsWith("/allocate") || p.startsWith("/points") },
  { href: "#/ledger", label: "Ledger", match: (p: string) => p.startsWith("/ledger") },
  { href: "#/how", label: "How it works", match: (p: string) => p.startsWith("/how") },
]

function SimClock() {
  const { state, actions, toast } = useStore()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener("hashchange", close)
    return () => window.removeEventListener("hashchange", close)
  }, [])
  const left = state.seasonLength - (state.day - state.seasonStartDay)
  const step = (d: number) => {
    actions.advance(d)
    toast(`Fast-forwarded ${d} day${d > 1 ? "s" : ""}. Yield and donations kept flowing.`)
    if (d >= left) toast(`Season ${state.season} closed and its yield was shared across funds.`)
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 rounded-full border border-dashed border-coop-ink/40 bg-coop-ink/5 pl-3 pr-2.5 text-sm font-semibold text-coop-ink cursor-pointer hover:bg-coop-ink/10"
        title="Demo time controls"
      >
        <CalendarClock size={15} />
        Day {state.day}
        <span className="font-normal text-coop-ink/70">· S{state.season}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="pop-in absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-border bg-card p-4 shadow-xl">
            <div className="text-xs font-semibold tracking-wide text-coop-ink uppercase">Demo time machine</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Skip ahead to see yield build up and rounds pay out.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-muted p-3 text-center text-xs">
              <div>
                <div className="text-muted-foreground">Season</div>
                <div className="font-semibold">{state.season}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Ends in</div>
                <div className="font-semibold">{left}d</div>
              </div>
              <div>
                <div className="text-muted-foreground">Yield/day</div>
                <div className="font-semibold">{num(dailyYield(state))}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[1, 7, 30].map((d) => (
                <Button key={d} size="sm" variant="outline" onClick={() => step(d)}>
                  <FastForward size={13} /> {d}d
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              variant="dark"
              className="mt-2 w-full"
              onClick={() => {
                actions.endSeason()
                toast(`Season ${state.season} closed. Yield shared across funds by points.`)
                setOpen(false)
                window.location.hash = "/allocate"
              }}
            >
              End season now and share the yield
            </Button>
            <button
              onClick={() => {
                if (confirm("Reset the demo world? Your projects, donations and points will be cleared.")) {
                  actions.reset()
                  setOpen(false)
                }
              }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <RotateCcw size={12} /> Reset demo
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function Layout({ path, children }: { path: string; children: ReactNode }) {
  const { state, toasts } = useStore()
  const [cartOpen, setCartOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const me = getUser(state, ME)
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-8 px-8">
          <a href="#/" className="flex items-center gap-2">
            <BreadLogo size={28} />
            <span className="font-display text-[22px] font-semibold tracking-tight">Artizenal</span>
          </a>
          <nav className="flex items-center gap-1">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  n.match(path) ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setAboutOpen(true)}
              className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              title="What is this showcase?"
            >
              <Info size={16} /> About
            </button>
            <SimClock />
            <a href="#/wallet" className="flex h-10 items-center gap-3 rounded-full border border-border bg-card px-3.5 text-sm font-semibold hover:bg-muted" title="Wallet">
              <Bread value={state.me.bread} digits={state.me.bread % 1 ? 2 : 0} />
            </a>
            <a href="#/points" className="flex h-10 items-center rounded-full border border-border bg-card px-3.5 text-sm font-semibold hover:bg-muted" title="Points you can give">
              <Pts value={pointsBalance(state, ME)} />
            </a>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card hover:bg-muted cursor-pointer"
              aria-label="Basket"
            >
              <ShoppingBasket size={17} />
              {state.cart.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {state.cart.length}
                </span>
              )}
            </button>
            <a href="#/wallet" aria-label="Your account">
              <Avatar user={me} size={36} />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-8 pt-8 pb-24">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 py-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <BreadLogo size={16} /> A Bread Cooperative showcase. Everything is simulated.
          </div>
          
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <Onboarding />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pop-in flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg",
              t.tone === "ok" ? "bg-foreground text-background" : "bg-destructive text-destructive-foreground"
            )}
          >
            {t.tone === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}
