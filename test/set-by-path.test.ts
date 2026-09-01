import { describe, expect, it } from "vitest";
import { setByPath } from "@/lib/edit/set-by-path";

describe("setByPath", () => {
  it("writes a top-level key", () => {
    const obj: Record<string, unknown> = { name: "old" };
    setByPath(obj, "name", "new");
    expect(obj.name).toBe("new");
  });

  it("writes through nested objects and array indexes", () => {
    const obj = { work: [{ description: ["a", "b"] }] };
    setByPath(obj, "work.0.description.1", "edited");
    expect(obj.work[0].description).toEqual(["a", "edited"]);
  });

  it("skips a path that no longer resolves instead of inventing it", () => {
    const obj = { work: [] as unknown[] };
    setByPath(obj, "work.3.title", "ghost");
    expect(obj.work).toEqual([]);
    expect(Object.keys(obj)).toEqual(["work"]);
  });

  it("skips paths through primitives", () => {
    const obj = { name: "Ada" };
    setByPath(obj, "name.first", "x");
    expect(obj.name).toBe("Ada");
  });

  it("can write null", () => {
    const obj = { work: [{ end: "2024" }] };
    setByPath(obj, "work.0.end", null);
    expect(obj.work[0].end).toBeNull();
  });
});
