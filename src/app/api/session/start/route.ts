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

    return redirectTo(slug ? `/${existing}/${slug}` : "/");
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

  return response;
}
