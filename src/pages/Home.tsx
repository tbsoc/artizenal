import { ArrowRight, Check, Landmark, Sprout, Vote, HandCoins, Sparkles, History } from "lucide-react"
import { ArtizenBadge, Avatar, Bread, Card, LinkButton, Loaf, SectionTitle } from "@/components/ui"
import { CampaignRow, FundCard, ProjectCard } from "@/components/cards"
import { Cover } from "@/components/Cover"
import { START_USDC } from "@/lib/seed"
import { ME, campaignStatus, getUser, totalSupply, useStore } from "@/lib/store"
import { compact, cn, dayLabel } from "@/lib/utils"

function Engine() {
  const { state } = useStore()
  const live = state.campaigns.filter((c) => campaignStatus(c, state.day) === "live")
  const livePool = live.reduce((a, c) => a + c.matchingPool, 0)
  const left = state.seasonLength - (state.day - state.seasonStartDay)
  const pct = ((state.day - state.seasonStartDay) / state.seasonLength) * 100
  return (
    <Card className="relative overflow-hidden p-6">
      <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Matching pool</div>
      <div className="mt-4 grid grid-cols-2 gap-5">
        <div>
          <div className="text-xs text-muted-foreground">BREAD in circulation</div>
          <div className="mt-1 font-display text-3xl font-semibold">{compact(totalSupply(state))}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Interest (APY)</div>
          <div className="mt-1 font-display text-3xl font-semibold">{(state.apy * 100).toFixed(1)}%</div>
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-muted p-4">
        <div className="flex items-baseline justify-between">
          <div className="text-sm font-semibold">Season {state.season} yield so far</div>
          <div className="text-xs text-muted-foreground">{left} days left</div>
        </div>
        <Bread value={state.yieldPool} className="mt-1 font-display text-4xl font-semibold text-community" />
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-card">
          <div className="h-full rounded-full bg-community" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Live in {live.length} rounds</span>
        <Bread value={livePool} className="font-semibold" />
      </div>
    </Card>
  )
}

function Checklist() {
  const { state } = useStore()
  const steps = [
    { done: state.me.usdc < START_USDC, label: "Get BREAD", href: "#/wallet" },
    { done: state.donations.some((d) => d.from === ME && d.campaignId), label: "Back a project", href: "#/f/artizen-rescue" },
    { done: state.pointGifts.some((g) => g.userId === ME), label: "Give points", href: "#/allocate" },
    { done: state.users.some((u) => u.referredBy === ME), label: "Invite a friend", href: "#/points" },
    { done: state.projects.some((p) => p.creatorId === ME), label: "Start a project", href: "#/new" },
  ]
  const n = steps.filter((s) => s.done).length
  if (n === steps.length) return null
  return (
    <Card className="flex items-center gap-6 px-6 py-4">
      <div className="shrink-0">
        <div className="text-sm font-semibold">Onboarding</div>
        <div className="text-xs text-muted-foreground">{n}/{steps.length}</div>
      </div>
      <div className="flex flex-1 flex-wrap gap-2">
        {steps.map((s) => (
          <a
            key={s.label}
            href={s.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              s.done ? "border-community/30 bg-community/8 text-community" : "border-border hover:bg-muted"
            )}
          >
            {s.done ? <Check size={13} /> : <span className="h-3 w-3 rounded-full border-2 border-muted-foreground/40" />}
            {s.label}
          </a>
        ))}
      </div>
    </Card>
  )
}

const FLOW = [
  { icon: Landmark, title: "Hold BREAD", text: "Convert USDC 1:1. Redeem any time." },
  { icon: Sprout, title: "Reserves earn", text: "The USDC behind BREAD earns interest." },
  { icon: Vote, title: "Points split it", text: "Funds get yield in proportion to points given." },
  { icon: HandCoins, title: "Rounds match", text: "Funds match BREAD donations to projects." },
]

