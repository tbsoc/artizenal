const COLORS = ["#EA5817", "#e9b44c", "#2f8f6b", "#3d5a99", "#b5466b", "#f4a259"]

/** Pop a small burst of confetti and a floating label from an element. No-op for reduced motion. */
export function confettiFrom(el: Element, label?: string) {
  if (typeof window === "undefined") return
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
  const r = el.getBoundingClientRect()
  const x = r.left + r.width / 2
  const y = r.top + r.height / 2

  const layer = document.createElement("div")
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:70;overflow:hidden"
  document.body.appendChild(layer)

  for (let i = 0; i < 28; i++) {
    const piece = document.createElement("span")
    const size = 5 + Math.random() * 5
    const round = Math.random() < 0.35
    piece.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${round ? size : size * 0.45}px;background:${
      COLORS[i % COLORS.length]
    };border-radius:${round ? "50%" : "1px"}`
    layer.appendChild(piece)
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4
    const dist = 50 + Math.random() * 90
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist
    piece.animate(
      [
        { transform: "translate(-50%,-50%) rotate(0deg)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(calc(-50% + ${dx * 1.15}px), calc(-50% + ${dy + 80}px)) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 400, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" }
    )
  }

  if (label) {
    const tag = document.createElement("span")
    tag.textContent = label
    tag.style.cssText = `position:absolute;left:${x}px;top:${y}px;font:700 15px Inter,system-ui,sans-serif;color:#2b3a67;white-space:nowrap`
    layer.appendChild(tag)
    tag.animate(
      [
        { transform: "translate(-50%,-50%) scale(.8)", opacity: 0 },
        { transform: "translate(-50%,-160%) scale(1.1)", opacity: 1, offset: 0.3 },
        { transform: "translate(-50%,-260%) scale(1)", opacity: 0 },
      ],
      { duration: 1100, easing: "ease-out", fill: "forwards" }
    )
  }

  setTimeout(() => layer.remove(), 1500)
}
