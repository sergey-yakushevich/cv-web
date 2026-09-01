import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/*
 * Same setup as db-queries.test.ts: a real SQLite file in a temp dir, with
 * DATABASE_PATH set before the modules are imported.
 */
let dir: string;
let user: typeof import("@/lib/user");
let q: typeof import("@/lib/db/queries");

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "cv-test-"));
  process.env.DATABASE_PATH = join(dir, "test.db");
  user = await import("@/lib/user");
  q = await import("@/lib/db/queries");
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("createUserWithStarterCv", () => {
  it("seeds two CVs: Cocks first (the default), Human second", () => {
    const userId = user.createUserWithStarterCv();
    const cvs = q.listCvs(userId);

    expect(cvs.map((cv) => cv.slug)).toEqual(["cocks", "human"]);
    expect(cvs.map((cv) => cv.label)).toEqual(["Cocks", "Human"]);
    expect(user.firstCvSlug(userId)).toBe("cocks");
  });

  it("gives the cat a complete, valid resume with no contact details", () => {
    const userId = user.createUserWithStarterCv();
    const cocks = q.getCv(userId, "cocks");

    expect(cocks?.data.name).toBe("Cocks");
    expect(cocks?.data.avatarUrl).toBe("/cocks-avatar.jpg");
    expect(cocks?.data.contact.email).toBe("");
    expect(cocks?.data.contact.tel).toBe("");
    expect(cocks?.data.contact.social).toEqual([]);
    expect(cocks?.data.work.length).toBeGreaterThan(0);
    expect(cocks?.data.skills.length).toBeGreaterThan(0);
    // The summary is a string (what the DB stores), and mentions the age.
    expect(typeof cocks?.data.summary).toBe("string");
    expect(cocks?.data.summary).toContain("2.5 year");
  });

  it("keeps the human starter CV as the second entry", () => {
    const userId = user.createUserWithStarterCv();
    const human = q.getCv(userId, "human");
    expect(human?.data.name).toBe("Sergey Yakushevich");
  });
});
