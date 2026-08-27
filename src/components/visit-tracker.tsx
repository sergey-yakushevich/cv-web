"use client";

/*
 * Visitor + action tracking for the CV SPA.
 *
 * buildcv is a single-page editor: after the first load the user barely
 * changes URL, so page views alone say almost nothing. What matters is what
 * they *do* — open the editor, upload a photo, save, download the PDF. This
 * component records those actions as trackhub events, plus a page_view for the
 * initial load and any real route change.
 *
 * Everything is fire-and-forget to POST /api/track (which forwards server-side
 * to the central trackhub API). Tracking must never break the page.
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

const TOKEN_KEY = "cv_vid";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Strips the workspace id out of a path before it is reported.
 *
 * Knowing a CV's URL is what grants permission to read *and* edit it — there is
 * no registration, so the id in the path is the whole credential. Reporting the
 * literal path would file that credential into the analytics store next to an
 * IP and a device fingerprint, so "/<uuid>/my-cv" is reported as
 * "/:workspace/my-cv". The action is still counted; the key is not handed over.
 */
function redactPath(path: string): string {
  return path
    .split("/")
    .map((segment) => (UUID.test(segment) ? ":workspace" : segment))
    .join("/");
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function visitorToken(): string {
  try {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = uuid();
      localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  } catch {
    return uuid();
  }
}

let cachedFingerprint: string | null = null;

async function getFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
    return cachedFingerprint;
  } catch {
    return "";
  }
}

function clientContext(): Record<string, unknown> {
  const params = new URLSearchParams(window.location.search);
  return {
    screen_w: window.screen?.width,
    screen_h: window.screen?.height,
    viewport_w: window.innerWidth,
    viewport_h: window.innerHeight,
    device_pixel_ratio: window.devicePixelRatio,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer: document.referrer || null,
    landing_path: redactPath(window.location.pathname),
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
  };
}

function post(body: Record<string, unknown>): void {
  const json = JSON.stringify(body);

  if (navigator.sendBeacon) {
    const blob = new Blob([json], { type: "application/json" });
    if (navigator.sendBeacon("/api/track", blob)) return;
  }

  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
    keepalive: true,
  }).catch(() => {
    // Tracking must never break the page.
  });
}

let contextSent = false;

type EventFields = {
  id?: string;
  name: string;
  label?: string;
  path?: string;
  duration_ms?: number;
  meta?: Record<string, unknown>;
};

/** Send one event, attaching the one-time client context on the first beacon. */
async function sendEvent(event: EventFields): Promise<void> {
  try {
    const body: Record<string, unknown> = { token: visitorToken() };
    if (!contextSent) {
      contextSent = true;
      const fingerprint = await getFingerprint();
      Object.assign(body, clientContext(), {
        device_fingerprint: fingerprint || null,
      });
    }
    post({
      ...body,
      event: {
        id: event.id ?? uuid(),
        name: event.name,
        label: event.label ?? null,
        path: event.path ?? redactPath(window.location.pathname),
        occurred_at: new Date().toISOString(),
        duration_ms: event.duration_ms,
        meta: event.meta ?? null,
      },
    });
  } catch {
    // Tracking must never break the page.
  }
}

/** Fire-and-forget action event (never awaited by callers). */
function track(
  name: string,
  opts: { label?: string; meta?: Record<string, unknown> } = {}
): void {
  void sendEvent({ name, label: opts.label, meta: opts.meta });
}

// ---------------------------------------------------------------------------
// Page views + dwell time
// ---------------------------------------------------------------------------

type OpenPageView = {
  id: string;
  path: string;
  activeMs: number;
  resumedAt: number | null;
};

let openPageView: OpenPageView | null = null;

function accumulate(view: OpenPageView): void {
  if (view.resumedAt === null) return;
  view.activeMs += Date.now() - view.resumedAt;
  view.resumedAt = null;
}

function closePageView(): void {
  const view = openPageView;
  if (!view) return;
  openPageView = null;

  accumulate(view);
  // Synchronous on purpose: runs on unload, where promise continuations are
  // not guaranteed to execute.
  post({
    token: visitorToken(),
    event: {
      id: view.id,
      name: "page_view",
      path: view.path,
      duration_ms: view.activeMs,
    },
  });
}

function trackPageView(rawPath: string): void {
  const path = redactPath(rawPath);
  if (openPageView?.path === path) return;

  closePageView();

  const view: OpenPageView = {
    id: uuid(),
    path,
    activeMs: 0,
    resumedAt: Date.now(),
  };
  openPageView = view;

  void sendEvent({ id: view.id, name: "page_view", path });
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

let listenersInstalled = false;

function installPageListeners(): void {
  if (listenersInstalled) return;
  listenersInstalled = true;

  window.addEventListener("pagehide", closePageView);
  document.addEventListener("visibilitychange", () => {
    const view = openPageView;
    if (!view) return;
    if (document.visibilityState === "hidden") {
      accumulate(view);
    } else if (view.resumedAt === null) {
      view.resumedAt = Date.now();
    }
  });
}

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    installPageListeners();
    installActions();
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
