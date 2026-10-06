import { useMemo, useState } from "react"
import { ArrowRight, X, CircleDollarSign, PartyPopper, ShoppingBasket, Trash2, Info, Sparkles, ScrollText, Scale, ShieldCheck } from "lucide-react"
import { Bread, BreadLogo, Button, Field, Input, Loaf, Modal, Pts, Select, MechanismBadge } from "./ui"
import { Cover } from "./Cover"
import { POINT_RULES, campaignStatus, getFund, getProject, ME, useStore } from "@/lib/store"
import { basketMatch, marginalMatch, MECHANISM_INFO } from "@/lib/matching"
import type { Currency, Fund, Project } from "@/lib/types"
import { cn, num } from "@/lib/utils"

const PRESETS = [5, 10, 25, 50, 100]

/** Inline helper shown when the user doesn't have enough BREAD. */
export function QuickBake({ need }: { need: number }) {
  const { state, actions, toast } = useStore()
  const amt = Math.min(Math.max(Math.ceil(need - state.me.bread), 50), Math.floor(state.me.usdc))
  if (need <= state.me.bread) return null
  if (amt <= 0)
    return (
      <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        You need <Bread value={need} className="font-semibold text-foreground" /> and your wallet is out of USDC to convert.
      </div>
    )
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-wheat/25 px-4 py-3 text-sm">
      <div>
        You have <Bread value={state.me.bread} className="font-semibold" />. Convert USDC into BREAD 1:1?
      </div>
      <Button
        size="sm"
        variant="dark"
        onClick={() => {
          const r = actions.bake(amt)
          if (r.ok) toast(`Converted ${amt} USDC into BREAD`)
          else toast(r.error, "err")
        }}
      >
        <Loaf size={14} /> Convert {amt}
      </Button>
    </div>
  )
}

