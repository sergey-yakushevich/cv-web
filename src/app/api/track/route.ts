import { headers } from "next/headers";
import { NextResponse } from "next/server";

/*
 * Public, fire-and-forget beacon endpoint hit by the client tracking script
 * (src/components/visit-tracker.tsx). Adds the request facts only the server
 * knows (real IP, user agent, Cloudflare country) and forwards the payload to
 * the central trackhub API over the VPS's internal docker network.
 */

export const runtime = "nodejs";

const TRACKHUB_URL = process.env.TRACKHUB_URL ?? "http://tracker:8080";

export async function POST(request: Request) {
  const token = process.env.TRACKHUB_TOKEN;
  if (!token) return new NextResponse(null, { status: 204 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  if (!body || typeof body.token !== "string" || !body.token) {
    return new NextResponse(null, { status: 204 });
  }

  const h = headers();
  const ip =
    h.get("cf-connecting-ip") ??
    h.get("true-client-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "";

  // Forward without awaiting the result; the beacon must return immediately
  // and tracking must never break the page.
  void fetch(`${TRACKHUB_URL}/api/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      site: process.env.TRACKHUB_SITE ?? "buildcv.cc",
      token: body.token,
      ip,
      user_agent: h.get("user-agent") ?? "",
      cf_country: h.get("cf-ipcountry") ?? "",
      client: body.client ?? {},
      event: body.event ?? null,
    }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => {
    // Tracking must never surface an error to the caller.
  });

  return new NextResponse(null, { status: 204 });
}
