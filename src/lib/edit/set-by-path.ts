/**
 * Writes `value` at a dot path like "work.0.description.1" inside the parsed
 * CV. Numeric segments index arrays. A path that no longer resolves — the CV
 * shrank under the editor — is skipped rather than invented.
 */
export function setByPath(target: unknown, path: string, value: unknown) {
  const keys = path.split(".");
  let node = target as Record<string, unknown> | null;
  for (let i = 0; i < keys.length - 1; i++) {
    const next = node?.[keys[i]];
    if (next == null || typeof next !== "object") return;
    node = next as Record<string, unknown>;
  }
  if (node) node[keys[keys.length - 1]] = value;
}
