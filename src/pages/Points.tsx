import { Copy, UserPlus, Trophy, HandCoins, Landmark, Rocket, History, Vote, Sprout, Users, Star } from "lucide-react"
import { Avatar, Button, Card, Pts, SectionTitle, Badge, PointsTabs } from "@/components/ui"
import { ME, POINT_RULES, pointsBalance, pointsGiven, useStore, userPoints } from "@/lib/store"
import { PROPOSE_MIN_POINTS } from "@/lib/seed"
import { cn, dayLabel, num } from "@/lib/utils"

const TIERS = [
  { name: "Crumb", min: 0 },
  { name: "Starter", min: 500 },
  { name: "Loaf", min: PROPOSE_MIN_POINTS },
  { name: "Baker", min: 2500 },
  { name: "Head Baker", min: 5000 },
  { name: "Guild", min: 10000 },
]

const EARN = [
  { icon: HandCoins, title: "Back a project", value: `${POINT_RULES.perBread} per $1`, note: "Matched" },
  { icon: Landmark, title: "Give to a fund", value: `${POINT_RULES.perFundBread} per $1`, note: "Double points" },
  { icon: UserPlus, title: "Invite a friend", value: `${POINT_RULES.referral} + 10%`, note: "Plus 10% of theirs" },
  { icon: Star, title: "Be an early backer", value: `+${POINT_RULES.earlyBacker}`, note: `First ${POINT_RULES.earlyBackerSlots} donors` },
  { icon: Sprout, title: "Hold pas tokens", value: "1 per $10 / day", note: "Daily" },
  { icon: Rocket, title: "Launch a project", value: `+${POINT_RULES.createProject}`, note: "One time" },
  { icon: Landmark, title: "Endow the Wealth Fund", value: `${POINT_RULES.perEndowedUsd} per $1`, note: "Permanent" },
  { icon: History, title: "Artizen alumni", value: `+${num(POINT_RULES.artizenAlumni)}`, note: "One time" },
  { icon: Vote, title: "Curate", value: `+${POINT_RULES.proposeFund} / +${POINT_RULES.curate}`, note: "Propose a fund / run a round" },
]

const REASON_LABEL: Record<string, string> = {
  welcome: "Welcome",
  referral: "Referral",
  "referral-bonus": "Referral share",
  "donate-bread": "Donation",
  "donate-fund": "Fund gift",
  "early-backer": "Early backer",
  holding: "Holding",
  "create-project": "New project",
  "artizen-alumni": "Artizen alumni",
  "propose-fund": "Proposed fund",
  curate: "Curation",
  endow: "Endowment",
  seed: "Earlier activity",
}