export function Home() {
  const { state } = useStore()
  const live = state.campaigns
    .filter((c) => campaignStatus(c, state.day) !== "ended")
    .sort((a, b) => a.endDay - b.endDay)
  const alumni = state.projects.filter((p) => p.artizen).slice(0, 4)
  const funds = state.funds.filter((f) => f.status === "active").slice(0, 3)
  const featured = state.campaigns.find((c) => c.id === "lifeboat")

  return (
    <div className="space-y-14">
      <section className="grid grid-cols-[1.25fr_1fr] items-stretch gap-8">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-foreground p-10 text-background">
          <div className="absolute inset-0 opacity-25">
            <Cover seed={7} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/85 to-transparent" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <History size={13} /> For the projects Artizen left behind
            </div>
            <h1 className="mt-6 max-w-xl font-display text-[54px] leading-[1.02] font-semibold tracking-tight">
              Artizen closed. <span className="text-wheat">The projects didn't.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-background/75">
              Community-matched funding, run as a cooperative. Interest on shared reserves pays for matching.
            </p>
          </div>
          <div className="relative mt-10 flex gap-3">
            <LinkButton href="#/funds" size="lg">
              Explore live rounds <ArrowRight size={16} />
            </LinkButton>
            <LinkButton href="#/new?artizen=1" size="lg" variant="outline" className="border-background/25 bg-transparent text-background hover:bg-background/10">
              Bring your Artizen project
            </LinkButton>
          </div>
        </div>
        <Engine />
      </section>

      <Checklist />

      <section>
        <SectionTitle title="How it works" />
        <div className="grid grid-cols-4 gap-4">
          {FLOW.map((f, i) => (
            <div key={f.title} className="relative">
              <Card className="h-full p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wheat/30 text-crust">
                  <f.icon size={19} />
                </div>
                <div className="mt-4 font-semibold">{f.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.text}</div>
              </Card>
              {i < FLOW.length - 1 && (
                <ArrowRight className="absolute top-1/2 -right-[13px] z-10 -translate-y-1/2 rounded-full bg-background p-0.5 text-muted-foreground" size={22} />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-[1.5fr_1fr] gap-8">
        <div>
          <SectionTitle title="Rounds open now" action={<LinkButton href="#/funds" variant="ghost" size="sm">All funds <ArrowRight size={14} /></LinkButton>} />
          <div className="space-y-3">
            {live.map((c) => (
              <CampaignRow key={c.id} campaign={c} />
            ))}
          </div>
        </div>
        <div>
          <SectionTitle title="Activity" />
          <Card className="divide-y divide-border">
            {state.activity.slice(0, 8).map((a) => {
              const u = getUser(state, a.userId)
              return (
                <a key={a.id} href={a.href} className="flex gap-3 px-4 py-3 text-sm hover:bg-muted/50">
                  {u ? <Avatar user={u} size={28} /> : <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wheat/40"><Loaf size={15} /></div>}
                  <div className="min-w-0">
                    <span className="font-semibold">{u ? (u.id === ME ? "You" : u.name) : "Artizenal"}</span>{" "}
                    <span className="text-muted-foreground">{a.text}</span>
                    <div className="text-xs text-muted-foreground/70">{dayLabel(a.day, state.day)}</div>
                  </div>
                </a>
              )
            })}
          </Card>
        </div>
      </section>

      <section>
        <SectionTitle
          title={
            <span className="flex items-center gap-3">
              Rehoming Artizen projects <ArtizenBadge />
            </span>
          }
          sub="Live on Artizen when it shut down."
          action={<LinkButton href="#/projects?artizen=1" variant="ghost" size="sm">See all alumni <ArrowRight size={14} /></LinkButton>}
        />
        <div className="grid grid-cols-4 gap-5">
          {alumni.map((p) => (
            <ProjectCard key={p.id} project={p} campaign={featured && featured.projectIds.includes(p.id) ? featured : undefined} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Funds"
          action={<LinkButton href="#/propose" variant="outline" size="sm"><Sparkles size={14} /> Propose a fund</LinkButton>}
        />
        <div className="grid grid-cols-3 gap-5">
          {funds.map((f) => (
            <FundCard key={f.id} fund={f} />
          ))}
        </div>
      </section>
    </div>
  )
}
