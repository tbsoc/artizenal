import { useState } from "react"
import { createPortal } from "react-dom"
import { HandCoins, HelpCircle, Landmark, Sprout, Vote, Coins } from "lucide-react"
import { LinkButton, Modal } from "./ui"
import { dailyYield, useStore } from "@/lib/store"
import { cn, usd } from "@/lib/utils"

const STEPS = [
  { icon: Coins, title: "Stake", text: "Convert USDC, EURC or ETH into pasUSD, pasEUR or pasETH, 1:1. They stay yours and you can redeem them 1:1 any time." },
  { icon: Sprout, title: "Earn yield", text: "The reserves behind every pas token are staked in DeFi savings and ETH staking, and earn yield." },
  { icon: Landmark, title: "Fill the matching pool", text: "All that yield collects in the Pastry Wealth Fund as the season's matching pool." },
  { icon: Vote, title: "Points split it", text: "Members give points to funds. Each fund's share of the pool is its points divided by all points given." },
  { icon: HandCoins, title: "Rounds match projects", text: "Each fund puts its share into its matching rounds, where it matches donations to projects." },
]

/** A small "What are pas tokens?" link that opens the explainer. */
export function PasInfo({ className, label = "What are pas tokens?" }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className={cn("inline-flex items-center gap-1 text-xs font-semibold text-crust hover:underline cursor-pointer", className)}
      >
        <HelpCircle size={13} /> {label}
      </button>
      {open && createPortal(<PasExplainer onClose={() => setOpen(false)} />, document.body)}
    </>
  )
}

function PasExplainer({ onClose }: { onClose: () => void }) {
  const { state } = useStore()
  return (
    <Modal open onClose={onClose} title="What are pas tokens?" width={560}>
      <p className="text-sm text-muted-foreground">
        pas tokens are staked dollars, euros and ETH. Holding them is how matching gets paid for.
      </p>
      <ol className="mt-5 space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wheat/30 text-crust">
              <s.icon size={17} />
            </div>
            <div>
              <div className="text-sm font-semibold">
                {i + 1}. {s.title}
              </div>
              <div className="text-sm text-muted-foreground">{s.text}</div>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-community/8 px-4 py-3 text-sm">
        <span>
          This season: <b className="text-community">{usd(state.yieldPool)}</b> of yield so far, about {usd(dailyYield(state))} a day.
        </span>
        <LinkButton href="#/wallet" size="sm" onClick={onClose}>
          Get pas tokens
        </LinkButton>
      </div>
    </Modal>
  )
}
