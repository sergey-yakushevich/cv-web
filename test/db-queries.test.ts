import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { EditableResume } from "@/lib/resume-json";

/*
 * Runs against a real SQLite file in a temp directory: better-sqlite3 is
 * synchronous and fast, and a fake would only test the fake. DATABASE_PATH
 * must be set before the module is imported, because the connection is
 * cached at module scope.
 */
let dir: string;
let q: typeof import("@/lib/db/queries");

const resume = (name: string) => ({ name }) as unknown as EditableResume;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "cv-test-"));
  process.env.DATABASE_PATH = join(dir, "test.db");
  q = await import("@/lib/db/queries");
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("users", () => {
  it("creates a user that then exists", () => {
    const id = q.createUser();
    expect(q.userExists(id)).toBe(true);
  });

  it("does not find a made-up user", () => {
    expect(q.userExists("no-such-user")).toBe(false);
  });
});

describe("cvs", () => {
  it("creates and reads back a CV scoped by (user, slug)", () => {
    const userId = q.createUser();
    q.createCv({
      userId,
      slug: "my-cv",
      label: "My CV",
      data: resume("Ada"),
    });

    const row = q.getCv(userId, "my-cv");
    expect(row?.data.name).toBe("Ada");

    // The same slug under another user is not reachable.
    const stranger = q.createUser();
    expect(q.getCv(stranger, "my-cv")).toBeNull();
  });

  it("lists CVs in position order", () => {
    const userId = q.createUser();
    q.createCv({ userId, slug: "b", label: "B", data: resume("B"), position: 1 });
    q.createCv({ userId, slug: "a", label: "A", data: resume("A"), position: 0 });
    expect(q.listCvs(userId).map((c) => c.slug)).toEqual(["a", "b"]);
  });

  it("updates only the addressed CV and reports a miss", () => {
    const userId = q.createUser();
    q.createCv({ userId, slug: "one", label: "One", data: resume("v1") });

    expect(q.updateCv(userId, "one", resume("v2"))).toBe(true);
    expect(q.getCv(userId, "one")?.data.name).toBe("v2");
    expect(q.updateCv(userId, "missing", resume("x"))).toBe(false);
    expect(q.updateCv("wrong-user", "one", resume("x"))).toBe(false);
  });

  it("renames only the addressed CV, keeping its slug and data", () => {
    const userId = q.createUser();
    q.createCv({ userId, slug: "keep", label: "Old name", data: resume("v1") });

    expect(q.renameCv(userId, "keep", "New name")).toBe(true);
    const row = q.getCv(userId, "keep");
    expect(row?.label).toBe("New name");
    expect(row?.slug).toBe("keep");
    expect(row?.data.name).toBe("v1");
    expect(q.renameCv(userId, "missing", "X")).toBe(false);
    expect(q.renameCv("wrong-user", "keep", "X")).toBe(false);
  });

  it("deletes and frees the slug", () => {
    const userId = q.createUser();
    q.createCv({ userId, slug: "gone", label: "Gone", data: resume("x") });
    expect(q.slugAvailable(userId, "gone")).toBe(false);
    expect(q.deleteCv(userId, "gone")).toBe(true);
    expect(q.slugAvailable(userId, "gone")).toBe(true);
    expect(q.deleteCv(userId, "gone")).toBe(false);
  });

  it("enforces slug uniqueness per user, not globally", () => {
    const a = q.createUser();
    const b = q.createUser();
    q.createCv({ userId: a, slug: "same", label: "A", data: resume("A") });
    expect(q.slugAvailable(a, "same")).toBe(false);
    expect(q.slugAvailable(b, "same")).toBe(true);
  });
});

describe("counters", () => {
  it("starts at zero and increments", () => {
    expect(q.getCounter("test_counter")).toBe(0);
    q.incrementCounter("test_counter");
    q.incrementCounter("test_counter");
    expect(q.getCounter("test_counter")).toBe(2);
  });
});
