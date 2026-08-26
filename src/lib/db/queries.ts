import "server-only";
import { v7 as uuidv7 } from "uuid";
import { getDb } from "@/lib/db";
import type { EditableResume } from "@/lib/resume-json";

export interface CvRow {
  id: string;
  userId: string;
  slug: string;
  label: string;
  data: EditableResume;
  position: number;
  updatedAt: string;
}

interface RawCv {
  id: string;
  user_id: string;
  slug: string;
  label: string;
  data: string;
  position: number;
  updated_at: string;
}

const hydrate = (row: RawCv): CvRow => ({
  id: row.id,
  userId: row.user_id,
  slug: row.slug,
  label: row.label,
  data: JSON.parse(row.data) as EditableResume,
  position: row.position,
  updatedAt: row.updated_at,
});

const now = () => new Date().toISOString();

export function userExists(id: string): boolean {
  return Boolean(getDb().prepare("SELECT 1 FROM users WHERE id = ?").get(id));
}

export function createUser(): string {
  const id = uuidv7();
  const timestamp = now();

  getDb()
    .prepare(
      "INSERT INTO users (id, created_at, last_seen_at) VALUES (?, ?, ?)"
    )
    .run(id, timestamp, timestamp);

  return id;
}

export function touchUser(id: string): void {
  getDb()
    .prepare("UPDATE users SET last_seen_at = ? WHERE id = ?")
    .run(now(), id);
}

export function listCvs(userId: string): CvRow[] {
  return (
    getDb()
      .prepare(
        "SELECT * FROM cvs WHERE user_id = ? ORDER BY position, created_at"
      )
      .all(userId) as RawCv[]
  ).map(hydrate);
}

/**
 * Reads one CV.
 *
 * userId is part of the lookup rather than checked afterwards, so a caller
 * cannot accidentally read somebody else's CV by passing only a slug.
 */
export function getCv(userId: string, slug: string): CvRow | null {
  const row = getDb()
    .prepare("SELECT * FROM cvs WHERE user_id = ? AND slug = ?")
    .get(userId, slug) as RawCv | undefined;

  return row ? hydrate(row) : null;
}

export function createCv(input: {
  userId: string;
  slug: string;
  label: string;
  data: EditableResume;
  position?: number;
}): CvRow {
  const id = uuidv7();
  const timestamp = now();

  getDb()
    .prepare(
      `INSERT INTO cvs (id, user_id, slug, label, data, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.userId,
      input.slug,
      input.label,
      JSON.stringify(input.data),
      input.position ?? 0,
      timestamp,
      timestamp
    );

  return {
    id,
    userId: input.userId,
    slug: input.slug,
    label: input.label,
    data: input.data,
    position: input.position ?? 0,
    updatedAt: timestamp,
  };
}

/** Returns false when the CV does not exist or belongs to someone else. */
export function updateCv(
  userId: string,
  slug: string,
  data: EditableResume
): boolean {
  const result = getDb()
    .prepare(
      "UPDATE cvs SET data = ?, updated_at = ? WHERE user_id = ? AND slug = ?"
    )
    .run(JSON.stringify(data), now(), userId, slug);

  return result.changes > 0;
}

export function deleteCv(userId: string, slug: string): boolean {
  const result = getDb()
    .prepare("DELETE FROM cvs WHERE user_id = ? AND slug = ?")
    .run(userId, slug);

  return result.changes > 0;
}

/** True when the slug is free for this user. Slugs are unique per user, not global. */
export function slugAvailable(userId: string, slug: string): boolean {
  return !getDb()
    .prepare("SELECT 1 FROM cvs WHERE user_id = ? AND slug = ?")
    .get(userId, slug);
}
