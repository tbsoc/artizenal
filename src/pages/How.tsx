import { Card, LinkButton, SectionTitle, Loaf } from "@/components/ui"
import { MECHANISM_INFO } from "@/lib/matching"
import { POINT_RULES, useStore } from "@/lib/store"
import { PROJECT_DEPOSIT, PROPOSE_MIN_POINTS } from "@/lib/seed"
import { num } from "@/lib/utils"

const QA: { q: string; a: string }[] = [
  {
    q: "What is BREAD?",
    a: "BREAD is the Bread Cooperative's community currency. It's created from USDC 1:1, and you can turn it back into USDC at any time. Every BREAD is backed by the USDC held in reserve.",
  },
  {
    q: "Where does the matching money come from?",
    a: "From interest. The USDC behind every BREAD sits in safe, interest-bearing reserves. The interest goes into a shared yield pool, and at the end of every season the pool is split between funds. Nobody's principal is ever spent.",
  },
  {
    q: "Why do only BREAD donations get matched?",
    a: "BREAD is what earns the yield that pays for matching. Rewarding gifts in BREAD keeps the loop going: more BREAD held means more yield, and more yield means bigger matches. USDC donations still reach projects in full. They just aren't matched.",
  },
  {
    q: "What are points for?",
    a: `Points are earned, never bought. Each season you give them to funds. A fund's share of that season's yield is the points it received divided by all the points given, so a fund with 30% of the points gets 30% of the yield. Given points are spent, and the count starts fresh each season. Points given to a proposed fund add up until it launches. Once you've earned ${num(PROPOSE_MIN_POINTS)} points you can propose a fund of your own.`,
  },
  {
    q: "Why is there a deposit to create a project?",
    a: `It keeps spam out. You put down ${PROJECT_DEPOSIT} BREAD when you publish. It comes back once 3 different people back you, or after 14 days without spam reports. Curators can send a spam project's deposit to the matching pool.`,
  },
  {
    q: "I was on Artizen. What happens to my project?",
    a: `Bring it over. Tick "This project was on Artizen" when you create it and link your old page. You'll get an alumni badge, a ${num(POINT_RULES.artizenAlumni)}-point welcome, and you can enter the Artizen Rescue Fund's rounds.`,
  },
  {
    q: "Is any of this real?",
    a: "Not yet. This is a showcase. Every number is simulated in your browser so you can try the whole loop: holding BREAD, donating, matching, giving points, curating. Use the day counter in the header to fast-forward time.",
  },
]

export function How() {
  const { state } = useStore()
  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <div className="text-center">
        <Loaf size={48} className="mx-auto" />
        <h1 className="mt-4 font-display text-[48px] leading-tight font-semibold tracking-tight">How Artizenal works</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
          A funding platform owned by the people who use it. Holding BREAD pays for matching, and members decide where the matching goes.
        </p>
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
        <SectionTitle title="Three ways to match" sub="Each fund picks the formula that fits its community when it's proposed." />
        <div className="grid grid-cols-3 gap-4">
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