export function DonateModal({
  project,
  open,
  onClose,
  defaultCampaignId,
}: {
  project: Project
  open: boolean
  onClose: () => void
  defaultCampaignId?: string
}) {
  const { state, actions, toast } = useStore()
  const liveCampaigns = state.campaigns.filter(
    (c) => c.projectIds.includes(project.id) && campaignStatus(c, state.day) === "live"
  )
  const [currency, setCurrency] = useState<Currency>("BREAD")
  const [amount, setAmount] = useState(25)
  const [campaignId, setCampaignId] = useState<string>(
    defaultCampaignId && liveCampaigns.some((c) => c.id === defaultCampaignId) ? defaultCampaignId : liveCampaigns[0]?.id ?? ""
  )
  const [done, setDone] = useState<null | { amount: number; match: number; points: number }>(null)

  const campaign = liveCampaigns.find((c) => c.id === campaignId)
  const fund = campaign ? getFund(state, campaign.fundId) : undefined
  const match =
    currency === "BREAD" && campaign && fund && amount > 0
      ? marginalMatch(campaign, fund.mechanism, state.donations, project.id, ME, amount)
      : 0
  const points = Math.round(amount * (currency === "BREAD" ? POINT_RULES.perBread : POINT_RULES.perUsdc))
  const balance = currency === "BREAD" ? state.me.bread : state.me.usdc

  const close = () => {
    setDone(null)
    onClose()
  }

  const submit = () => {
    const r = actions.donate(project.id, amount, currency, campaign?.id)
    if (!r.ok) return toast(r.error, "err")
    setDone({ amount, match, points })
  }

  return (
    <Modal open={open} onClose={close} title={done ? null : `Back ${project.title}`} width={560}>
      {done ? (
        <div className="py-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-community/12 text-community">
            <PartyPopper size={30} />
          </div>
          <h3 className="mt-4 font-display text-2xl font-semibold">Thank you!</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            You gave {currency === "BREAD" ? `${done.amount} BREAD` : `${done.amount} USDC`} to {project.title}
            {done.match > 0.5 && (
              <>
                , which unlocked about <b className="text-community">{num(done.match)} BREAD</b> in matching
              </>
            )}
            .
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-coop-ink/8 px-4 py-2 text-sm font-semibold text-coop-ink">
            <Sparkles size={15} /> +{num(done.points)} points
          </div>
          <div className="mt-6">
            <Button onClick={close} variant="dark">
              Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {(["BREAD", "USDC"] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={cn(
                  "rounded-2xl border-2 p-3.5 text-left transition cursor-pointer",
                  currency === c ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {c === "BREAD" ? <Loaf size={18} /> : <CircleDollarSign size={17} className="text-coop-ink" />}
                  {c === "BREAD" ? "Give BREAD" : "Give USDC"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {c === "BREAD" ? `Counts for matching · ${POINT_RULES.perBread} pts per BREAD` : `Not matched · ${POINT_RULES.perUsdc} pts per USDC`}
                </div>
              </button>
            ))}
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">Amount</div>
            <div className="flex gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(p)}
                  className={cn(
                    "h-10 flex-1 rounded-xl border text-sm font-semibold transition cursor-pointer",
                    amount === p ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              ))}
              <Input
                type="number"
                min={1}
                value={amount || ""}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="h-10 w-28"
                aria-label="Custom amount"
              />
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">
              Balance: {currency === "BREAD" ? `${num(balance, 2)} BREAD` : `${num(balance, 2)} USDC`}
            </div>
          </div>

          {currency === "BREAD" && (
            <>
              {liveCampaigns.length > 0 ? (
                <Field label="Count toward round">
                  <Select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
                    {liveCampaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {getFund(state, c.fundId)?.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <div className="flex gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  This project isn't in a live matching round right now. Your BREAD still goes straight to the project.
                </div>
              )}
              {campaign && fund && (
                <div className="rounded-2xl border border-community/25 bg-community/6 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Estimated match unlocked</div>
                    <MechanismBadge m={fund.mechanism} />
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <Bread value={match} digits={match < 10 ? 2 : 0} className="font-display text-3xl font-semibold text-community" />
                    {amount > 0 && match > 0 && (
                      <span className="text-sm text-muted-foreground">({(match / amount).toFixed(2)}× your gift)</span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {MECHANISM_INFO[fund.mechanism.type].explain}
                    {fund.mechanism.type === "qf" && " This is an estimate at today's rate. Final matches are set when the round closes."}
                  </div>
                </div>
              )}
              {amount > state.me.bread && <QuickBake need={amount} />}
            </>
          )}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm font-semibold text-coop-ink">
              <Pts value={points} /> points
            </span>
            <Button size="lg" onClick={submit} disabled={amount <= 0 || amount > balance}>
              Give {num(amount)} {currency} <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export function FundDonateModal({ fund, open, onClose }: { fund: Fund; open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useStore()
  const live = state.campaigns.filter((c) => c.fundId === fund.id && campaignStatus(c, state.day) !== "ended")
  const [amount, setAmount] = useState(50)
  const [target, setTarget] = useState(live[0]?.id ?? "")
  const proposed = fund.status === "proposed"

  const submit = () => {
    const r = actions.donateFund(fund.id, amount, proposed ? undefined : target || undefined)
    if (!r.ok) return toast(r.error, "err")
    toast(`+${num(amount * POINT_RULES.perFundBread)} points. Thanks for growing ${fund.name}!`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={proposed ? `Pledge to launch ${fund.name}` : `Give to ${fund.name}`}>
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          {proposed
            ? "Pledges are held until the fund reaches both its pledge goal and its points goal. Then they become its first matching reserve."
            : "Gifts to a fund become matching money. Every BREAD you add here is multiplied across the projects in the round."}{" "}
          You earn <b className="text-coop-ink">{POINT_RULES.perFundBread} points per BREAD</b>, double what a project donation earns.
        </p>
        <div className="flex gap-2">
          {[25, 50, 100, 250, 500].map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={cn(
                "h-10 flex-1 rounded-xl border text-sm font-semibold transition cursor-pointer",
                amount === p ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"
              )}
            >
              {p}
            </button>
          ))}
          <Input type="number" value={amount || ""} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} className="h-10 w-28" />
        </div>
        {!proposed && (
          <Field label="Where should it go?">
            <Select value={target} onChange={(e) => setTarget(e.target.value)}>
              {live.map((c) => (
                <option key={c.id} value={c.id}>
                  Top up {c.name}'s matching pool ({campaignStatus(c, state.day)})
                </option>
              ))}
              <option value="">Fund reserve (curators assign it to future rounds)</option>
            </Select>
          </Field>
        )}
        {amount > state.me.bread && <QuickBake need={amount} />}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Pts value={amount * POINT_RULES.perFundBread} className="text-sm font-semibold text-coop-ink" />
          <Button size="lg" onClick={submit} disabled={amount <= 0 || amount > state.me.bread}>
            {proposed ? "Pledge" : "Give"} {num(amount)} BREAD
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useStore()
  const groups = useMemo(() => {
    const m = new Map<string, typeof state.cart>()
    for (const i of state.cart) m.set(i.campaignId, [...(m.get(i.campaignId) ?? []), i])
    return [...m.entries()]
  }, [state.cart])
  const total = state.cart.reduce((a, i) => a + i.amount, 0)
  let totalMatch = 0
  const groupMatches = groups.map(([cid, items]) => {
    const c = state.campaigns.find((x) => x.id === cid)!
    const f = getFund(state, c.fundId)!
    const r = basketMatch(c, f.mechanism, state.donations, ME, items)
    totalMatch += r.total
    return r
  })

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-foreground/30 animate-in" onMouseDown={onClose}>
      <div className="slide-in flex h-full w-[460px] flex-col bg-card shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <div className="font-display text-2xl font-semibold">Your basket</div>
            <div className="text-sm text-muted-foreground">Back several projects in one go and see the match you unlock.</div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted cursor-pointer" aria-label="Close basket">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {groups.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <ShoppingBasket className="mx-auto mb-3 text-border" size={40} />
              Collect projects from a live round on any fund page.
            </div>
          )}
          {groups.map(([cid, items], gi) => {
            const c = state.campaigns.find((x) => x.id === cid)!
            const f = getFund(state, c.fundId)!
            return (
              <div key={cid}>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{f.name}</div>
                  </div>
                  <MechanismBadge m={f.mechanism} />
                </div>
                <div className="space-y-2">
                  {items.map((i) => {
                    const p = getProject(state, i.projectId)!
                    return (
                      <div key={i.projectId} className="flex items-center gap-3 rounded-xl border border-border p-2">
                        <div className="h-11 w-14 shrink-0 overflow-hidden rounded-lg">
                          <Cover seed={p.coverSeed} image={p.image} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{p.title}</div>
                          <div className="text-xs text-community">+{num(groupMatches[gi].perProject[p.id] ?? 0, 1)} match</div>
                        </div>
                        <Input
                          type="number"
                          value={i.amount || ""}
                          onChange={(e) => actions.updateCart(i.projectId, cid, Number(e.target.value))}
                          className="h-9 w-20 text-right"
                        />
                        <button onClick={() => actions.removeFromCart(i.projectId, cid)} className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer" aria-label="Remove">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        {groups.length > 0 && (
          <div className="space-y-3 border-t border-border bg-muted/40 px-6 py-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You give</span>
              <Bread value={total} className="font-semibold" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Matching you unlock</span>
              <Bread value={totalMatch} className="font-semibold text-community" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Points earned</span>
              <Pts value={total * POINT_RULES.perBread} className="font-semibold text-coop-ink" />
            </div>
            {total > state.me.bread && <QuickBake need={total} />}
            <Button
              size="lg"
              className="w-full"
              disabled={total <= 0 || total > state.me.bread}
              onClick={() => {
                const r = actions.checkout()
                if (!r.ok) return toast(r.error, "err")
                toast(`Backed ${state.cart.length} projects. ~${num(totalMatch)} BREAD of matching unlocked!`)
                onClose()
              }}
            >
              Give <Bread value={total} unitClass="text-primary-foreground/80" /> to {state.cart.length} projects
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

const PRINCIPLES = [
  {
    icon: ScrollText,
    title: "Fully auditable",
    text: "Every donation, fund gift, yield split and matching payout is recorded on a public ledger. Anyone can check where money came from and where it went.",
  },
  {
    icon: Scale,
    title: "Realistic matching",
    text: "Matching pools only hold money that already exists: interest the reserves have earned, plus gifts to funds. Nothing is promised that isn't in hand.",
  },
  {
    icon: ShieldCheck,
    title: "Your funds aren't put at risk",
    text: "Only the interest is used for matching. The USDC behind BREAD is never spent, and anyone can redeem their BREAD 1:1 at any time.",
  },
]

/** What this showcase is and why it exists. */
export function AboutContent() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <BreadLogo size={34} />
        <div>
          <div className="font-display text-2xl font-semibold leading-tight">Why Artizenal exists</div>
          <div className="text-sm text-muted-foreground">A showcase built on the Bread Cooperative stack</div>
        </div>
      </div>
      <p className="text-[15px] leading-relaxed text-foreground/85">
        Artizen recently announced that it is closing down. Many artists, scientists and organizers lost matching they were counting on, some of them in the
        middle of a round. Artizenal is our attempt to show what an alternative could look like if it worked differently.
      </p>
      <div className="space-y-3">
        {PRINCIPLES.map((p) => (
          <div key={p.title} className="flex gap-3 rounded-2xl bg-muted p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-crust">
              <p.icon size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold">{p.title}</div>
              <div className="mt-0.5 text-sm text-muted-foreground">{p.text}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
        This is a showcase, not a live platform. Every balance, donation and payout is simulated in your browser, and nothing real moves. The projects and people
        are examples.
      </p>
    </div>
  )
}

export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} width={600}>
      <AboutContent />
      <div className="mt-6 flex justify-end gap-2">
        <a href="#/ledger" onClick={onClose} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold hover:bg-muted">
          Open the public ledger
        </a>
        <Button variant="dark" onClick={onClose}>
          Got it
        </Button>
      </div>
    </Modal>
  )
}

export function Onboarding() {
  const { state, actions } = useStore()
  const [step, setStep] = useState<"about" | "join">("about")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  if (state.me.onboarded) return null
  if (step === "about")
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-6 backdrop-blur-sm">
        <div className="pop-in w-full max-w-[600px] rounded-3xl bg-card p-8 shadow-2xl">
          <AboutContent />
          <div className="mt-6 flex justify-end">
            <Button size="lg" onClick={() => setStep("join")}>
              Try the showcase <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    )
  const sample = state.users.find((u) => u.id === "maya")
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-6 backdrop-blur-sm">
      <div className="pop-in grid w-full max-w-[880px] grid-cols-[1fr_1.1fr] overflow-hidden rounded-3xl bg-card shadow-2xl">
        <div className="relative bg-foreground p-10 text-background">
          <div className="absolute inset-0 opacity-30">
            <Cover seed={7} />
          </div>
          <div className="relative">
            <div className="font-display text-3xl font-semibold">Artizenal</div>
            <p className="mt-6 font-display text-[26px] leading-snug">
              Funding for artists, scientists and builders, matched by the community.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-background/80">
              <li>• Convert USDC into BREAD, 1:1. The interest on the reserves pays for matching.</li>
              <li>• Back projects in live rounds. Small gifts unlock big matches.</li>
              <li>• Earn points, then use them to steer where the yield goes.</li>
            </ul>
            <p className="mt-10 text-xs text-background/60">
              This is a live simulation and nothing real moves. Your wallet starts with some USDC and BREAD so you can try everything.
            </p>
          </div>
        </div>
        <form
          className="space-y-5 p-10"
          onSubmit={(e) => {
            e.preventDefault()
            actions.onboard(name, code || undefined)
          }}
        >
          <div>
            <h2 className="font-display text-2xl font-semibold">Pull up a chair</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pick a display name to get started.</p>
          </div>
          <Field label="Your name">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sam Baker" />
          </Field>
          <Field
            label="Invite code (optional)"
            hint={
              <>
                Try <button type="button" className="font-semibold text-primary underline cursor-pointer" onClick={() => setCode("MAYA")}>MAYA</button> to see
                how referrals work: {sample?.name.split(" ")[0]} earns {POINT_RULES.referral} points, plus 10% of every point you earn.
              </>
            }
          >
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MAYA" />
          </Field>
          <div className="rounded-2xl bg-coop-ink/6 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-coop-ink">
              <Sparkles size={16} /> {POINT_RULES.welcome} welcome points
            </div>
            <div className="mt-1 text-muted-foreground">
              Points are your voice on Artizenal. You can't buy or sell them. Each season you give them to the funds you believe in, and that decides where the yield goes.
            </div>
          </div>
          <Button size="lg" className="w-full" type="submit" disabled={!name.trim()}>
            Enter Artizenal <ArrowRight size={16} />
          </Button>
          <div className="text-center text-xs text-muted-foreground">
            Demo world: day {state.day}, season {state.season}. {state.users.length} members, {state.projects.length} projects.
          </div>
        </form>
      </div>
    </div>
  )
}
