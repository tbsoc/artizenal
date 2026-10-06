export type Asset = "USD" | "EUR" | "ETH"

export const ASSET_IDS: Asset[] = ["USD", "EUR", "ETH"]

/** The three art tokens. Each is created 1:1 from its base currency; rates and APYs are simulated. */
export const ASSETS: Record<
  Asset,
  { token: string; base: string; usd: number; apy: number; digits: number; presets: number[]; yieldSource: string }
> = {
  USD: { token: "artUSD", base: "USDC", usd: 1, apy: 0.045, digits: 2, presets: [5, 10, 25, 50, 100], yieldSource: "US dollar savings" },
  EUR: { token: "artEUR", base: "EURC", usd: 1.08, apy: 0.032, digits: 2, presets: [5, 10, 25, 50, 100], yieldSource: "euro savings" },
  ETH: { token: "artETH", base: "ETH", usd: 3200, apy: 0.03, digits: 4, presets: [0.005, 0.01, 0.02, 0.05, 0.1], yieldSource: "ETH staking" },
}

export const toUsd = (asset: Asset, units: number) => units * ASSETS[asset].usd

export function fmtUnits(asset: Asset, units: number) {
  const d = ASSETS[asset].digits
  return units.toLocaleString("en-US", { maximumFractionDigits: d })
}

export const zero = (): Record<Asset, number> => ({ USD: 0, EUR: 0, ETH: 0 })
