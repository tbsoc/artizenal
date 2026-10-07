// Signup proxy for the Pastry showcase: adds an email to the Bread Cooperative
// newsletter on Paragraph. The Paragraph API key lives in a Worker secret so it
// never ships in the public site.

const ALLOWED_ORIGINS = ["https://tbsoc.github.io", "http://localhost:5180"]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  }
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(origin) } })
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || ""
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) })
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, origin)
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ ok: false, error: "Forbidden" }, 403, origin)

    let email = ""
    try {
      email = String((await request.json()).email || "").trim().toLowerCase()
    } catch {
      return json({ ok: false, error: "Invalid request" }, 400, origin)
    }
    if (!EMAIL.test(email) || email.length > 254) return json({ ok: false, error: "Please enter a valid email" }, 400, origin)

    const res = await fetch("https://public.api.paragraph.com/api/v1/subscribers", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.PARAGRAPH_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      console.log("Paragraph error", res.status, await res.text())
      return json({ ok: false, error: "Couldn't sign you up right now. Please try again." }, 502, origin)
    }
    return json({ ok: true }, 200, origin)
  },
}
