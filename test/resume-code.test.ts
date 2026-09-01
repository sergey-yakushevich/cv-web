import { describe, expect, it } from "vitest";
import {
  CODE_PROMPT_COMMENT,
  parseResumeCode,
  previewText,
  resumeToCode,
} from "@/lib/edit/resume-code";

describe("resumeToCode", () => {
  it("puts the AI prompt comment above the pretty-printed JSON", () => {
    const code = resumeToCode({ name: "Cocks" });
    expect(code.startsWith(CODE_PROMPT_COMMENT)).toBe(true);
    expect(code).toContain('"name": "Cocks"');
  });

  it("round-trips through parseResumeCode", () => {
    const resume = { name: "Cocks", skills: ["Napping"], theme: "mono" };
    expect(parseResumeCode(resumeToCode(resume))).toEqual(resume);
  });
});

describe("parseResumeCode", () => {
  it("ignores // comment lines anywhere in the text", () => {
    const text = '// top\n{\n// middle\n"name": "A"\n}\n// bottom';
    expect(parseResumeCode(text)).toEqual({ name: "A" });
  });

  it("trims chatter around the outermost JSON object", () => {
    const text = 'Here is your JSON:\n```json\n{"name": "A"}\n```\nEnjoy!';
    expect(parseResumeCode(text)).toEqual({ name: "A" });
  });

  it("keeps // inside string values intact", () => {
    const text = resumeToCode({ site: "https://example.com" });
    expect(parseResumeCode(text)).toEqual({ site: "https://example.com" });
  });

  it("throws on text that holds no JSON", () => {
    expect(() => parseResumeCode("// only a comment")).toThrow();
    expect(() => parseResumeCode('{"name": ')).toThrow();
  });
});

describe("previewText", () => {
  it("returns short text untouched, whitespace collapsed", () => {
    expect(previewText("Senior  House\nCat", 140)).toBe("Senior House Cat");
  });

  it("cuts at 140 characters with an ellipsis", () => {
    const long = "word ".repeat(60);
    const preview = previewText(long, 140);
    expect(preview.endsWith("…")).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(141);
  });

  it("prefers a word boundary near the limit", () => {
    const text = `${"a".repeat(130)} bordercase-word-running-long`;
    const preview = previewText(text, 140);
    expect(preview).toBe(`${"a".repeat(130)}…`);
  });

  it("hard-cuts a single word longer than the limit", () => {
    const preview = previewText("x".repeat(200), 140);
    expect(preview).toBe(`${"x".repeat(140)}…`);
  });
});
