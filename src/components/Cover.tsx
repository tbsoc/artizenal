import { rng } from "@/lib/seed"
import { cn } from "@/lib/utils"

const PALETTES = [
  ["#f4e4c8", "#e07a2f", "#9c3d1c", "#2f3b5c"],
  ["#e8efe4", "#3c8a6a", "#1d4d3c", "#e9b44c"],
  ["#f2dfd7", "#d1495b", "#6b2d3a", "#f4a259"],
  ["#e3e8f2", "#3d5a99", "#1f2a48", "#e9c46a"],
  ["#f6ecd2", "#c9852b", "#5a3a1a", "#88a07a"],
  ["#efe3ef", "#8a4f9e", "#3a2147", "#f0a868"],
  ["#e2efee", "#2a9d8f", "#264653", "#e76f51"],
  ["#f3e6d6", "#b5563c", "#3b2a24", "#d9b26f"],
]

/**
 * Procedural cover art so every project and fund has a distinct image
 * without loading anything from the network.
 */
export function Cover({
  seed,
  image,
  className,
}: {
  seed: number
  image?: string
  className?: string
}) {
  if (image) {
    return <img src={image} alt="" className={cn("h-full w-full object-cover", className)} />
  }
  const r = rng(seed * 9973 + 17)
  const pal = PALETTES[seed % PALETTES.length]
  const [bg, a, b, c] = pal
  const kind = Math.floor(r() * 4)
  const W = 400
  const H = 260
  const sunX = 80 + r() * 240
  const sunY = 50 + r() * 80
  const sunR = 38 + r() * 46

  const waves = Array.from({ length: 4 }, (_, i) => {
    const y = 140 + i * 30 + r() * 10
    const amp = 10 + r() * 18
    const f = 1 + r() * 2
    let d = `M0 ${y}`
    for (let x = 0; x <= W; x += 20) d += ` L${x} ${y + Math.sin((x / W) * Math.PI * 2 * f + i) * amp}`
    d += ` L${W} ${H} L0 ${H} Z`
    return d
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={cn("h-full w-full", className)} aria-hidden>
      <defs>
        <pattern id={`g${seed}`} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill="#000" opacity="0.07" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={bg} />
      {kind === 0 && (
        <>
          <circle cx={sunX} cy={sunY} r={sunR} fill={c} />
          {waves.map((d, i) => (
            <path key={i} d={d} fill={[a, b, a, b][i]} opacity={0.55 + i * 0.15} />
          ))}
        </>
      )}
      {kind === 1 && (
        <>
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} x={i * 62 - 20} y={-20} width={34} height={H + 40} fill={i % 2 ? a : b} opacity={0.85} transform={`rotate(${18} ${W / 2} ${H / 2})`} />
          ))}
          <circle cx={sunX} cy={H / 2} r={sunR + 10} fill={bg} />
          <circle cx={sunX} cy={H / 2} r={sunR - 6} fill={c} />
        </>
      )}
      {kind === 2 && (
        <>
          {Array.from({ length: 5 }, (_, row) =>
            Array.from({ length: 8 }, (_, col) => {
              const x = col * 52 + (row % 2) * 26 - 10
              const y = row * 56 - 10
              const fill = [a, b, c][Math.floor(r() * 3)]
              return r() > 0.25 ? <circle key={`${row}-${col}`} cx={x + 26} cy={y + 28} r={8 + r() * 18} fill={fill} opacity={0.9} /> : null
            })
          )}
        </>
      )}
      {kind === 3 && (
        <>
          <rect x={0} y={H * 0.58} width={W} height={H} fill={b} />
          <path d={`M0 ${H * 0.6} Q ${W * 0.3} ${H * 0.2} ${W * 0.55} ${H * 0.6} T ${W} ${H * 0.45} L ${W} ${H} L0 ${H} Z`} fill={a} />
          <circle cx={sunX} cy={sunY - 10} r={sunR * 0.7} fill={c} />
          <path d={`M${W * 0.1} ${H} L ${W * 0.35} ${H * 0.55} L ${W * 0.6} ${H} Z`} fill={b} opacity={0.6} />
        </>
      )}
      <rect width={W} height={H} fill={`url(#g${seed})`} />
    </svg>
  )
}
