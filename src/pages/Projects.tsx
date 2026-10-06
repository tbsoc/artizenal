import { useMemo, useState } from "react"
import { Plus, Search, History, Radio } from "lucide-react"
import { Input, LinkButton, SectionTitle, Empty } from "@/components/ui"
import { ProjectCard } from "@/components/cards"
import { campaignStatus, projectStats, useStore } from "@/lib/store"
import { CATEGORIES } from "@/lib/types"
import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"

type Sort = "backed" | "new" | "goal"

export function Projects({ query }: { query: URLSearchParams }) {
  const { state } = useStore()
  const [q, setQ] = useState("")
  const [cat, setCat] = useState<Category | "All">("All")
  const [alumni, setAlumni] = useState(query.get("artizen") === "1")
  const [liveOnly, setLiveOnly] = useState(false)
  const [sort, setSort] = useState<Sort>("backed")

  const liveIds = useMemo(
    () => new Set(state.campaigns.filter((c) => campaignStatus(c, state.day) === "live").flatMap((c) => c.projectIds)),
    [state.campaigns, state.day]
  )

  const list = state.projects
    .filter((p) => cat === "All" || p.category === cat)
    .filter((p) => !alumni || p.artizen)
    .filter((p) => !liveOnly || liveIds.has(p.id))
    .filter((p) => !q || `${p.title} ${p.tagline} ${p.location}`.toLowerCase().includes(q.toLowerCase()))
    .map((p) => ({ p, s: projectStats(state, p.id) }))
    .sort((a, b) =>
      sort === "backed" ? b.s.donors - a.s.donors : sort === "new" ? b.p.createdDay - a.p.createdDay : b.s.total / b.p.goal - a.s.total / a.p.goal
    )

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition cursor-pointer",
      active ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted"
    )

  return (
    <div>
      <SectionTitle
        title="Projects"
        sub={`${state.projects.length} projects`}
        action={
          <LinkButton href="#/new" size="md">
            <Plus size={16} /> Start a project
          </LinkButton>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects or places" className="pl-10" />
        </div>
        <button className={chip(alumni)} onClick={() => setAlumni((v) => !v)}>
          <History size={14} /> Artizen alumni
        </button>
        <button className={chip(liveOnly)} onClick={() => setLiveOnly((v) => !v)}>
          <Radio size={14} /> In a live round
        </button>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          Sort
          {(
            [
              ["backed", "Most backed"],
              ["goal", "Closest to goal"],
              ["new", "Newest"],
            ] as [Sort, string][]
          ).map(([k, l]) => (
            <button key={k} onClick={() => setSort(k)} className={cn("rounded-full px-2.5 py-1 font-medium cursor-pointer", sort === k ? "bg-muted text-foreground" : "hover:text-foreground")}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(["All", ...CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn("rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer", cat === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
            {c}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map(({ p }) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <Empty>No projects match those filters.</Empty>
      )}
    </div>
  )
}
