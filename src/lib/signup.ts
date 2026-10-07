// Newsletter gate: visitors join the Bread Cooperative newsletter on Paragraph
// before entering the showcase. The request goes through a small Cloudflare
// Worker (see /worker) that holds the Paragraph API key.

export const SIGNUP_URL = "https://pastry-signup.pastrycoop.workers.dev"

const KEY = "pastry-subscribed"

/** True once this browser has signed up, so a demo reset doesn't ask again. */
export function isSubscribed() {
  try {
    return !!localStorage.getItem(KEY)
  } catch {
    return false
  }
}

export async function subscribe(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(SIGNUP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
    if (!res.ok || !body.ok) return { ok: false, error: body.error || "Couldn't sign you up right now. Please try again." }
    try {
      localStorage.setItem(KEY, "1")
    } catch {
      /* storage unavailable; they'll just be asked again next visit */
    }
    return { ok: true }
  } catch {
    return { ok: false, error: "Couldn't reach the signup service. Check your connection and try again." }
  }
}
