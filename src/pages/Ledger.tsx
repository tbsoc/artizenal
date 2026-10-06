import { useMemo, useState } from "react"
import { Download, Search } from "lucide-react"
import { Badge, Bread, Button, Card, Input, Pts, SectionTitle, Stat } from "@/components/ui"
import { ME, getFund, getProject, getUser, useStore } from "@/lib/store"
import type { State } from "@/lib/types"
import { cn, num } from "@/lib/utils"

type Kind = "donation" | "fund-gift" | "yield" | "match" | "deposit" | "points"

interface Entry {
  id: string
  day: number
  kind: Kind
  from: string
  to: string
  toHref?: string
  amount: number
  unit: "BREAD" | "USDC" | "points"
  note: string
}

const KINDS: { id: Kind | "all"; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "donation", label: "Donations" },
  { id: "fund-gift", label: "Fund gifts" },
  { id: "yield", label: "Yield splits" },
  { id: "match", label: "Match payouts" },
  { id: "deposit", label: "Spam deposits" },
  { id: "points", label: "Points given" },
]

const KIND_LABEL: Record<Kind, string> = {
  donation: "Donation",
  "fund-gift": "Fund gift",
  yield: "Yield split",
  match: "Match payout",
  deposit: "Spam deposit",
  points: "Points given",
}

function who(s: State, id: string) {
  return id === ME ? "You" : getUser(s, id)?.name ?? id
}

/** Every money movement (and every point given) in the simulated world, as one list. */
function buildLedger(s: State): Entry[] {
  const out: Entry[] = []
  const campaignName = (id?: string) => (id ? s.campaigns.find((c) => c.id === id)?.name : undefined)
  for (const d of s.donations) {
    const p = getProject(s, d.projectId)
    const round = campaignName(d.campaignId)
    out.push({
      id: d.id,
      day: d.day,
      kind: "donation",
      from: who(s, d.from),
      to: p?.title ?? d.projectId,
      toHref: `#/p/${d.projectId}`,
      amount: d.amount,
      unit: d.currency,
      note: round ? `Counts toward ${round}` : d.currency === "USDC" ? "Not matched (USDC)" : "Outside a round",
    })
  }
  for (const d of s.fundDonations) {
    const f = getFund(s, d.fundId)
    const round = campaignName(d.campaignId)
    out.push({
      id: d.id,
      day: d.day,
      kind: "fund-gift",
      from: who(s, d.from),
      to: f?.name ?? d.fundId,
      toHref: `#/f/${d.fundId}`,
      amount: d.amount,
      unit: "BREAD",
      note: round ? `Matching pool of ${round}` : f?.status === "proposed" ? "Launch pledge" : "Fund reserve",
    })
  }
  for (const dist of s.distributions) {
    const totalPts = Object.values(dist.points ?? {}).reduce((a, b) => a + b, 0)
    for (const [fid, amount] of Object.entries(dist.shares)) {
      const pts = dist.points?.[fid] ?? 0
      out.push({
        id: `y${dist.season}-${fid}`,
        day: dist.day,
        kind: "yield",
        from: "Reserve interest",
        to: getFund(s, fid)?.name ?? fid,
        toHref: `#/f/${fid}`,
        amount,
        unit: "BREAD",
        note: totalPts ? `Season ${dist.season}: ${num(pts)} ÷ ${num(totalPts)} points = ${((pts / totalPts) * 100).toFixed(1)}%` : `Season ${dist.season}`,
      })
    }
  }
  for (const c of s.campaigns) {
    if (!c.settled) continue
    const f = getFund(s, c.fundId)
    for (const [pid, amount] of Object.entries(c.settled)) {
      if (amount < 0.005) continue
      out.push({
        id: `m${c.id}-${pid}`,
        day: c.endDay + 1,
        kind: "match",
        from: `${f?.name ?? c.fundId} · ${c.name}`,
        to: getProject(s, pid)?.title ?? pid,
        toHref: `#/p/${pid}`,
        amount,
        unit: "BREAD",
        note: "Matching paid when the round closed",
      })
    }
  }
  for (const p of s.projects) {
    out.push({
      id: `dep-${p.id}`,
      day: p.createdDay,
      kind: "deposit",
      from: who(s, p.creatorId),
      to: `${p.title} (held)`,
      toHref: `#/p/${p.id}`,
      amount: p.deposit.amount,
      unit: "BREAD",
      note: p.deposit.status === "held" ? "Held until 3 backers or 14 days" : p.deposit.status === "refunded" ? "Returned to creator" : "Forfeited to matching",
    })
  }
  for (const g of s.pointGifts) {
    out.push({
      id: g.id,
      day: g.day,
      kind: "points",
      from: who(s, g.userId),
      to: getFund(s, g.fundId)?.name ?? g.fundId,
      toHref: `#/f/${g.fundId}`,
      amount: g.amount,
      unit: "points",
      note: `Season ${g.season} yield split`,
    })
  }
  return out.sort((a, b) => b.day - a.day || a.kind.localeCompare(b.kind))
}

