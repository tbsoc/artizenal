import { useMemo, useState } from "react"
import { ArrowRight, X, PartyPopper, ShoppingBasket, Trash2, Info, Sparkles, ScrollText, Scale, ShieldCheck } from "lucide-react"
import { Bread, BreadLogo, Button, Field, Input, Loaf, Modal, Pts, Select, MechanismBadge } from "./ui"
import { Cover } from "./Cover"
import { POINT_RULES, campaignStatus, getFund, getProject, ME, useStore } from "@/lib/store"
import { basketMatch, marginalMatch, MECHANISM_INFO } from "@/lib/matching"
import type { Fund, Project } from "@/lib/types"
import { cn, num, usd } from "@/lib/utils"
import { ASSETS, ASSET_IDS, fmtUnits, toUsd } from "@/lib/assets"
import type { Asset } from "@/lib/assets"

/** Inline helper shown when the user doesn't hold enough of an art token. */
export function QuickBake({ need, asset = "USD" }: { need: number; asset?: Asset }) {
  const { state, actions, toast } = useStore()
  const A = ASSETS[asset]
  const short = need - state.me.art[asset]
  if (short <= 0) return null
  const minimum = asset === "ETH" ? 0.01 : 50
  const amt = Math.min(Math.max(short, minimum), state.me.base[asset])
  if (amt <= 0)
    return (
      <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        Not enough {A.token}, and no {A.base} left to convert.
      </div>
    )
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-wheat/25 px-4 py-3 text-sm">
      <div>
        Convert {A.base} into {A.token} 1:1?
      </div>
      <Button
        size="sm"
        variant="dark"
        onClick={() => {
          const r = actions.bake(asset, amt)
          if (r.ok) toast(`Converted ${fmtUnits(asset, amt)} ${A.base} into ${A.token}`)
          else toast(r.error, "err")
        }}
      >
        <Loaf size={14} /> Convert {fmtUnits(asset, amt)}
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
  const [asset, setAsset] = useState<Asset>("USD")
  const [units, setUnits] = useState(25)
  const [campaignId, setCampaignId] = useState<string>(
    defaultCampaignId && liveCampaigns.some((c) => c.id === defaultCampaignId) ? defaultCampaignId : liveCampaigns[0]?.id ?? ""
  )
  const [done, setDone] = useState<null | { label: string; match: number; points: number }>(null)

  const A = ASSETS[asset]
  const usdValue = toUsd(asset, units)
  const campaign = liveCampaigns.find((c) => c.id === campaignId)
  const fund = campaign ? getFund(state, campaign.fundId) : undefined
  const match = campaign && fund && usdValue > 0 ? marginalMatch(campaign, fund.mechanism, state.donations, project.id, ME, usdValue) : 0
  const points = Math.round(usdValue * POINT_RULES.perBread)
  const balance = state.me.art[asset]

  const pickAsset = (a: Asset) => {
    setAsset(a)
    setUnits(ASSETS[a].presets[2])
  }

  const close = () => {
    setDone(null)
    onClose()
  }

  const submit = () => {
    const r = actions.donate(project.id, asset, units, campaign?.id)
    if (!r.ok) return toast(r.error, "err")
    setDone({ label: `${fmtUnits(asset, units)} ${A.token}`, match, points })
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
            You gave {done.label} to {project.title}
            {done.match > 0.5 && (
              <>
                , which unlocked about <b className="text-community">${num(done.match)}</b> in matching
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
          <div className="grid grid-cols-3 gap-2">
            {ASSET_IDS.map((a) => (
              <button
                key={a}
                onClick={() => pickAsset(a)}
                className={cn(
                  "rounded-xl border-2 px-3 py-2 text-left transition cursor-pointer",
                  asset === a ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className="text-sm font-semibold">{ASSETS[a].token}</div>
                <div className="text-xs text-muted-foreground tabular-nums">{fmtUnits(a, state.me.art[a])} held</div>
              </button>
            ))}
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">Amount</div>
            <div className="flex flex-wrap gap-2">
              {A.presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setUnits(p)}
                  className={cn(
                    "h-10 flex-1 rounded-xl border text-sm font-semibold transition cursor-pointer",
                    units === p ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              ))}
              <Input
                type="number"
                min={0}
                step="any"
                value={units || ""}
                onChange={(e) => setUnits(Math.max(0, Number(e.target.value)))}
                className="h-10 w-full sm:w-28"
                aria-label="Custom amount"
              />
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">
              ≈ {usd(usdValue)} · Balance {fmtUnits(asset, balance)} {A.token}
            </div>
          </div>

          {liveCampaigns.length > 0 ? (
            <Field label="Round">
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
              Not in a live round, so this gift won't be matched.
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
                {usdValue > 0 && match > 0 && <span className="text-sm text-muted-foreground">({(match / usdValue).toFixed(2)}× your gift)</span>}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {fund.mechanism.type === "qf" ? "Estimate. Final matches are set when the round closes." : MECHANISM_INFO[fund.mechanism.type].name}
              </div>
            </div>
          )}
          {units > balance && <QuickBake need={units} asset={asset} />}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm font-semibold text-coop-ink">
              <Pts value={points} /> points
            </span>
            <Button size="lg" onClick={submit} disabled={units <= 0 || units > balance + 1e-9}>
              Give {fmtUnits(asset, units)} {A.token} <ArrowRight size={16} />
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
    toast(`+${num(amount * POINT_RULES.perFundBread)} points. Thanks!`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={proposed ? `Pledge to launch ${fund.name}` : `Give to ${fund.name}`}>
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          {proposed
            ? "Held until the fund launches, then used for matching."
            : "Becomes matching money for the fund's rounds."}{" "}
          <b className="text-coop-ink">{POINT_RULES.perFundBread} points per artUSD.</b>
        </p>
        <div className="flex flex-wrap gap-2">
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
          <Input type="number" value={amount || ""} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} className="h-10 w-full sm:w-28" />
        </div>
        {!proposed && (
          <Field label="To">
            <Select value={target} onChange={(e) => setTarget(e.target.value)}>
              {live.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} matching pool
                </option>
              ))}
              <option value="">Fund reserve</option>
            </Select>
          </Field>
        )}
        {amount > state.me.art.USD && <QuickBake need={amount} />}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Pts value={amount * POINT_RULES.perFundBread} className="text-sm font-semibold text-coop-ink" />
          <Button size="lg" onClick={submit} disabled={amount <= 0 || amount > state.me.art.USD}>
            {proposed ? "Pledge" : "Give"} {num(amount)} artUSD
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
      <div className="slide-in flex h-full w-full flex-col sm:w-[460px] bg-card shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <div className="font-display text-2xl font-semibold">Your basket</div>
            
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted cursor-pointer" aria-label="Close basket">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {groups.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <ShoppingBasket className="mx-auto mb-3 text-border" size={40} />
              Collect projects from any live round.
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
            {total > state.me.art.USD && <QuickBake need={total} />}
            <Button
              size="lg"
              className="w-full"
              disabled={total <= 0 || total > state.me.art.USD}
              onClick={() => {
                const r = actions.checkout()
                if (!r.ok) return toast(r.error, "err")
                toast(`Backed ${state.cart.length} projects. ~${num(totalMatch)} artUSD of matching unlocked!`)
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
    text: "Every donation, yield split and payout is on a public ledger.",
  },
  {
    icon: Scale,
    title: "Realistic matching",
    text: "Pools only hold money that already exists. Nothing is promised that isn't in hand.",
  },
  {
    icon: ShieldCheck,
    title: "Funds aren't put at risk",
    text: "Only interest pays for matching. Art tokens are redeemable 1:1 any time.",
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
          <div className="text-sm text-muted-foreground">
            A showcase by the{" "}
            <a href="https://bread.coop" target="_blank" rel="noreferrer" className="font-semibold text-[#EA5817] hover:underline">
              Bread Cooperative
            </a>
          </div>
        </div>
      </div>
      <p className="text-[15px] leading-relaxed text-foreground/85">
        Artizen recently announced it is closing down, and many projects lost matching they were counting on. We're the{" "}
        <a href="https://bread.coop" target="_blank" rel="noreferrer" className="font-semibold text-[#EA5817] hover:underline">
          Bread Cooperative
        </a>
        , and this is our take on an alternative that works differently.
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
        A showcase: everything is simulated in your browser. Projects and people are examples.
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
          Public ledger
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
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    )
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-6 backdrop-blur-sm">
      <form
        className="pop-in w-full max-w-[440px] space-y-5 rounded-3xl bg-card p-8 shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault()
          actions.onboard(name, code || undefined)
        }}
      >
        <div className="flex items-center gap-3">
          <BreadLogo size={30} />
          <h2 className="font-display text-2xl font-semibold">Join Artizenal</h2>
        </div>
        <Field label="Name">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Sam Baker" />
        </Field>
        <Field
          label="Invite code (optional)"
          hint={
            <>
              Try <button type="button" className="font-semibold text-primary underline cursor-pointer" onClick={() => setCode("MAYA")}>MAYA</button>
            </>
          }
        >
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MAYA" />
        </Field>
        <div className="flex items-center gap-2 text-sm text-coop-ink">
          <Sparkles size={15} /> {POINT_RULES.welcome} welcome points, plus some USDC, EURC and ETH to try things with
        </div>
        <Button size="lg" className="w-full" type="submit" disabled={!name.trim()}>
          Enter <ArrowRight size={16} />
        </Button>
      </form>
    </div>
  )
}
