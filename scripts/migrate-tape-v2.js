#!/usr/bin/env node
/**
 * Migration v2: Properly update Tale of the Tape in all cached books.
 * 
 * Strategy: For each book, read the FIRST copy (what head() returns),
 * update its stats page, delete ALL copies, upload ONE clean version.
 * 
 * Usage: BLOB_READ_WRITE_TOKEN=xxx node scripts/migrate-tape-v2.js [--dry-run] [--book v9_lion_vs_tiger_neutral]
 */

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!BLOB_TOKEN) {
  console.error('ERROR: Set BLOB_READ_WRITE_TOKEN');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
const SINGLE_BOOK = process.argv.find((a, i) => process.argv[i - 1] === '--book');
const BLOB_API = 'https://blob.vercel-storage.com';

// --- Blob helpers ---

async function listBlobs(prefix) {
  const allBlobs = [];
  let cursor;
  do {
    const params = new URLSearchParams({ prefix, limit: '100' });
    if (cursor) params.set('cursor', cursor);
    const res = await fetch(`${BLOB_API}?${params}`, {
      headers: { authorization: `Bearer ${BLOB_TOKEN}` },
    });
    if (!res.ok) throw new Error(`List failed: ${res.status}`);
    const data = await res.json();
    allBlobs.push(...data.blobs);
    cursor = data.hasMore ? data.cursor : undefined;
  } while (cursor);
  return allBlobs;
}

async function readBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Read failed: ${res.status}`);
  return res.json();
}

async function deleteBlob(url) {
  const res = await fetch(`${BLOB_API}/delete`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${BLOB_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ urls: [url] }),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status} ${await res.text()}`);
}

