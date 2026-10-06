import { useState } from "react"
import { Sparkles } from "lucide-react"
import { LinkButton, SectionTitle, Tabs } from "@/components/ui"
import { FundCard } from "@/components/cards"
import { fundSeasonPoints, fundTotalPoints, useStore } from "@/lib/store"

export function Funds() {
  const { state } = useStore()
  const [tab, setTab] = useState<"active" | "proposed">("active")
  const funds = state.funds
    .filter((f) => f.status === tab)
    .sort((a, b) => (tab === "active" ? fundSeasonPoints(state, b.id) - fundSeasonPoints(state, a.id) : fundTotalPoints(state, b.id) - fundTotalPoints(state, a.id)))
  const proposedCount = state.funds.filter((f) => f.status === "proposed").length

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Funds"
        sub="Pools of matching money, split each season by points."
        action={
          <LinkButton href="#/propose">
            <Sparkles size={15} /> Propose a fund
          </LinkButton>
        }
      />
      <div>
        <Tabs
          value={tab}
          onChange={setTab}
          className="mb-6"
          tabs={[
            { id: "active", label: "Active" },
            { id: "proposed", label: `Proposed (${proposedCount})` },
          ]}
        />
        {tab === "proposed" && <p className="-mt-2 mb-6 text-sm text-muted-foreground">Launches once it hits its BREAD and points goals.</p>}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {funds.map((f) => (
            <FundCard key={f.id} fund={f} />
          ))}
        </div>
      </div>
    </div>
  )
}
