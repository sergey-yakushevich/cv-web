/**
 * Imports the CVs in src/data into one user's account.
 *
 * The files under src/data are Sergey's real résumés. They are not the starter
 * template new visitors receive — that is src/data/starter-template.ts, which is
 * deliberately nobody's CV. This script is how the real ones get into an
 * account once, without shipping his contact details to every stranger.
 *
 * Usage:
 *   pnpm dev                      # in one terminal, so the DB file exists
 *   pnpm cv:import <userId>       # userId is the cv_uid cookie value
 *
 * Point elsewhere with CV_ORIGIN=https://buildcv.cc pnpm cv:import <userId>
 */
const origin = process.env.CV_ORIGIN ?? "http://localhost:3000";
const userId = process.argv[2];

if (!userId) {
  console.error(
    "Usage: pnpm cv:import <userId>\n" +
      "Find your id in the cv_uid cookie, or in the URL you are browsing."
  );
  process.exit(1);
}

const response = await fetch(`${origin}/api/cvs/import`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // The API normally takes the user from the cookie; the script sends it
    // explicitly because it has no browser session.
    Cookie: `cv_uid=${userId}`,
  },
  body: JSON.stringify({ source: "src/data" }),
});

const result = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error(`Import failed (HTTP ${response.status}):`, result.error ?? "");
  process.exit(1);
}

for (const cv of result.imported ?? []) {
  console.log(`  ${cv.slug}  ${cv.label}`);
}
console.log(`\nImported ${result.imported?.length ?? 0} CVs into ${userId}`);
