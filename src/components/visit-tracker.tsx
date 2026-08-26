"use client";

/*
 * Lightweight, fire-and-forget visitor tracking (same model as the other
 * sites). Sends a page_view (with dwell time) for the initial load and every
 * route change to POST /api/track, which forwards server-side to the central
 * trackhub API. The first beacon also carries the client context and a device
 * fingerprint. Tracking must never break the page.
 */

import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const TOKEN_KEY = "cv_vid";

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
    landing_path: window.location.pathname,
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
  };
}

function send(body: Record<string, unknown>): void {
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
  }).catch(() => {});
}

let contextSent = false;

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
  send({
    token: visitorToken(),
    event: { id: view.id, name: "page_view", path: view.path, duration_ms: view.activeMs },
  });
}

function trackPageView(path: string): void {
  if (openPageView?.path === path) return;

  closePageView();

  const view: OpenPageView = { id: uuid(), path, activeMs: 0, resumedAt: Date.now() };
  openPageView = view;

  void (async () => {
    try {
      const body: Record<string, unknown> = { token: visitorToken() };
      if (!contextSent) {
        contextSent = true;
        const fingerprint = await getFingerprint();
        Object.assign(body, clientContext(), { device_fingerprint: fingerprint || null });
      }
      send({
        ...body,
        event: { id: view.id, name: "page_view", path, occurred_at: new Date().toISOString() },
      });
    } catch {
      // Tracking must never break the page.
    }
  })();
}

let listenersInstalled = false;

function installListeners(): void {
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
    installListeners();
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
