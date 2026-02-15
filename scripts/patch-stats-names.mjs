#!/usr/bin/env node
/**
 * Patch cached books' stats pages to add color legend at top
 * and remove per-bar animal name labels (saves vertical space)
 */

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!BLOB_TOKEN) {
  console.error('Missing BLOB_READ_WRITE_TOKEN');
  process.exit(1);
}

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

function extractAnimalNames(html) {
  // Find animal names from the name labels in the Strength section
  // Pattern: color: #c41e3a;">AnimalA</p> and color: #1e4fc4;">AnimalB</p>
  const nameA = html.match(/color:\s*#c41e3a;?"?>([^<]+)<\/p>/);
  const nameB = html.match(/color:\s*#1e4fc4;?"?>([^<]+)<\/p>/);
  return {
    nameA: nameA ? nameA[1].trim() : null,
    nameB: nameB ? nameB[1].trim() : null,
  };
}

function patchStatsContent(html) {
  if (!html) return { html, changed: false };
  
  // Skip if already has legend
  if (html.includes('🔴') && html.includes('🔵')) {
    return { html, changed: false };
  }
  
  const { nameA, nameB } = extractAnimalNames(html);
  if (!nameA || !nameB) {
    return { html, changed: false };
  }
  
  // Add legend before the first stat-bar-container
  const legend = `<div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 8px; font-family: 'Bangers', cursive; font-size: 1.1em; letter-spacing: 1px;">
          <span style="color: #c41e3a;">🔴 ${nameA}</span>
          <span style="color: #666;">VS</span>
          <span style="color: #1e4fc4;">🔵 ${nameB}</span>
        </div>
        `;
  
  let patched = html.replace(
    '<div class="stat-bar-container">',
    legend + '<div class="stat-bar-container">'
  );
  
  // Remove the individual name <p> tags under bars (both animals)
  // These are like: <p style="text-align: center; margin-top: 2px; font-weight: bold; font-size: 0.85em; color: #c41e3a;">Lion</p>
  patched = patched.replace(
    /<p style="text-align: center;[^"]*color:\s*#c41e3a;?"?>[^<]+<\/p>/g,
    ''
  );
  patched = patched.replace(
    /<p style="text-align: center;[^"]*color:\s*#1e4fc4;?"?>[^<]+<\/p>/g,
    ''
  );
  
  return { html: patched, changed: patched !== html };
}

async function main() {
  console.log('Listing cached books...');
  
  let allBlobs = [];
  let cursor = null;
  
  do {
    const result = await listBlobs('fightingbooks/cache/', cursor);
    allBlobs = allBlobs.concat(result.blobs || []);
    cursor = result.cursor;
  } while (cursor);
  
  console.log(`Total cached books: ${allBlobs.length}`);
  
  let patched = 0, skipped = 0, errors = 0;
  
  for (const blob of allBlobs) {
    const name = blob.pathname;
    try {
      const data = await getBlob(blob.url);
      
      if (!data.pages || !Array.isArray(data.pages)) {
        skipped++; continue;
      }
      
      const statsPage = data.pages.find(p => p.type === 'stats');
      if (!statsPage) {
        skipped++; continue;
      }
      
      const { html: patchedContent, changed } = patchStatsContent(statsPage.content);
      
      if (!changed) {
        console.log(`  SKIP: ${name}`);
        skipped++; continue;
      }
      
      statsPage.content = patchedContent;
      await putBlob(name, data);
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
