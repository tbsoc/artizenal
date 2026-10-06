import { MapPin, Plus, Check } from "lucide-react"
import { Cover } from "./Cover"
import { ArtizenBadge, Avatar, Badge, Bread, Card, MechanismBadge, Progress, StatusPill, Pts } from "./ui"
import {
  campaignStatus,
  fundSeasonPoints,
  fundTotalPoints,
  fundPledged,
  getFund,
  getUser,
  projectStats,
  useStore,
} from "@/lib/store"
import { campaignMatches } from "@/lib/matching"
import type { Campaign, Fund, Project } from "@/lib/types"
import { cn, num } from "@/lib/utils"

export function ProjectCard({ project, campaign, className }: { project: Project; campaign?: Campaign; className?: string }) {
  const { state, actions, toast } = useStore()
  const stats = projectStats(state, project.id)
  const creator = getUser(state, project.creatorId)
  const raised = stats.total + stats.pendingMatch
  const inCart = campaign && state.cart.some((i) => i.projectId === project.id && i.campaignId === campaign.id)
  const live = campaign && campaignStatus(campaign, state.day) === "live"
  const fund = campaign && getFund(state, campaign.fundId)
  const campaignMatch = campaign && fund ? campaignMatches(campaign, fund.mechanism, state.donations).matches[project.id] ?? 0 : 0

  return (
    <Card className={cn("group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg", className)}>
      <a href={`#/p/${project.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <Cover seed={project.coverSeed} image={project.image} className="transition duration-500 group-hover:scale-[1.03]" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            {project.artizen && <ArtizenBadge season={project.artizen.season} />}
          </div>
          <Badge tone="outline" className="absolute top-3 right-3 border-0 bg-card/90">
            {project.category}
          </Badge>
        </div>
        <div className="p-4">
          <h3 className="font-display text-lg leading-snug font-semibold">{project.title}</h3>
          <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">{project.tagline}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar user={creator} size={20} />
            <span className="truncate">{creator?.name}</span>
            <span className="text-border">•</span>
            <MapPin size={12} />
            <span className="truncate">{project.location}</span>
          </div>
          <div className="mt-4">
            <Progress value={(stats.total / project.goal) * 100} extra={(stats.pendingMatch / project.goal) * 100} />
            <div className="mt-2 flex items-baseline justify-between text-xs">
              <span>
                <span className="text-sm font-semibold text-foreground">${num(raised)}</span>
                <span className="text-muted-foreground"> of ${num(project.goal)}</span>
              </span>
              <span className="text-muted-foreground">{stats.donors} donors</span>
            </div>
          </div>
        </div>
      </a>
      {campaign && (
        <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/40 px-4 py-3">
          <div className="text-xs">
            <div className="text-muted-foreground">{live ? "Est. match so far" : "Match"}</div>
            <Bread value={campaignMatch} className="font-semibold text-community" />
          </div>
          {live && (
            <button
              onClick={() => {
                if (inCart) return
                actions.addToCart(project.id, campaign.id)
                toast(`${project.title} added to your basket`)
              }}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition cursor-pointer",
                inCart ? "bg-community/12 text-community" : "bg-foreground text-background hover:opacity-90"
              )}
            >
              {inCart ? <Check size={14} /> : <Plus size={14} />}
              {inCart ? "In basket" : "Collect"}
            </button>
          )}
        </div>
      )}
    </Card>
  )
}

export function FundCard({ fund }: { fund: Fund }) {
  const { state } = useStore()
  const campaigns = state.campaigns.filter((c) => c.fundId === fund.id)
  const live = campaigns.filter((c) => campaignStatus(c, state.day) === "live")
  const livePool = live.reduce((a, c) => a + c.matchingPool, 0)
  const backing = fund.status === "active" ? fundSeasonPoints(state, fund.id) : fundTotalPoints(state, fund.id)
  const pledged = fundPledged(state, fund.id)
  const curators = fund.curators.map((id) => getUser(state, id))

  return (
    <a href={`#/f/${fund.id}`} className="group block">
      <Card className="h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="relative h-28 overflow-hidden">
          <Cover seed={fund.coverSeed} />
          <div className="absolute inset-x-3 bottom-3 flex items-center gap-1.5">
            <MechanismBadge m={fund.mechanism} />
            {fund.status === "proposed" ? (
              <Badge tone="primary" className="bg-card/95">Proposed</Badge>
            ) : live.length ? (
              <Badge tone="success" className="bg-card/95">{live.length} live round{live.length > 1 ? "s" : ""}</Badge>
            ) : null}
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-display text-xl font-semibold">{fund.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{fund.tagline}</p>
          {fund.status === "active" ? (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Live matching</div>
                <Bread value={livePool} className="font-semibold" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Points this season</div>
                <Pts value={backing} className="font-semibold" />
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2.5 text-xs">
              <div>
                <div className="mb-1 flex justify-between text-muted-foreground">
                  <span>Pledged</span>
                  <span>
                    {num(pledged)} / {num(fund.pledgeGoal)} BREAD
                  </span>
                </div>
                <Progress value={(pledged / fund.pledgeGoal) * 100} />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-muted-foreground">
                  <span>Points given</span>
                  <span>
                    {num(backing)} / {num(fund.backingGoal)}
                  </span>
                </div>
                <Progress value={(backing / fund.backingGoal) * 100} barClass="bg-coop-ink" />
              </div>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex -space-x-2">
              {curators.map((u, i) => (
                <Avatar key={u?.id ?? i} user={u} size={22} />
              ))}
            </div>
            Curated by {curators.map((u) => u?.name.split(" ")[0]).join(", ")}
          </div>
        </div>
      </Card>
    </a>
  )
}

export function CampaignRow({ campaign }: { campaign: Campaign }) {
  const { state } = useStore()
  const fund = getFund(state, campaign.fundId)!
  const status = campaignStatus(campaign, state.day)
  const daysLeft = campaign.endDay - state.day
  return (
    <a href={`#/f/${fund.id}?c=${campaign.id}`} className="block">
      <Card className="flex items-center gap-4 p-3 pr-5 transition hover:shadow-md">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl">
          <Cover seed={fund.coverSeed} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusPill status={status} />
            <MechanismBadge m={fund.mechanism} />
          </div>
          <div className="mt-1 truncate font-semibold">{campaign.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {fund.name} · {campaign.projectIds.length} projects ·{" "}
            {status === "live" ? `${daysLeft} days left` : status === "upcoming" ? `opens in ${campaign.startDay - state.day} days` : "ended"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Matching pool</div>
          <Bread value={campaign.matchingPool} className="text-lg font-semibold" />
        </div>
      </Card>
    </a>
  )
}
