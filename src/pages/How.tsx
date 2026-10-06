import { Card, LinkButton, SectionTitle } from "@/components/ui"
import { MECHANISM_INFO } from "@/lib/matching"
import { POINT_RULES } from "@/lib/store"
import { PROJECT_DEPOSIT, PROPOSE_MIN_POINTS } from "@/lib/seed"
import { num } from "@/lib/utils"

const QA: { q: string; a: string }[] = [
  {
    q: "What are artUSD, artEUR and artETH?",
    a: "Art tokens built on the Bread Cooperative stack. Each is created 1:1 from USDC, EURC or ETH and can be redeemed any time.",
  },
  {
    q: "How do art tokens earn yield?",
    a: "The USDC, EURC and ETH behind them are put to work in DeFi: dollar and euro savings protocols, and ETH staking. You keep your tokens and can redeem them 1:1; the yield they earn goes to matching.",
  },
  {
    q: "Where does the matching money come from?",
    a: "The Artizenal Wealth Fund: everything behind the art tokens, plus permanent endowments. Its savings and staking yield is split between funds each season. Principal is never spent.",
  },
  {
    q: "What does endowing mean?",
    a: `Giving USDC, EURC or ETH to the Wealth Fund for good. It earns yield for matching forever, and you get ${POINT_RULES.perEndowedUsd} points per $1 to steer it.`,
  },
  {
    q: "What are points for?",
    a: `You give them to funds each season. A fund with 30% of the points gets 30% of the yield. Earn ${num(PROPOSE_MIN_POINTS)} to propose a fund.`,
  },
  {
    q: "Why is there a deposit to create a project?",
    a: `To keep spam out. ${PROJECT_DEPOSIT} artUSD, returned after 3 backers or 14 days.`,
  },
  {
    q: "I was on Artizen. What happens to my project?",
    a: `Bring it over. You'll get an alumni badge and ${num(POINT_RULES.artizenAlumni)} points.`,
  },
  {
    q: "Is any of this real?",
    a: "Not yet. It's simulated in your browser. Use the day counter to skip ahead.",
  },
]

export function How() {
  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <div className="text-center">
        <h1 className="font-display text-3xl leading-tight md:text-[48px] font-semibold tracking-tight">How Artizenal works</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">Holding art tokens pays for matching. Members decide where it goes.</p>
      </div>

      <div>
        <SectionTitle title="Three ways to match" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Object.values(MECHANISM_INFO).map((m) => (
            <Card key={m.name} className="p-5">
              <div className="font-semibold">{m.name}</div>
              <p className="mt-2 text-sm text-muted-foreground">{m.explain}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle title="Questions" />
        <div className="space-y-3">
          {QA.map((x) => (
            <details key={x.q} className="group rounded-2xl border border-border bg-card px-6 py-4 open:pb-5">
              <summary className="cursor-pointer list-none font-semibold marker:hidden">
                <span className="mr-2 inline-block text-crust transition group-open:rotate-90">›</span>
                {x.q}
              </summary>
              <p className="mt-2 pl-5 text-sm leading-relaxed text-muted-foreground">{x.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <LinkButton href="#/funds" size="lg">
          See live rounds
        </LinkButton>
        <LinkButton href="#/new?artizen=1" size="lg" variant="outline">
          Bring your Artizen project
        </LinkButton>
      </div>
    </div>
  )
}
