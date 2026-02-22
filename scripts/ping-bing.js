#!/usr/bin/env node
/**
 * Ping Bing with sitemap after deploy.
 * Run: node scripts/ping-bing.js
 */

const SITEMAP_URL = "https://whowouldwinbooks.com/sitemap.xml";

async function main() {
  const pingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
  console.log(`Pinging Bing with sitemap: ${pingUrl}`);

  const res = await fetch(pingUrl);
  console.log(`Bing ping status: ${res.status} ${res.statusText}`);

  if (res.ok || res.status === 200) {
    console.log("✅ Bing sitemap ping successful");
  } else {
    console.warn("⚠️  Unexpected status — check Bing Webmaster Tools manually");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Ping failed:", err.message);
  process.exit(1);
});
