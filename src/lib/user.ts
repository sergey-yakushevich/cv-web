import "server-only";
import { cookies } from "next/headers";
import { STARTER_TEMPLATE } from "@/data/starter-template";
import { createCv, createUser, listCvs, userExists } from "@/lib/db/queries";

export const USER_COOKIE = "cv_uid";

/** A year. Long enough to be useful, short enough to be a functional cookie. */
export const USER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * The visitor's id, or null if they have no valid cookie yet.
 *
 * A cookie naming a user that no longer exists is treated as absent — that
 * happens if the database is reset, and silently trusting the id would produce
 * CV rows pointing at a missing user.
 */
export function currentUserId(): string | null {
  const id = cookies().get(USER_COOKIE)?.value;

  if (!id || !userExists(id)) {
    return null;
  }

  return id;
}

/**
 * Creates a user and gives them a CV to start from.
 *
 * The starter CV is a neutral placeholder, not a copy of anyone's résumé — see
 * the note on STARTER_TEMPLATE.
 */
export function createUserWithStarterCv(): string {
  const userId = createUser();

  createCv({
    userId,
    slug: "my-cv",
    label: "My CV",
    data: STARTER_TEMPLATE,
    position: 0,
  });

  return userId;
}

/** The CV a user should land on: their first, by position. */
export function firstCvSlug(userId: string): string | null {
  return listCvs(userId)[0]?.slug ?? null;
}
