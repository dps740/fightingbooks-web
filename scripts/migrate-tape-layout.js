#!/usr/bin/env node
/**
 * Migration script: Update Tale of the Tape page in all cached books
 * to use the new Option A face-off bars layout.
 * 
 * This reads each cached book from Vercel Blob, extracts the animal-specific
 * data (names, scores, notes), generates new HTML, and saves back.
 * 
 * Usage: BLOB_READ_WRITE_TOKEN=xxx node scripts/migrate-tape-layout.js [--dry-run]
 */

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!BLOB_TOKEN) {
  console.error('ERROR: Set BLOB_READ_WRITE_TOKEN environment variable');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
const BLOB_API = 'https://blob.vercel-storage.com';

// --- Vercel Blob helpers ---

async function listBlobs(prefix) {
  const allBlobs = [];
  let cursor = undefined;
  
  do {
    const params = new URLSearchParams({ prefix, limit: '100' });
    if (cursor) params.set('cursor', cursor);
    
    const res = await fetch(`${BLOB_API}?${params}`, {
      headers: { authorization: `Bearer ${BLOB_TOKEN}` },
    });
    if (!res.ok) throw new Error(`List failed: ${res.status} ${await res.text()}`);
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

async function writeBlob(pathname, data) {
  const res = await fetch(`${BLOB_API}/${pathname}`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${BLOB_TOKEN}`,
      'content-type': 'application/json',
      'x-api-version': '7',
      'x-content-type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Write failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// --- HTML generation (matches route.ts generateTapeHTML) ---

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

// --- Extract data from existing cached books ---

function extractAnimalNames(book) {
  const coverPage = book.pages.find(p => p.type === 'cover');
  if (!coverPage) return null;
  
  // Title format: "Lion vs Tiger"
  const match = coverPage.title.match(/^(.+?)\s+vs\s+(.+)$/i);
  if (!match) return null;
  return { nameA: match[1].trim(), nameB: match[2].trim() };
}

function extractScoresFromStats(statsPage) {
  // The stats object has { animalA: { strength, speed, weapons, defense }, animalB: ... }
  // These are on 0-100 scale, need to convert to 0-10
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
  
  // Try to extract notes from existing HTML patterns
  // Old format: <p class="stat-note">...</p>
  // The notes appear between stat labels and bars
  const notePatterns = [
    { key: 'strengthNote', before: 'STRENGTH', after: 'SPEED' },
    { key: 'speedNote', before: 'SPEED', after: 'WEAPONS' },
    { key: 'weaponsNote', before: 'WEAPONS', after: 'DEFENSE' },
    { key: 'defenseNote', before: 'DEFENSE', after: 'KEY ADVANTAGE' },
  ];
  
  for (const { key, before, after } of notePatterns) {
    // Look for stat-note content between the before/after markers
    const beforeIdx = html.indexOf(before);
    const afterIdx = html.indexOf(after, beforeIdx + before.length);
    if (beforeIdx === -1) continue;
    
    const section = afterIdx > -1 
      ? html.slice(beforeIdx, afterIdx) 
      : html.slice(beforeIdx);
    
    // Extract from stat-note class or tape-stat-note class
    const noteMatch = section.match(/class="(?:stat-note|tape-stat-note)"[^>]*>([^<]+(?:<[^>]+>[^<]+)*?)<\//);
    if (noteMatch) {
      notes[key] = noteMatch[1].replace(/<[^>]*>/g, '').trim();
    }
  }
  
  // Extract key advantage
  const keyAdvMatch = html.match(/KEY ADVANTAGE[^<]*<\/(?:div|p)>\s*<p[^>]*>([^<]+)/);
  if (keyAdvMatch) {
    notes.keyAdvantage = keyAdvMatch[1].trim();
  }
  // Also try the tape-advantage format
  const tapeAdvMatch = html.match(/tape-advantage-label[^>]*>[^<]*<\/div>\s*<p>([^<]+)/);
  if (tapeAdvMatch && !notes.keyAdvantage) {
    notes.keyAdvantage = tapeAdvMatch[1].trim();
  }
  // Also try the old did-you-know KEY ADVANTAGE format
  const oldAdvMatch = html.match(/🎯 KEY ADVANTAGE:\s*([^<]+)/);
  if (oldAdvMatch && !notes.keyAdvantage) {
    notes.keyAdvantage = oldAdvMatch[1].trim();
  }
  
  return notes;
}

// --- Main migration ---

async function main() {
  console.log(`🔧 Tale of the Tape Migration${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('---');
  
  // List all cached books
  const blobs = await listBlobs('fightingbooks/cache/');
  console.log(`Found ${blobs.length} cached book(s)\n`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  // Deduplicate — keep only the latest version of each base path
  const byBasePath = new Map();
  for (const blob of blobs) {
    // Remove random suffix added by Vercel Blob (e.g., "xxx-AbCd123.json" → "xxx.json")
    const basePath = blob.pathname.replace(/-[A-Za-z0-9]{7,}\.json$/, '.json');
    const existing = byBasePath.get(basePath);
    if (!existing || new Date(blob.uploadedAt) > new Date(existing.uploadedAt)) {
      byBasePath.set(basePath, blob);
    }
  }
  
  const uniqueBlobs = [...byBasePath.values()];
  console.log(`Unique books after dedup: ${uniqueBlobs.length}\n`);
  
  for (const blob of uniqueBlobs) {
    const name = blob.pathname;
    
    try {
      // Read the cached book
      const book = await readBlob(blob.url);
      if (!book.pages || !Array.isArray(book.pages)) {
        console.log(`⏭  ${name} — not a valid book (no pages array)`);
        skipped++;
        continue;
      }
      
      // Find the stats page
      const statsIdx = book.pages.findIndex(p => p.type === 'stats');
      if (statsIdx === -1) {
        console.log(`⏭  ${name} — no stats page found`);
        skipped++;
        continue;
      }
      
      const statsPage = book.pages[statsIdx];
      
      // Already migrated? Check for tape-fighters class
      if (statsPage.content && statsPage.content.includes('tape-fighters')) {
        console.log(`⏭  ${name} — already has new layout`);
        skipped++;
        continue;
      }
      
      // Extract animal names
      const animals = extractAnimalNames(book);
      if (!animals) {
        console.log(`⚠️  ${name} — could not extract animal names`);
        errors++;
        continue;
      }
      
      // Extract scores from stats object
      const scores = extractScoresFromStats(statsPage);
      if (!scores) {
        console.log(`⚠️  ${name} — no stats object, cannot migrate`);
        errors++;
        continue;
      }
      
      // Extract notes from existing HTML
      const notes = extractNotesFromHTML(statsPage.content || '');
      
      // Generate new HTML
      const tacticalFallback = 'An evenly matched fight! Both animals have comparable stats across all categories.';
      const newContent = generateTapeHTML(
        animals.nameA, 
        animals.nameB, 
        scores, 
        notes,
        tacticalFallback
      );
      
      console.log(`✅ ${name}`);
      console.log(`   ${animals.nameA} vs ${animals.nameB}`);
      console.log(`   Scores: STR ${scores.strengthA}/${scores.strengthB} SPD ${scores.speedA}/${scores.speedB} WPN ${scores.weaponsA}/${scores.weaponsB} DEF ${scores.defenseA}/${scores.defenseB}`);
      console.log(`   Notes found: ${Object.keys(notes).length}/5`);
      
      if (!DRY_RUN) {
        // Update just the stats page content
        book.pages[statsIdx].content = newContent;
        
        // Write back to Vercel Blob
        // Use the Vercel Blob put API
        const putRes = await fetch(`${BLOB_API}/${name}`, {
          method: 'PUT',
          headers: {
            authorization: `Bearer ${BLOB_TOKEN}`,
            'x-api-version': '7',
            'content-type': 'application/json',
          },
          body: JSON.stringify(book),
        });
        
        if (!putRes.ok) {
          const errText = await putRes.text();
          console.log(`   ❌ Write failed: ${putRes.status} ${errText}`);
          errors++;
          continue;
        }
        
        console.log(`   💾 Saved`);
      }
      
      updated++;
    } catch (err) {
      console.log(`❌ ${name} — ${err.message}`);
      errors++;
    }
  }
  
  console.log('\n---');
  console.log(`Done! Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
  if (DRY_RUN) console.log('(Dry run — no changes written)');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