async function uploadBlob(pathname, data) {
  const body = JSON.stringify(data);
  const res = await fetch(`${BLOB_API}/${pathname}?addRandomSuffix=0`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${BLOB_TOKEN}`,
      'x-api-version': '7',
      'content-type': 'application/json',
    },
    body,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// --- Tape HTML generator (matches route.ts) ---

function generateTapeHTML(nameA, nameB, scores, notes, tacticalFallback) {
  function statBlock(emoji, label, sA, sB, note) {
    return `
      <div class="tape-stat">
        <div class="tape-stat-label">${emoji} ${label}</div>
        ${note ? `<div class="tape-stat-note">${note}</div>` : ''}
        <div class="tape-stat-row">
          <span class="tape-score tape-score-a">${sA}/10</span>
          <div class="tape-bars">
            <div class="tape-bar-left"><div class="tape-fill tape-fill-a" style="width: ${sA * 10}%;"></div></div>
            <div class="tape-bar-right"><div class="tape-fill tape-fill-b" style="width: ${sB * 10}%;"></div></div>
          </div>
          <span class="tape-score tape-score-b">${sB}/10</span>
        </div>
      </div>`;
  }

  const advantageHTML = notes.keyAdvantage
    ? `<div class="tape-advantage">
        <div class="tape-advantage-label">💡 KEY ADVANTAGE</div>
        <p>${notes.keyAdvantage}</p>
      </div>`
    : `<div class="tape-advantage">
        <div class="tape-advantage-label">💡 ANALYSIS</div>
        <p>${tacticalFallback}</p>
      </div>`;

  return `
    <div class="tape-fighters">
      <span class="tape-fighter-a">🔴 ${nameA}</span>
      <span class="tape-vs">VS</span>
      <span class="tape-fighter-b">${nameB} 🔵</span>
    </div>
    ${statBlock('💪', 'STRENGTH', scores.strengthA, scores.strengthB, notes.strengthNote)}
    ${statBlock('⚡', 'SPEED', scores.speedA, scores.speedB, notes.speedNote)}
    ${statBlock('⚔️', 'WEAPONS', scores.weaponsA, scores.weaponsB, notes.weaponsNote)}
    ${statBlock('🛡️', 'DEFENSE', scores.defenseA, scores.defenseB, notes.defenseNote)}
    ${advantageHTML}
  `;
}

// --- Extraction helpers ---

function extractAnimalNames(book) {
  const coverPage = book.pages.find(p => p.type === 'cover');
  if (!coverPage) return null;
  const match = coverPage.title.match(/^(.+?)\s+vs\s+(.+)$/i);
  if (!match) return null;
  return { nameA: match[1].trim(), nameB: match[2].trim() };
}

function extractScoresFromStats(statsPage) {
  if (!statsPage.stats) return null;
  const a = statsPage.stats.animalA;
  const b = statsPage.stats.animalB;
  return {
    strengthA: Math.round(a.strength / 10),
    strengthB: Math.round(b.strength / 10),
    speedA: Math.round(a.speed / 10),
    speedB: Math.round(b.speed / 10),
    weaponsA: Math.round(a.weapons / 10),
    weaponsB: Math.round(b.weapons / 10),
    defenseA: Math.round(a.defense / 10),
    defenseB: Math.round(b.defense / 10),
  };
}

function extractNotesFromHTML(html) {
  const notes = {};
  
  const notePatterns = [
    { key: 'strengthNote', before: 'STRENGTH', after: 'SPEED' },
    { key: 'speedNote', before: 'SPEED', after: 'WEAPONS' },
    { key: 'weaponsNote', before: 'WEAPONS', after: 'DEFENSE' },
    { key: 'defenseNote', before: 'DEFENSE', after: 'KEY ADVANTAGE' },
  ];
  
  for (const { key, before, after } of notePatterns) {
    const beforeIdx = html.indexOf(before);
    const afterIdx = html.indexOf(after, beforeIdx + before.length);
    if (beforeIdx === -1) continue;
    
    const section = afterIdx > -1 ? html.slice(beforeIdx, afterIdx) : html.slice(beforeIdx);
    
    // Try stat-note or tape-stat-note
    const noteMatch = section.match(/class="(?:stat-note|tape-stat-note)"[^>]*>([^<]+(?:<[^>]+>[^<]+)*?)<\//);
    if (noteMatch) {
      notes[key] = noteMatch[1].replace(/<[^>]*>/g, '').trim();
    }
  }
  
  // Extract key advantage from various formats
  const patterns = [
    /KEY ADVANTAGE[^<]*<\/(?:div|p)>\s*<p[^>]*>([^<]+)/,
    /tape-advantage-label[^>]*>[^<]*<\/div>\s*<p>([^<]+)/,
    /🎯 KEY ADVANTAGE:\s*([^<]+)/,
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m && !notes.keyAdvantage) {
      notes.keyAdvantage = m[1].trim();
    }
  }
  
  return notes;
}

// --- Main ---

async function main() {
  console.log(`📐 Tale of the Tape Migration v2${DRY_RUN ? ' (DRY RUN)' : ''}`);
  if (SINGLE_BOOK) console.log(`Single book mode: ${SINGLE_BOOK}`);
  console.log('---\n');

  const prefix = SINGLE_BOOK 
    ? `fightingbooks/cache/${SINGLE_BOOK}`
    : 'fightingbooks/cache/';
  
  const allBlobs = await listBlobs(prefix);
  console.log(`Total blobs found: ${allBlobs.length}`);

  // Group by pathname
  const byPath = new Map();
  for (const blob of allBlobs) {
    if (!byPath.has(blob.pathname)) byPath.set(blob.pathname, []);
    byPath.get(blob.pathname).push(blob);
  }
  
  console.log(`Unique books: ${byPath.size}\n`);

  let updated = 0, skipped = 0, errors = 0;

  for (const [pathname, copies] of byPath) {
    try {
      // Sort by upload time, oldest first (what head() likely returns)
      copies.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
      
      // Read the oldest copy (the reviewed version)
      const book = await readBlob(copies[0].url);
      
      if (!book.pages || !Array.isArray(book.pages)) {
        console.log(`⏭  ${pathname} — not a valid book`);
        skipped++;
        continue;
      }
      
      const statsIdx = book.pages.findIndex(p => p.type === 'stats');
      if (statsIdx === -1) {
        console.log(`⏭  ${pathname} — no stats page`);
        skipped++;
        continue;
      }
      
      const statsPage = book.pages[statsIdx];
      
      // Already has new layout?
      if (statsPage.content && statsPage.content.includes('tape-fighters')) {
        console.log(`⏭  ${pathname} — already migrated`);
        skipped++;
        continue;
      }
      
      // Get animal names
      const animals = extractAnimalNames(book);
      if (!animals) {
        console.log(`⚠️  ${pathname} — can't extract names`);
        errors++;
        continue;
      }
      
      // Get scores
      const scores = extractScoresFromStats(statsPage);
      if (!scores) {
        console.log(`⚠️  ${pathname} — no stats object`);
        errors++;
        continue;
      }
      
      // Get notes from existing HTML
      const notes = extractNotesFromHTML(statsPage.content || '');
      
      // Generate new HTML
      const newContent = generateTapeHTML(
        animals.nameA, animals.nameB, scores, notes,
        'An evenly matched fight! Both animals have comparable stats across all categories.'
      );
      
      // Update only the stats page content
      book.pages[statsIdx].content = newContent;
      
      console.log(`✅ ${pathname}`);
      console.log(`   ${animals.nameA} vs ${animals.nameB} (${copies.length} copies → 1)`);
      console.log(`   Notes: ${Object.keys(notes).length}/5`);
      
      if (!DRY_RUN) {
        // Step 1: Delete ALL copies
        for (const copy of copies) {
          await deleteBlob(copy.url);
        }
        console.log(`   🗑️  Deleted ${copies.length} old copies`);
        
        // Step 2: Upload ONE clean copy (no random suffix)
        const result = await uploadBlob(pathname, book);
        console.log(`   💾 Uploaded clean copy: ${result.url}`);
      }
      
      updated++;
    } catch (err) {
      console.log(`❌ ${pathname} — ${err.message}`);
      errors++;
    }
  }

  console.log(`\n---`);
  console.log(`Done! Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
  if (DRY_RUN) console.log('(Dry run — no changes written)');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
