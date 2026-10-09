import { useMemo, useState } from "react"
import { PasInfo } from "./PasExplainer"
import { ArrowRight, X, PartyPopper, ShoppingBasket, Trash2, Info, Sparkles, ScrollText, Scale, ShieldCheck } from "lucide-react"
import { Bread, BreadLogo, Button, CommunityLinks, Field, Input, Loaf, Modal, Pts, Select, MechanismBadge, Textarea } from "./ui"
import { Cover } from "./Cover"
import { POINT_RULES, campaignStatus, getFund, getProject, ME, useStore } from "@/lib/store"
import { basketMatch, marginalMatch, MECHANISM_INFO } from "@/lib/matching"
import type { Fund, Project } from "@/lib/types"
import { cn, num, usd } from "@/lib/utils"
import { isSubscribed, subscribe } from "@/lib/signup"
import { ASSETS, ASSET_IDS, DONATION_FEE, fmtUnits, toUsd } from "@/lib/assets"
import type { Asset } from "@/lib/assets"

/** Inline helper shown when the user doesn't hold enough of a pas token. */
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
  const match = campaign && fund && usdValue > 0 ? marginalMatch(campaign, fund.mechanism, state.donations, project.id, ME, usdValue * (1 - DONATION_FEE)) : 0
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
                , which unlocked about <b className="text-community">{usd(done.match)}</b> in matching
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
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Pay with</span>
              <PasInfo />
            </div>
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
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-2.5 text-xs text-muted-foreground">
            <span>
              The project gets <b className="text-foreground">{fmtUnits(asset, units * (1 - DONATION_FEE))} {A.token}</b>
            </span>
            <span>
              {Math.round(DONATION_FEE * 100)}% ({fmtUnits(asset, units * DONATION_FEE)}) to the{" "}
              <a href="#/wealth" className="font-semibold text-crust hover:underline">
                Wealth Fund
              </a>
            </span>
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

/** Three-way picker for which pas token to pay with, showing what you hold. */
export function AssetPicker({ value, onChange }: { value: Asset; onChange: (a: Asset) => void }) {
  const { state } = useStore()
  return (
    <div>
      <div className="mb-1.5 flex justify-end">
        <PasInfo />
      </div>
    <div className="grid grid-cols-3 gap-2">
      {ASSET_IDS.map((a) => (
        <button
          key={a}
          onClick={() => onChange(a)}
          className={cn(
            "rounded-xl border-2 px-3 py-2 text-left transition cursor-pointer",
            value === a ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
          )}
        >
          <div className="text-sm font-semibold">{ASSETS[a].token}</div>
          <div className="text-xs text-muted-foreground tabular-nums">{fmtUnits(a, state.me.art[a])} held</div>
        </button>
      ))}
    </div>
    </div>
  )
}

const FUND_PRESETS: Record<Asset, number[]> = {
  USD: [25, 50, 100, 250, 500],
  EUR: [25, 50, 100, 250, 500],
  ETH: [0.01, 0.02, 0.05, 0.1, 0.2],
}

