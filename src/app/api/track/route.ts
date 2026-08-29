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

const CLIENT_FIELDS = [
  "screen_w",
  "screen_h",
  "viewport_w",
  "viewport_h",
  "device_pixel_ratio",
  "language",
  "timezone",
  "referrer",
  "landing_path",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "device_fingerprint",
] as const;

/** Collects the client context when a caller flattened it into the body. */
function clientFieldsFrom(
  body: Record<string, unknown>
): Record<string, unknown> {
  const client: Record<string, unknown> = {};
  for (const field of CLIENT_FIELDS) {
    if (body[field] !== undefined && body[field] !== null) {
      client[field] = body[field];
    }
  }
  return client;
}

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

  // The tracker nests its context under `client`, but earlier builds of this
  // app flattened the same fields into the top level of the body. This route
  // only ever read `body.client`, so for buildcv.cc's whole life every visitor
  // arrived at trackhub with no screen size, timezone or fingerprint. Accept
  // both shapes, and forward the payload as-is rather than picking fields —
  // a per-field allowlist here is exactly what silently dropped them.
  const client =
    body.client && typeof body.client === "object"
      ? body.client
      : clientFieldsFrom(body);

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
      client,
      event: body.event ?? null,
    }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => {
    // Tracking must never surface an error to the caller.
  });

  return new NextResponse(null, { status: 204 });
}
