import { useState } from "react"
import { Sparkles, Scale, Equal, X as Times } from "lucide-react"
import { Card, LinkButton, SectionTitle, Tabs } from "@/components/ui"
import { FundCard } from "@/components/cards"
import { MECHANISM_INFO } from "@/lib/matching"
import { fundSeasonPoints, fundTotalPoints, useStore } from "@/lib/store"

const MECH_ICONS = { qf: Scale, match: Equal, multiplier: Times }

export function Funds() {
  const { state } = useStore()
  const [tab, setTab] = useState<"active" | "proposed">("active")
  const funds = state.funds
    .filter((f) => f.status === tab)
    .sort((a, b) => (tab === "active" ? fundSeasonPoints(state, b.id) - fundSeasonPoints(state, a.id) : fundTotalPoints(state, b.id) - fundTotalPoints(state, a.id)))
  const proposedCount = state.funds.filter((f) => f.status === "proposed").length

  return (
    <div className="space-y-10">
      <SectionTitle
        title="Funds"
        sub="A fund is a pot of matching money with a focus and a set of curators. Each season, funds get a share of the yield in proportion to the points members give them."
        action={
          <LinkButton href="#/propose">
            <Sparkles size={15} /> Propose a fund
          </LinkButton>
        }
      />
      <div className="grid grid-cols-3 gap-4">
        {(Object.keys(MECHANISM_INFO) as (keyof typeof MECHANISM_INFO)[]).map((k) => {
          const Icon = MECH_ICONS[k]
          return (
            <Card key={k} className="flex gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coop-ink/8 text-coop-ink">
                <Icon size={18} />
              </div>
              <div>
                <div className="font-semibold">{MECHANISM_INFO[k].name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{MECHANISM_INFO[k].explain}</div>
              </div>
            </Card>
          )
        })}
      </div>
      <div>
        <Tabs
          value={tab}
          onChange={setTab}
          className="mb-6"
          tabs={[
            { id: "active", label: "Active funds" },
            { id: "proposed", label: `Proposed (${proposedCount})` },
          ]}
        />
        {tab === "proposed" && (
          <p className="-mt-2 mb-6 max-w-2xl text-sm text-muted-foreground">
            A proposed fund launches once it reaches its pledge goal in BREAD and enough points have been given to it. Pledging BREAD earns
            you points.
          </p>
        )}
        <div className="grid grid-cols-3 gap-5">
          {funds.map((f) => (
            <FundCard key={f.id} fund={f} />
          ))}
        </div>
      </div>
    </div>
  )
}
