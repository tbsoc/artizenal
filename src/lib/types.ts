import type { Asset } from "./assets"

export type Category =
  | "Art"
  | "Music"
  | "Science"
  | "Climate"
  | "Publishing"
  | "Food"
  | "Community"
  | "Tech"

export const CATEGORIES: Category[] = [
  "Art",
  "Music",
  "Science",
  "Climate",
  "Publishing",
  "Food",
  "Community",
  "Tech",
]

export interface User {
  id: string
  name: string
  handle: string
  hue: number
  bio?: string
  referredBy?: string
  joinedDay: number
}

export type DepositStatus = "held" | "refunded" | "forfeited"

export interface Project {
  id: string
  title: string
  tagline: string
  description: string
  category: Category
  creatorId: string
  location: string
  website?: string
  image?: string // data URL for uploaded cover
  coverSeed: number
  artizen?: { season: string; url?: string }
  deposit: { amount: number; status: DepositStatus }
  createdDay: number
  goal: number
  updates: { day: number; text: string }[]
}

export type Mechanism =
  | { type: "qf" }
  | { type: "match"; cap: number }
  | { type: "multiplier"; x: number }

export type FundStatus = "active" | "proposed"

export interface Fund {
  id: string
  name: string
  tagline: string
  description: string
  category: Category
  curators: string[]
  proposedBy: string
  mechanism: Mechanism
  status: FundStatus
  reserve: number // unassigned pasUSD held by the fund
  autoStream: boolean // route yield share straight into live campaigns
  pledgeGoal: number // proposed funds: pasUSD needed to launch
  backingGoal: number // proposed funds: points needed to launch
  coverSeed: number
  createdDay: number
}

export interface Campaign {
  id: string
  fundId: string
  name: string
  blurb: string
  startDay: number
  endDay: number
  matchingPool: number
  projectIds: string[]
  settled?: Record<string, number> // projectId -> match paid out
}

export interface Donation {
  id: string
  from: string
  projectId: string
  campaignId?: string
  amount: number // dollar value; matching and totals use this
  asset: Asset
  units: number // amount the project received, after the Wealth Fund fee
  fee?: number // units sent to the Wealth Fund
  day: number
}

/** A permanent gift of principal to the Pastry Wealth Fund. */
export interface Endowment {
  id: string
  userId: string
  asset: Asset
  units: number
  usd: number
  day: number
}

export interface FundDonation {
  id: string
  from: string
  fundId: string
  campaignId?: string // undefined = fund reserve / launch pledge
  amount: number // dollar value the fund received, after the Wealth Fund fee
  asset: Asset
  units: number
  fee?: number
  message?: string
  link?: string
  anonymous?: boolean
  day: number
}

export type PointsReason =
  | "welcome"
  | "referral"
  | "referral-bonus"
  | "donate-bread"
  | "donate-fund"
  | "early-backer"
  | "holding"
  | "create-project"
  | "artizen-alumni"
  | "propose-fund"
  | "curate"
  | "endow"
  | "seed"

export interface PointsEvent {
  id: string
  userId: string
  amount: number
  reason: PointsReason
  note: string
  day: number
}

/** Points given to a fund. Given points are spent; each season's gifts set that season's yield split. */
export interface PointGift {
  id: string
  userId: string
  fundId: string
  amount: number
  season: number
  day: number
}

export interface Activity {
  id: string
  day: number
  userId: string
  text: string
  href?: string
}

export interface Distribution {
  season: number
  day: number
  total: number
  shares: Record<string, number>
  points: Record<string, number>
}

export interface CartItem {
  projectId: string
  campaignId: string
  amount: number
}

export interface Me {
  base: Record<Asset, number> // USDC, EURC, ETH
  art: Record<Asset, number> // pasUSD, pasEUR, pasETH
  onboarded: boolean
  referralCode: string
  yieldGenerated: number
  holdingCarry: number // fractional holding points not yet awarded
  onboardingDismissed?: boolean
  display?: Asset // currency totals are shown in
}

export interface State {
  version: number
  day: number
  season: number
  seasonStartDay: number
  seasonLength: number
  supply: Record<Asset, number> // pas tokens held by other members (redeemable)
  endowed: Record<Asset, number> // permanent principal from everyone, in units
  feeUnits: Record<Asset, number> // permanent principal from the 10% donation fee
  yieldPool: number
  yieldLifetime: number
  me: Me
  users: User[]
  projects: Project[]
  funds: Fund[]
  campaigns: Campaign[]
  donations: Donation[]
  fundDonations: FundDonation[]
  points: PointsEvent[]
  pointGifts: PointGift[]
  endowments: Endowment[]
  activity: Activity[]
  distributions: Distribution[]
  cart: CartItem[]
  cartAsset?: Asset
}
