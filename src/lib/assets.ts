export type Asset = "USD" | "EUR" | "ETH"

export const ASSET_IDS: Asset[] = ["USD", "EUR", "ETH"]

/** The three pas tokens. Each is created 1:1 from its base currency; rates and APYs are simulated. */
export const ASSETS: Record<
  Asset,
  { token: string; base: string; usd: number; apy: number; digits: number; presets: number[]; yieldSource: string }
> = {
  USD: { token: "pasUSD", base: "USDC", usd: 1, apy: 0.045, digits: 2, presets: [5, 10, 25, 50, 100], yieldSource: "DeFi dollar savings" },
  EUR: { token: "pasEUR", base: "EURC", usd: 1.08, apy: 0.032, digits: 2, presets: [5, 10, 25, 50, 100], yieldSource: "DeFi euro savings" },
  ETH: { token: "pasETH", base: "ETH", usd: 3200, apy: 0.03, digits: 4, presets: [0.005, 0.01, 0.02, 0.05, 0.1], yieldSource: "ETH staking" },
}

export const toUsd = (asset: Asset, units: number) => units * ASSETS[asset].usd

export function fmtUnits(asset: Asset, units: number) {
  const d = ASSETS[asset].digits
  return units.toLocaleString("en-US", { maximumFractionDigits: d })
}

export const zero = (): Record<Asset, number> => ({ USD: 0, EUR: 0, ETH: 0 })

/* ------------------------------------------------------------------ */
/* Display currency: every combined total is stored in USD and shown   */
/* in the viewer's chosen currency (USD by default).                    */
/* ------------------------------------------------------------------ */
export const DISPLAY_SYMBOL: Record<Asset, string> = { USD: "$", EUR: "€", ETH: "Ξ" }

let displayCurrency: Asset = "USD"
export const setDisplayCurrency = (a: Asset) => {
  displayCurrency = a
}
export const getDisplayCurrency = () => displayCurrency

/** Format a dollar value in the current display currency, e.g. "$1,234", "€1,143", "Ξ0.39". */
export function money(usdValue: number, cents = false) {
  const a = displayCurrency
  const v = usdValue / ASSETS[a].usd
  const digits = a === "ETH" ? (Math.abs(v) < 1 ? 4 : Math.abs(v) < 100 ? 3 : 2) : cents ? 2 : 0
  return DISPLAY_SYMBOL[a] + v.toLocaleString("en-US", { minimumFractionDigits: a === "ETH" ? 0 : digits, maximumFractionDigits: digits })
}
