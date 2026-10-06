import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { campaignContributions, computeMatches, campaignMatches } from "./matching"
import { PROJECT_DEPOSIT, PROPOSE_MIN_POINTS, STATE_VERSION, buildSeed, rng } from "./seed"
import type {
  Campaign,
  Category,
  Currency,
  Fund,
  Mechanism,
  PointsReason,
  Project,
  State,
} from "./types"

export const ME = "me"
const STORAGE_KEY = "artizenal-state"

/* ------------------------------------------------------------------ */
/* Points rules (shown on the Points page too)                         */
/* ------------------------------------------------------------------ */
export const POINT_RULES = {
  welcome: 250,
  referral: 500,
  referralShare: 0.1,
  perBread: 10,
  perFundBread: 20,
  earlyBacker: 50,
  earlyBackerSlots: 10,
  holdingPer10PerDay: 1,
  createProject: 200,
  artizenAlumni: 1000,
  proposeFund: 300,
  curate: 150,
}

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */
export type CampaignStatus = "upcoming" | "live" | "ended"

export function campaignStatus(c: Campaign, day: number): CampaignStatus {
  if (c.settled || day > c.endDay) return "ended"
  if (day < c.startDay) return "upcoming"
  return "live"
}

export function userPoints(s: State, uid: string) {
  let t = 0
  for (const e of s.points) if (e.userId === uid) t += e.amount
  return t
}

/** Points a member has given away to funds (all seasons, or one season). */
export function pointsGiven(s: State, uid: string, season?: number) {
  let t = 0
  for (const g of s.pointGifts) if (g.userId === uid && (season === undefined || g.season === season)) t += g.amount
  return t
}

/** Points a member can still give. Earned points minus points already given. */
export function pointsBalance(s: State, uid: string) {
  return userPoints(s, uid) - pointsGiven(s, uid)
}

/** Points a fund has received this season. Sets its share of this season's yield. */
export function fundSeasonPoints(s: State, fundId: string, season = s.season) {
  let t = 0
  for (const g of s.pointGifts) if (g.fundId === fundId && g.season === season) t += g.amount
  return t
}

/** Points a fund has received across all seasons. Used for a proposed fund's launch goal. */
export function fundTotalPoints(s: State, fundId: string) {
  let t = 0
  for (const g of s.pointGifts) if (g.fundId === fundId) t += g.amount
  return t
}

/** Each active fund's share of this season's yield: its points ÷ all points given to active funds. */
export function seasonRatios(s: State, extra: Record<string, number> = {}) {
  const active = s.funds.filter((f) => f.status === "active")
  const pts: Record<string, number> = {}
  let total = 0
  for (const f of active) {
    pts[f.id] = fundSeasonPoints(s, f.id) + (extra[f.id] ?? 0)
    total += pts[f.id]
  }
  const ratio: Record<string, number> = {}
  for (const f of active) ratio[f.id] = total ? pts[f.id] / total : 1 / active.length
  return { pts, total, ratio }
}

export function fundPledged(s: State, fundId: string) {
  return s.fundDonations
    .filter((d) => d.fundId === fundId && !d.campaignId)
    .reduce((a, d) => a + d.amount, 0)
}

export function totalSupply(s: State) {
  return s.otherSupply + s.me.bread
}

export function dailyYield(s: State) {
  return (totalSupply(s) * s.apy) / 365
}

export function getFund(s: State, id: string) {
  return s.funds.find((f) => f.id === id)
}

export function getProject(s: State, id: string) {
  return s.projects.find((p) => p.id === id)
}

export function getUser(s: State, id: string) {
  return s.users.find((u) => u.id === id)
}

export function projectStats(s: State, pid: string) {
  const ds = s.donations.filter((d) => d.projectId === pid)
  const bread = ds.filter((d) => d.currency === "BREAD").reduce((a, d) => a + d.amount, 0)
  const donors = new Set(ds.map((d) => d.from)).size
  let matched = 0
  let pendingMatch = 0
  for (const c of s.campaigns) {
    if (!c.projectIds.includes(pid)) continue
    const fund = getFund(s, c.fundId)
    if (!fund) continue
    if (c.settled) matched += c.settled[pid] ?? 0
    else if (campaignStatus(c, s.day) === "live")
      pendingMatch += campaignMatches(c, fund.mechanism, s.donations).matches[pid] ?? 0
  }
  return { bread, donors, matched, pendingMatch, total: bread + matched, donations: ds }
}

