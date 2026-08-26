/**
 * Whether this instance may write CV data back to src/data.
 *
 * Editing is a local authoring feature: the endpoints behind it write into the
 * repo's own source tree. A deployed instance must never expose them, or anyone
 * visiting the site could rewrite the CV. Production refuses unless the
 * operator opts in explicitly.
 *
 * Kept in its own module, free of node:fs imports, so a server component can
 * read it and pass the answer to the browser — which is what lets the UI hide
 * controls that would only ever fail.
 */
export function editingEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.CV_ENABLE_EDITING === "1"
  );
}
