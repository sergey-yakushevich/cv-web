"use client";

/*
 * Visitor + action tracking for the CV SPA.
 *
 * Page views, dwell time and engagement are no longer implemented here. They
 * come from the shared trackhub tracker (served at /trk/t.js), which every site
 * now loads — four hand-maintained copies had already drifted apart, and that
 * drift is what silently dropped this app's client context for every visitor.
 *
 * What stays here is the part that is genuinely specific to buildcv: it is a
 * single-page editor, so after the first load the user barely changes URL and
 * what matters is what they *do*.
 *
 * Actions captured:
 *   - button_click : any button / link / role=button, labelled by its text
 *   - file_upload  : choosing a file (the avatar picker)
 *   - cv_save      : a successful PUT /api/cvs/... (the real "save")
 *   - cv_download  : a successful GET /api/pdf/... (the PDF download)
 * The last two are caught by wrapping fetch, so they fire however the action
 * was triggered — toolbar button, command menu, or keyboard.
 */

import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const TRACKER_SRC =
  process.env.NEXT_PUBLIC_TRACKHUB_SCRIPT ?? "https://cyberjosef.dev/trk/t.js";

type TrackhubAPI = {
  __loaded?: boolean;
  q?: unknown[][];
  pageview?: (path?: string) => void;
  event?: (name: string, options?: { label?: string; meta?: unknown }) => void;
  fingerprint?: (value: string) => void;
};

declare global {
  interface Window {
    trackhub?: TrackhubAPI;
  }
}

/**
 * Calls the shared tracker, queueing when the script has not landed yet.
 * Tracking must never break the page, so every path here swallows its errors.
 */
function call(method: string, ...args: unknown[]): void {
  if (typeof window === "undefined") return;
  try {
    if (!window.trackhub) {
      window.trackhub = { q: [] };
    }
    const api = window.trackhub;
    if (api.__loaded) {
      const fn = (api as Record<string, unknown>)[method];
      if (typeof fn === "function") {
        (fn as (...a: unknown[]) => void)(...args);
      }
      return;
    }
    if (!api.q) {
      api.q = [];
    }
    api.q.push([method, ...args]);
  } catch {
    // Tracking must never break the page.
  }
}

function track(
  name: string,
  opts: { label?: string; meta?: Record<string, unknown> } = {}
): void {
  call("event", name, opts);
}

/** Loads the shared tracker once. */
function installTracker(): void {
  if (document.querySelector<HTMLScriptElement>("script[data-trackhub]"))
    return;

  const script = document.createElement("script");
  script.src = TRACKER_SRC;
  script.async = true;
  script.dataset.trackhub = "";
  // The beacon goes to this app's own route, which adds the real IP and user
  // agent and holds the API token server-side.
  script.dataset.endpoint = "/api/track";
  // Keep the historic localStorage key so returning visitors stay the same
  // visitor rather than all appearing brand new on deploy day.
  script.dataset.key = "cv_vid";
  document.head.appendChild(script);
}

/**
 * Hands the device fingerprint to the shared tracker.
 *
 * This is an analytics grouping key only. It is never an identity or an access
 * check — a CV is reached by holding its URL, and a fingerprint collision must
 * never be able to show one person another's workspace.
 */
async function reportFingerprint(): Promise<void> {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    if (result.visitorId) call("fingerprint", result.visitorId);
  } catch {
    // A missing fingerprint costs device grouping, nothing more.
  }
}

// ---------------------------------------------------------------------------
// Action capture
// ---------------------------------------------------------------------------

/** A readable label for a clicked control: its text, else aria-label/title. */
function controlLabel(el: HTMLElement): string {
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  if (text) return text.slice(0, 80);
  const aria = el.getAttribute("aria-label") || el.getAttribute("title");
  return (aria ?? "").slice(0, 80);
}

let actionsInstalled = false;

function installActions(): void {
  if (actionsInstalled) return;
  actionsInstalled = true;

  // Clicks on real controls. Capture phase so we still see it if the handler
  // stops propagation. Editing the CV text (contenteditable) is not a click to
  // record, and anything marked data-track-ignore opts out.
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("button, a, [role='button']");
      if (!el || el.closest("[contenteditable='true'], [data-track-ignore]"))
        return;

      const label = controlLabel(el);
      if (!label) return;
      track("button_click", { label });
    },
    true
  );

  // File chooser (the avatar upload dialog).
  document.addEventListener(
    "change",
    (event) => {
      const el = event.target as HTMLInputElement | null;
      if (!el || el.type !== "file" || !el.files?.length) return;
      const file = el.files[0];
      track("file_upload", {
        label: file.name,
        meta: { size: file.size, type: file.type, count: el.files.length },
      });
    },
    true
  );

  // Save and download both go through fetch; wrap it once so they are caught
  // however they were triggered (button, command menu, keyboard).
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const method = (
      init?.method ||
      (input instanceof Request ? input.method : "GET") ||
      "GET"
    ).toUpperCase();
    const response = await originalFetch(input as RequestInfo, init);
    try {
      if (response.ok && url) {
        if (method === "PUT" && /\/api\/cvs\//.test(url)) {
          track("cv_save");
        } else if (/\/api\/pdf\//.test(url)) {
          track("cv_download");
        }
      }
    } catch {
      // Never let tracking affect the real fetch result.
    }
    return response;
  };
}

// ---------------------------------------------------------------------------

let started = false;

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!started) {
      started = true;
      installTracker();
      installActions();
      void reportFingerprint();
      // The tracker opens the first page view itself on load.
      return;
    }
    // App Router navigations go through the history API, which the tracker
    // already hooks; this is the belt to that braces, and it de-duplicates by
    // path so a double call costs nothing.
    call("pageview", pathname);
  }, [pathname]);

  return null;
}
