import { ArrowRight, Lock, Unlock, Wallet as WalletIcon } from "lucide-react"
import { Badge, Button, Card, LinkButton } from "./ui"
import { projectEarnings, useStore } from "@/lib/store"
import { ASSETS, ASSET_IDS, fmtUnits } from "@/lib/assets"
import type { Project } from "@/lib/types"
import { usd } from "@/lib/utils"

/** Creator view of a project's money: what came in, what's locked until the season ends, and what can be withdrawn. */
export function CreatorEarnings({ project, compact = false }: { project: Project; compact?: boolean }) {
  const { state, actions, toast } = useStore()
  const e = projectEarnings(state, project.id)

  const withdraw = () => {
    const r = actions.withdrawProject(project.id)
    if (!r.ok) return toast(r.error, "err")
    toast(`Withdrew ${usd(e.availableUsd)} to your wallet`)
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            {compact ? project.title : "Your earnings"} <Badge tone="primary">Creator view</Badge>
          </div>
          <div className="text-xs text-muted-foreground">Only you can see this. Money unlocks when the season it arrived in ends.</div>
        </div>
        {compact && (
          <LinkButton href={`#/p/${project.id}`} variant="ghost" size="sm">
            Open project <ArrowRight size={14} />
          </LinkButton>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-3">
        <div>
          <div className="text-xs text-muted-foreground">Donations received</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{usd(e.receivedUsd)}</div>
          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground tabular-nums">
            {ASSET_IDS.filter((a) => e.received[a] > 0).map((a) => (
              <div key={a}>
                {fmtUnits(a, e.received[a])} {ASSETS[a].token}
              </div>
            ))}
            <div>after the 10% Wealth Fund fee · {e.donors} donors</div>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Matching funds</div>
          <div className="mt-1 text-2xl font-semibold text-community tabular-nums">{usd(e.matchPaid + e.matchPending)}</div>
          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground tabular-nums">
            <div>{usd(e.matchPaid)} paid by closed rounds</div>
            <div>{usd(e.matchPending)} estimated from live rounds</div>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Withdrawn so far</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{usd(e.withdrawnUsd)}</div>
          <div className="mt-1 text-xs text-muted-foreground">sent to your wallet as pas tokens</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-border p-5 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl bg-muted p-4">
          <Lock size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Locked until season {state.season} ends</div>
            <div className="text-xl font-semibold tabular-nums">{usd(e.lockedUsd)}</div>
            <div className="text-xs text-muted-foreground">
              {e.lockedUsd >= 0.01
                ? `Unlocks in ${e.daysToUnlock} day${e.daysToUnlock === 1 ? "" : "s"}. Use the day counter to skip ahead.`
                : "Nothing locked right now."}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-community/30 bg-community/6 p-4">
          <Unlock size={18} className="mt-0.5 shrink-0 text-community" />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Available to withdraw</div>
            <div className="text-xl font-semibold text-community tabular-nums">{usd(e.availableUsd)}</div>
            <Button size="sm" className="mt-2" disabled={e.availableUsd < 0.01} onClick={withdraw}>
              <WalletIcon size={14} /> Withdraw to wallet
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
