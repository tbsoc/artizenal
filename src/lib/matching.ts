import type { Campaign, Donation, Mechanism } from "./types"

export interface MatchResult {
  matches: Record<string, number>
  /** What the mechanism would pay if the pool were unlimited. */
  demand: number
  /** Fraction of demand the pool can actually cover (1 = fully covered). */
  coverage: number
}

type Contribution = { projectId: string; donor: string; amount: number }

export const MECHANISM_INFO: Record<
  Mechanism["type"],
  { name: string; short: string; explain: string }
> = {
  qf: {
    name: "Quadratic funding",
    short: "QF",
    explain:
      "The pool is split by how many people back a project, not how much any one person gives. Ten people giving $5 unlock far more than one person giving $50.",
  },
  match: {
    name: "1:1 match with cap",
    short: "1:1",
    explain:
      "Every artUSD donated is matched one-for-one, up to a cap per donor per project. If demand exceeds the pool, everything is scaled down evenly.",
  },
  multiplier: {
    name: "Fixed multiplier",
    short: "×",
    explain:
      "Each artUSD donated unlocks a fixed multiple from the pool. If demand exceeds the pool, everything is scaled down evenly.",
  },
}

export function mechanismLabel(m: Mechanism) {
  if (m.type === "qf") return "Quadratic funding"
  if (m.type === "match") return `1:1 match, up to ${m.cap} artUSD per donor`
  return `${m.x}× multiplier`
}

/** Donations made inside a campaign count toward its matching at their dollar value. */
export function campaignContributions(campaign: Campaign, donations: Donation[]): Contribution[] {
  return donations
    .filter(
      (d) =>
        d.campaignId === campaign.id &&
        campaign.projectIds.includes(d.projectId)
    )
    .map((d) => ({ projectId: d.projectId, donor: d.from, amount: d.amount }))
}

export function computeMatches(
  mechanism: Mechanism,
  pool: number,
  projectIds: string[],
  contributions: Contribution[]
): MatchResult {
  // aggregate per project per donor
  const per: Record<string, Record<string, number>> = {}
  for (const id of projectIds) per[id] = {}
  for (const c of contributions) {
    if (!per[c.projectId]) continue
    per[c.projectId][c.donor] = (per[c.projectId][c.donor] ?? 0) + c.amount
  }

  const raw: Record<string, number> = {}
  for (const id of projectIds) {
    const amounts = Object.values(per[id])
    if (mechanism.type === "qf") {
      const sumSqrt = amounts.reduce((s, a) => s + Math.sqrt(a), 0)
      const sum = amounts.reduce((s, a) => s + a, 0)
      raw[id] = Math.max(0, sumSqrt * sumSqrt - sum)
    } else if (mechanism.type === "match") {
      raw[id] = amounts.reduce((s, a) => s + Math.min(a, mechanism.cap), 0)
    } else {
      raw[id] = amounts.reduce((s, a) => s + a, 0) * mechanism.x
    }
  }

  const demand = Object.values(raw).reduce((s, v) => s + v, 0)
  const matches: Record<string, number> = {}
  if (demand <= 0) {
    for (const id of projectIds) matches[id] = 0
    return { matches, demand: 0, coverage: 1 }
  }

  if (mechanism.type === "qf") {
    // QF always distributes the whole pool proportionally (CLR).
    for (const id of projectIds) matches[id] = (pool * raw[id]) / demand
    return { matches, demand, coverage: Math.min(1, pool / demand) }
  }

  const scale = Math.min(1, pool / demand)
  for (const id of projectIds) matches[id] = raw[id] * scale
  return { matches, demand, coverage: scale }
}

export function campaignMatches(campaign: Campaign, mechanism: Mechanism, donations: Donation[]) {
  if (campaign.settled) {
    return { matches: campaign.settled, demand: 0, coverage: 1 }
  }
  return computeMatches(
    mechanism,
    campaign.matchingPool,
    campaign.projectIds,
    campaignContributions(campaign, donations)
  )
}

/** Raw (un-normalised) QF score per project. */
function qfScores(projectIds: string[], contributions: Contribution[]) {
  const per: Record<string, Record<string, number>> = {}
  for (const id of projectIds) per[id] = {}
  for (const c of contributions) {
    if (per[c.projectId]) per[c.projectId][c.donor] = (per[c.projectId][c.donor] ?? 0) + c.amount
  }
  const out: Record<string, number> = {}
  for (const id of projectIds) {
    const amounts = Object.values(per[id])
    const sumSqrt = amounts.reduce((s, a) => s + Math.sqrt(a), 0)
    out[id] = Math.max(0, sumSqrt * sumSqrt - amounts.reduce((s, a) => s + a, 0))
  }
  return out
}

/**
 * Extra match unlocked per project by a set of new gifts.
 *
 * QF shares a fixed pool, so adding money anywhere slightly dilutes everyone
 * else. Like most QF platforms we show the match a gift attracts at today's
 * rate (pool / total score), which is what donors intuitively expect.
 */
function matchDelta(
  campaign: Campaign,
  mechanism: Mechanism,
  donations: Donation[],
  donor: string,
  items: { projectId: string; amount: number }[]
) {
  const base = campaignContributions(campaign, donations)
  const added = [...base, ...items.map((i) => ({ projectId: i.projectId, donor, amount: i.amount }))]
  const perProject: Record<string, number> = {}
  if (mechanism.type === "qf") {
    const before = qfScores(campaign.projectIds, base)
    const after = qfScores(campaign.projectIds, added)
    const totalBefore = Object.values(before).reduce((a, b) => a + b, 0)
    const totalAfter = Object.values(after).reduce((a, b) => a + b, 0)
    const rate = campaign.matchingPool / Math.max(1, totalBefore || totalAfter)
    for (const i of items) perProject[i.projectId] = Math.max(0, (after[i.projectId] - before[i.projectId]) * rate)
  } else {
    const before = computeMatches(mechanism, campaign.matchingPool, campaign.projectIds, base)
    const after = computeMatches(mechanism, campaign.matchingPool, campaign.projectIds, added)
    for (const i of items) perProject[i.projectId] = Math.max(0, (after.matches[i.projectId] ?? 0) - (before.matches[i.projectId] ?? 0))
  }
  return perProject
}

/** Extra match a project would receive if `donor` gave `amount` more artUSD now. */
export function marginalMatch(
  campaign: Campaign,
  mechanism: Mechanism,
  donations: Donation[],
  projectId: string,
  donor: string,
  amount: number
) {
  return matchDelta(campaign, mechanism, donations, donor, [{ projectId, amount }])[projectId] ?? 0
}

/** Match unlocked by a basket of donations across projects in one campaign. */
export function basketMatch(
  campaign: Campaign,
  mechanism: Mechanism,
  donations: Donation[],
  donor: string,
  items: { projectId: string; amount: number }[]
) {
  const perProject = matchDelta(campaign, mechanism, donations, donor, items)
  const total = Object.values(perProject).reduce((a, b) => a + b, 0)
  return { perProject, total }
}