function toCsv(rows: Entry[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const head = ["day", "type", "from", "to", "amount", "unit", "note", "ref"]
  return [head.join(","), ...rows.map((r) => [r.day, KIND_LABEL[r.kind], r.from, r.to, r.amount.toFixed(2), r.unit, r.note, r.id].map(esc).join(","))].join("\n")
}

export function Ledger() {
  const { state } = useStore()
  const [kind, setKind] = useState<Kind | "all">("all")
  const [q, setQ] = useState("")
  const [limit, setLimit] = useState(80)
  const all = useMemo(() => buildLedger(state), [state])
  const rows = all.filter((r) => (kind === "all" || r.kind === kind) && (!q || `${r.from} ${r.to} ${r.note}`.toLowerCase().includes(q.toLowerCase())))

  const sum = (k: Kind, unit?: string) => all.filter((r) => r.kind === k && (!unit || r.unit === unit)).reduce((a, r) => a + r.amount, 0)

  const download = () => {
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `artizenal-ledger-day-${state.day}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Public ledger"
        sub="Every money movement, open to anyone."
        action={
          <Button variant="outline" onClick={download}>
            <Download size={15} /> Download CSV
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-5">
          <Stat label="Donated to projects" value={<Bread value={sum("donation", "BREAD")} />} sub={`+ ${num(sum("donation", "USDC"))} USDC`} />
        </Card>
        <Card className="p-5">
          <Stat label="Given to funds" value={<Bread value={sum("fund-gift")} />} />
        </Card>
        <Card className="p-5">
          <Stat label="Yield shared to funds" value={<Bread value={sum("yield")} />} />
        </Card>
        <Card className="p-5">
          <Stat label="Matching paid out" value={<Bread value={sum("match")} />} sub={`across ${state.campaigns.filter((c) => c.settled).length} closed rounds`} />
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative w-72">
            <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names, projects, funds" className="pl-10" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k.id}
                onClick={() => setKind(k.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                  kind === k.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
          <div className="ml-auto text-xs text-muted-foreground">{num(rows.length)} entries</div>
        </div>

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="w-16 px-4 py-2.5 font-medium">Day</th>
                <th className="w-32 px-3 py-2.5 font-medium">Type</th>
                <th className="px-3 py-2.5 font-medium">From</th>
                <th className="px-3 py-2.5 font-medium">To</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r) => (
                <tr key={r.id} className={cn("border-t border-border", r.from === "You" && "bg-primary/4")}>
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{r.day}</td>
                  <td className="px-3 py-2.5">
                    <Badge tone={r.kind === "yield" || r.kind === "match" ? "community" : r.kind === "points" ? "ink" : "muted"}>{KIND_LABEL[r.kind]}</Badge>
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2.5">{r.from}</td>
                  <td className="max-w-[220px] truncate px-3 py-2.5">
                    {r.toHref ? (
                      <a href={r.toHref} className="font-medium hover:underline">
                        {r.to}
                      </a>
                    ) : (
                      r.to
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">
                    {r.unit === "BREAD" ? <Bread value={r.amount} digits={r.amount < 10 ? 2 : 0} /> : r.unit === "points" ? <Pts value={r.amount} /> : `${num(r.amount)} USDC`}
                  </td>
                  <td className="max-w-[300px] truncate px-4 py-2.5 text-xs text-muted-foreground">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > limit && (
            <div className="border-t border-border p-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + 200)}>
                Show more ({num(rows.length - limit)} left)
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
