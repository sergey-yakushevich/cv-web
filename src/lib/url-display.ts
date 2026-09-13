/**
 * How a URL is printed on a CV, as opposed to how it is stored.
 *
 * The contact line prints literal addresses — `github.com/sergey-yakushevich`,
 * not the word "GitHub" — because résumé parsers read the PDF text layer and
 * drop link annotations, so anchor text is what actually reaches them. See
 * `Header.tsx`.
 *
 * A tracking parameter is the one part of a URL that is *not* the address. It
 * says which copy of the document was opened, which is useful to the sender
 * and noise to the reader, so it rides in the href and stays out of the text.
 * The cost is real and worth stating: a code only survives a click. Anyone who
 * retypes the address, and any parser reading the text layer, lands on the
 * untagged URL and the open goes unattributed.
 */

/** Query keys that are attribution rather than address. */
const TRACKING_PARAMS =
  /^(t|track|utm_[a-z]+|ref|referrer|fbclid|gclid|mc_cid|mc_eid)$/i;

/** Strips the scheme and any trailing slash: how a link reads on paper. */
export function bareUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/**
 * What the page prints for a stored URL: the bare address, with tracking
 * parameters removed.
 *
 * A URL carrying none is returned untouched rather than round-tripped through
 * the URL parser, so nothing else about it — a trailing dot, an unusual escape
 * — is quietly normalised on the way to the page.
 */
export function displayUrl(url: string): string {
  return bareUrl(stripTracking(url));
}

function stripTracking(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url; // not absolute, or not a URL at all; print it as given
  }

  const tracking = [...parsed.searchParams.keys()].filter((key) =>
    TRACKING_PARAMS.test(key)
  );
  if (tracking.length === 0) return url;

  for (const key of tracking) parsed.searchParams.delete(key);
  return parsed.toString();
}

/**
 * True when `text` — the visible, editable contact line — still reads as
 * `stored` does. The editor collects link text back into the stored URL, so
 * without this check the first save would rewrite a tracked URL down to the
 * address it prints and silently drop the code.
 */
export function displaysAs(text: string, stored: string): boolean {
  if (!stored) return false;
  return bareUrl(text.trim()) === displayUrl(stored);
}
