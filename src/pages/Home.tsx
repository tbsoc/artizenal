import { ArrowRight, Check, X, Landmark, Sprout, Vote, HandCoins, Sparkles, History } from "lucide-react"
import { ArtizenBadge, Avatar, Bread, Card, LinkButton, LiveYield, Loaf, SectionTitle } from "@/components/ui"
import { CampaignRow, FundCard, ProjectCard } from "@/components/cards"
import { Cover } from "@/components/Cover"
import { START_USDC } from "@/lib/seed"
import { ME, campaignStatus, dailyYield, getUser, totalSupply, useStore } from "@/lib/store"
import { compact, cn, dayLabel, usd } from "@/lib/utils"

function MatchingPool() {
  const { state } = useStore()
  const live = state.campaigns.filter((c) => campaignStatus(c, state.day) === "live")
  const livePool = live.reduce((a, c) => a + c.matchingPool, 0)
  const left = state.seasonLength - (state.day - state.seasonStartDay)
  const donated =
    state.donations.filter((d) => d.day >= state.seasonStartDay).reduce((a, d) => a + d.amount, 0) +
    state.fundDonations.filter((d) => d.day >= state.seasonStartDay).reduce((a, d) => a + d.amount, 0)
  const stats = [
    { label: "Donated this season", value: usd(donated) },
    { label: "Live matching", value: <Bread value={livePool} />, sub: `${live.length} rounds` },
    { label: "BREAD in circulation", value: compact(totalSupply(state)) },
    { label: "Interest (APY)", value: `${(state.apy * 100).toFixed(1)}%` },
  ]
  return (
    <Card className="grid grid-cols-1 gap-6 p-6 md:p-8 lg:grid-cols-[1.1fr_1.6fr_auto] lg:items-center lg:gap-10">
      <div>
        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Season {state.season} matching pool · {left} days left
        </div>
        <LiveYield base={state.yieldPool} perDay={dailyYield(state)} className="mt-2 font-display text-4xl font-semibold text-community md:text-5xl" />
        <div className="mt-1 text-sm text-muted-foreground">Yield earned so far, growing every second</div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:border-l lg:border-border lg:pl-10">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{s.value}</div>
            {s.sub && <div className="text-xs text-muted-foreground">{s.sub}</div>}
          </div>
        ))}
      </div>
      <LinkButton href="#/wallet" size="lg" className="w-full lg:w-auto">
        <Loaf size={16} /> Create BREAD
      </LinkButton>
    </Card>
  )
}

function Checklist() {
  const { state, actions } = useStore()
  const steps = [
    { done: state.me.usdc < START_USDC, label: "Get BREAD", href: "#/wallet" },
    { done: state.donations.some((d) => d.from === ME && d.campaignId), label: "Back a project", href: "#/f/artizen-rescue" },
    { done: state.pointGifts.some((g) => g.userId === ME), label: "Give points", href: "#/allocate" },
    { done: state.users.some((u) => u.referredBy === ME), label: "Invite a friend", href: "#/points" },
    { done: state.projects.some((p) => p.creatorId === ME), label: "Start a project", href: "#/new" },
  ]
  const n = steps.filter((s) => s.done).length
  if (state.me.onboardingDismissed || n === steps.length) return null
  return (
    <Card className="relative flex flex-col items-start gap-3 px-5 py-4 pr-12 md:flex-row md:items-center md:gap-6 md:px-6 md:pr-14">
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
      <button
        onClick={actions.dismissOnboarding}
        className="absolute top-3 right-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer md:top-1/2 md:-translate-y-1/2"
        aria-label="Close onboarding"
      >
        <X size={16} />
      </button>
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
      <div className="space-y-6">
      <Checklist />
      <section>
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-foreground p-6 text-background md:p-10">
          <div className="absolute inset-0 opacity-25">
            <Cover seed={7} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/85 to-transparent" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <History size={13} /> For the projects Artizen left behind
            </div>
            <h1 className="mt-6 max-w-xl font-display text-4xl leading-[1.05] md:text-[54px] md:leading-[1.02] font-semibold tracking-tight">
              Artizen closed. <span className="text-wheat">The projects didn't.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-background/75">
              Community-matched funding, run as a cooperative. Interest on shared reserves pays for matching.
            </p>
          </div>
          <div className="relative mt-8 flex flex-wrap gap-3 md:mt-10">
            <LinkButton href="#/funds" size="lg">
              Explore live rounds <ArrowRight size={16} />
            </LinkButton>
            <LinkButton href="#/new?artizen=1" size="lg" variant="outline" className="border-background/25 bg-transparent text-background hover:bg-background/10">
              Bring your Artizen project
            </LinkButton>
          </div>
        </div>
      </section>
      <MatchingPool />
      </div>

      <section>
        <SectionTitle title="How it works" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
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
                <ArrowRight className="absolute top-1/2 -right-[13px] z-10 hidden -translate-y-1/2 lg:block rounded-full bg-background p-0.5 text-muted-foreground" size={22} />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {funds.map((f) => (
            <FundCard key={f.id} fund={f} />
          ))}
        </div>
      </section>
    </div>
  )
}
