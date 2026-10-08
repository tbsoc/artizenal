import { useState } from "react"
import { ArrowLeft, Globe, MapPin, ShieldCheck, Megaphone, Plus, Check, ExternalLink, Clock } from "lucide-react"
import { ArtizenBadge, Avatar, Badge, Bread, Button, Card, Empty, MechanismBadge, Progress, Select, StatusPill, Tabs, Textarea } from "@/components/ui"
import { Cover } from "@/components/Cover"
import { CreatorEarnings } from "@/components/Earnings"
import { DonateModal } from "@/components/modals"
import {
  ME,
  campaignStatus,
  getFund,
  getProject,
  getUser,
  projectCampaigns,
  projectStats,
  useStore,
} from "@/lib/store"
import { campaignMatches } from "@/lib/matching"
import { dayLabel, usd } from "@/lib/utils"

export function ProjectPage({ id }: { id: string }) {
  const { state, actions, toast } = useStore()
  const project = getProject(state, id)
  const [donateOpen, setDonateOpen] = useState(false)
  const [donateCampaign, setDonateCampaign] = useState<string | undefined>()
  const [tab, setTab] = useState<"about" | "updates" | "donors">("about")
  const [update, setUpdate] = useState("")
  const [joinId, setJoinId] = useState("")

  if (!project) return <Empty>That project doesn't exist. <a className="text-primary underline" href="#/projects">Back to projects</a></Empty>

  const stats = projectStats(state, project.id)
  const creator = getUser(state, project.creatorId)
  const mine = project.creatorId === ME
  if (mine && !state.me.seenProject) queueMicrotask(actions.seeProject)
  const campaigns = projectCampaigns(state, project.id).sort((a, b) => b.endDay - a.endDay)
  const joinable = state.campaigns.filter(
    (c) => !c.projectIds.includes(project.id) && campaignStatus(c, state.day) !== "ended" && getFund(state, c.fundId)?.status === "active"
  )
  const donorList = Object.entries(
    stats.donations.reduce<Record<string, { bread: number; last: number }>>((m, d) => {
      const e = (m[d.from] ??= { bread: 0, last: 0 })
      e.bread += d.amount
      e.last = Math.max(e.last, d.day)
      return m
    }, {})
  ).sort((a, b) => b[1].last - a[1].last)

  const openDonate = (cid?: string) => {
    setDonateCampaign(cid)
    setDonateOpen(true)
  }

  return (
    <div>
      <a href="#/projects" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> All projects
      </a>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
        <div className="min-w-0">
          <div className="relative aspect-[16/8] overflow-hidden rounded-3xl bg-muted">
            <Cover seed={project.coverSeed} image={project.image} />
            {project.artizen && <ArtizenBadge season={project.artizen.season} className="absolute top-4 left-4 px-3 py-1 text-xs" />}
          </div>
          <div className="mt-7 flex items-center gap-2">
            <Badge tone="outline">{project.category}</Badge>
            {project.artizen && (
              <Badge tone="muted" className="gap-1">
                Previously on {project.artizen.season}
                {project.artizen.url && (
                  <a href={project.artizen.url} target="_blank" rel="noreferrer" className="hover:text-foreground">
                    <ExternalLink size={11} />
                  </a>
                )}
              </Badge>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl leading-tight md:text-[44px] font-semibold tracking-tight">{project.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{project.tagline}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Avatar user={creator} size={30} />
              <div>
                <div className="font-semibold">{mine ? "You" : creator?.name}</div>
                <div className="text-xs text-muted-foreground">Creator</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin size={15} /> {project.location}
            </div>
            {project.website && (
              <a href={project.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <Globe size={15} /> Website
              </a>
            )}
          </div>

          {mine && (
            <div className="mt-8">
              <CreatorEarnings project={project} />
            </div>
          )}

          <div className="mt-8 border-b border-border pb-3">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { id: "about", label: "About" },
                { id: "updates", label: `Updates (${project.updates.length})` },
                { id: "donors", label: `Donors (${donorList.length})` },
              ]}
            />
          </div>

          {tab === "about" && (
            <div className="prose-body mt-6 max-w-2xl text-[16px] leading-[1.75] text-foreground/90">
              {project.description.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {tab === "updates" && (
            <div className="mt-6 max-w-2xl space-y-4">
              {mine && (
                <Card className="p-4">
                  <Textarea value={update} onChange={(e) => setUpdate(e.target.value)} placeholder="Share progress with your backers…" className="min-h-20" />
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      disabled={!update.trim()}
                      onClick={() => {
                        actions.postUpdate(project.id, update)
                        setUpdate("")
                        toast("Update posted")
                      }}
                    >
                      <Megaphone size={14} /> Post update
                    </Button>
                  </div>
                </Card>
              )}
              {[...project.updates].reverse().map((u, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Day {u.day} · {dayLabel(u.day, state.day)}</div>
                    <div className="mt-1">{u.text}</div>
                  </div>
                </div>
              ))}
              {!project.updates.length && <Empty>No updates yet.</Empty>}
            </div>
          )}

          {tab === "donors" && (
            <Card className="mt-6 max-w-2xl divide-y divide-border">
              {donorList.map(([uid, d]) => {
                const u = getUser(state, uid)
                return (
                  <div key={uid} className="flex items-center gap-3 px-4 py-3">
                    <Avatar user={u} size={30} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{uid === ME ? "You" : u?.name}</div>
                      <div className="text-xs text-muted-foreground">{dayLabel(d.last, state.day)}</div>
                    </div>
                    <div className="text-right text-sm">
                      {d.bread > 0 && <Bread value={d.bread} className="font-semibold" />}
                    </div>
                  </div>
                )
              })}
              {!donorList.length && <div className="p-6 text-center text-sm text-muted-foreground">Be the first to back this project.</div>}
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="sticky top-24 p-6">
            <div className="font-display text-4xl font-semibold tabular-nums">{usd(stats.total + stats.pendingMatch)}</div>
            <div className="mt-1 text-sm text-muted-foreground">raised of {usd(project.goal)} goal</div>
            <Progress value={(stats.total / project.goal) * 100} extra={(stats.pendingMatch / project.goal) * 100} className="mt-4 h-2.5" />
            <div className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Donated</div>
                <Bread value={stats.bread} className="font-semibold" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Matching paid</div>
                <Bread value={stats.matched} className="font-semibold text-community" />
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-community/70" /> Pending match
                </div>
                <Bread value={stats.pendingMatch} className="font-semibold text-community" />
              </div>
            </div>
            <Button size="lg" className="mt-6 w-full" onClick={() => openDonate()}>
              Back this project
            </Button>
            <div className="mt-3 text-center text-xs text-muted-foreground">{stats.donors} people have backed this project</div>

            <div className="mt-6 border-t border-border pt-5">
              <div className="mb-3 text-sm font-semibold">Matching rounds</div>
              <div className="space-y-2.5">
                {campaigns.map((c) => {
                  const f = getFund(state, c.fundId)!
                  const st = campaignStatus(c, state.day)
                  const m = campaignMatches(c, f.mechanism, state.donations).matches[project.id] ?? 0
                  const inCart = state.cart.some((i) => i.projectId === project.id && i.campaignId === c.id)
                  return (
                    <div key={c.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <a href={`#/f/${f.id}?c=${c.id}`} className="truncate text-sm font-semibold hover:underline">
                          {c.name}
                        </a>
                        <StatusPill status={st} />
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {f.name} <MechanismBadge m={f.mechanism} />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs">
                          {st === "ended" ? "Matched " : st === "live" ? "Est. match " : "Pool "}
                          <Bread value={st === "upcoming" ? c.matchingPool : m} className="font-semibold text-community" />
                        </div>
                        {st === "live" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => {
                              if (!inCart) {
                                actions.addToCart(project.id, c.id)
                                toast("Added to your basket")
                              }
                            }}>
                              {inCart ? <Check size={13} /> : <Plus size={13} />} {inCart ? "In basket" : "Collect"}
                            </Button>
                            <Button size="sm" onClick={() => openDonate(c.id)}>Give</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {!campaigns.length && <div className="text-xs text-muted-foreground">Not in any rounds yet.</div>}
              </div>
              {mine && joinable.length > 0 && (
                <div className="mt-3 flex gap-2">
                  <Select value={joinId} onChange={(e) => setJoinId(e.target.value)} className="h-9 text-xs">
                    <option value="">Enter a round…</option>
                    {joinable.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({getFund(state, c.fundId)?.name})
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="sm"
                    variant="dark"
                    disabled={!joinId}
                    onClick={() => {
                      actions.joinCampaign(project.id, joinId)
                      setJoinId("")
                      toast("Project entered into the round")
                    }}
                  >
                    Enter
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              {project.deposit.status === "held" ? <Clock size={16} className="shrink-0 text-primary" /> : <ShieldCheck size={16} className="shrink-0 text-success" />}
              <div>
                <div className="font-semibold text-foreground">
                  {project.deposit.status === "held"
                    ? `${project.deposit.amount} pasUSD spam deposit held`
                    : project.deposit.status === "refunded"
                      ? "Spam deposit returned"
                      : "Deposit forfeited to the commons"}
                </div>
                {project.deposit.status === "held"
                  ? "Returned after 3 backers or 14 days."
                  : ""}
              </div>
            </div>
          </Card>
        </aside>
      </div>
      <DonateModal key={`${donateCampaign}-${donateOpen}`} project={project} open={donateOpen} onClose={() => setDonateOpen(false)} defaultCampaignId={donateCampaign} />
    </div>
  )
}
