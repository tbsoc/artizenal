import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { ShoppingBasket, FastForward, RotateCcw, CalendarClock, ChevronDown, CheckCircle2, AlertCircle, Info, Menu, X } from "lucide-react"
import { Avatar, BreadLogo, Button, Pts } from "./ui"
import { AboutModal, CartDrawer, Onboarding } from "./modals"
import { ME, dailyYield, getUser, myHoldingsUsd, pointsBalance, useStore } from "@/lib/store"
import { ASSET_IDS } from "@/lib/assets"
import type { Asset } from "@/lib/assets"
import { cn, num, usd } from "@/lib/utils"

const NAV = [
  { href: "#/", label: "Discover", match: (p: string) => p === "/" },
  { href: "#/projects", label: "Projects", match: (p: string) => p.startsWith("/projects") || p.startsWith("/p/") },
  { href: "#/funds", label: "Funds", match: (p: string) => p.startsWith("/funds") || p.startsWith("/f/") || p.startsWith("/propose") },
  { href: "#/wealth", label: "Wealth Fund", match: (p: string) => p.startsWith("/wealth") },
  { href: "#/allocate", label: "Points", match: (p: string) => p.startsWith("/allocate") || p.startsWith("/points") },
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
        className="flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-dashed border-coop-ink/40 bg-coop-ink/5 pl-3 pr-2.5 text-sm font-semibold text-coop-ink cursor-pointer hover:bg-coop-ink/10"
        title="Demo time controls"
      >
        <CalendarClock size={15} />
        <span className="hidden sm:inline">Day</span> {state.day}
        <span className="hidden font-normal text-coop-ink/70 2xl:inline">· S{state.season}</span>
        <ChevronDown size={14} className="hidden sm:block" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="pop-in fixed inset-x-3 top-[4.5rem] z-40 rounded-2xl sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 border border-border bg-card p-4 shadow-xl">
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

/** Picks the currency every combined total is shown in. */
function CurrencySelect({ className }: { className?: string }) {
  const { state, actions } = useStore()
  return (
    <select
      value={state.me.display ?? "USD"}
      onChange={(e) => actions.setDisplay(e.target.value as Asset)}
      className={cn("cursor-pointer bg-transparent text-xs font-semibold text-muted-foreground outline-none hover:text-foreground", className)}
      aria-label="Show totals in"
      title="Show totals in"
    >
      {ASSET_IDS.map((a) => (
        <option key={a} value={a}>
          {a}
        </option>
      ))}
    </select>
  )
}

export function Layout({ path, children }: { path: string; children: ReactNode }) {
  const { state, toasts } = useStore()
  const [cartOpen, setCartOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const me = getUser(state, ME)
  useEffect(() => {
    const close = () => setMenuOpen(false)
    window.addEventListener("hashchange", close)
    return () => window.removeEventListener("hashchange", close)
  }, [])
  const iconBtn = "relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card hover:bg-muted cursor-pointer"
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 md:px-8 xl:gap-5 2xl:gap-8">
          <a href="#/" className="flex items-center gap-2">
            <BreadLogo size={28} />
            <span className="font-display text-xl font-semibold tracking-tight md:text-[22px]">Pastry</span>
          </a>
          <nav className="hidden items-center gap-1 xl:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-full px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition 2xl:px-3",
                  n.match(path) ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setAboutOpen(true)}
              className="hidden h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer xl:flex"
              title="What is this showcase?"
            >
              <Info size={16} /> <span className="hidden 2xl:inline">About</span>
            </button>
            <SimClock />
            <div className="hidden h-10 items-center rounded-full border border-border bg-card text-sm font-semibold md:flex">
              <CurrencySelect className="h-full rounded-l-full pl-3 pr-1" />
              <a href="#/wallet" className="flex h-full items-center rounded-r-full pr-3.5 pl-1 hover:bg-muted" title="Your pas tokens">
                {usd(myHoldingsUsd(state))}
              </a>
            </div>
            <a href="#/points" className="hidden h-10 items-center rounded-full border border-border bg-card px-3.5 text-sm font-semibold hover:bg-muted md:flex" title="Points you can give">
              <Pts value={pointsBalance(state, ME)} />
            </a>
            <button onClick={() => setCartOpen(true)} className={iconBtn} aria-label="Basket">
              <ShoppingBasket size={17} />
              {state.cart.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {state.cart.length}
                </span>
              )}
            </button>
            <a href="#/wallet" aria-label="Your account" className="hidden sm:block">
              <Avatar user={me} size={36} />
            </a>
            <button onClick={() => setMenuOpen((o) => !o)} className={cn(iconBtn, "xl:hidden")} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <>
            <div className="fixed inset-0 top-16 z-30 bg-foreground/20 xl:hidden" onClick={() => setMenuOpen(false)} />
            <div className="pop-in absolute inset-x-0 top-16 z-40 border-b border-border bg-background shadow-lg xl:hidden">
              <nav className="mx-auto flex max-w-[1280px] flex-col px-4 py-3 md:px-8">
                {NAV.map((n) => (
                  <a
                    key={n.href}
                    href={n.href}
                    className={cn(
                      "rounded-xl px-3 py-3 text-base font-medium transition",
                      n.match(path) ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                    )}
                  >
                    {n.label}
                  </a>
                ))}
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setAboutOpen(true)
                  }}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-base font-medium hover:bg-muted cursor-pointer"
                >
                  <Info size={17} /> About this showcase
                </button>
                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3 md:hidden">
                  <a href="#/wallet" className="flex items-center justify-between rounded-xl bg-card px-3 py-3 text-sm font-semibold border border-border">
                    <span className="text-muted-foreground">Wallet</span>
                    {usd(myHoldingsUsd(state))}
                  </a>
                  <div className="col-span-2 flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Show totals in</span>
                    <CurrencySelect className="h-8 rounded-lg px-2 font-semibold" />
                  </div>
                  <a href="#/allocate" className="flex items-center justify-between rounded-xl bg-card px-3 py-3 text-sm font-semibold border border-border">
                    <span className="text-muted-foreground">Points</span>
                    <Pts value={pointsBalance(state, ME)} />
                  </a>
                </div>
              </nav>
            </div>
          </>
        )}
      </header>

      <main className="mx-auto max-w-[1280px] px-4 pt-6 pb-24 md:px-8 md:pt-8">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-8 text-xs text-muted-foreground md:px-8">
          <div className="flex items-center gap-2">
            <BreadLogo size={16} /> A Bread Cooperative showcase. Everything is simulated.
          </div>
          
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <Onboarding />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pop-in flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium shadow-lg",
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
