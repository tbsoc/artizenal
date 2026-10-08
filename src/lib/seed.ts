import { ASSETS, ASSET_IDS, zero } from "./assets"
import type { Asset } from "./assets"
import { campaignContributions, computeMatches } from "./matching"
import type {
  Activity,
  Campaign,
  Donation,
  Endowment,
  Fund,
  PointGift,
  PointsEvent,
  Project,
  State,
  User,
} from "./types"

export const STATE_VERSION = 10
export const PROJECT_DEPOSIT = 25
export const PROPOSE_MIN_POINTS = 1000
/** A proposed fund must raise at least this much matching money (in dollars) before it can launch. */
export const MIN_FUND_PLEDGE = 1000
export const START_USDC = 750
export const START_BASE: Record<Asset, number> = { USD: 750, EUR: 400, ETH: 0.25 }
export const START_ART: Record<Asset, number> = { USD: 250, EUR: 100, ETH: 0.05 }

/** Small deterministic PRNG so the seeded world is the same on every load. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const users: User[] = [
  { id: "maya", name: "Maya Okafor", handle: "maya", hue: 18, joinedDay: 0, bio: "Printmaker. Ran a riso studio on Artizen for three seasons." },
  { id: "theo", name: "Theo Lindqvist", handle: "theo", hue: 210, joinedDay: 0, bio: "Marine biologist, tidepool nerd." },
  { id: "priya", name: "Priya Raman", handle: "priya", hue: 330, joinedDay: 1, bio: "Seed saver and food sovereignty organizer." },
  { id: "sol", name: "Sol Ibarra", handle: "sol", hue: 45, joinedDay: 2, bio: "Sound artist recording vanishing places." },
  { id: "june", name: "June Park", handle: "junepark", hue: 160, joinedDay: 2, bio: "Hardware hacker, air quality obsessive." },
  { id: "kofi", name: "Kofi Mensah", handle: "kofi", hue: 260, joinedDay: 3, bio: "Builds repair cafés and tool libraries." },
  { id: "ana", name: "Ana Ruiz", handle: "anaruiz", hue: 0, joinedDay: 4, bio: "Translator. Feminist economics reading group." },
  { id: "ezra", name: "Ezra Cohen", handle: "ezra", hue: 120, joinedDay: 5, bio: "Materials scientist growing things out of fungi." },
  { id: "lena", name: "Lena Vogel", handle: "lena", hue: 290, joinedDay: 6, bio: "Accessible instrument designer." },
  { id: "dev", name: "Dev Patel", handle: "devp", hue: 190, joinedDay: 8, bio: "Solar installer turned co-op organizer." },
  { id: "rosa", name: "Rosa Delgado", handle: "rosa", hue: 350, joinedDay: 9, bio: "Oral historian, community archivist." },
  { id: "kai", name: "Kai Nakamura", handle: "kai", hue: 230, joinedDay: 11, bio: "Birder. Builds tiny apps for big counts." },
  { id: "ines", name: "Inês Costa", handle: "ines", hue: 30, joinedDay: 14, bio: "Cook, writer, kitchen co-op member." },
  { id: "noor", name: "Noor Haddad", handle: "noor", hue: 140, joinedDay: 17, bio: "Curator. Previously on the Artizen fund council." },
  { id: "bea", name: "Bea Thompson", handle: "bea", hue: 270, joinedDay: 20, bio: "Musician, label refusenik." },
  { id: "oli", name: "Oliver Grant", handle: "oli", hue: 80, joinedDay: 23, bio: "Donor, mostly to weird science." },
]

const P = (p: Omit<Project, "deposit" | "updates"> & Partial<Pick<Project, "deposit" | "updates">>): Project => ({
  deposit: { amount: PROJECT_DEPOSIT, status: "refunded" },
  updates: [],
  ...p,
})

const projects: Project[] = [
  P({
    id: "tidepool-atlas",
    title: "Tidepool Atlas",
    tagline: "An open map of intertidal life, built by the people who visit it.",
    category: "Science",
    creatorId: "theo",
    location: "Pacific Northwest",
    coverSeed: 11,
    goal: 8000,
    createdDay: 1,
    artizen: { season: "Artizen Season 5", url: "https://artizen.fund" },
    description:
      "Tidepool Atlas is a free, open dataset and field guide for intertidal zones along the Pacific coast. Volunteers log what they see at low tide with a phone, and we turn those sightings into maps that marine researchers and coastal schools use.\n\nWe were mid-way through a matching round on Artizen when the platform shut down. The match we were counting on to pay for our second year of server costs and a field-training weekend disappeared with it.\n\nFunding here covers hosting, two training weekends for new volunteers, and a printed pocket guide that we give away at trailheads.",
    updates: [
      { day: 33, text: "We moved our full dataset to an open archive. 41,000 observations and counting." },
      { day: 39, text: "First training weekend booked for next month. 24 volunteers signed up." },
    ],
  }),
  P({
    id: "seed-library-van",
    title: "The Seed Library Van",
    tagline: "A retired bread van that lends heirloom seeds to rural towns.",
    category: "Food",
    creatorId: "priya",
    location: "Central Valley, CA",
    coverSeed: 23,
    goal: 12000,
    createdDay: 2,
    description:
      "We bought a retired bakery delivery van and turned it into a rolling seed library. Every two weeks it visits seven small towns. People borrow seeds in spring and bring saved seeds back in autumn.\n\nThe collection is now over 300 varieties, most of them adapted to drought. Funding pays for fuel, a new solar fridge for seed storage, and a part-time driver who also runs seed-saving workshops.",
  }),
  P({
    id: "riso-commons",
    title: "Riso Commons",
    tagline: "A shared risograph studio for zine makers who can't afford one.",
    category: "Publishing",
    creatorId: "maya",
    location: "Lagos & online",
    coverSeed: 37,
    goal: 6000,
    createdDay: 1,
    artizen: { season: "Artizen Season 4", url: "https://artizen.fund" },
    description:
      "Riso Commons is a community print studio with two risograph machines, a drum library, and open hours for anyone who wants to publish. We print zines, posters and small-run books at cost.\n\nWe were a featured project on Artizen for three seasons. When it closed, we lost our main source of matching and the community that came with it. We're rebuilding here.\n\nThis round pays for ink, drum maintenance, and twelve free studio residencies for first-time publishers.",
    updates: [{ day: 36, text: "Residency applications are open. We received 80 in the first week." }],
  }),
  P({
    id: "night-choir",
    title: "Night Choir",
    tagline: "Field recordings of cities after midnight, released for free.",
    category: "Music",
    creatorId: "sol",
    location: "Mexico City",
    coverSeed: 41,
    goal: 4000,
    createdDay: 3,
    artizen: { season: "Artizen Season 6" },
    description:
      "Night Choir is an ongoing archive of field recordings made between midnight and 4am in cities that are changing fast. Street vendors, generators, birds that have learned to sing over traffic.\n\nEverything is released under a Creative Commons license so other musicians can sample it. Funding pays for a new recorder, travel to three cities, and mastering.",
  }),
  P({
    id: "repair-kits",
    title: "Repair Café Starter Kits",
    tagline: "Everything a neighborhood needs to run its first repair café.",
    category: "Climate",
    creatorId: "kofi",
    location: "Accra & Rotterdam",
    coverSeed: 52,
    goal: 9000,
    createdDay: 4,
    description:
      "A repair café is a monthly event where volunteers fix broken things for free. Toasters, bikes, jeans, laptops. Starting one is mostly a matter of tools and confidence.\n\nWe pack both into a crate: a vetted tool set, signage, a volunteer handbook in five languages, and a follow-up call with an experienced organizer. Every crate we fund goes to a group that has already found a venue.",
    updates: [{ day: 40, text: "Crate #14 shipped to a library in Kumasi." }],
  }),
  P({
    id: "mycelium-bricks",
    title: "Mycelium Bricks for Schools",
    tagline: "Kids grow building blocks from mushrooms and farm waste.",
    category: "Science",
    creatorId: "ezra",
    location: "Lisbon",
    coverSeed: 64,
    goal: 10000,
    createdDay: 5,
    artizen: { season: "Artizen Season 5", url: "https://artizen.fund" },
    description:
      "We run a six-week classroom program where students grow mycelium bricks from agricultural waste, test their strength, and build something with them at the end.\n\nThe program was half funded through an Artizen match that was never paid out. We're asking the community to help us finish the year in the eight schools already enrolled.",
  }),
  P({
    id: "oral-histories",
    title: "Block by Block Oral Histories",
    tagline: "Recording the people who remember the neighborhood before.",
    category: "Community",
    creatorId: "rosa",
    location: "San Antonio, TX",
    coverSeed: 75,
    goal: 5000,
    createdDay: 9,
    description:
      "Block by Block trains teenagers to interview elders on their street and archives the recordings with the local library. Each summer we cover a new set of blocks.\n\nFunding pays the teen interviewers a stipend, which is the difference between this program happening or not.",
  }),
  P({
    id: "air-monitors",
    title: "Open Air Monitors",
    tagline: "$40 open-hardware air sensors that anyone can build.",
    category: "Tech",
    creatorId: "june",
    location: "Seoul",
    coverSeed: 88,
    goal: 7000,
    createdDay: 3,
    description:
      "An open-source PM2.5 and CO₂ sensor you can solder in an afternoon. The design, firmware and calibration data are all public.\n\nWe want to run twenty build workshops in neighborhoods next to highways and industrial zones, and publish the resulting data on an open map.",
  }),
  P({
    id: "accessible-synth",
    title: "The Accessible Synth Project",
    tagline: "Synthesizers designed for players with limited hand mobility.",
    category: "Music",
    creatorId: "lena",
    location: "Berlin",
    coverSeed: 93,
    goal: 6500,
    createdDay: 6,
    artizen: { season: "Artizen Season 6" },
    description:
      "Most synthesizers assume ten nimble fingers. We design instruments around breath, head tracking and large-format pads, together with disabled musicians who test every prototype.\n\nAll designs are open hardware. This round funds a batch of twelve instruments for a touring ensemble.",
  }),
  P({
    id: "kitchen-cookbook",
    title: "The Co-op Kitchen Cookbook",
    tagline: "Recipes and bylaws from 30 worker-owned kitchens.",
    category: "Publishing",
    creatorId: "ines",
    location: "Porto",
    coverSeed: 104,
    goal: 4500,
    createdDay: 14,
    description:
      "Half cookbook, half how-to. Each chapter profiles a worker-owned kitchen, shares three of its recipes, and explains how it governs itself.\n\nWe'll print 1,000 copies and give half of them to people trying to start a food co-op.",
  }),
  P({
    id: "solar-toolkit",
    title: "Rooftop Solar Co-op Toolkit",
    tagline: "An open playbook for neighbors buying solar together.",
    category: "Climate",
    creatorId: "dev",
    location: "Pune",
    coverSeed: 117,
    goal: 8000,
    createdDay: 8,
    description:
      "Group purchasing cuts the cost of rooftop solar by a third. The hard part is the paperwork. We're writing an open toolkit covering bulk buying, installer vetting, financing and shared maintenance, tested with four housing societies.",
  }),
  P({
    id: "lullabies",
    title: "Lullaby Archive",
    tagline: "Collecting the songs grandparents sing, in 40 languages.",
    category: "Music",
    creatorId: "bea",
    location: "Online",
    coverSeed: 129,
    goal: 3000,
    createdDay: 20,
    artizen: { season: "Artizen Season 3" },
    description:
      "Families record lullabies on their phones and send them in. We clean up the audio, transcribe and translate the lyrics, and publish everything openly.\n\nWe started on Artizen in its early seasons and have 1,200 recordings so far.",
  }),
  P({
    id: "bird-count",
    title: "Backyard Bird Count",
    tagline: "A tiny app that makes bird surveys easy for anyone.",
    category: "Science",
    creatorId: "kai",
    location: "Osaka",
    coverSeed: 133,
    goal: 3500,
    createdDay: 12,
    description:
      "Point, tap, done. Backyard Bird Count makes it easy to log what you see in fifteen minutes, then shares the data with regional bird surveys. Funding covers a year of hosting and translation into four languages.",
  }),
  P({
    id: "feminist-econ",
    title: "Translating Feminist Economics",
    tagline: "Open translations of essential texts, out of English.",
    category: "Publishing",
    creatorId: "ana",
    location: "Buenos Aires",
    coverSeed: 147,
    goal: 5500,
    createdDay: 4,
    artizen: { season: "Artizen Season 5", url: "https://artizen.fund" },
    description:
      "Most feminist economics is published in English and stays there. We translate key essays into Spanish, Portuguese and Swahili and publish them free online and in cheap print editions for reading groups.",
  }),
  P({
    id: "mural-walls",
    title: "Walls That Remember",
    tagline: "Community murals painted with the stories residents choose.",
    category: "Art",
    creatorId: "noor",
    location: "Amman",
    coverSeed: 158,
    goal: 6000,
    createdDay: 18,
    artizen: { season: "Artizen Season 4" },
    description:
      "Each mural starts with a month of story circles. Residents decide what the wall should say, and local artists lead painting days that anyone can join. We've painted four walls so far.",
  }),
]

const funds: Fund[] = [
  {
    id: "artizen-rescue",
    name: "Artizen Rescue Fund",
    tagline: "Finishing what Artizen started for the projects it left behind.",
    description:
      "When Artizen shut down, hundreds of projects lost matching they had already earned. This fund exists to finish those rounds. Any project that can show it was live on Artizen is eligible.\n\nCurated by former Artizen artists and fund council members. It uses quadratic funding so the community, not a handful of big donors, decides where the money goes.",
    category: "Art",
    curators: ["noor", "maya"],
    proposedBy: "noor",
    mechanism: { type: "qf" },
    status: "active",
    reserve: 1840,
    autoStream: true,
    pledgeGoal: 0,
    backingGoal: 0,
    coverSeed: 7,
    createdDay: 0,
  },
  {
    id: "climate-commons",
    name: "Open Climate Commons",
    tagline: "Practical, open tools for communities adapting to a hotter world.",
    description:
      "We fund repair, reuse, community energy and other climate work that a neighborhood can pick up and run on its own. Everything we fund has to be openly licensed.\n\nWe use a 2× multiplier because our donors told us they want to see their impact doubled, simply.",
    category: "Climate",
    curators: ["kofi", "dev"],
    proposedBy: "kofi",
    mechanism: { type: "multiplier", x: 2 },
    status: "active",
    reserve: 920,
    autoStream: true,
    pledgeGoal: 0,
    backingGoal: 0,
    coverSeed: 15,
    createdDay: 2,
  },
  {
    id: "small-press",
    name: "Small Press & Zines",
    tagline: "Keeping independent publishing weird and affordable.",
    description:
      "Grants and matching for zines, small presses, translation and community publishing. We match every donor one-for-one up to 50 pasUSD per project, so a lot of small gifts go a long way.",
    category: "Publishing",
    curators: ["ana", "maya"],
    proposedBy: "ana",
    mechanism: { type: "match", cap: 50 },
    status: "active",
    reserve: 410,
    autoStream: false,
    pledgeGoal: 0,
    backingGoal: 0,
    coverSeed: 29,
    createdDay: 5,
  },
  {
    id: "community-science",
    name: "Community Science",
    tagline: "Research done by, with and for the people it affects.",
    description:
      "Citizen science, open hardware and participatory research. Quadratic funding helps us find the projects with the broadest community support.",
    category: "Science",
    curators: ["theo", "june", "kai"],
    proposedBy: "theo",
    mechanism: { type: "qf" },
    status: "active",
    reserve: 1260,
    autoStream: true,
    pledgeGoal: 0,
    backingGoal: 0,
    coverSeed: 44,
    createdDay: 6,
  },
  {
    id: "music-no-labels",
    name: "Music Without Labels",
    tagline: "For musicians who'd rather own their work.",
    description:
      "Independent recordings, archives, instruments and tours. 1.5× multiplier on every pasUSD given to a project in an active round.",
    category: "Music",
    curators: ["bea", "sol"],
    proposedBy: "bea",
    mechanism: { type: "multiplier", x: 1.5 },
    status: "active",
    reserve: 2210,
    autoStream: false,
    pledgeGoal: 0,
    backingGoal: 0,
    coverSeed: 58,
    createdDay: 10,
  },
  {
    id: "food-sovereignty",
    name: "Food Sovereignty Kitchens",
    tagline: "Seed libraries, community kitchens and food co-ops.",
    description:
      "A proposed fund for the infrastructure that lets communities feed themselves: seed libraries, shared kitchens, food co-ops and land access. Needs pledges and community backing to launch.",
    category: "Food",
    curators: ["priya", "ines"],
    proposedBy: "priya",
    mechanism: { type: "qf" },
    status: "proposed",
    reserve: 0,
    autoStream: true,
    pledgeGoal: 2500,
    backingGoal: 20000,
    coverSeed: 71,
    createdDay: 34,
  },
  {
    id: "disability-design",
    name: "Disability-led Design",
    tagline: "Tools, instruments and spaces designed by disabled makers.",
    description:
      "A proposed fund that only supports projects led by disabled designers and artists. Curated by a rotating panel of disabled creators.",
    category: "Tech",
    curators: ["lena"],
    proposedBy: "lena",
    mechanism: { type: "match", cap: 100 },
    status: "proposed",
    reserve: 0,
    autoStream: true,
    pledgeGoal: 2000,
    backingGoal: 15000,
    coverSeed: 86,
    createdDay: 38,
  },
]

const campaigns: Campaign[] = [
  {
    id: "lifeboat",
    fundId: "artizen-rescue",
    name: "Lifeboat Round",
    blurb: "Restoring matching for projects stranded mid-round when Artizen closed.",
    startDay: 30,
    endDay: 58,
    matchingPool: 6000,
    projectIds: ["tidepool-atlas", "riso-commons", "mycelium-bricks", "feminist-econ", "night-choir", "accessible-synth", "lullabies", "mural-walls"],
  },
  {
    id: "repair-rebuild",
    fundId: "climate-commons",
    name: "Repair & Rebuild",
    blurb: "Doubling every pasUSD for open tools that keep things out of landfill and power in neighbors' hands.",
    startDay: 35,
    endDay: 63,
    matchingPool: 6000,
    projectIds: ["repair-kits", "solar-toolkit", "mycelium-bricks", "air-monitors"],
  },
  {
    id: "zine-drive",
    fundId: "small-press",
    name: "Spring Zine Drive",
    blurb: "A short, sharp round for presses, zines and translations. Every donor matched 1:1 up to 50 pasUSD.",
    startDay: 38,
    endDay: 52,
    matchingPool: 3000,
    projectIds: ["riso-commons", "kitchen-cookbook", "feminist-econ", "oral-histories"],
  },
  {
    id: "sensor-season",
    fundId: "community-science",
    name: "Sensor Season",
    blurb: "Community-built sensors, surveys and datasets. Opens soon.",
    startDay: 45,
    endDay: 73,
    matchingPool: 5000,
    projectIds: ["air-monitors", "bird-count", "tidepool-atlas"],
  },
  {
    id: "field-recordings",
    fundId: "music-no-labels",
    name: "Field Recordings Round",
    blurb: "Archives and recordings of places and voices.",
    startDay: 8,
    endDay: 28,
    matchingPool: 2500,
    projectIds: ["night-choir", "lullabies", "accessible-synth"],
  },
  {
    id: "round-zero",
    fundId: "artizen-rescue",
    name: "Round Zero",
    blurb: "The emergency round run the week Artizen went dark.",
    startDay: 1,
    endDay: 24,
    matchingPool: 6000,
    projectIds: ["tidepool-atlas", "riso-commons", "mycelium-bricks", "feminist-econ"],
  },
]

const FIRST = ["Alex", "Bo", "Cam", "Dani", "Eli", "Fern", "Gus", "Hiro", "Ivy", "Jo", "Kit", "Lou", "Mo", "Nia", "Ola", "Pax", "Quinn", "Rae", "Sky", "Tam", "Uma", "Vic", "Wren", "Xi", "Yuki", "Zed", "Ari", "Bex", "Cy", "Dee"]
const LAST = ["Abara", "Berg", "Chandra", "Diaz", "Eze", "Falk", "Gomez", "Holm", "Iwata", "Jensen", "Kaur", "Lund", "Moreau", "Ng", "Osei", "Pires", "Quist", "Rahman", "Sato", "Tran"]

/** A crowd of background members so rounds have realistic donor counts. */
function crowd(r: () => number): User[] {
  const out: User[] = []
  const seen = new Set<string>()
  while (out.length < 64) {
    const name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`
    if (seen.has(name)) continue
    seen.add(name)
    out.push({ id: `m${out.length}`, name, handle: name.toLowerCase().replace(/[^a-z]/g, ""), hue: Math.floor(r() * 360), joinedDay: Math.floor(r() * 40) })
  }
  return out
}

export const SEED_DAY = 41
const AMOUNTS = [5, 5, 10, 10, 10, 15, 20, 20, 25, 25, 40, 50, 75, 100, 150]

function buildDonations(r: () => number, everyone: User[]): Donation[] {
  const out: Donation[] = []
  let n = 0
  const donors = everyone.map((u) => u.id)
  for (const c of campaigns) {
    if (c.startDay > SEED_DAY) continue
    const last = Math.min(c.endDay, SEED_DAY)
    for (const pid of c.projectIds) {
      const creator = projects.find((p) => p.id === pid)!.creatorId
      const count = 12 + Math.floor(r() * 22)
      for (let i = 0; i < count; i++) {
        const from = donors[Math.floor(r() * donors.length)]
        if (from === creator) continue
        const amount = AMOUNTS[Math.floor(r() * AMOUNTS.length)]
        const roll = r()
        const asset: Asset = roll < 0.75 ? "USD" : roll < 0.9 ? "EUR" : "ETH"
        out.push({
          id: `sd${n++}`,
          from,
          projectId: pid,
          campaignId: c.id,
          amount,
          asset,
          units: amount / ASSETS[asset].usd,
          day: c.startDay + Math.floor(r() * (last - c.startDay + 1)),
        })
      }
    }
  }
  return out.sort((a, b) => a.day - b.day)
}

export function buildSeed(): State {
  const r = rng(42)
  const members = crowd(rng(7))
  const everyone = [...users, ...members]
  const donations = buildDonations(r, everyone)

  // settle campaigns that already ended
  const settledCampaigns = campaigns.map((c) => {
    if (c.endDay >= SEED_DAY) return { ...c }
    const fund = funds.find((f) => f.id === c.fundId)!
    const { matches } = computeMatches(fund.mechanism, c.matchingPool, c.projectIds, campaignContributions(c, donations))
    return { ...c, settled: matches }
  })

  const seedPoints: Record<string, number> = {
    maya: 9400, theo: 7800, priya: 6200, sol: 3900, june: 5100, kofi: 6800, ana: 4700, ezra: 3300,
    lena: 4100, dev: 2900, rosa: 2400, kai: 3600, ines: 1900, noor: 8700, bea: 2600, oli: 5600,
  }
  for (const m of members) seedPoints[m.id] = 100 + Math.round(r() * 14) * 100
  const points: PointsEvent[] = Object.entries(seedPoints).map(([userId, amount]) => ({
    id: `sp-${userId}`,
    userId,
    amount,
    reason: "seed",
    note: "Season 1 activity",
    day: 29,
  }))

  // Season 2 so far: members have given part of their points to active funds.
  const activeIds = funds.filter((f) => f.status === "active").map((f) => f.id)
  const pointGifts: PointGift[] = []
  let g = 0
  for (const [uid, total] of Object.entries(seedPoints)) {
    const budget = Math.round((total * (0.2 + r() * 0.3)) / 10) * 10
    const picks = [...activeIds].sort(() => r() - 0.5).slice(0, 1 + Math.floor(r() * 3))
    for (const fid of picks) {
      const amount = Math.round(budget / picks.length / 10) * 10
      if (amount > 0) pointGifts.push({ id: `sg${g++}`, userId: uid, fundId: fid, amount, season: 2, day: 30 + Math.floor(r() * (SEED_DAY - 30)) })
    }
  }
  // Early backing for the two proposed funds, still short of their launch goals.
  const backers: [string, string, number][] = [
    ["priya", "food-sovereignty", 2400], ["ines", "food-sovereignty", 900], ["oli", "food-sovereignty", 1800], ["kofi", "food-sovereignty", 1200], ["maya", "food-sovereignty", 1500],
    ["lena", "disability-design", 1800], ["noor", "disability-design", 2200], ["sol", "disability-design", 700], ["june", "disability-design", 900],
  ]
  for (const [userId, fundId, amount] of backers) pointGifts.push({ id: `sg${g++}`, userId, fundId, amount, season: 2, day: 38 + Math.floor(r() * 3) })

  const activity: Activity[] = [
    { id: "a1", day: 40, userId: "kofi", text: "posted an update on Repair Café Starter Kits", href: "#/p/repair-kits" },
    { id: "a2", day: 39, userId: "theo", text: "posted an update on Tidepool Atlas", href: "#/p/tidepool-atlas" },
    { id: "a3", day: 38, userId: "lena", text: "proposed the fund Disability-led Design", href: "#/f/disability-design" },
    { id: "a4", day: 38, userId: "ana", text: "launched Spring Zine Drive in Small Press & Zines", href: "#/f/small-press" },
    { id: "a5", day: 35, userId: "kofi", text: "launched Repair & Rebuild in Open Climate Commons", href: "#/f/climate-commons" },
    { id: "a6", day: 34, userId: "priya", text: "proposed the fund Food Sovereignty Kitchens", href: "#/f/food-sovereignty" },
    { id: "a7", day: 30, userId: "noor", text: "launched Lifeboat Round in Artizen Rescue Fund", href: "#/f/artizen-rescue" },
  ]

  const fundDonations = [
    { id: "fd1", from: "oli", fundId: "food-sovereignty", amount: 600, asset: "USD" as const, units: 600, day: 35 },
    { id: "fd2", from: "priya", fundId: "food-sovereignty", amount: 250, asset: "USD" as const, units: 250, day: 34 },
    { id: "fd3", from: "ines", fundId: "food-sovereignty", amount: 150, asset: "USD" as const, units: 150, day: 36 },
    { id: "fd4", from: "lena", fundId: "disability-design", amount: 300, asset: "USD" as const, units: 300, day: 38 },
    { id: "fd5", from: "noor", fundId: "disability-design", amount: 400, asset: "USD" as const, units: 400, day: 39 },
    { id: "fd6", from: "oli", fundId: "artizen-rescue", campaignId: "lifeboat", amount: 1000, asset: "USD" as const, units: 1000, day: 31, message: "Artizen projects deserve to finish what they started." },
    { id: "fd7", from: "kofi", fundId: "climate-commons", amount: 400, asset: "USD" as const, units: 400, day: 36, message: "Our repair crates are free to borrow for any group in this fund's rounds." },
    { id: "fd8", from: "m3", fundId: "climate-commons", amount: 750, asset: "USD" as const, units: 750, day: 37, anonymous: true },
    { id: "fd9", from: "june", fundId: "community-science", amount: 300, asset: "USD" as const, units: 300, day: 33, message: "Open hardware forever. Sensor build nights every Saturday at our Seoul makerspace." },
    { id: "fd10", from: "bea", fundId: "music-no-labels", amount: 500, asset: "USD" as const, units: 500, day: 32, message: "Run by musicians, for musicians." },
    { id: "fd11", from: "m7", fundId: "artizen-rescue", amount: 2000, asset: "USD" as const, units: 2000, day: 39, anonymous: true },
    { id: "fd12", from: "maya", fundId: "small-press", amount: 250, asset: "USD" as const, units: 250, day: 38, message: "Riso Commons prints at cost for every project in the Spring Zine Drive." },
    { id: "fd13", from: "theo", fundId: "community-science", amount: 0.1 * ASSETS.ETH.usd, asset: "ETH" as const, units: 0.1, day: 40, message: "Tidepool Atlas volunteers say thanks." },
  ]

  // Pas tokens other members hold, and permanent endowments, in units of each asset.
  const supply: Record<Asset, number> = { USD: 1_650_000, EUR: 420_000, ETH: 95 }
  const endowments: Endowment[] = [
    { id: "se1", userId: "oli", asset: "USD", units: 6_000, usd: 6_000, day: 12 },
    { id: "se2", userId: "noor", asset: "ETH", units: 2, usd: 2 * ASSETS.ETH.usd, day: 18 },
    { id: "se3", userId: "ines", asset: "EUR", units: 2_500, usd: 2_500 * ASSETS.EUR.usd, day: 26 },
    { id: "se4", userId: "maya", asset: "USD", units: 1_000, usd: 1_000, day: 33 },
  ]
  const endowed = zero()
  for (const e of endowments) {
    endowed[e.asset] += e.units
    points.push({ id: `pe-${e.id}`, userId: e.userId, amount: e.usd * 100, reason: "endow", note: "Endowed the Wealth Fund", day: e.day })
  }
  const perDay = ASSET_IDS.reduce((t, a) => t + ((supply[a] + endowed[a]) * ASSETS[a].usd * ASSETS[a].apy) / 365, 0)
  return {
    version: STATE_VERSION,
    day: SEED_DAY,
    season: 2,
    seasonStartDay: 30,
    seasonLength: 30,
    supply,
    endowed,
    feeUnits: zero(),
    yieldPool: perDay * (SEED_DAY - 30),
    yieldLifetime: perDay * SEED_DAY,
    me: {
      base: { ...START_BASE },
      art: { ...START_ART },
      onboarded: false,
      referralCode: "",
      yieldGenerated: 0,
      holdingCarry: 0,
    },
    users: everyone.map((u) => ({ ...u })),
    projects: projects.map((p) => ({ ...p })),
    funds: funds.map((f) => ({ ...f })),
    campaigns: settledCampaigns,
    donations,
    fundDonations,
    points,
    pointGifts,
    endowments,
    activity,
    distributions: [
      {
        season: 1,
        day: 30,
        total: perDay * 30,
        shares: {
          "artizen-rescue": 3400,
          "climate-commons": 1900,
          "small-press": 1100,
          "community-science": 1700,
          "music-no-labels": 776,
        },
        points: {
          "artizen-rescue": 18400,
          "climate-commons": 10300,
          "small-press": 5950,
          "community-science": 9200,
          "music-no-labels": 4200,
        },
      },
    ],
    cart: [],
  }
}
