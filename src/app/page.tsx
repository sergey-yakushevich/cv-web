import { redirect } from "next/navigation";
import { currentUserId, firstCvSlug } from "@/lib/user";

export const dynamic = "force-dynamic";

/**
 * The root is a door, not a page. A returning visitor goes straight to their
 * CV; everyone else is handed to /api/session/start, which mints their user,
 * sets the cookie and lands them on their own copy with the welcome dialog
 * open. The pitch that used to live here is the dialog now.
 *
 * The cookie can only be *set* in a route handler, which is why the new-user
 * path has to bounce through the API route instead of redirecting to the CV
 * directly.
 */
export default function LandingPage() {
  const userId = currentUserId();

  if (userId) {
    const slug = firstCvSlug(userId);

    if (slug) {
      redirect(`/${userId}/${slug}`);
    }
  }

  redirect("/api/session/start");
}