export function Points() {
  const { state, actions, toast } = useStore()
  const pts = userPoints(state, ME)
  const balance = pointsBalance(state, ME)
  const given = pointsGiven(state, ME)
  const tierIdx = TIERS.reduce((acc, t, i) => (pts >= t.min ? i : acc), 0)
  const tier = TIERS[tierIdx]
  const next = TIERS[tierIdx + 1]
  const history = state.points.filter((p) => p.userId === ME).reverse()
  const referrals = state.users.filter((u) => u.referredBy === ME)
  const referralEarned = state.points.filter((p) => p.userId === ME && (p.reason === "referral" || p.reason === "referral-bonus")).reduce((a, p) => a + p.amount, 0)
  const leaderboard = state.users.map((u) => ({ u, pts: userPoints(state, u.id) })).sort((a, b) => b.pts - a.pts)
  const myRank = leaderboard.findIndex((r) => r.u.id === ME) + 1
  const link = `pastry.coop/join/${state.me.referralCode}`

  return (
    <div className="space-y-8">
      <div>
      <PointsTabs active="earn" />
      <SectionTitle title="Points" sub="Earned, never bought. Give them to funds to split the yield." />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="relative overflow-hidden bg-coop-ink p-8 text-white">
          <div className="absolute -right-10 -bottom-16 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute right-20 -top-20 h-48 w-48 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/15 text-white">{tier.name}</Badge>
              <span className="text-sm text-white/70">Rank #{myRank} of {leaderboard.length}</span>
            </div>
            <div className="mt-4 font-display text-5xl leading-none md:text-[64px] font-semibold tabular-nums">{num(balance)}</div>
            <div className="mt-2 text-white/70">
              points to give · {num(pts)} earned all-time · {num(given)} given to funds
            </div>
            {next && (
              <div className="mt-6 max-w-md">
                <div className="mb-1.5 flex justify-between text-xs text-white/70">
                  <span>{tier.name}</span>
                  <span>
                    {num(next.min - pts)} to {next.name}
                    {next.min === PROPOSE_MIN_POINTS && " (unlocks proposing funds)"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-wheat" style={{ width: `${((pts - tier.min) / (next.min - tier.min)) * 100}%` }} />
                </div>
              </div>
            )}
            <div className="mt-6 flex gap-2">
              <a href="#/allocate" className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-coop-ink">
                <Vote size={15} /> Give points to funds
              </a>
              {pts >= PROPOSE_MIN_POINTS && (
                <a href="#/propose" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/30 px-4 text-sm font-semibold">
                  <Rocket size={15} /> Propose a fund
                </a>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 font-semibold">
            <Users size={17} /> Invite friends
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            You get <b className="text-foreground">{POINT_RULES.referral} points</b> when a friend joins, plus <b className="text-foreground">10%</b> of every point
            they earn, for good.
          </p>
          <div className="mt-4 flex gap-2">
            <div className="flex h-10 flex-1 items-center rounded-xl border border-border bg-muted px-3 font-mono text-sm">{link}</div>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard?.writeText(`https://${link}`).catch(() => {})
                toast("Invite link copied")
              }}
            >
              <Copy size={14} /> Copy
            </Button>
          </div>
          <Button
            variant="dark"
            className="mt-3 w-full"
            onClick={() => {
              const name = actions.simulateReferral()
              toast(`${name} joined with your link! +${POINT_RULES.referral} points`)
            }}
          >
            <UserPlus size={15} /> Simulate a friend joining
          </Button>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
            <span className="text-muted-foreground">
              {referrals.length} friend{referrals.length === 1 ? "" : "s"} joined
            </span>
            <span>
              earned you <Pts value={referralEarned} className="font-semibold" />
            </span>
          </div>
          {referrals.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {referrals.map((u) => (
                <div key={u.id} className="flex items-center gap-1.5 rounded-full bg-muted py-1 pr-3 pl-1 text-xs font-medium">
                  <Avatar user={u} size={22} />
                  {u.name} · {num(userPoints(state, u.id))}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div>
        <h3 className="mb-4 font-display text-2xl font-semibold">Ways to earn</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EARN.map((e) => (
            <Card key={e.title} className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wheat/30 text-crust">
                <e.icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{e.title}</div>
                <div className="text-xs text-muted-foreground">{e.note}</div>
              </div>
              <div className="text-right text-sm font-semibold whitespace-nowrap text-coop-ink">{e.value}</div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <h3 className="mb-4 font-display text-2xl font-semibold">Your history</h3>
          <Card className="divide-y divide-border">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                <Badge tone="ink" className="w-28 justify-center">{REASON_LABEL[h.reason]}</Badge>
                <div className="flex-1">{h.note}</div>
                <div className="text-xs text-muted-foreground">{dayLabel(h.day, state.day)}</div>
                <div className="w-16 text-right font-semibold text-coop-ink tabular-nums">+{num(h.amount)}</div>
              </div>
            ))}
          </Card>
        </div>
        <div>
          <h3 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold">
            <Trophy size={20} className="text-crust" /> Leaderboard
          </h3>
          <Card className="divide-y divide-border">
            {leaderboard.slice(0, 12).map((r, i) => (
              <div key={r.u.id} className={cn("flex items-center gap-3 px-4 py-2.5 text-sm", r.u.id === ME && "bg-primary/6")}>
                <div className="w-5 text-xs font-semibold text-muted-foreground">{i + 1}</div>
                <Avatar user={r.u} size={28} />
                <div className="flex-1 font-medium">{r.u.id === ME ? "You" : r.u.name}</div>
                <Pts value={r.pts} className="font-semibold" />
              </div>
            ))}
            {myRank > 12 && (
              <div className="flex items-center gap-3 bg-primary/6 px-4 py-2.5 text-sm">
                <div className="w-5 text-xs font-semibold text-muted-foreground">{myRank}</div>
                <Avatar user={state.users.find((u) => u.id === ME)} size={28} />
                <div className="flex-1 font-medium">You</div>
                <Pts value={pts} className="font-semibold" />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
