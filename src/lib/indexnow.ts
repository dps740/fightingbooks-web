/**
 * IndexNow — instant URL submission to Bing (+ DuckDuckGo, Yahoo, etc.)
 * Docs: https://www.indexnow.org/documentation
 *
 * How to use:
 *   import { notifyIndexNow } from "@/lib/indexnow";
 *   await notifyIndexNow(["/battles/lion-vs-tiger", "/battles/tiger-vs-grizzly-bear"]);
 */

const INDEXNOW_KEY = "0a4f2613c7b2492cbe97d0fbdd8f1745";
const SITE_HOST = "whowouldwinbooks.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Notify Bing IndexNow of updated URLs.
 * Pass paths (e.g. "/battles/lion-vs-tiger") — we prepend the host.
 * Silently no-ops on failure so it never breaks book generation.
 */
export async function notifyIndexNow(paths: string[]): Promise<void> {
  if (!paths || paths.length === 0) return;

  // Ensure paths start with /
  const urlList = paths.map((p) =>
    `https://${SITE_HOST}${p.startsWith("/") ? p : "/" + p}`
  );

  const body = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
    urlList,
  };

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    if (res.ok || res.status === 202) {
      console.log(`[IndexNow] Submitted ${urlList.length} URL(s) — status ${res.status}`);
    } else {
      console.warn(`[IndexNow] Unexpected status ${res.status} for ${urlList.length} URL(s)`);
    }
  } catch (err) {
    // Never let IndexNow break user-facing flows
    console.warn("[IndexNow] Submission failed (non-critical):", err);
  }
}

/**
 * Shortcut for a single URL.
 */
export async function notifyIndexNowSingle(path: string): Promise<void> {
  return notifyIndexNow([path]);
}

/**
 * Submit the full sitemap to Bing Webmaster Tools.
 * Call once after deploy or on a schedule. Separate from per-URL IndexNow.
 */
export async function submitSitemapToBing(): Promise<void> {
  const sitemapUrl = `https://${SITE_HOST}/sitemap.xml`;
  const pingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

  try {
    const res = await fetch(pingUrl);
    console.log(`[Bing Sitemap] Ping result: ${res.status}`);
  } catch (err) {
    console.warn("[Bing Sitemap] Ping failed (non-critical):", err);
  }
}