export function projectCampaigns(s: State, pid: string) {
  return s.campaigns.filter((c) => c.projectIds.includes(pid))
}

/* ------------------------------------------------------------------ */
/* Mutation helpers                                                    */
/* ------------------------------------------------------------------ */
let idCounter = Date.now() % 1_000_000
const uid = (p: string) => `${p}${(idCounter++).toString(36)}`

function award(s: State, userId: string, amount: number, reason: PointsReason, note: string) {
  amount = Math.round(amount)
  if (amount <= 0) return
  s.points.push({ id: uid("pt"), userId, amount, reason, note, day: s.day })
  const u = getUser(s, userId)
  if (u?.referredBy && reason !== "referral-bonus" && reason !== "seed") {
    const bonus = Math.round(amount * POINT_RULES.referralShare)
    if (bonus > 0)
      s.points.push({
        id: uid("pt"),
        userId: u.referredBy,
        amount: bonus,
        reason: "referral-bonus",
        note: `10% of ${u.name.split(" ")[0]}'s points`,
        day: s.day,
      })
  }
}

function log(s: State, userId: string, text: string, href?: string) {
  s.activity.unshift({ id: uid("a"), day: s.day, userId, text, href })
  if (s.activity.length > 120) s.activity.length = 120
}

function addDonation(
  s: State,
  from: string,
  projectId: string,
  amount: number,
  currency: Currency,
  campaignId?: string
) {
  const project = getProject(s, projectId)
  if (!project) return
  const priorDonors = new Set(s.donations.filter((d) => d.projectId === projectId).map((d) => d.from))
  s.donations.push({ id: uid("d"), from, projectId, campaignId, amount, currency, day: s.day })
  award(
    s,
    from,
    amount * POINT_RULES.perBread,
    "donate-bread",
    `Donated to ${project.title}`
  )
  if (!priorDonors.has(from) && priorDonors.size < POINT_RULES.earlyBackerSlots) {
    award(s, from, POINT_RULES.earlyBacker, "early-backer", `Early backer of ${project.title}`)
  }
}

function settleCampaigns(s: State) {
  for (const c of s.campaigns) {
    if (c.settled || s.day <= c.endDay) continue
    const fund = getFund(s, c.fundId)!
    const { matches } = computeMatches(fund.mechanism, c.matchingPool, c.projectIds, campaignContributions(c, s.donations))
    c.settled = matches
    const paid = Object.values(matches).reduce((a, b) => a + b, 0)
    fund.reserve += Math.max(0, c.matchingPool - paid) // unspent pool returns to the fund
    log(s, fund.curators[0], `closed ${c.name}: ${Math.round(paid).toLocaleString()} BREAD matched`, `#/f/${fund.id}`)
  }
}

function checkLaunches(s: State) {
  for (const f of s.funds) {
    if (f.status !== "proposed") continue
    if (fundPledged(s, f.id) >= f.pledgeGoal && fundTotalPoints(s, f.id) >= f.backingGoal) {
      f.status = "active"
      f.reserve += fundPledged(s, f.id)
      log(s, f.proposedBy, `launched the fund ${f.name}`, `#/f/${f.id}`)
    }
  }
}

function refundDeposits(s: State) {
  for (const p of s.projects) {
    if (p.deposit.status !== "held") continue
    const donors = new Set(s.donations.filter((d) => d.projectId === p.id).map((d) => d.from)).size
    if (donors >= 3 || s.day - p.createdDay >= 14) {
      p.deposit.status = "refunded"
      if (p.creatorId === ME) s.me.bread += p.deposit.amount
      log(s, p.creatorId, `had their spam deposit returned for ${p.title}`, `#/p/${p.id}`)
    }
  }
}

function distributeYield(s: State) {
  const total = s.yieldPool
  const active = s.funds.filter((f) => f.status === "active")
  const { pts, ratio } = seasonRatios(s)
  const shares: Record<string, number> = {}
  for (const f of active) {
    const share = total * ratio[f.id]
    shares[f.id] = share
    const live = s.campaigns.filter((c) => c.fundId === f.id && campaignStatus(c, s.day) === "live")
    if (f.autoStream && live.length) {
      for (const c of live) c.matchingPool += share / live.length
    } else {
      f.reserve += share
    }
  }
  s.distributions.push({ season: s.season, day: s.day, total, shares, points: pts })
  log(s, "system", `Season ${s.season} closed. ${Math.round(total).toLocaleString()} BREAD of yield was split across ${active.length} funds by points given`, "#/allocate")
  s.yieldPool = 0
  s.season += 1
  s.seasonStartDay = s.day
}

