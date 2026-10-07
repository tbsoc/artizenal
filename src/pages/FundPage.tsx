import { useState } from "react"
import { confettiFrom } from "@/lib/confetti"
import { ArrowLeft, HandCoins, Rocket, Settings2, ShoppingBasket, Sparkles, Vote, Plus } from "lucide-react"
import {
  Avatar,
  Badge,
  Bread,
  Button,
  Card,
  Empty,
  Field,
  Input,
  MechanismBadge,
  Modal,
  Progress,
  Pts,
  Stat,
  StatusPill,
  Textarea,
} from "@/components/ui"
import { Cover } from "@/components/Cover"
import { ProjectCard } from "@/components/cards"
import { FundDonateModal } from "@/components/modals"
import {
  ME,
  campaignStatus,
  fundSeasonPoints,
  fundTotalPoints,
  pointsBalance,
  seasonRatios,
  fundPledged,
  getFund,
  getProject,
  getUser,
  useStore,
} from "@/lib/store"
import { MECHANISM_INFO, campaignContributions, campaignMatches, mechanismLabel } from "@/lib/matching"
import type { Campaign, Fund } from "@/lib/types"
import { cn, num, usd } from "@/lib/utils"

function GivePoints({ fund }: { fund: Fund }) {
  const { state, actions, toast } = useStore()
  const balance = pointsBalance(state, ME)
  const mine = state.pointGifts
    .filter((g) => g.userId === ME && g.fundId === fund.id && (fund.status === "proposed" || g.season === state.season))
    .reduce((a, g) => a + g.amount, 0)
  const give = (amount: number, from: Element) => {
    const r = actions.givePoints({ [fund.id]: amount })
    if (!r.ok) return toast(r.error, "err")
    confettiFrom(from, `+${num(amount)} points`)
    toast(`+${num(amount)} points to ${fund.name}`)
  }
  return (
    <div className="rounded-xl bg-coop-ink/5 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-coop-ink">Give points</span>
        <span className="text-xs text-muted-foreground">{num(balance)} to give</span>
      </div>
      <div className="mt-3 flex gap-1.5">
        {[10, 100, 1000].map((amt) => (
          <button
            key={amt}
            onClick={(e) => give(amt, e.currentTarget)}
            disabled={amt > balance}
            className="h-9 flex-1 rounded-full border border-border bg-card text-sm font-semibold tabular-nums transition hover:border-coop-ink hover:bg-coop-ink hover:text-white disabled:pointer-events-none disabled:opacity-35 cursor-pointer"
          >
            +{num(amt)}
          </button>
        ))}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {fund.status === "active" ? "Given points are spent." : "Counts toward the launch goal."}
        {mine > 0 && ` You've given ${num(mine)}${fund.status === "active" ? " this season" : ""}.`}
      </div>
    </div>
  )
}

