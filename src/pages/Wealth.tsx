import { useState } from "react"
import { PasInfo } from "@/components/PasExplainer"
import { Landmark, Lock, Sparkles } from "lucide-react"
import { Avatar, Button, Card, Input, LiveYield, Pts, SectionTitle, Stat } from "@/components/ui"
import { ME, POINT_RULES, blendedApy, dailyYield, feesUsd, getUser, totalSupply, useStore, wealthUnits } from "@/lib/store"
import { ASSETS, ASSET_IDS, fmtUnits, toUsd } from "@/lib/assets"
import type { Asset } from "@/lib/assets"
import { cn, num, usd } from "@/lib/utils"

export function Wealth() {
  const { state, actions, toast } = useStore()
  const [asset, setAsset] = useState<Asset>("USD")
  const [amount, setAmount] = useState(100)
  const [sure, setSure] = useState(false)
  const A = ASSETS[asset]
  const value = toUsd(asset, amount)
  const points = Math.round(value * POINT_RULES.perEndowedUsd)

  const endowedUsd = ASSET_IDS.reduce((t, a) => t + toUsd(a, state.endowed[a]), 0)
  const daysLeft = state.seasonLength - (state.day - state.seasonStartDay)

  const byUser = new Map<string, number>()
  for (const e of state.endowments) byUser.set(e.userId, (byUser.get(e.userId) ?? 0) + e.usd)
  const top = [...byUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)

  const pick = (a: Asset) => {
    setAsset(a)
    setAmount(a === "ETH" ? 0.05 : 100)
  }

  const submit = () => {
    const r = actions.endow(asset, amount)
    if (!r.ok) return toast(r.error, "err")
    toast(`Endowed ${fmtUnits(asset, amount)} ${A.base}. +${num(points)} points`)
    setSure(false)
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        title={
          <span className="flex items-center gap-3">
            <Landmark size={26} className="text-crust" /> Pastry Wealth Fund
          </span>
        }
        sub={
          <>
            Every pas token and every endowment sits here. The reserves earn yield in DeFi through savings protocols and ETH staking. Only that yield
            is used, and it pays for matching. <PasInfo label="How it works" />
          </>
        }
      />

      <Card className="grid grid-cols-1 gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)] lg:items-center lg:gap-10">
        <div>
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total value</div>
          <div className="mt-2 font-display text-4xl font-semibold md:text-5xl">{usd(totalSupply(state))}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {usd(endowedUsd + feesUsd(state))} is permanent: {usd(endowedUsd)} endowed, {usd(feesUsd(state))} from the 10% donation fee
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:border-l lg:border-border lg:pl-10">
          <div>
            <div className="text-xs text-muted-foreground">Season {state.season} yield · {daysLeft}d left</div>
            <LiveYield base={state.yieldPool} perDay={dailyYield(state)} className="mt-1 block text-xl font-bold text-community" />
          </div>
          <Stat label="Yield per day" value={usd(dailyYield(state))} />
          <Stat label="Blended APY" value={`${(blendedApy(state) * 100).toFixed(2)}%`} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 font-medium">Asset</th>
                <th className="px-3 py-2.5 text-right font-medium">Held (redeemable)</th>
                <th className="px-3 py-2.5 text-right font-medium">Permanent (endowed + fees)</th>
                <th className="px-3 py-2.5 text-right font-medium">APY</th>
                <th className="px-5 py-2.5 text-right font-medium">Yield per day</th>
              </tr>
            </thead>
            <tbody>
              {ASSET_IDS.map((a) => {
                const X = ASSETS[a]
                const held = wealthUnits(state, a) - state.endowed[a] - state.feeUnits[a]
                return (
                  <tr key={a} className="border-t border-border">
                    <td className="px-5 py-3">
                      <div className="font-semibold">{X.token}</div>
                      <div className="text-xs text-muted-foreground">from {X.base} · {X.yieldSource}</div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <div className="font-semibold">{fmtUnits(a, Math.round(held * 100) / 100)}</div>
                      <div className="text-xs text-muted-foreground">{usd(toUsd(a, held))}</div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <div className="font-semibold">{fmtUnits(a, state.endowed[a] + state.feeUnits[a])}</div>
                      <div className="text-xs text-muted-foreground">{usd(toUsd(a, state.endowed[a] + state.feeUnits[a]))}</div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{(X.apy * 100).toFixed(1)}%</td>
                    <td className="px-5 py-3 text-right font-semibold text-community tabular-nums">{usd((toUsd(a, wealthUnits(state, a)) * X.apy) / 365)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <Card className="p-6">
          <div className="flex items-center gap-2 font-display text-2xl font-semibold">
            <Lock size={20} className="text-crust" /> Endow permanently
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Give up the principal for good. It earns yield for matching forever, and you get <b className="text-coop-ink">{POINT_RULES.perEndowedUsd} points per $1</b>, the
            most of any action.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {ASSET_IDS.map((a) => (
              <button
                key={a}
                onClick={() => pick(a)}
                className={cn("rounded-xl border-2 px-3 py-2 text-left transition cursor-pointer", asset === a ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30")}
              >
                <div className="text-sm font-semibold">{ASSETS[a].base}</div>
                <div className="text-xs text-muted-foreground tabular-nums">{fmtUnits(a, state.me.base[a])} available</div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Input type="number" step="any" value={amount || ""} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} className="h-12 text-lg" />
            <span className="shrink-0 text-sm font-semibold">{A.base}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              ≈ {usd(value)} · earns ≈ {usd((value * A.apy) / 365 * 30, true)} per season, forever
            </span>
            <span className="flex items-center gap-1 font-semibold text-coop-ink">
              <Sparkles size={14} /> +{num(points)}
            </span>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
            <span>I understand this is permanent and can't be withdrawn.</span>
          </label>
          <Button size="lg" className="mt-4 w-full" disabled={!sure || amount <= 0 || amount > state.me.base[asset] + 1e-9} onClick={submit}>
            Endow {fmtUnits(asset, amount)} {A.base}
          </Button>
        </Card>

        <Card className="h-fit p-5">
          <div className="text-sm font-semibold">Top endowers</div>
          <div className="mt-3 space-y-3">
            {top.map(([uid, total]) => {
              const u = getUser(state, uid)
              return (
                <div key={uid} className={cn("flex items-center gap-3 text-sm", uid === ME && "font-semibold")}>
                  <Avatar user={u} size={28} />
                  <span className="flex-1 truncate">{uid === ME ? "You" : u?.name}</span>
                  <span className="tabular-nums">{usd(total)}</span>
                </div>
              )
            })}
          </div>
          {top.length > 0 && (
            <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
              Endowers have earned <Pts value={state.endowments.reduce((t, e) => t + e.usd, 0) * POINT_RULES.perEndowedUsd} /> points for curation.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
