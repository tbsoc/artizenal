import { useState } from "react"
import { ArrowDown, CircleDollarSign, Sprout, Sparkles } from "lucide-react"
import { Bread, Button, Card, Input, Loaf, SectionTitle, Empty } from "@/components/ui"
import { ME, POINT_RULES, getFund, getProject, getUser, useStore } from "@/lib/store"
import { num } from "@/lib/utils"

function Usdc({ value, digits = 0, className }: { value: number; digits?: number; className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-1 tabular-nums ${className ?? ""}`}>
      {num(value, digits)}
      <span className="text-[0.62em] font-bold tracking-wide text-coop-ink">USDC</span>
    </span>
  )
}

export function Wallet() {
  const { state, actions, toast } = useStore()
  const [toBread, setToBread] = useState(true)
  const [amount, setAmount] = useState(100)
  const me = getUser(state, ME)
  const max = toBread ? state.me.usdc : state.me.bread
  const from = toBread ? "USDC" : "BREAD"
  const to = toBread ? "BREAD" : "USDC"

  const history = [
    ...state.donations.filter((d) => d.from === ME).map((d) => ({ day: d.day, label: getProject(state, d.projectId)?.title ?? "", href: `#/p/${d.projectId}`, amount: d.amount, currency: d.currency, kind: d.campaignId ? "Matched donation" : "Donation" })),
    ...state.fundDonations.filter((d) => d.from === ME).map((d) => ({ day: d.day, label: getFund(state, d.fundId)?.name ?? "", href: `#/f/${d.fundId}`, amount: d.amount, currency: "BREAD" as const, kind: "Fund gift" })),
    ...state.projects.filter((p) => p.creatorId === ME).map((p) => ({ day: p.createdDay, label: `${p.title} deposit (${p.deposit.status})`, href: `#/p/${p.id}`, amount: p.deposit.amount, currency: "BREAD" as const, kind: "Spam deposit" })),
  ].sort((a, b) => b.day - a.day)

  const submit = () => {
    const r = toBread ? actions.bake(amount) : actions.redeem(amount)
    if (!r.ok) return toast(r.error, "err")
    toast(toBread ? `Converted ${num(amount)} USDC into BREAD. It's earning for the commons now.` : `Converted ${num(amount)} BREAD back into USDC`)
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        title={`${me?.name.split(" ")[0] ?? "Your"}'s wallet`}
        sub="Convert USDC to BREAD 1:1. While you hold it, its interest pays for matching."
      />

      <div className="grid grid-cols-[1fr_1fr_420px] gap-5">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleDollarSign size={16} className="text-coop-ink" /> USDC
          </div>
          <Usdc value={state.me.usdc} digits={2} className="mt-3 font-display text-4xl font-semibold" />
          <div className="mt-1 text-xs text-muted-foreground">Ready to convert into BREAD</div>
        </Card>
        <Card className="relative overflow-hidden p-6">
          <div className="absolute -top-6 -right-6 opacity-15">
            <Loaf size={140} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loaf size={16} /> BREAD
          </div>
          <Bread value={state.me.bread} digits={2} className="mt-3 font-display text-4xl font-semibold" />
          <div className="mt-1 text-xs text-muted-foreground">Earning for the commons while you hold it</div>
        </Card>
        <Card className="row-span-2 p-6">
          <div className="font-display text-xl font-semibold">Convert</div>
          <div className="mt-4 rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>From</span>
              <button onClick={() => setAmount(Math.floor(max))} className="font-semibold hover:text-foreground cursor-pointer">
                Balance {num(max, 2)} · Max
              </button>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <Input type="number" value={amount || ""} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} className="h-12 flex-1 border-0 px-0 font-display text-3xl focus:ring-0" />
              <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">
                {toBread ? <CircleDollarSign size={15} className="text-coop-ink" /> : <Loaf size={15} />} {from}
              </span>
            </div>
          </div>
          <div className="relative z-10 -my-3 flex justify-center">
            <button
              onClick={() => setToBread((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted cursor-pointer"
              aria-label="Switch direction"
            >
              <ArrowDown size={16} />
            </button>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <div className="text-xs text-muted-foreground">To</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-display text-3xl tabular-nums">{num(amount)}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-semibold">
                {toBread ? <Loaf size={15} /> : <CircleDollarSign size={15} className="text-coop-ink" />} {to}
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-semibold">1 {from} = 1 {to}</span>
            </div>
          </div>
          <Button size="lg" className="mt-5 w-full" onClick={submit} disabled={amount <= 0 || amount > max}>
            Convert {num(amount)} {from} to {to}
          </Button>
        </Card>

        <Card className="col-span-2 grid grid-cols-2 gap-6 p-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sprout size={14} /> Yield you've generated for matching
            </div>
            <Bread value={state.me.yieldGenerated} digits={2} className="mt-1 text-2xl font-semibold text-community" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles size={14} /> Holding points
            </div>
            <div className="mt-1 text-2xl font-semibold text-coop-ink tabular-nums">+{num((state.me.bread / 10) * POINT_RULES.holdingPer10PerDay)}/day</div>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="mb-4 font-display text-2xl font-semibold">Your giving</h3>
        {history.length ? (
          <Card className="divide-y divide-border">
            {history.map((h, i) => (
              <a key={i} href={h.href} className="flex items-center gap-4 px-5 py-3 text-sm hover:bg-muted/40">
                <div className="w-20 text-xs text-muted-foreground">Day {h.day}</div>
                <div className="w-36 text-xs font-semibold text-muted-foreground">{h.kind}</div>
                <div className="flex-1 font-medium">{h.label}</div>
                <div className="font-semibold">{h.currency === "BREAD" ? <Bread value={h.amount} /> : <Usdc value={h.amount} />}</div>
              </a>
            ))}
          </Card>
        ) : (
          <Empty>Nothing yet. Back a project in a live round with some of your BREAD.</Empty>
        )}
      </div>
    </div>
  )
}