function StartCampaignModal({ fund, open, onClose }: { fund: Fund; open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useStore()
  const [name, setName] = useState("")
  const [blurb, setBlurb] = useState("")
  const [days, setDays] = useState(21)
  const [startsIn, setStartsIn] = useState(0)
  const [pool, setPool] = useState(Math.floor(fund.reserve))
  const [picked, setPicked] = useState<string[]>([])
  const candidates = [...state.projects].sort((a, b) => Number(b.category === fund.category) - Number(a.category === fund.category))

  return (
    <Modal open={open} onClose={onClose} title="Launch a matching round" width={680}>
      <div className="space-y-4">
        <Field label="Round name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Autumn Open Call" />
        </Field>
        <Field label="Description">
          <Textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} className="min-h-20" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Matching pool" hint={`Reserve: ${usd(fund.reserve)}`}>
            <Input type="number" value={pool || ""} onChange={(e) => setPool(Math.max(0, Number(e.target.value)))} />
          </Field>
          <Field label="Length (days)">
            <Input type="number" value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value)))} />
          </Field>
          <Field label="Opens in (days)">
            <Input type="number" value={startsIn} onChange={(e) => setStartsIn(Math.max(0, Number(e.target.value)))} />
          </Field>
        </div>
        <div className="rounded-xl bg-muted px-4 py-3 text-sm">
          Matching formula: <b>{mechanismLabel(fund.mechanism)}</b>
          <span className="text-muted-foreground"> (set for the whole fund when it was proposed)</span>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold">Projects ({picked.length})</div>
          <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {candidates.map((p) => {
              const on = picked.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => setPicked((ids) => (on ? ids.filter((x) => x !== p.id) : [...ids, p.id]))}
                  className={cn("flex items-center gap-2 rounded-xl border-2 p-2 text-left text-sm transition cursor-pointer", on ? "border-primary bg-primary/5" : "border-border")}
                >
                  <div className="h-8 w-10 shrink-0 overflow-hidden rounded-md">
                    <Cover seed={p.coverSeed} image={p.image} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.category}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || !picked.length || pool <= 0}
            onClick={() => {
              const r = actions.startCampaign(fund.id, { name: name.trim(), blurb: blurb.trim(), days, startsIn, pool, projectIds: picked })
              if (!r.ok) return toast(r.error, "err")
              toast(`${name} is ${startsIn ? "scheduled" : "live"}!`)
              onClose()
            }}
          >
            <Rocket size={15} /> Launch round
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function CampaignPanel({ campaign, fund }: { campaign: Campaign; fund: Fund }) {
  const { state, actions, toast } = useStore()
  const status = campaignStatus(campaign, state.day)
  const { matches, demand, coverage } = campaignMatches(campaign, fund.mechanism, state.donations)
  const contribs = campaignContributions(campaign, state.donations)
  const rows = campaign.projectIds
    .map((pid) => {
      const cs = contribs.filter((c) => c.projectId === pid)
      return {
        pid,
        project: getProject(state, pid)!,
        donors: new Set(cs.map((c) => c.donor)).size,
        given: cs.reduce((a, c) => a + c.amount, 0),
        match: matches[pid] ?? 0,
      }
    })
    .sort((a, b) => b.match - a.match)
  const totalGiven = rows.reduce((a, r) => a + r.given, 0)
  const totalMatch = rows.reduce((a, r) => a + r.match, 0)
  const maxMatch = Math.max(1, ...rows.map((r) => r.match))
  const notInCart = campaign.projectIds.filter((pid) => !state.cart.some((i) => i.projectId === pid && i.campaignId === campaign.id))

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <StatusPill status={status} />
              <MechanismBadge m={fund.mechanism} />
            </div>
            <h3 className="mt-2 font-display text-3xl font-semibold">{campaign.name}</h3>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{campaign.blurb}</p>
          </div>
          {status === "live" && notInCart.length > 0 && (
            <Button
              variant="dark"
              onClick={() => {
                notInCart.forEach((pid) => actions.addToCart(pid, campaign.id))
                toast(`Collected ${notInCart.length} projects into your basket`)
              }}
            >
              <ShoppingBasket size={15} /> Collect all {notInCart.length}
            </Button>
          )}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-6 border-t border-border pt-5 md:grid-cols-4">
          <Stat label="Matching pool" value={<Bread value={campaign.matchingPool} />} />
          <Stat label="Donated" value={<Bread value={totalGiven} />} sub={`${new Set(contribs.map((c) => c.donor)).size} donors`} />
          {status === "ended" ? (
            <Stat label="Matched" value={<Bread value={totalMatch} className="text-community" />} />
          ) : fund.mechanism.type === "qf" ? (
            <Stat
              label="Match per $1"
              value={<span className="text-community">{totalGiven ? (campaign.matchingPool / totalGiven).toFixed(2) : "–"}×</span>}
            />
          ) : (
            <Stat
              label="Pool claimed"
              value={<span className="text-community">{Math.round(Math.min(1, demand / campaign.matchingPool) * 100)}%</span>}
              sub={coverage < 1 ? `Scaled to ${Math.round(coverage * 100)}%` : `${usd(campaign.matchingPool - demand)} left`}
            />
          )}
          <Stat
            label={status === "live" ? "Closes" : status === "upcoming" ? "Opens" : "Closed"}
            value={status === "live" ? `in ${campaign.endDay - state.day}d` : status === "upcoming" ? `in ${campaign.startDay - state.day}d` : `day ${campaign.endDay}`}
            sub={`Day ${campaign.startDay} to ${campaign.endDay}`}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="text-sm font-semibold">{status === "ended" ? "Final results" : "Live match estimate"}</div>
          <div className="text-xs text-muted-foreground">Donations in any pas token count at their dollar value</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-5 py-2 font-medium">Project</th>
              <th className="px-3 py-2 text-right font-medium">Donors</th>
              <th className="px-3 py-2 text-right font-medium">Donated</th>
              <th className="w-[34%] px-5 py-2 font-medium">Match</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.pid} className="border-t border-border">
                <td className="px-5 py-2.5">
                  <a href={`#/p/${r.pid}`} className="flex items-center gap-3 hover:underline">
                    <div className="h-8 w-11 shrink-0 overflow-hidden rounded-md">
                      <Cover seed={r.project.coverSeed} image={r.project.image} />
                    </div>
                    <span className="font-semibold">{r.project.title}</span>
                    {r.project.creatorId === ME && <Badge tone="primary">Yours</Badge>}
                  </a>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.donors}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{num(r.given)}</td>
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-community transition-all" style={{ width: `${(r.match / maxMatch) * 100}%` }} />
                    </div>
                    <span className="w-16 text-right font-semibold tabular-nums text-community">{num(r.match)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {campaign.projectIds.map((pid) => {
          const p = getProject(state, pid)
          return p ? <ProjectCard key={pid} project={p} campaign={campaign} /> : null
        })}
      </div>
    </div>
  )
}

