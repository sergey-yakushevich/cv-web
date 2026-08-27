import { type NextRequest, NextResponse } from "next/server";
import {
  createUserWithStarterCv,
  currentUserId,
  firstCvSlug,
  USER_COOKIE,
  USER_COOKIE_MAX_AGE,
} from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts or resumes a visitor's session, then sends them to their CV.
 *
 * This is a route handler rather than middleware because Next 14 runs
 * middleware on the edge runtime, where better-sqlite3 cannot load. It is also
 * the only place a cookie can be set during a plain navigation — a server
 * component may read cookies but not write them.
 */
/**
 * A relative Location, deliberately.
 *
 * Building an absolute URL from request.url reconstructs the host from headers,
 * and behind kamal-proxy that resolved to the container's own localhost:3000 —
 * the same trap that made every production PDF render fail. RFC 7231 allows a
 * relative Location and every browser follows it, so the redirect simply cannot
 * name the wrong host.
 */
function redirectTo(path: string): NextResponse {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}

export async function GET(_request: NextRequest) {
  const existing = currentUserId();

  if (existing) {
    const slug = firstCvSlug(existing);

    // A cookie whose user has no CVs falls through and is re-minted below —
    // sending it back to "/" would bounce straight here again, forever.
    if (slug) {
      return redirectTo(`/${existing}/${slug}`);
    }
  }

  const userId = createUserWithStarterCv();
  const slug = firstCvSlug(userId) ?? "my-cv";

  const response = redirectTo(`/${userId}/${slug}`);

  response.cookies.set(USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    // Secure only where it can work: a plain-HTTP localhost would drop it.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: USER_COOKIE_MAX_AGE,
  });

  /*
   * Makes the CV page greet the brand-new visitor. A cookie, not a query
   * parameter: the client router can hit this route twice while resolving the
   * redirect from "/", and only the second hit's Location becomes the address
   * — a ?welcome=1 put there by the first hit was lost. Short-lived, and not
   * httpOnly so the dialog can delete it when dismissed.
   */
  response.cookies.set("cv_welcome", "1", {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 300,
  });

  return response;
}
