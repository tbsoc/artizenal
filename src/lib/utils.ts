import { money } from "./assets"
import { clsx } from "clsx"
import type { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a dollar value in the viewer's display currency (USD by default). */
export function usd(amount: number, cents = false) {
  return money(amount, cents)
}

export function num(n: number, digits = 0) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function compact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n)
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function dayLabel(day: number, today: number) {
  const d = today - day
  if (d <= 0) return "today"
  if (d === 1) return "yesterday"
  return `${d} days ago`
}