const ROUND_NAMES = ["Open Call", "Community Round", "Harvest Round", "Spotlight Round", "Neighbors Round"]

/** Other curators open a fresh round whenever their fund has reserve but nothing running. */
function autoCurate(s: State) {
  const r = rng(s.day * 131 + s.campaigns.length)
  for (const f of s.funds) {
    if (f.status !== "active" || f.curators.includes(ME) || f.reserve < 400) continue
    if (s.campaigns.some((c) => c.fundId === f.id && campaignStatus(c, s.day) !== "ended")) continue
    const fits = s.projects.filter((p) => p.category === f.category || (f.id === "artizen-rescue" && p.artizen))
    const others = s.projects.filter((p) => !fits.includes(p)).sort(() => r() - 0.5)
    const projectIds = [...fits, ...others].slice(0, 4 + Math.floor(r() * 3)).map((p) => p.id)
    const pool = Math.floor(f.reserve * 0.8)
    f.reserve -= pool
    const name = `${ROUND_NAMES[s.campaigns.length % ROUND_NAMES.length]} ${s.season}`
    s.campaigns.push({
      id: uid("c"),
      fundId: f.id,
      name,
      blurb: `A new round from ${f.name}, funded by the yield members sent its way with their points.`,
      startDay: s.day,
      endDay: s.day + 21,
      matchingPool: pool,
      projectIds,
    })
    log(s, f.curators[0], `launched ${name} in ${f.name}`, `#/f/${f.id}`)
  }
}

const FRIEND_NAMES = ["Ada Mwangi", "Leo Fontaine", "Mira Chen", "Tomás Vidal", "Hana Sato", "Felix Brandt", "Zara Ali", "Nico Rossi", "Yara Santos", "Sam Rivera"]

function simulateOthers(s: State) {
  const r = rng(s.day * 7919 + s.donations.length)
  // a few members give points to funds each day
  const givers = s.users.filter((u) => u.id !== ME)
  const funds = s.funds
  for (let i = 0, n = 2 + Math.floor(r() * 4); i < n; i++) {
    const u = givers[Math.floor(r() * givers.length)]
    const f = funds[Math.floor(r() * funds.length)]
    const amount = Math.min(pointsBalance(s, u.id), (2 + Math.floor(r() * 20)) * 20)
    if (amount >= 20) s.pointGifts.push({ id: uid("g"), userId: u.id, fundId: f.id, amount, season: s.season, day: s.day })
  }
  const live = s.campaigns.filter((c) => campaignStatus(c, s.day) === "live")
  if (!live.length) return
  const others = s.users.filter((u) => u.id !== ME)
  const n = 2 + Math.floor(r() * 5)
  for (let i = 0; i < n; i++) {
    const c = live[Math.floor(r() * live.length)]
    const pid = c.projectIds[Math.floor(r() * c.projectIds.length)]
    const from = others[Math.floor(r() * others.length)]
    if (getProject(s, pid)?.creatorId === from.id) continue
    const amt = [5, 10, 10, 20, 25, 50][Math.floor(r() * 6)]
    addDonation(s, from.id, pid, amt, "BREAD", c.id)
  }
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */
function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as State
      if (parsed.version === STATE_VERSION) return parsed
    }
  } catch {
    /* storage unavailable; fall back to seed */
  }
  return buildSeed()
}

export interface NewProject {
  title: string
  tagline: string
  description: string
  category: Category
  location: string
  website?: string
  image?: string
  goal: number
  artizen?: { season: string; url?: string }
  campaignIds: string[]
}

export interface NewFund {
  name: string
  tagline: string
  description: string
  category: Category
  mechanism: Mechanism
  pledgeGoal: number
  backingGoal: number
  initialPledge: number
}

export interface NewCampaign {
  name: string
  blurb: string
  days: number
  startsIn: number
  pool: number
  projectIds: string[]
}

type Result = { ok: true; id?: string } | { ok: false; error: string }

