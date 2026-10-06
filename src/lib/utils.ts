import { clsx } from "clsx"
import type { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function usd(amount: number, cents = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(amount)
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
