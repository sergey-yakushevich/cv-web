import { chmodSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import os from "node:os";
import { describe, expect, it } from "vitest";
import type { ResumeData } from "@/lib/types";
import { stripWatermarks } from "@/lib/pdf/strip-watermarks";

/**
 * The watermark-removal step drives the vendored watermarks-remover scripts
 * through a real python3 process, so these tests exercise the whole path the
 * PDF route uses — dirty JSON in, clean JSON and a report out — plus the
 * fail-soft contracts that make the step unable to break a download.
 */

function dirtyCv(): ResumeData {
  return {
    name: "Ser\u00adgey Yakushevich",
    initials: "SY",
    location: "Batumi",
    locationLink: "",
    about: "Payments engineer. Built sys\u200etems\u202eat scale.",
    headline: "Senior Backend\u00a0Engineer",
    summary: "Ten\u00adyear payments veteran",
    avatarUrl: "",
    personalWebsiteUrl: "",
    contact: {
      email: "ser\u200bgey@example.com",
      tel: "",
      social: [],
    },
    education: [
      { school: "University", degree: "BSc", start: "2010", end: "2014" },
    ],
    work: [
      {
        company: "Moyasar",
        link: "",
        badges: ["Go"],
        title: "Backend Engineer",
        start: "2020",
        end: null,
        description: ["Pro\u00adcessed pay\u200bments"],
      },
    ],
    skills: ["Go", "Ruby"],
    projects: [],
    theme: "sand",
  };
}

describe("stripWatermarks", () => {
  it("removes invisible characters from every field (Layer A)", async () => {
    const { data, report } = await stripWatermarks(dirtyCv());

    expect(data.name).toBe("Sergey Yakushevich");
    expect(data.headline).toBe("Senior Backend Engineer");
    expect(data.about).not.toContain("\u00ad");
    expect(data.about).not.toContain("\u202e");
    expect(data.contact.email).toBe("sergey@example.com");
    expect(data.work[0].description[0]).toBe("Processed payments");

    expect(report.status).toBe("cleaned");
    const a = report.layers?.a;
    expect(a?.ran).toBe(true);
    expect(a?.removed_count).toBeGreaterThan(0);
    expect(a?.replaced_count).toBeGreaterThan(0);
    expect(a?.fields_touched.length).toBeGreaterThan(0);
  });

  it("leaves the CV structure untouched", async () => {
    const cv = dirtyCv();
    const { data } = await stripWatermarks(cv);

    expect(Object.keys(data).sort()).toEqual(Object.keys(cv).sort());
    expect(data.work.length).toBe(1);
    expect(data.work[0].badges).toEqual(["Go"]);
    expect(data.skills).toEqual(["Go", "Ruby"]);
    expect(data.work[0].end).toBeNull();
    expect(data.theme).toBe("sand");
  });

  it("skips Layer B when no rewrite backend is configured", async () => {
    const { report } = await stripWatermarks(dirtyCv(), {
      env: { WATERMARKS_REWRITE_BACKEND: "" },
    });

    const b = report.layers?.b;
    expect(b?.ran).toBe(false);
    expect(b?.status).toBe("skipped");
    expect(b?.reason).toContain("WATERMARKS_REWRITE_BACKEND");
  });

  it("skips Layer B when the backend is configured without a model", async () => {
    const { report } = await stripWatermarks(dirtyCv(), {
      env: {
        WATERMARKS_REWRITE_BACKEND: "ollama",
        WATERMARKS_REWRITE_MODEL: "",
        WATERMARKS_REWRITE_BASE_URL: "",
      },
    });

    const b = report.layers?.b;
    expect(b?.ran).toBe(false);
    expect(b?.status).toBe("skipped");
    expect(b?.reason).toContain("WATERMARKS_REWRITE_MODEL");
  });

  it("returns the original data, degraded, when python is missing", async () => {
    const cv = dirtyCv();
    const { data, report } = await stripWatermarks(cv, {
      python: "/nonexistent/python-for-watermarks",
      timeoutMs: 5_000,
    });

    expect(data).toEqual(cv);
    expect(report.status).toBe("degraded");
    expect(report.reason).toMatch(/could not run|not found/i);
  });

  it("never lets a hung driver block the download", async () => {
    const stub = resolve(os.tmpdir(), `watermarks-hang-${process.pid}.sh`);
    writeFileSync(stub, "#!/bin/sh\nsleep 600\n");
    chmodSync(stub, 0o755);

    try {
      const cv = dirtyCv();
      const { data, report } = await stripWatermarks(cv, {
        python: stub,
        timeoutMs: 500,
      });

      expect(data).toEqual(cv);
      expect(report.status).toBe("degraded");
      expect(report.reason).toContain("timed out");
    } finally {
      rmSync(stub, { force: true });
    }
  });
});
