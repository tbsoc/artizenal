import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Badge, Bread, Button, Card, Pts, SectionTitle, Stat, Stepper, MechanismBadge, PointsTabs } from "@/components/ui"
import { Cover } from "@/components/Cover"
import { ME, dailyYield, fundTotalPoints, getFund, pointsBalance, seasonRatios, useStore } from "@/lib/store"
import { cn, num } from "@/lib/utils"

const BAR_COLORS = ["#d9762b", "#2f8f6b", "#3d5a99", "#b5466b", "#8a6d2b", "#6b4ea0", "#2a8d9d", "#a05a2c"]

/** Split `total` points across funds in proportion to `weights`, in whole points. */
function splitByRatio(total: number, weights: Record<string, number>) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0)
  const sum = entries.reduce((a, [, w]) => a + w, 0)
  const out: Record<string, number> = {}
  if (!sum || total <= 0) return out
  let used = 0
  for (const [fid, w] of entries) {
    out[fid] = Math.floor((total * w) / sum)
    used += out[fid]
  }
  const top = entries.sort((a, b) => b[1] - a[1])[0][0]
  out[top] += total - used
  return out
}

export function Allocate() {
  const { state, actions, toast } = useStore()
  const balance = pointsBalance(state, ME)
  const [weights, setWeights] = useState<Record<string, number>>({})
  const [budget, setBudget] = useState(Math.floor(balance / 10) * 10)
  const toGive = Math.min(budget, balance)
  const draft = splitByRatio(toGive, weights)
  const drafted = Object.values(draft).reduce((a, b) => a + b, 0)
  const weightTotal = Object.values(weights).reduce((a, b) => a + b, 0)

  const active = state.funds.filter((f) => f.status === "active")
  const proposed = state.funds.filter((f) => f.status === "proposed")
  const now = seasonRatios(state)
  const after = seasonRatios(state, draft)
  const daysLeft = state.seasonLength - (state.day - state.seasonStartDay)
  const seasonEstimate = state.yieldPool + dailyYield(state) * daysLeft
  const myGifts = state.pointGifts.filter((g) => g.userId === ME && g.season === state.season).reverse()

  const colorOf = (fid: string) => BAR_COLORS[state.funds.findIndex((f) => f.id === fid) % BAR_COLORS.length]

  const give = () => {
    const r = actions.givePoints(draft)
    if (!r.ok) return toast(r.error, "err")
    toast(`Gave ${num(drafted)} points. The split for season ${state.season} has been updated.`)
    setWeights({})
    setBudget(Math.floor((balance - drafted) / 10) * 10)
  }

  const row = (fid: string) => {
    const f = getFund(state, fid)!
    const isActive = f.status === "active"
    const mine = draft[fid] ?? 0
    const w = weights[fid] ?? 0
    const delta = isActive ? after.ratio[fid] - now.ratio[fid] : 0
    return (
      <div key={fid} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-4 md:grid-cols-[minmax(0,1.4fr)_120px_minmax(0,1.5fr)_130px] md:gap-5 md:px-5">
        <a href={`#/f/${fid}`} className="flex min-w-0 items-center gap-3">
          <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg">
            <Cover seed={f.coverSeed} />
            {isActive && <span className="absolute top-1 left-1 h-2.5 w-2.5 rounded-full ring-2 ring-card" style={{ background: colorOf(fid) }} />}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold hover:underline">{f.name}</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <MechanismBadge m={f.mechanism} />
              {!isActive && <Badge tone="primary">Proposed</Badge>}
            </div>
          </div>
        </a>
        <div className="text-right text-sm">
          {isActive ? (
            <>
              <Pts value={now.pts[fid]} className="font-semibold" />
              <div className="text-xs text-muted-foreground">this season</div>
            </>
          ) : (
            <>
              <div className="font-semibold tabular-nums">
                {num(fundTotalPoints(state, fid))}
                <span className="font-normal text-muted-foreground"> / {num(f.backingGoal)}</span>
              </div>
              <div className="text-xs text-muted-foreground">toward launch</div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Stepper value={w} onChange={(v) => setWeights({ ...weights, [fid]: v })} label={`${f.name} ratio`} />
          <div className="text-xs leading-tight">
            <div className={cn("font-semibold tabular-nums", w ? "text-foreground" : "text-muted-foreground")}>{weightTotal ? Math.round((w / weightTotal) * 100) : 0}%</div>
            <div className="text-muted-foreground tabular-nums">{num(mine)} pts</div>
          </div>
        </div>
        <div className="text-right">
          {isActive ? (
            <>
              <div className="font-semibold tabular-nums">{(after.ratio[fid] * 100).toFixed(1)}%</div>
              <div className={cn("text-xs tabular-nums", delta > 0.0005 ? "text-community" : "text-muted-foreground")}>
                {delta > 0.0005 ? `+${(delta * 100).toFixed(1)} from you` : `≈ ${num(seasonEstimate * after.ratio[fid])} BREAD`}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">{mine > 0 ? `${num(fundTotalPoints(state, fid) + mine)} after your gift` : "Counts toward launch"}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
      <PointsTabs active="give" />
      <SectionTitle
        title="Points"
        sub="A fund's share of the season's yield = its points ÷ all points given. Given points are spent."
      />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="flex items-center gap-6 p-6 md:col-span-2 md:gap-8">
          <div>
            <div className="text-xs text-muted-foreground">Season {state.season} yield so far</div>
            <Bread value={state.yieldPool} className="mt-1 font-display text-4xl leading-none md:text-[42px] font-semibold text-community" />
            <div className="mt-2 text-xs text-muted-foreground">
              ≈ {num(seasonEstimate)} by season end · {daysLeft} days left
            </div>
          </div>
          <div className="flex-1">
            <div className="flex h-24 items-end gap-1">
              {Array.from({ length: state.seasonLength }, (_, i) => {
                const done = i < state.day - state.seasonStartDay
                return <div key={i} className={cn("flex-1 rounded-sm", done ? "bg-community" : "bg-muted")} style={{ height: `${20 + (i / state.seasonLength) * 80}%` }} />
              })}
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <Stat label="Points given this season" value={<Pts value={now.total} />} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-4 md:px-5">
            <div>
              <div className="font-semibold">Give points</div>
              <div className="text-sm text-muted-foreground">
                You have <Pts value={balance} className="font-semibold text-foreground" /> to give
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setWeights({})} disabled={!weightTotal}>
                <RotateCcw size={14} /> Clear
              </Button>
              <Button size="sm" disabled={!drafted} onClick={give}>
                Give {drafted ? num(drafted) : ""} points
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-4 md:gap-4 md:px-5">
            <div className="text-sm font-semibold">Amount</div>
            <Stepper value={toGive} onChange={setBudget} step={50} max={balance} label="Points to give" />
            <Button variant="outline" size="sm" onClick={() => setBudget(balance)} disabled={toGive === balance}>
              All
            </Button>
            <div className="ml-auto text-xs text-muted-foreground">Set a ratio with − and +</div>
          </div>
          <div className="hidden grid-cols-[minmax(0,1.4fr)_120px_minmax(0,1.5fr)_130px] gap-5 px-5 pt-4 text-xs md:grid font-semibold tracking-wide text-muted-foreground uppercase">
            <div>Active funds</div>
            <div className="text-right">Points</div>
            <div>Your ratio</div>
            <div className="text-right">Share of yield</div>
          </div>
          <div className="divide-y divide-border">{active.map((f) => row(f.id))}</div>
          {proposed.length > 0 && (
            <>
              <div className="border-t border-border px-5 pt-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Proposed funds
              </div>
              <div className="divide-y divide-border">{proposed.map((f) => row(f.id))}</div>
            </>
          )}
          {balance <= 0 && (
            <div className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
              No points left. <a href="#/points" className="font-semibold text-primary hover:underline">Earn more</a>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-sm font-semibold">Season {state.season} split{drafted > 0 && " (with your gift)"}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {after.total ? `${num(after.total)} points given` : "No points given yet."}
            </div>
            <div className="mt-4 flex h-5 overflow-hidden rounded-full">
              {active.map((f) => (
                <div key={f.id} title={f.name} style={{ width: `${after.ratio[f.id] * 100}%`, background: colorOf(f.id) }} className="transition-all" />
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {active.map((f) => (
                <div key={f.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorOf(f.id) }} />
                    <span className="flex-1 truncate">{f.name}</span>
                    <Bread value={seasonEstimate * after.ratio[f.id]} className="font-semibold" />
                  </div>
                  {after.total > 0 && (
                    <div className="mt-0.5 pl-[18px] text-xs text-muted-foreground tabular-nums">
                      {num(after.pts[f.id])} ÷ {num(after.total)} = {(after.ratio[f.id] * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
          {myGifts.length > 0 && (
            <Card className="p-5">
              <div className="text-sm font-semibold">Your gifts</div>
              <div className="mt-3 space-y-2 text-sm">
                {myGifts.map((g) => (
                  <div key={g.id} className="flex items-center justify-between gap-3">
                    <span className="truncate text-muted-foreground">{getFund(state, g.fundId)?.name}</span>
                    <Pts value={g.amount} className="font-semibold" />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-display text-2xl font-semibold">Past seasons</h3>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 font-medium">Season</th>
                <th className="px-5 py-2.5 font-medium">Closed</th>
                <th className="px-5 py-2.5 font-medium">Points given</th>
                <th className="px-5 py-2.5 font-medium">Yield shared</th>
                <th className="px-5 py-2.5 font-medium">Split</th>
              </tr>
            </thead>
            <tbody>
              {[...state.distributions].reverse().map((d) => (
                <tr key={d.season} className="border-t border-border">
                  <td className="px-5 py-3 font-semibold">Season {d.season}</td>
                  <td className="px-5 py-3 text-muted-foreground">Day {d.day}</td>
                  <td className="px-5 py-3">
                    <Pts value={Object.values(d.points ?? {}).reduce((a, b) => a + b, 0)} />
                  </td>
                  <td className="px-5 py-3">
                    <Bread value={d.total} className="font-semibold" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex h-3 w-full max-w-sm overflow-hidden rounded-full">
                      {state.funds.map((f) =>
                        d.shares[f.id] ? (
                          <div
                            key={f.id}
                            title={`${f.name}: ${num(d.points?.[f.id] ?? 0)} points → ${num(d.shares[f.id])} BREAD`}
                            style={{ width: `${(d.shares[f.id] / d.total) * 100}%`, background: colorOf(f.id) }}
                          />
                        ) : null
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
