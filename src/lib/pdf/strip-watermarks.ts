import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * The final step of resume generation: strip AI watermarks before the PDF is
 * served.
 *
 * Runs Layers A and B of the vendored watermarks-remover
 * (vendor/watermarks-remover — see its README for provenance) as one
 * `python3` process over the CV JSON:
 *
 *   Layer A   deterministic — drops invisible Unicode, exotic spaces, bidi
 *             overrides and tag characters from every field
 *   Layer B   statistical — rewrites the prose fields through a configured
 *             LLM backend (WATERMARKS_REWRITE_*), skipped when none is
 *             configured, exactly like upstream's "optional hook"
 *
 * Fail-soft by contract: if python3 is missing, the script is absent or the
 * step errors, the ORIGINAL data is returned with a "degraded" report —
 * watermark removal must never break a download. The database is never
 * touched; only the render sees the cleaned copy.
 */

/** Matches the driver's Layer A stats (upstream text_unicode clean_text shape). */
export interface LayerAReport {
  ran: boolean;
  changed: boolean;
  removed: Record<string, number>;
  replaced: Record<string, number>;
  removed_count: number;
  replaced_count: number;
  suspicious_before: number;
  suspicious_after: number;
  fields_touched: string[];
}

/** Matches the driver's Layer B report. */
export interface LayerBReport {
  ran: boolean;
  status: "applied" | "skipped" | "failed";
  reason?: string;
  strategy?: string | null;
  backend?: string;
  model?: string;
  fields?: Record<string, unknown>;
  field_errors?: Record<string, string>;
}

export interface WatermarksReport {
  status: "cleaned" | "failed" | "degraded";
  source?: string;
  error?: string;
  reason?: string;
  layers?: { a: LayerAReport; b: LayerBReport };
}

export interface StripWatermarksOptions {
  /** Python interpreter; defaults to WATERMARKS_PYTHON, then "python3". */
  python?: string;
  /** Extra environment for the driver (e.g. WATERMARKS_REWRITE_BACKEND). */
  env?: Record<string, string>;
  /** Hard ceiling for the whole step; default 30s (WATERMARKS_STRIP_TIMEOUT_MS). */
  timeoutMs?: number;
}

const SCRIPT_PATH = join("vendor", "watermarks-remover", "cv_clean.py");

function degraded(reason: string): WatermarksReport {
  return { status: "degraded", reason };
}

/**
 * Cleans one CV through the vendored watermarks-remover driver.
 *
 * The CV JSON travels over stdin/stdout of a single python3 process; strings
 * are cleaned as decoded values (not as serialized bytes, where an escaped
 * "\u00ad" would hide the real codepoint from the scrubber). The driver walks
 * string leaves only and never reorders or retypes anything, so the generic
 * carries the stored CV's shape (CvRow.data: EditableResume) unchanged.
 */
export async function stripWatermarks<T extends object>(
  data: T,
  options: StripWatermarksOptions = {}
): Promise<{ data: T; report: WatermarksReport }> {
  const python = options.python ?? process.env.WATERMARKS_PYTHON ?? "python3";
  const script = join(process.cwd(), SCRIPT_PATH);
  const timeoutMs =
    options.timeoutMs ??
    Number(process.env.WATERMARKS_STRIP_TIMEOUT_MS ?? 30_000);

  if (!existsSync(script)) {
    return { data, report: degraded(`watermark driver not found: ${script}`) };
  }

  return await new Promise((resolve) => {
    const child = spawn(python, [script], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, ...options.env },
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (result: { data: T; report: WatermarksReport }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish({
        data,
        report: degraded(`watermark driver timed out after ${timeoutMs}ms`),
      });
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      finish({
        data,
        report: degraded(`could not run ${python}: ${error.message}`),
      });
    });

    child.on("close", (code) => {
      if (code !== 0) {
        finish({
          data,
          report: degraded(
            `watermark driver exited with ${code}: ${stderr.trim().slice(0, 500)}`
          ),
        });
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as {
          cleaned: T;
          report: WatermarksReport;
        };

        if (!parsed.cleaned || typeof parsed.cleaned !== "object") {
          finish({
            data,
            report: degraded("watermark driver returned no cleaned payload"),
          });
          return;
        }

        finish({ data: parsed.cleaned, report: parsed.report });
      } catch (error) {
        finish({
          data,
          report: degraded(
            `watermark driver output was not JSON: ${error instanceof Error ? error.message : String(error)}`
          ),
        });
      }
    });

    child.stdin.write(JSON.stringify({ data, options: {} }));
    child.stdin.end();
  });
}

/**
 * One-line summary for server logs, so a download leaves a trace of what the
 * final step did (or why it could not).
 */
export function summarizeWatermarksReport(report: WatermarksReport): string {
  if (report.status === "degraded") {
    return `watermark removal degraded: ${report.reason}`;
  }
  if (report.status === "failed") {
    return `watermark removal failed: ${report.error}`;
  }
  const a = report.layers?.a;
  const b = report.layers?.b;
  const aPart = a
    ? `layer A removed ${a.removed_count}, replaced ${a.replaced_count} (${a.suspicious_before} suspicious → ${a.suspicious_after})`
    : "layer A did not run";
  const bPart = b
    ? b.ran
      ? `layer B applied via ${b.backend} (${b.strategy})`
      : `layer B ${b.status}: ${b.reason ?? ""}`.trim()
    : "layer B did not run";
  return `${aPart}; ${bPart}`;
}