export function FundDonateModal({ fund, open, onClose }: { fund: Fund; open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useStore()
  const live = state.campaigns.filter((c) => c.fundId === fund.id && campaignStatus(c, state.day) !== "ended")
  const [asset, setAsset] = useState<Asset>("USD")
  const [units, setUnits] = useState(50)
  const [target, setTarget] = useState(live[0]?.id ?? "")
  const [message, setMessage] = useState("")
  const [link, setLink] = useState("")
  const [anonymous, setAnonymous] = useState(false)
  const proposed = fund.status === "proposed"
  const A = ASSETS[asset]
  const value = toUsd(asset, units)
  const points = Math.round(value * POINT_RULES.perFundBread)

  const pick = (a: Asset) => {
    setAsset(a)
    setUnits(FUND_PRESETS[a][1])
  }

  const submit = () => {
    const r = actions.donateFund(fund.id, asset, units, proposed ? undefined : target || undefined, anonymous ? { anonymous } : { message, link })
    if (!r.ok) return toast(r.error, "err")
    toast(`+${num(points)} points. Thanks!`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={proposed ? `Pledge to launch ${fund.name}` : `Give to ${fund.name}`}>
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          {proposed ? "Held until the fund launches, then used for matching." : "Becomes matching money for the fund's rounds."}{" "}
          <b className="text-coop-ink">{POINT_RULES.perFundBread} points per $1.</b>
        </p>
        <AssetPicker value={asset} onChange={pick} />
        <div>
          <div className="flex flex-wrap gap-2">
            {FUND_PRESETS[asset].map((p) => (
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
            <Input type="number" step="any" value={units || ""} onChange={(e) => setUnits(Math.max(0, Number(e.target.value)))} className="h-10 w-full sm:w-28" />
          </div>
          <div className="mt-1.5 text-xs text-muted-foreground">
            ≈ {usd(value)} · Balance {fmtUnits(asset, state.me.art[asset])} {A.token}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-2.5 text-xs text-muted-foreground">
            <span>
              The fund gets <b className="text-foreground">{fmtUnits(asset, units * (1 - DONATION_FEE))} {A.token}</b>
            </span>
            <span>
              {Math.round(DONATION_FEE * 100)}% ({fmtUnits(asset, units * DONATION_FEE)}) to the{" "}
              <a href="#/wealth" className="font-semibold text-crust hover:underline">
                Wealth Fund
              </a>
            </span>
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
        <div className="space-y-3 rounded-2xl border border-border p-4">
          <div className="text-sm font-semibold">Public note (optional)</div>
          {!anonymous && (
            <>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 280))}
                placeholder="Say why you're giving, or tell people about your project or product"
                className="min-h-20"
              />
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link, e.g. yourproduct.com" />
            </>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
            Give anonymously
          </label>
          <div className="text-xs text-muted-foreground">
            {anonymous ? "Your name won't be shown on the fund page." : "Shown with your name in the fund's supporters. Top supporters are listed as sponsors."}
          </div>
        </div>
        {units > state.me.art[asset] && <QuickBake need={units} asset={asset} />}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Pts value={points} className="text-sm font-semibold text-coop-ink" />
          <Button size="lg" onClick={submit} disabled={units <= 0 || units > state.me.art[asset] + 1e-9}>
            {proposed ? "Pledge" : "Give"} {fmtUnits(asset, units)} {A.token}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useStore()
  const asset = state.cartAsset ?? "USD"
  const A = ASSETS[asset]
  const groups = useMemo(() => {
    const m = new Map<string, typeof state.cart>()
    for (const i of state.cart) m.set(i.campaignId, [...(m.get(i.campaignId) ?? []), i])
    return [...m.entries()]
  }, [state.cart])
  const total = state.cart.reduce((a, i) => a + i.amount, 0)
  const totalUsd = toUsd(asset, total)
  let totalMatch = 0
  const groupMatches = groups.map(([cid, items]) => {
    const c = state.campaigns.find((x) => x.id === cid)!
    const f = getFund(state, c.fundId)!
    const r = basketMatch(c, f.mechanism, state.donations, ME, items.map((i) => ({ projectId: i.projectId, amount: toUsd(asset, i.amount) * (1 - DONATION_FEE) })))
    totalMatch += r.total
    return r
  })

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-foreground/30 animate-in" onMouseDown={onClose}>
      <div className="slide-in flex h-full w-full flex-col sm:w-[460px] bg-card shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="font-display text-2xl font-semibold">Your basket</div>
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
          {groups.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-semibold">Pay with</div>
              <AssetPicker value={asset} onChange={actions.setCartAsset} />
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
                          <div className="text-xs text-community">+{usd(groupMatches[gi].perProject[p.id] ?? 0, true)} match</div>
                        </div>
                        <Input
                          type="number"
                          step="any"
                          value={i.amount || ""}
                          onChange={(e) => actions.updateCart(i.projectId, cid, Number(e.target.value))}
                          className="h-9 w-24 text-right"
                          aria-label={`Amount in ${A.token}`}
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
              <span className="font-semibold tabular-nums">
                {fmtUnits(asset, total)} {A.token} <span className="font-normal text-muted-foreground">≈ {usd(totalUsd)}</span>
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">To the Wealth Fund ({Math.round(DONATION_FEE * 100)}%)</span>
              <span className="tabular-nums">
                {fmtUnits(asset, total * DONATION_FEE)} {A.token}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Matching you unlock</span>
              <Bread value={totalMatch} className="font-semibold text-community" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Points earned</span>
              <Pts value={totalUsd * POINT_RULES.perBread} className="font-semibold text-coop-ink" />
            </div>
            {total > state.me.art[asset] && <QuickBake need={total} asset={asset} />}
            <Button
              size="lg"
              className="w-full"
              disabled={total <= 0 || total > state.me.art[asset] + 1e-9}
              onClick={() => {
                const r = actions.checkout()
                if (!r.ok) return toast(r.error, "err")
                toast(`Backed ${state.cart.length} projects. ~${usd(totalMatch)} of matching unlocked!`)
                onClose()
              }}
            >
              Give {fmtUnits(asset, total)} {A.token} to {state.cart.length} projects
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
    text: "Every donation, yield split and payout is publicly recorded.",
  },
  {
    icon: Scale,
    title: "Realistic matching",
    text: "Pools only hold money that already exists. Nothing is promised that isn't in hand.",
  },
  {
    icon: ShieldCheck,
    title: "Funds aren't put at risk",
    text: "Only interest pays for matching. Pas tokens are redeemable 1:1 any time.",
  },
]

/** What this showcase is and why it exists. */
export function AboutContent() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <BreadLogo size={34} />
        <div>
          <div className="font-display text-2xl font-semibold leading-tight">Why Pastry exists</div>
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3">
        <div className="text-sm">
          <div className="font-semibold">Join the Bread Cooperative community</div>
          <div className="text-xs text-muted-foreground">Questions, ideas, or want to build this with us?</div>
        </div>
        <CommunityLinks size="sm" />
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
  const [email, setEmail] = useState("")
  const [needsEmail] = useState(() => !isSubscribed())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
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
        onSubmit={async (e) => {
          e.preventDefault()
          if (needsEmail) {
            setBusy(true)
            setError("")
            const r = await subscribe(email)
            setBusy(false)
            if (!r.ok) return setError(r.error)
          }
          actions.onboard(name)
        }}
      >
        <div className="flex items-center gap-3">
          <BreadLogo size={30} />
          <h2 className="font-display text-2xl font-semibold">Join Pastry</h2>
        </div>
        {needsEmail && (
          <Field label="Email" hint="Signs you up for the Bread Cooperative newsletter on Paragraph. Required to try the showcase.">
            <Input autoFocus type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </Field>
        )}
        <Field label="Name">
          <Input autoFocus={!needsEmail} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sam Baker" />
        </Field>
        <div className="flex items-center gap-2 text-sm text-coop-ink">
          <Sparkles size={15} /> {POINT_RULES.welcome} welcome points, plus some USDC, EURC and ETH to try things with
        </div>
        {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
        <Button size="lg" className="w-full" type="submit" disabled={busy || !name.trim() || (needsEmail && !email.trim())}>
          {busy ? "Signing you up…" : needsEmail ? "Subscribe & enter" : "Enter"} {!busy && <ArrowRight size={16} />}
        </Button>
      </form>
    </div>
  )
}
