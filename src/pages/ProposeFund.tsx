import { useState } from "react"
import { Lock, Scale, Equal, X as Times, Sparkles } from "lucide-react"
import { Bread, Button, Card, Field, Input, LinkButton, Pts, Select, Textarea } from "@/components/ui"
import { Cover } from "@/components/Cover"
import { QuickBake } from "@/components/modals"
import { ME, POINT_RULES, useStore, userPoints } from "@/lib/store"
import { PROPOSE_MIN_POINTS } from "@/lib/seed"
import { MECHANISM_INFO, mechanismLabel } from "@/lib/matching"
import { CATEGORIES } from "@/lib/types"
import type { Category, Mechanism } from "@/lib/types"
import { go } from "@/lib/router"
import { cn, num } from "@/lib/utils"

export function ProposeFund() {
  const { state, actions, toast } = useStore()
  const pts = userPoints(state, ME)
  const [name, setName] = useState("")
  const [tagline, setTagline] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<Category>("Art")
  const [type, setType] = useState<Mechanism["type"]>("qf")
  const [cap, setCap] = useState(50)
  const [x, setX] = useState(2)
  const [pledgeGoal, setPledgeGoal] = useState(1500)
  const [backingGoal, setBackingGoal] = useState(10000)
  const [initialPledge, setInitialPledge] = useState(100)
  const [seed] = useState(() => Math.floor(Math.random() * 1000))

  const mechanism: Mechanism = type === "qf" ? { type } : type === "match" ? { type, cap } : { type, x }
  const locked = pts < PROPOSE_MIN_POINTS

  if (locked) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-coop-ink/8 text-coop-ink">
          <Lock size={28} />
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold">Proposing a fund takes {num(PROPOSE_MIN_POINTS)} points earned</h1>
        <p className="mt-3 text-muted-foreground">
          You've earned <Pts value={pts} className="font-semibold text-foreground" />.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <LinkButton href="#/points">How to earn points</LinkButton>
          <LinkButton href="#/funds" variant="outline">
            Browse funds
          </LinkButton>
        </div>
      </div>
    )
  }

  const submit = () => {
    const r = actions.proposeFund({ name: name.trim(), tagline: tagline.trim(), description: description.trim(), category, mechanism, pledgeGoal, backingGoal, initialPledge })
    if (!r.ok) return toast(r.error, "err")
    toast(`${name} proposed! +${num(POINT_RULES.proposeFund + initialPledge * POINT_RULES.perFundBread)} points`)
    go(`/f/${r.id}`)
  }

  const MECHS: { id: Mechanism["type"]; icon: typeof Scale }[] = [
    { id: "qf", icon: Scale },
    { id: "match", icon: Equal },
    { id: "multiplier", icon: Times },
  ]

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
      <div>
        <h1 className="font-display text-3xl font-semibold md:text-[40px] tracking-tight">Propose a fund</h1>
        <p className="mt-1 text-muted-foreground">Launches once it hits its BREAD and points goals.</p>
        <div className="mt-8 space-y-6">
          <Card className="space-y-5 p-6">
            <Field label="Fund name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Queer Archives Fund" />
            </Field>
            <Field label="Tagline">
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="What kind of work will it support?" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[200px_1fr]">
              <Field label="Category">
                <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Description">
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Who it's for and how you'll pick projects" />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold">Matching formula</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {MECHS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setType(m.id)}
                  className={cn("rounded-2xl border-2 p-4 text-left transition cursor-pointer", type === m.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30")}
                >
                  <m.icon size={18} className="text-coop-ink" />
                  <div className="mt-2 font-semibold">{MECHANISM_INFO[m.id].name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{MECHANISM_INFO[m.id].explain}</div>
                </button>
              ))}
            </div>
            {type === "match" && (
              <div className="mt-4 w-full sm:w-64">
                <Field label="Cap per donor per project (BREAD)">
                  <Input type="number" value={cap} onChange={(e) => setCap(Math.max(1, Number(e.target.value)))} />
                </Field>
              </div>
            )}
            {type === "multiplier" && (
              <div className="mt-4 w-full sm:w-64">
                <Field label="Multiplier">
                  <Select value={x} onChange={(e) => setX(Number(e.target.value))}>
                    {[1.5, 2, 3, 5].map((v) => (
                      <option key={v} value={v}>
                        {v}×
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold">Launch conditions</div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Pledge goal (BREAD)">
                <Input type="number" value={pledgeGoal} onChange={(e) => setPledgeGoal(Math.max(0, Number(e.target.value)))} />
              </Field>
              <Field label="Points goal">
                <Input type="number" value={backingGoal} onChange={(e) => setBackingGoal(Math.max(0, Number(e.target.value)))} />
              </Field>
              <Field label="Your own pledge (BREAD)" hint={`Earns ${POINT_RULES.perFundBread} pts per BREAD`}>
                <Input type="number" value={initialPledge} onChange={(e) => setInitialPledge(Math.max(0, Number(e.target.value)))} />
              </Field>
            </div>
            {initialPledge > state.me.bread && (
              <div className="mt-4">
                <QuickBake need={initialPledge} />
              </div>
            )}
          </Card>
        </div>
      </div>

      <aside>
        <div className="sticky top-24 space-y-4">
          <Card className="overflow-hidden">
            <div className="h-28">
              <Cover seed={seed} />
            </div>
            <div className="p-5">
              <div className="font-display text-xl font-semibold">{name || "Your fund"}</div>
              <div className="mt-1 text-sm text-muted-foreground">{tagline || "Tagline"}</div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formula</span>
                  <span className="font-medium">{mechanismLabel(mechanism)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Needs</span>
                  <span className="font-medium">
                    {num(pledgeGoal)} BREAD + {num(backingGoal)} pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your pledge</span>
                  <Bread value={initialPledge} className="font-medium" />
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-5 text-sm">
            <div className="flex items-center gap-2 font-semibold text-coop-ink">
              <Sparkles size={15} /> +{num(POINT_RULES.proposeFund + initialPledge * POINT_RULES.perFundBread)} points
            </div>
            <div className="mt-1 text-muted-foreground">for proposing and pledging. You'll be the fund's first curator.</div>
            <Button size="lg" className="mt-4 w-full" disabled={!name.trim() || !tagline.trim() || initialPledge > state.me.bread} onClick={submit}>
              Propose fund
            </Button>
          </Card>
        </div>
      </aside>
    </div>
  )
}
