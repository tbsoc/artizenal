import { useEffect, useState } from "react"

export function parseHash() {
  const h = window.location.hash.replace(/^#/, "") || "/"
  const [path, query = ""] = h.split("?")
  const parts = path.split("/").filter(Boolean)
  return { path, parts, query: new URLSearchParams(query) }
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const on = () => {
      setRoute(parseHash())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])
  return route
}

export function go(href: string) {
  window.location.hash = href.replace(/^#/, "")
}
