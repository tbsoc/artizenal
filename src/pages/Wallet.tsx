import { useState } from "react"
import { ArrowDown, Landmark, Sparkles, Sprout } from "lucide-react"
import { Bread, Button, Card, Empty, Input, LinkButton, SectionTitle } from "@/components/ui"
import { ME, POINT_RULES, getFund, getProject, getUser, myHoldingsUsd, useStore } from "@/lib/store"
import { ASSETS, ASSET_IDS, fmtUnits, toUsd } from "@/lib/assets"
import type { Asset } from "@/lib/assets"
import { cn, num, usd } from "@/lib/utils"

export function Wallet() {
  const { state, actions, toast } = useStore()
  const [asset, setAsset] = useState<Asset>("USD")
  const [toArt, setToArt] = useState(true)
  const [amount, setAmount] = useState(100)
  const me = getUser(state, ME)
  const A = ASSETS[asset]
  const max = toArt ? state.me.base[asset] : state.me.art[asset]
  const from = toArt ? A.base : A.token
  const to = toArt ? A.token : A.base

  const pick = (a: Asset) => {
    setAsset(a)
    setAmount(a === "ETH" ? 0.05 : 100)
  }

  const history = [
    ...state.donations
      .filter((d) => d.from === ME)
      .map((d) => ({ day: d.day, label: getProject(state, d.projectId)?.title ?? "", href: `#/p/${d.projectId}`, value: `${fmtUnits(d.asset, d.units)} ${ASSETS[d.asset].token}`, kind: d.campaignId ? "Matched donation" : "Donation" })),
    ...state.fundDonations
      .filter((d) => d.from === ME)
      .map((d) => ({ day: d.day, label: getFund(state, d.fundId)?.name ?? "", href: `#/f/${d.fundId}`, value: `${num(d.amount)} artUSD`, kind: "Fund gift" })),
    ...state.endowments
      .filter((e) => e.userId === ME)
      .map((e) => ({ day: e.day, label: "Artizenal Wealth Fund", href: "#/wealth", value: `${fmtUnits(e.asset, e.units)} ${ASSETS[e.asset].base}`, kind: "Endowment" })),
    ...state.projects
      .filter((p) => p.creatorId === ME)
      .map((p) => ({ day: p.createdDay, label: `${p.title} deposit (${p.deposit.status})`, href: `#/p/${p.id}`, value: `${p.deposit.amount} artUSD`, kind: "Spam deposit" })),
  ].sort((a, b) => b.day - a.day)

  const submit = () => {
    const r = toArt ? actions.bake(asset, amount) : actions.redeem(asset, amount)
    if (!r.ok) return toast(r.error, "err")
    toast(`Converted ${fmtUnits(asset, amount)} ${from} to ${to}`)
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        title={`${me?.name.split(" ")[0] ?? "Your"}'s wallet`}
        sub="Convert USDC, EURC or ETH into art tokens 1:1. While you hold them, their yield funds matching."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ASSET_IDS.map((a) => {
              const X = ASSETS[a]
              return (
                <button
                  key={a}
                  onClick={() => pick(a)}
                  className={cn("rounded-2xl border-2 bg-card p-5 text-left transition cursor-pointer", asset === a ? "border-primary" : "border-border hover:border-muted-foreground/30")}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{X.token}</span>
                    <span className="text-xs text-community">{(X.apy * 100).toFixed(1)}% APY</span>
                  </div>
                  <Bread value={state.me.art[a]} digits={X.digits} unit={X.token} className="mt-2 font-display text-3xl font-semibold" />
                  <div className="mt-1 text-xs text-muted-foreground">≈ {usd(toUsd(a, state.me.art[a]))}</div>
                  <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                    {fmtUnits(a, state.me.base[a])} {X.base} available
                  </div>
                </button>
              )
            })}
          </div>

          <Card className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sprout size={14} /> Yield you've generated for matching
              </div>
              <div className="mt-1 text-2xl font-semibold text-community tabular-nums">{usd(state.me.yieldGenerated, true)}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles size={14} /> Holding points
              </div>
              <div className="mt-1 text-2xl font-semibold text-coop-ink tabular-nums">+{num((myHoldingsUsd(state) / 10) * POINT_RULES.holdingPer10PerDay)}/day</div>
            </div>
          </Card>

          <Card className="flex flex-col items-start gap-4 bg-foreground p-6 text-background sm:flex-row sm:items-center">
            <Landmark size={28} className="shrink-0 text-wheat" />
            <div className="flex-1">
              <div className="font-semibold">Endow the Wealth Fund</div>
              <div className="text-sm text-background/70">
                Give principal permanently. It earns yield for matching forever, and you get {POINT_RULES.perEndowedUsd} points per $1.
              </div>
            </div>
            <LinkButton href="#/wealth" variant="secondary">
              Endow
            </LinkButton>
          </Card>
        </div>

        <Card className="h-fit p-6">
          <div className="font-display text-xl font-semibold">Convert</div>
          <div className="mt-4 rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>From</span>
              <button onClick={() => setAmount(max)} className="font-semibold hover:text-foreground cursor-pointer">
                Balance {fmtUnits(asset, max)} · Max
              </button>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <Input type="number" step="any" value={amount || ""} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} className="h-12 flex-1 border-0 px-0 font-display text-3xl focus:ring-0" />
              <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">{from}</span>
            </div>
          </div>
          <div className="relative z-10 -my-3 flex justify-center">
            <button
              onClick={() => setToArt((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted cursor-pointer"
              aria-label="Switch direction"
            >
              <ArrowDown size={16} />
            </button>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <div className="text-xs text-muted-foreground">To</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-display text-3xl tabular-nums">{fmtUnits(asset, amount)}</span>
              <span className="rounded-full bg-card px-3 py-1.5 text-sm font-semibold">{to}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-muted-foreground">Rate</span>
            <span className="font-semibold">
              1 {from} = 1 {to}
            </span>
          </div>
          <Button size="lg" className="mt-5 w-full" onClick={submit} disabled={amount <= 0 || amount > max + 1e-9}>
            Convert to {to}
          </Button>
        </Card>
      </div>

      <div>
        <h3 className="mb-4 font-display text-2xl font-semibold">Your giving</h3>
        {history.length ? (
          <Card className="divide-y divide-border">
            {history.map((h, i) => (
              <a key={i} href={h.href} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm hover:bg-muted/40">
                <div className="w-16 text-xs text-muted-foreground">Day {h.day}</div>
                <div className="w-32 text-xs font-semibold text-muted-foreground">{h.kind}</div>
                <div className="min-w-0 flex-1 font-medium">{h.label}</div>
                <div className="font-semibold tabular-nums">{h.value}</div>
              </a>
            ))}
          </Card>
        ) : (
          <Empty>Nothing yet. Back a project in a live round.</Empty>
        )}
      </div>
    </div>
  )
}
