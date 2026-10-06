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
  reserve: number // unassigned BREAD held by the fund
  autoStream: boolean // route yield share straight into live campaigns
  pledgeGoal: number // proposed funds: BREAD needed to launch
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

export type Currency = "BREAD" | "USDC"

export interface Donation {
  id: string
  from: string
  projectId: string
  campaignId?: string
  amount: number
  currency: Currency
  day: number
}

export interface FundDonation {
  id: string
  from: string
  fundId: string
  campaignId?: string // undefined = fund reserve / launch pledge
  amount: number
  day: number
}

export type PointsReason =
  | "welcome"
  | "referral"
  | "referral-bonus"
  | "donate-bread"
  | "donate-usdc"
  | "donate-fund"
  | "early-backer"
  | "holding"
  | "create-project"
  | "artizen-alumni"
  | "propose-fund"
  | "curate"
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
  usdc: number
  bread: number
  onboarded: boolean
  referralCode: string
  yieldGenerated: number
  holdingCarry: number // fractional holding points not yet awarded
}

export interface State {
  version: number
  day: number
  season: number
  seasonStartDay: number
  seasonLength: number
  apy: number
  otherSupply: number
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
  activity: Activity[]
  distributions: Distribution[]
  cart: CartItem[]
}
