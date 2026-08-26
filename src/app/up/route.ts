export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness probe for kamal-proxy. It polls this during a deploy and only
 * switches traffic to the new container once it answers, so a broken build
 * never takes the site down.
 */
export function GET() {
  return new Response("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
  });
}
