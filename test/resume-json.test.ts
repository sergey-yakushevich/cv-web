import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { resumeToJson, toEditableResume } from "@/lib/resume-json";
import type { ResumeData } from "@/lib/types";

const base = {
  name: "Ada",
  initials: "A",
  location: "",
  locationLink: "",
  about: "",
  headline: "",
  personalWebsiteUrl: "",
  contact: { email: "", tel: "", social: [] },
  education: [],
  work: [],
  skills: [],
  projects: [],
} satisfies Omit<ResumeData, "summary"> & { summary?: never };

describe("toEditableResume", () => {
  it("keeps a string summary as-is", () => {
    const out = toEditableResume({ ...base, summary: "plain text" });
    expect(out.summary).toBe("plain text");
  });

  it("flattens a JSX summary to its text", () => {
    // <p>Ten years of <strong>backends</strong> and payments.</p>
    const summary = createElement(
      "p",
      null,
      "Ten years of ",
      createElement("strong", null, "backends"),
      " and payments."
    );
    const out = toEditableResume({ ...base, summary });
    expect(out.summary).toBe("Ten years of backends and payments.");
  });
});

describe("resumeToJson", () => {
  it("produces pretty-printed JSON the editor can parse back", () => {
    const json = resumeToJson({ ...base, summary: "s" });
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe("Ada");
    expect(json).toContain("\n  ");
  });
});
