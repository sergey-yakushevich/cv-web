import { describe, expect, it } from "vitest";
import type { EditableResume } from "@/lib/resume-json";
import { attachmentHeader, resumePdfFileName } from "@/lib/pdf/filename";

const resume = (name: string, headline: string) =>
  ({ name, headline }) as EditableResume;

describe("resumePdfFileName", () => {
  it("joins name and headline with an em dash", () => {
    expect(resumePdfFileName(resume("Ada Lovelace", "Engineer"))).toBe(
      "Ada Lovelace — Engineer.pdf"
    );
  });

  it("drops the headline when it is empty", () => {
    expect(resumePdfFileName(resume("Ada", ""))).toBe("Ada.pdf");
  });

  it("falls back to CV when the name is empty", () => {
    expect(resumePdfFileName(resume("", ""))).toBe("CV.pdf");
  });

  it("strips filesystem-hostile characters", () => {
    expect(resumePdfFileName(resume('A/B\\C?D%E*F:G|H"I<J>K', "x"))).toBe(
      "A B C D E F G H I J K — x.pdf"
    );
  });
});

describe("attachmentHeader", () => {
  it("carries an ASCII fallback and an encoded UTF-8 name", () => {
    const header = attachmentHeader("Ada — Engineer.pdf");
    expect(header).toContain('filename="Ada _ Engineer.pdf"');
    expect(header).toContain(
      `filename*=UTF-8''${encodeURIComponent("Ada — Engineer.pdf")}`
    );
  });

  it("never emits a quote inside the quoted fallback", () => {
    const header = attachmentHeader('a"b.pdf');
    expect(header).toContain('filename="ab.pdf"');
  });
});
