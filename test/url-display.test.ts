import { describe, expect, it } from "vitest";
import { bareUrl, displaysAs, displayUrl } from "@/lib/url-display";

describe("displayUrl", () => {
  it("prints the bare address", () => {
    expect(displayUrl("https://cyberjosef.dev/")).toBe("cyberjosef.dev");
    expect(displayUrl("https://github.com/ada")).toBe("github.com/ada");
  });

  it("keeps a tracking parameter out of the printed line", () => {
    expect(displayUrl("https://cyberjosef.dev/?t=ns9y")).toBe("cyberjosef.dev");
    expect(displayUrl("https://trydawn.us/glasses?t=ufnc")).toBe(
      "trydawn.us/glasses"
    );
    expect(displayUrl("https://x.dev/?utm_source=cv&utm_medium=pdf")).toBe(
      "x.dev"
    );
  });

  it("keeps query parameters that are part of the address", () => {
    // Not every query string is attribution. A page that genuinely lives at
    // ?id=7 must still print that way, or the printed line is wrong.
    expect(displayUrl("https://example.com/page?id=7")).toBe(
      "example.com/page?id=7"
    );
    expect(displayUrl("https://example.com/p?id=7&t=ns9y")).toBe(
      "example.com/p?id=7"
    );
  });

  it("leaves anything that is not a URL alone", () => {
    expect(displayUrl("cyberjosef.dev")).toBe("cyberjosef.dev");
    expect(displayUrl("")).toBe("");
    expect(displayUrl("not a url")).toBe("not a url");
  });

  it("does not normalise a URL that carries no tracking", () => {
    // Round-tripping through the URL parser would rewrite escapes and add a
    // path; an untagged URL must reach the page exactly as it was stored.
    expect(bareUrl("https://example.com")).toBe("example.com");
    expect(displayUrl("https://example.com")).toBe("example.com");
  });
});

describe("displaysAs", () => {
  it("recognises the printed form of a tracked URL", () => {
    expect(displaysAs("cyberjosef.dev", "https://cyberjosef.dev/?t=ns9y")).toBe(
      true
    );
    // The editor may hand back the text with a scheme in front of it.
    expect(
      displaysAs("https://cyberjosef.dev", "https://cyberjosef.dev/?t=ns9y")
    ).toBe(true);
  });

  it("rejects text that names a different address", () => {
    expect(displaysAs("example.com", "https://cyberjosef.dev/?t=ns9y")).toBe(
      false
    );
    expect(
      displaysAs("cyberjosef.dev/hire", "https://cyberjosef.dev/?t=ns9y")
    ).toBe(false);
  });

  it("is false when nothing was stored", () => {
    expect(displaysAs("cyberjosef.dev", "")).toBe(false);
  });
});
