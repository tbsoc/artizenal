# Pastry

A desktop showcase of community-matched funding on the Bread Cooperative stack, built for the projects left stranded when Artizen shut down. Everything is simulated in the browser: no real money, no wallets, no blockchain.

## Run it

```bash
npm install
npm run dev
```

`SINGLE_FILE=1 npx vite build --outDir dist-single` produces one self-contained `index.html` you can send to people.

## What it shows

- **Art tokens**: artUSD, artEUR and artETH, each created 1:1 from USDC, EURC or ETH (simulated rates and APYs in `src/lib/assets.ts`). Members can donate to projects in any of them; matching counts their dollar value.
- **Pastry Wealth Fund**: every art token plus permanent endowments. Its yield is the season's matching pool. Endowing USDC, EURC or ETH is permanent and earns 100 points per $1.
- **Points**: each season members give points to funds, setting a ratio with − / + like fund.bread.coop. A fund's share of the season's yield is its points ÷ all points given. Given points are spent and the tally resets every season.
- **About**: a first-visit modal explaining why the showcase exists (Artizen closing; auditable, realistic matching, funds not put at risk).
- **Funds**: each fund chooses quadratic funding, a 1:1 match up to a cap, or a fixed multiplier. Members can give to a fund's live round or its reserve. A proposed fund launches once it hits both its pledge goal and its points-backing goal.
- **Rounds**: only artUSD donations made inside a round are matched. USDC donations reach the project but aren't matched. Collect projects into a basket and see the match you unlock.
- **Projects**: a 25 artUSD refundable spam deposit, an optional Artizen alumni badge, updates and a donor list.
- **Points**: earned for donating, giving to funds, referrals (500 points plus 10% of a friend's points), holding artUSD, early backing, launching projects, Artizen alumni status and curating.
- **Time machine**: the day counter in the header fast-forwards time. Yield accrues, other members donate, rounds settle, deposits are refunded, seasons close, and simulated curators open new rounds.

State lives in `localStorage`. Use "Reset demo" in the time machine to start over.

## Code map

- `src/lib/matching.ts`: matching formulas and the live estimates
- `src/lib/store.tsx`: simulation engine (actions, points, yield, settlement)
- `src/lib/seed.ts`: the seeded world
- `src/pages/*`: one file per screen
