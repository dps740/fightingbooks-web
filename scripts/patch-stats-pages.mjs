#!/usr/bin/env node
/**
 * Patch all cached books' "Tale of the Tape" stats pages
 * to use compact inline styles (replacing margin-bottom: 20px, etc.)
 */

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!BLOB_TOKEN) {
  console.error('Missing BLOB_READ_WRITE_TOKEN');
  process.exit(1);
}

const BLOB_STORE_ID = BLOB_TOKEN.split('_')[3]; // Extract store ID

async function listBlobs(prefix, cursor) {
  const params = new URLSearchParams({ prefix, limit: '100' });
  if (cursor) params.set('cursor', cursor);
  
  const res = await fetch(`https://blob.vercel-storage.com?${params}`, {
    headers: { authorization: `Bearer ${BLOB_TOKEN}` },
  });
  return res.json();
}

async function getBlob(url) {
  const res = await fetch(url);
  return res.json();
}

async function putBlob(pathname, data) {
  const res = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${BLOB_TOKEN}`,
      'x-content-type': 'application/json',
      'x-cache-control-max-age': '31536000',
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

function patchStatsContent(html) {
  if (!html) return html;
  
  // Replace inline margin-bottom: 20px with 6px
  let patched = html.replace(/margin-bottom:\s*20px/g, 'margin-bottom: 6px');
  
  // Replace margin-top: 20px with 8px (on did-you-know / think-about-it)
  patched = patched.replace(/margin-top:\s*20px/g, 'margin-top: 8px');
  
  // Replace margin-top: 5px on animal name labels with 2px + smaller font
  patched = patched.replace(
    /margin-top:\s*5px;\s*font-weight:\s*bold/g,
    'margin-top: 2px; font-weight: bold; font-size: 0.85em'
  );
  
  return patched;
}

async function main() {
  console.log('Listing cached books...');
  
  let allBlobs = [];
  let cursor = null;
  
  do {
    const result = await listBlobs('fightingbooks/cache/', cursor);
    allBlobs = allBlobs.concat(result.blobs || []);
    cursor = result.cursor;
    console.log(`  Found ${allBlobs.length} blobs so far...`);
  } while (cursor);
  
  console.log(`\nTotal cached books: ${allBlobs.length}`);
  
  let patched = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const blob of allBlobs) {
    const name = blob.pathname;
    try {
      const data = await getBlob(blob.url);
      
      if (!data.pages || !Array.isArray(data.pages)) {
        console.log(`  SKIP (no pages): ${name}`);
        skipped++;
        continue;
      }
      
      const statsPage = data.pages.find(p => p.type === 'stats');
      if (!statsPage) {
        console.log(`  SKIP (no stats page): ${name}`);
        skipped++;
        continue;
      }
      
      const originalContent = statsPage.content;
      const patchedContent = patchStatsContent(originalContent);
      
      if (originalContent === patchedContent) {
        console.log(`  SKIP (already patched): ${name}`);
        skipped++;
        continue;
      }
      
      // Update the stats page content
      statsPage.content = patchedContent;
      
      // Save back
      const result = await putBlob(name, data);
      console.log(`  ✅ PATCHED: ${name}`);
      patched++;
      
    } catch (err) {
      console.error(`  ❌ ERROR: ${name} - ${err.message}`);
      errors++;
    }
  }
  
  console.log(`\nDone! Patched: ${patched}, Skipped: ${skipped}, Errors: ${errors}`);
}

main().catch(console.error);