export function FundPage({ id, query }: { id: string; query: URLSearchParams }) {
  const { state, actions } = useStore()
  const fund = getFund(state, id)
  const [giveOpen, setGiveOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const campaigns = state.campaigns
    .filter((c) => c.fundId === id)
    .sort((a, b) => {
      const order = { live: 0, upcoming: 1, ended: 2 }
      return order[campaignStatus(a, state.day)] - order[campaignStatus(b, state.day)] || b.endDay - a.endDay
    })
  const [selected, setSelected] = useState(query.get("c") ?? campaigns[0]?.id)

  if (!fund) return <Empty>Fund not found.</Empty>
  const campaign = campaigns.find((c) => c.id === selected) ?? campaigns[0]
  const backing = fund.status === "active" ? fundSeasonPoints(state, fund.id) : fundTotalPoints(state, fund.id)
  const ratios = seasonRatios(state)
  const share = ratios.ratio[fund.id] ?? 0
  const livePool = campaigns.filter((c) => campaignStatus(c, state.day) === "live").reduce((a, c) => a + c.matchingPool, 0)
  const pledged = fundPledged(state, fund.id)
  const isCurator = fund.curators.includes(ME)

  return (
    <div>
      <a href="#/funds" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> All funds
      </a>

      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0">
          <Cover seed={fund.coverSeed} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/20" />
        <div className="relative flex flex-col items-start gap-6 p-6 text-background md:flex-row md:items-end md:justify-between md:gap-10 md:p-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <MechanismBadge m={fund.mechanism} className="bg-card" />
              {fund.status === "proposed" ? <Badge tone="primary" className="bg-card">Proposed</Badge> : <Badge tone="success" className="bg-card">Active</Badge>}
              <Badge tone="outline" className="border-background/30 bg-transparent text-background/80">{fund.category}</Badge>
            </div>
            <h1 className="mt-4 font-display text-3xl leading-tight md:text-[48px] font-semibold tracking-tight">{fund.name}</h1>
            <p className="mt-2 text-lg text-background/80">{fund.tagline}</p>
            <div className="mt-5 flex items-center gap-3 text-sm text-background/80">
              <div className="flex -space-x-2">
                {fund.curators.map((c) => (
                  <Avatar key={c} user={getUser(state, c)} size={30} className="ring-foreground" />
                ))}
              </div>
              Curated by {fund.curators.map((c) => (c === ME ? "you" : getUser(state, c)?.name)).join(" & ")}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="lg" onClick={() => setGiveOpen(true)}>
              <HandCoins size={17} /> {fund.status === "proposed" ? "Pledge" : "Give to this fund"}
            </Button>
            <a href="#/allocate" className="inline-flex h-12 items-center gap-2 rounded-full border border-background/30 px-5 text-[15px] font-semibold hover:bg-background/10">
              <Vote size={17} /> Give points
            </a>
          </div>
        </div>
      </div>

      {fund.status === "active" ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <Stat label="Live matching" value={<Bread value={livePool} />} />
          </Card>
          <Card className="p-5">
            <Stat label="Reserve" value={<Bread value={fund.reserve} />} />
          </Card>
          <Card className="p-5">
            <Stat label="Points this season" value={<Pts value={backing} />} sub={`${(share * 100).toFixed(1)}% of this season's yield`} />
          </Card>
        </div>
      ) : (
        <Card className="mt-6 grid grid-cols-1 gap-6 p-6 md:grid-cols-[1fr_1fr_1.2fr] md:gap-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Rocket size={16} /> Pledges to launch
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <Bread value={pledged} className="font-display text-3xl font-semibold" />
              <span className="text-sm text-muted-foreground">of {num(fund.pledgeGoal)}</span>
            </div>
            <Progress value={(pledged / fund.pledgeGoal) * 100} className="mt-3 h-2.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={16} /> Points given
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <Pts value={backing} className="font-display text-3xl font-semibold" />
              <span className="text-sm text-muted-foreground">of {num(fund.backingGoal)}</span>
            </div>
            <Progress value={(backing / fund.backingGoal) * 100} className="mt-3 h-2.5" barClass="bg-coop-ink" />
          </div>
          <GivePoints fund={fund} />
        </Card>
      )}

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[28px] font-semibold">Rounds</h2>
            {isCurator && fund.status === "active" && (
              <Button variant="outline" size="sm" onClick={() => setStartOpen(true)}>
                <Plus size={14} /> New round
              </Button>
            )}
          </div>
          {campaigns.length > 0 ? (
            <>
              <div className="mb-5 flex flex-wrap gap-2">
                {campaigns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition cursor-pointer",
                      campaign?.id === c.id ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted"
                    )}
                  >
                    {campaignStatus(c, state.day) === "live" && <span className="h-2 w-2 rounded-full bg-success live-dot" />}
                    {c.name}
                  </button>
                ))}
              </div>
              {campaign && <CampaignPanel key={campaign.id} campaign={campaign} fund={fund} />}
            </>
          ) : (
            <Empty>
              {fund.status === "proposed"
                ? "Rounds open once the fund launches."
                : isCurator
                  ? "No rounds yet."
                  : "No rounds yet. Curators will open one soon."}
            </Empty>
          )}
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="text-sm font-semibold">About this fund</div>
            <div className="prose-body mt-2 text-sm leading-relaxed text-muted-foreground">
              {fund.description.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Card>
          {fund.status === "active" && <GivePoints fund={fund} />}
          <Card className="p-5">
            <div className="text-sm font-semibold">{MECHANISM_INFO[fund.mechanism.type].name}</div>
            <div className="mt-1 text-xs font-medium text-coop-ink">{mechanismLabel(fund.mechanism)}</div>
          </Card>
          {isCurator && fund.status === "active" && (
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Settings2 size={15} /> Curator settings
              </div>
              <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" checked={fund.autoStream} onChange={() => actions.toggleAutoStream(fund.id)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
                <span>
                  <span className="font-medium">Send yield to live rounds</span>
                                  </span>
              </label>
              <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => setStartOpen(true)}>
                <Rocket size={14} /> New round
              </Button>
            </Card>
          )}
        </aside>
      </div>

      <FundDonateModal key={String(giveOpen)} fund={fund} open={giveOpen} onClose={() => setGiveOpen(false)} />
      {startOpen && <StartCampaignModal fund={fund} open={startOpen} onClose={() => setStartOpen(false)} />}
    </div>
  )
}