function useStoreValue() {
  const [state, setState] = useState<State>(load)
  const [toasts, setToasts] = useState<{ id: number; text: string; tone: "ok" | "err" }[]>([])
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const toast = useCallback((text: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])

  /** Run a mutation on a deep copy of the current state and commit it. */
  const mutate = useCallback(<T,>(fn: (s: State) => T): T => {
    const draft = structuredClone(stateRef.current)
    const out = fn(draft)
    stateRef.current = draft
    setState(draft)
    return out
  }, [])

  const actions = useMemo(
    () => ({
      onboard(name: string, referral?: string): Result {
        return mutate((s) => {
          const clean = name.trim() || "Guest"
          const code = `${clean.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "BAKER"}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`
          const referrer = referral
            ? s.users.find((u) => u.handle.toUpperCase() === referral.trim().toUpperCase().split("-")[0])
            : undefined
          s.users = s.users.filter((u) => u.id !== ME)
          s.users.push({ id: ME, name: clean, handle: clean.toLowerCase().replace(/\s+/g, ""), hue: 26, joinedDay: s.day, referredBy: referrer?.id })
          s.me.onboarded = true
          s.me.referralCode = code
          if (referrer) award(s, referrer.id, POINT_RULES.referral, "referral", `${clean} joined with their link`)
          award(s, ME, POINT_RULES.welcome, "welcome", "Welcome to Artizenal")
          log(s, ME, referrer ? `joined via ${referrer.name}'s invite` : "joined Artizenal")
          return { ok: true }
        })
      },

      bake(amount: number): Result {
        return mutate((s) => {
          if (amount <= 0) return { ok: false, error: "Enter an amount" }
          if (amount > s.me.usdc) return { ok: false, error: "Not enough USDC in your wallet" }
          s.me.usdc -= amount
          s.me.bread += amount
          return { ok: true }
        })
      },

      redeem(amount: number): Result {
        return mutate((s) => {
          if (amount <= 0) return { ok: false, error: "Enter an amount" }
          if (amount > s.me.bread) return { ok: false, error: "Not enough BREAD" }
          s.me.bread -= amount
          s.me.usdc += amount
          return { ok: true }
        })
      },

      donate(projectId: string, amount: number, campaignId?: string): Result {
        return mutate((s) => {
          if (amount <= 0) return { ok: false, error: "Enter an amount" }
          if (amount > s.me.bread) return { ok: false, error: "Not enough BREAD. Convert some USDC first." }
          s.me.bread -= amount
          addDonation(s, ME, projectId, amount, "BREAD", campaignId)
          const p = getProject(s, projectId)!
          log(s, ME, `donated ${amount} BREAD to ${p.title}`, `#/p/${p.id}`)
          refundDeposits(s)
          return { ok: true }
        })
      },

      donateFund(fundId: string, amount: number, campaignId?: string): Result {
        return mutate((s) => {
          if (amount <= 0) return { ok: false, error: "Enter an amount" }
          if (amount > s.me.bread) return { ok: false, error: "Not enough BREAD. Convert some USDC first." }
          const f = getFund(s, fundId)!
          s.me.bread -= amount
          s.fundDonations.push({ id: uid("fd"), from: ME, fundId, campaignId, amount, day: s.day })
          if (f.status === "active") {
            const c = campaignId ? s.campaigns.find((x) => x.id === campaignId) : undefined
            if (c) c.matchingPool += amount
            else f.reserve += amount
          }
          award(s, ME, amount * POINT_RULES.perFundBread, "donate-fund", `Gave to ${f.name}`)
          log(s, ME, f.status === "proposed" ? `pledged ${amount} BREAD to launch ${f.name}` : `added ${amount} BREAD to ${f.name}`, `#/f/${f.id}`)
          checkLaunches(s)
          return { ok: true }
        })
      },

      addToCart(projectId: string, campaignId: string, amount = 10) {
        mutate((s) => {
          const existing = s.cart.find((i) => i.projectId === projectId && i.campaignId === campaignId)
          if (!existing) s.cart.push({ projectId, campaignId, amount })
        })
      },
      updateCart(projectId: string, campaignId: string, amount: number) {
        mutate((s) => {
          const i = s.cart.find((x) => x.projectId === projectId && x.campaignId === campaignId)
          if (i) i.amount = Math.max(0, amount)
        })
      },
      removeFromCart(projectId: string, campaignId: string) {
        mutate((s) => {
          s.cart = s.cart.filter((x) => !(x.projectId === projectId && x.campaignId === campaignId))
        })
      },
      checkout(): Result {
        return mutate((s) => {
          const items = s.cart.filter((i) => i.amount > 0)
          const total = items.reduce((a, i) => a + i.amount, 0)
          if (!items.length) return { ok: false, error: "Your basket is empty" }
          if (total > s.me.bread) return { ok: false, error: `You need ${total} BREAD. Convert a little more USDC first.` }
          s.me.bread -= total
          for (const i of items) addDonation(s, ME, i.projectId, i.amount, "BREAD", i.campaignId)
          log(s, ME, `backed ${items.length} projects with ${total} BREAD`)
          s.cart = []
          refundDeposits(s)
          return { ok: true }
        })
      },

      createProject(p: NewProject): Result {
        return mutate((s) => {
          if (s.me.bread < PROJECT_DEPOSIT) return { ok: false, error: `You need ${PROJECT_DEPOSIT} BREAD for the deposit` }
          const base = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project"
          let id = base
          let n = 2
          while (s.projects.some((x) => x.id === id)) id = `${base}-${n++}`
          s.me.bread -= PROJECT_DEPOSIT
          const project: Project = {
            id,
            title: p.title,
            tagline: p.tagline,
            description: p.description,
            category: p.category,
            creatorId: ME,
            location: p.location,
            website: p.website,
            image: p.image,
            coverSeed: Math.floor(Math.random() * 1000),
            artizen: p.artizen,
            deposit: { amount: PROJECT_DEPOSIT, status: "held" },
            createdDay: s.day,
            goal: p.goal,
            updates: [],
          }
          s.projects.unshift(project)
          for (const cid of p.campaignIds) {
            const c = s.campaigns.find((x) => x.id === cid)
            if (c && !c.projectIds.includes(id)) c.projectIds.push(id)
          }
          award(s, ME, POINT_RULES.createProject, "create-project", `Created ${p.title}`)
          if (p.artizen) award(s, ME, POINT_RULES.artizenAlumni, "artizen-alumni", "Artizen alumni welcome")
          log(s, ME, `launched the project ${p.title}`, `#/p/${id}`)
          return { ok: true, id }
        })
      },

      postUpdate(projectId: string, text: string) {
        mutate((s) => {
          const p = getProject(s, projectId)
          if (!p || !text.trim()) return
          p.updates.push({ day: s.day, text: text.trim() })
          log(s, ME, `posted an update on ${p.title}`, `#/p/${p.id}`)
        })
      },

      joinCampaign(projectId: string, campaignId: string) {
        mutate((s) => {
          const c = s.campaigns.find((x) => x.id === campaignId)
          if (c && !c.projectIds.includes(projectId)) c.projectIds.push(projectId)
          const p = getProject(s, projectId)
          if (c && p) log(s, ME, `entered ${p.title} into ${c.name}`, `#/f/${c.fundId}`)
        })
      },

      proposeFund(f: NewFund): Result {
        return mutate((s) => {
          if (userPoints(s, ME) < PROPOSE_MIN_POINTS)
            return { ok: false, error: `You need ${PROPOSE_MIN_POINTS.toLocaleString()} points to propose a fund` }
          if (f.initialPledge > s.me.bread) return { ok: false, error: "Not enough BREAD for that pledge" }
          const base = f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "fund"
          let id = base
          let n = 2
          while (s.funds.some((x) => x.id === id)) id = `${base}-${n++}`
          const fund: Fund = {
            id,
            name: f.name,
            tagline: f.tagline,
            description: f.description,
            category: f.category,
            curators: [ME],
            proposedBy: ME,
            mechanism: f.mechanism,
            status: "proposed",
            reserve: 0,
            autoStream: true,
            pledgeGoal: f.pledgeGoal,
            backingGoal: f.backingGoal,
            coverSeed: Math.floor(Math.random() * 1000),
            createdDay: s.day,
          }
          s.funds.push(fund)
          award(s, ME, POINT_RULES.proposeFund, "propose-fund", `Proposed ${f.name}`)
          log(s, ME, `proposed the fund ${f.name}`, `#/f/${id}`)
          if (f.initialPledge > 0) {
            s.me.bread -= f.initialPledge
            s.fundDonations.push({ id: uid("fd"), from: ME, fundId: id, amount: f.initialPledge, day: s.day })
            award(s, ME, f.initialPledge * POINT_RULES.perFundBread, "donate-fund", `Pledged to ${f.name}`)
          }
          checkLaunches(s)
          return { ok: true, id }
        })
      },

      startCampaign(fundId: string, c: NewCampaign): Result {
        return mutate((s) => {
          const f = getFund(s, fundId)!
          if (c.pool > f.reserve + 0.001) return { ok: false, error: "The fund's reserve isn't that large" }
          if (!c.projectIds.length) return { ok: false, error: "Pick at least one project" }
          f.reserve -= c.pool
          const id = uid("c")
          s.campaigns.push({
            id,
            fundId,
            name: c.name,
            blurb: c.blurb,
            startDay: s.day + c.startsIn,
            endDay: s.day + c.startsIn + c.days,
            matchingPool: c.pool,
            projectIds: c.projectIds,
          })
          award(s, ME, POINT_RULES.curate, "curate", `Launched ${c.name}`)
          log(s, ME, `launched ${c.name} in ${f.name}`, `#/f/${fundId}`)
          return { ok: true, id }
        })
      },

      toggleAutoStream(fundId: string) {
        mutate((s) => {
          const f = getFund(s, fundId)
          if (f) f.autoStream = !f.autoStream
        })
      },

      givePoints(gifts: Record<string, number>): Result {
        return mutate((s) => {
          const items = Object.entries(gifts).filter(([, v]) => v > 0)
          const total = items.reduce((a, [, v]) => a + v, 0)
          if (!total) return { ok: false, error: "Choose how many points to give" }
          if (total > pointsBalance(s, ME)) return { ok: false, error: "You don't have that many points to give" }
          for (const [fundId, amount] of items) {
            s.pointGifts.push({ id: uid("g"), userId: ME, fundId, amount, season: s.season, day: s.day })
          }
          const names = items.map(([fid]) => getFund(s, fid)?.name).join(", ")
          log(s, ME, `gave ${total.toLocaleString()} points to ${names}`, "#/allocate")
          checkLaunches(s)
          return { ok: true }
        })
      },

      advance(days: number) {
        mutate((s) => {
          let holding = s.me.holdingCarry
          for (let i = 0; i < days; i++) {
            s.day += 1
            const y = dailyYield(s)
            s.yieldPool += y
            s.yieldLifetime += y
            s.me.yieldGenerated += (s.me.bread * s.apy) / 365
            holding += (s.me.bread / 10) * POINT_RULES.holdingPer10PerDay
            simulateOthers(s)
            settleCampaigns(s)
            refundDeposits(s)
            checkLaunches(s)
            if (s.day - s.seasonStartDay >= s.seasonLength) distributeYield(s)
            autoCurate(s)
          }
          const whole = Math.floor(holding)
          if (whole > 0) award(s, ME, whole, "holding", `Held BREAD for ${days} day${days > 1 ? "s" : ""}`)
          s.me.holdingCarry = holding - whole
        })
      },

      endSeason() {
        mutate((s) => {
          settleCampaigns(s)
          distributeYield(s)
          autoCurate(s)
        })
      },

      simulateReferral(): string {
        return mutate((s) => {
          const taken = new Set(s.users.map((u) => u.name))
          const name = FRIEND_NAMES.find((n) => !taken.has(n)) ?? `Friend ${s.users.length}`
          const id = uid("u")
          s.users.push({
            id,
            name,
            handle: name.toLowerCase().replace(/[^a-z]/g, ""),
            hue: Math.floor(Math.random() * 360),
            joinedDay: s.day,
            referredBy: ME,
          })
          award(s, ME, POINT_RULES.referral, "referral", `${name} joined with your link`)
          award(s, id, POINT_RULES.welcome, "welcome", "Welcome to Artizenal")
          log(s, id, `joined via your invite`)
          const live = s.campaigns.filter((c) => campaignStatus(c, s.day) === "live")
          if (live.length) {
            const c = live[Math.floor(Math.random() * live.length)]
            const pid = c.projectIds[Math.floor(Math.random() * c.projectIds.length)]
            addDonation(s, id, pid, 20, "BREAD", c.id)
            log(s, id, `made their first donation to ${getProject(s, pid)?.title}`, `#/p/${pid}`)
          }
          return name
        })
      },

      reset() {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* ignore */
        }
        const fresh = buildSeed()
        stateRef.current = fresh
        setState(fresh)
      },
    }),
    [mutate]
  )

  return { state, actions, toast, toasts }
}

type Store = ReturnType<typeof useStoreValue>
const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useStore outside provider")
  return v
}
