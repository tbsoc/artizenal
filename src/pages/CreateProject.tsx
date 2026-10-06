import { useRef, useState } from "react"
import { ImagePlus, ShieldCheck, History, Sparkles, X } from "lucide-react"
import { ArtizenBadge, Badge, Bread, Button, Card, Field, Input, MechanismBadge, Select, Textarea } from "@/components/ui"
import { Cover } from "@/components/Cover"
import { QuickBake } from "@/components/modals"
import { POINT_RULES, campaignStatus, getFund, useStore } from "@/lib/store"
import { PROJECT_DEPOSIT } from "@/lib/seed"
import { CATEGORIES } from "@/lib/types"
import type { Category } from "@/lib/types"
import { go } from "@/lib/router"
import { cn, num } from "@/lib/utils"

const SEASONS = ["Artizen Season 1", "Artizen Season 2", "Artizen Season 3", "Artizen Season 4", "Artizen Season 5", "Artizen Season 6", "Artizen Season 7"]

/** Downscale an uploaded image so it fits comfortably in browser storage. */
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, 1100 / img.width)
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", 0.78))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function CreateProject({ query }: { query: URLSearchParams }) {
  const { state, actions, toast } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [tagline, setTagline] = useState("")
  const [category, setCategory] = useState<Category>("Art")
  const [location, setLocation] = useState("")
  const [website, setWebsite] = useState("")
  const [goal, setGoal] = useState(5000)
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<string | undefined>()
  const [wasArtizen, setWasArtizen] = useState(query.get("artizen") === "1")
  const [season, setSeason] = useState(SEASONS[5])
  const [artizenUrl, setArtizenUrl] = useState("")
  const [campaignIds, setCampaignIds] = useState<string[]>([])
  const [seed] = useState(() => Math.floor(Math.random() * 1000))

  const openRounds = state.campaigns.filter((c) => campaignStatus(c, state.day) !== "ended" && getFund(state, c.fundId)?.status === "active")
  const valid = title.trim() && tagline.trim() && description.trim().length >= 40 && location.trim() && goal > 0
  const points = POINT_RULES.createProject + (wasArtizen ? POINT_RULES.artizenAlumni : 0)

  const submit = () => {
    const r = actions.createProject({
      title: title.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      website: website.trim() || undefined,
      image,
      goal,
      artizen: wasArtizen ? { season, url: artizenUrl.trim() || undefined } : undefined,
      campaignIds,
    })
    if (!r.ok) return toast(r.error, "err")
    toast(`Project live! ${PROJECT_DEPOSIT} artUSD deposit held, +${num(points)} points`)
    go(`/p/${r.id}`)
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
      <div>
        <h1 className="font-display text-3xl font-semibold md:text-[40px] tracking-tight">Start a project</h1>

        <div className="mt-8 space-y-8">
          <Card className="space-y-5 p-6">
            <div className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">The basics</div>
            <Field label="Project name">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tidepool Atlas" />
            </Field>
            <Field label="One-line pitch">
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="What you're doing, in a sentence" maxLength={90} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Category">
                <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Where">
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or region" />
              </Field>
              <Field label="Funding goal ($)">
                <Input type="number" value={goal || ""} onChange={(e) => setGoal(Number(e.target.value))} />
              </Field>
            </div>
            <Field label="Website (optional)">
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </Field>
          </Card>

          <Card className="space-y-5 p-6">
            <div className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Story & image</div>
            <Field label="Description" hint="40 characters minimum.">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-44" placeholder="What, who for, and what the money pays for" />
            </Field>
            <div>
              <div className="mb-1.5 text-sm font-semibold">Cover image</div>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-40 overflow-hidden rounded-xl border border-border">
                  <Cover seed={seed} image={image} />
                  {image && (
                    <button onClick={() => setImage(undefined)} className="absolute top-1 right-1 rounded-full bg-card/90 p-1 cursor-pointer" aria-label="Remove image">
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div>
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <ImagePlus size={14} /> Upload image
                  </Button>
                  <div className="mt-1.5 text-xs text-muted-foreground">Optional</div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    try {
                      setImage(await readImage(f))
                    } catch {
                      toast("Couldn't read that image", "err")
                    }
                  }}
                />
              </div>
            </div>
          </Card>

          <Card className={cn("p-6 transition", wasArtizen && "border-foreground/30 ring-1 ring-foreground/10")}>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={wasArtizen} onChange={(e) => setWasArtizen(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--primary)]" />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold">
                  <History size={16} /> This project was on Artizen
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">Alumni badge + {num(POINT_RULES.artizenAlumni)} points</div>
              </div>
            </label>
            {wasArtizen && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:pl-7">
                <Field label="Season">
                  <Select value={season} onChange={(e) => setSeason(e.target.value)}>
                    {SEASONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Artizen page link">
                  <Input value={artizenUrl} onChange={(e) => setArtizenUrl(e.target.value)} placeholder="https://artizen.fund/…" />
                </Field>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Enter matching rounds</div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {openRounds.map((c) => {
                const f = getFund(state, c.fundId)!
                const on = campaignIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => setCampaignIds((ids) => (on ? ids.filter((x) => x !== c.id) : [...ids, c.id]))}
                    className={cn("rounded-xl border-2 p-3 text-left transition cursor-pointer", on ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{c.name}</div>
                      <MechanismBadge m={f.mechanism} />
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {f.name} · <Bread value={c.matchingPool} /> pool
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      <aside>
        <div className="sticky top-24 space-y-4">
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Preview</div>
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/10]">
              <Cover seed={seed} image={image} />
              {wasArtizen && <ArtizenBadge className="absolute top-3 left-3" />}
              <Badge tone="outline" className="absolute top-3 right-3 border-0 bg-card/90">{category}</Badge>
            </div>
            <div className="p-4">
              <div className="font-display text-lg font-semibold">{title || "Project name"}</div>
              <div className="mt-1 text-sm text-muted-foreground">{tagline || "One-line pitch"}</div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck size={17} className="text-success" /> Refundable spam deposit
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              <b className="text-foreground">{PROJECT_DEPOSIT} artUSD</b>, returned after 3 backers or 14 days.
            </p>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm">
              <span className="text-muted-foreground">Your balance</span>
              <Bread value={state.me.art.USD} digits={2} className="font-semibold" />
            </div>
            {state.me.art.USD < PROJECT_DEPOSIT && (
              <div className="mt-3">
                <QuickBake need={PROJECT_DEPOSIT} />
              </div>
            )}
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Points for launching</span>
              <span className="flex items-center gap-1 font-semibold text-coop-ink">
                <Sparkles size={14} /> +{num(points)}
              </span>
            </div>
            <Button size="lg" className="mt-5 w-full" disabled={!valid || state.me.art.USD < PROJECT_DEPOSIT} onClick={submit}>
              Put down deposit & publish
            </Button>
            {!valid && <div className="mt-2 text-center text-xs text-muted-foreground">Fill in the name, pitch, place, goal and a short description.</div>}
          </Card>
        </div>
      </aside>
    </div>
  )
}
