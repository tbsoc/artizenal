import { Card, LinkButton, SectionTitle, Loaf } from "@/components/ui"
import { MECHANISM_INFO } from "@/lib/matching"
import { POINT_RULES, useStore } from "@/lib/store"
import { PROJECT_DEPOSIT, PROPOSE_MIN_POINTS } from "@/lib/seed"
import { num } from "@/lib/utils"

const QA: { q: string; a: string }[] = [
  {
    q: "What is BREAD?",
    a: "The Bread Cooperative's community currency. Created from USDC 1:1, redeemable any time.",
  },
  {
    q: "Where does the matching money come from?",
    a: "Interest on the USDC behind BREAD. Each season it's split between funds. Principal is never spent.",
  },
  {
    q: "Why do only BREAD donations get matched?",
    a: "BREAD earns the yield that pays for matching. USDC gifts still reach projects in full.",
  },
  {
    q: "What are points for?",
    a: `You give them to funds each season. A fund with 30% of the points gets 30% of the yield. Earn ${num(PROPOSE_MIN_POINTS)} to propose a fund.`,
  },
  {
    q: "Why is there a deposit to create a project?",
    a: `To keep spam out. ${PROJECT_DEPOSIT} BREAD, returned after 3 backers or 14 days.`,
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
  const { state } = useStore()
  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <div className="text-center">
        <Loaf size={48} className="mx-auto" />
        <h1 className="mt-4 font-display text-3xl leading-tight md:text-[48px] font-semibold tracking-tight">How Artizenal works</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">Holding BREAD pays for matching. Members decide where it goes.</p>
      </div>

      <Card className="p-8">
        <svg viewBox="0 0 820 230" className="w-full" role="img" aria-label="Money flow diagram">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)" />
            </marker>
          </defs>
          {[
            { x: 10, label: "Members", sub: "convert USDC to BREAD" },
            { x: 175, label: "Reserves", sub: `earn ~${(state.apy * 100).toFixed(1)}% a year` },
            { x: 340, label: "Yield pool", sub: "builds up each season" },
            { x: 505, label: "Funds", sub: "share = points ratio" },
            { x: 670, label: "Rounds", sub: "match BREAD gifts" },
          ].map((b, i) => (
            <g key={b.label}>
              <rect x={b.x} y={40} width={140} height={74} rx={16} fill={i === 2 ? "var(--community)" : "var(--card)"} stroke="var(--border)" />
              <text x={b.x + 70} y={72} textAnchor="middle" fontSize="16" fontWeight="600" fill={i === 2 ? "white" : "var(--foreground)"}>
                {b.label}
              </text>
              <text x={b.x + 70} y={94} textAnchor="middle" fontSize="12" fill={i === 2 ? "rgba(255,255,255,.8)" : "var(--muted-foreground)"}>
                {b.sub}
              </text>
              {i < 4 && <line x1={b.x + 144} y1={77} x2={b.x + 171} y2={77} stroke="var(--muted-foreground)" strokeWidth="1.5" markerEnd="url(#ar)" />}
            </g>
          ))}
          <path d="M740 118 C 740 200, 80 200, 80 118" fill="none" stroke="var(--crust)" strokeWidth="1.5" strokeDasharray="5 5" markerEnd="url(#ar)" />
          <text x={410} y={186} textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">
            Members donate BREAD to projects → matched → projects grow → more members join
          </text>
          <path d="M575 118 C 575 150, 470 150, 430 150" fill="none" stroke="var(--coop-ink)" strokeWidth="1.5" />
          <text x={575} y={22} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--coop-ink)">
            Points given ✦ set the ratio
          </text>
        </svg>
      </Card>

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
