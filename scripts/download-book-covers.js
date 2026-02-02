/**
 * Download all Who Would Win book covers locally
 * Sources: Amazon, Open Library, or manual URLs
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'covers');

// All books with multiple image source options
const BOOKS = [
  { asin: "0545175712", title: "Lion vs Tiger", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545175712.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545175715-L.jpg`,
  ]},
  { asin: "0545175720", title: "Polar Bear vs Grizzly", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545175720.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545175722-L.jpg`,
  ]},
  { asin: "0545301718", title: "Komodo Dragon vs King Cobra", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545301718.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545301718-L.jpg`,
  ]},
  { asin: "0545160758", title: "Killer Whale vs Great White", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545160758.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545160759-L.jpg`,
  ]},
  { asin: "0545175739", title: "T-Rex vs Velociraptor", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545175739.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545175739-L.jpg`,
  ]},
  { asin: "0545301726", title: "Tarantula vs Scorpion", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545301726.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545301725-L.jpg`,
  ]},
  { asin: "0545301734", title: "Hammerhead vs Bull Shark", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545301734.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545301732-L.jpg`,
  ]},
  { asin: "0545451914", title: "Rhino vs Hippo", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545451914.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545451918-L.jpg`,
  ]},
  { asin: "0545451906", title: "Wolverine vs Tasmanian Devil", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545451906.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545451901-L.jpg`,
  ]},
  { asin: "0545451922", title: "Hornet vs Wasp", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545451922.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545451925-L.jpg`,
  ]},
  { asin: "0545681154", title: "Jaguar vs Skunk", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545681154.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545681155-L.jpg`,
  ]},
  { asin: "1338320262", title: "Green Ants vs Army Ants", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/1338320262.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9781338320268-L.jpg`,
  ]},
  { asin: "0545681189", title: "Ultimate Ocean Rumble", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545681189.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545681186-L.jpg`,
  ]},
  { asin: "0545946085", title: "Ultimate Jungle Rumble", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545946085.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545946087-L.jpg`,
  ]},
  { asin: "1338320254", title: "Ultimate Shark Rumble", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/1338320254.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9781338320251-L.jpg`,
  ]},
  { asin: "1338320270", title: "Ultimate Bug Rumble", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/1338320270.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9781338320275-L.jpg`,
  ]},
  { asin: "0545175747", title: "Whale vs Giant Squid", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545175747.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545175746-L.jpg`,
  ]},
  { asin: "0545451930", title: "Alligator vs Python", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545451930.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545451932-L.jpg`,
  ]},
  { asin: "0545681138", title: "Lobster vs Crab", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545681138.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545681131-L.jpg`,
  ]},
  { asin: "0545681146", title: "Falcon vs Hawk", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545681146.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545681148-L.jpg`,
  ]},
  { asin: "0545681162", title: "Hyena vs Honey Badger", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545681162.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545681162-L.jpg`,
  ]},
  { asin: "0545681170", title: "Triceratops vs Spinosaurus", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/0545681170.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9780545681179-L.jpg`,
  ]},
  { asin: "1338153951", title: "Ultimate Dinosaur Rumble", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/1338153951.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9781338153958-L.jpg`,
  ]},
  { asin: "1338672169", title: "Ultimate Reptile Rumble", sources: [
    `https://images-na.ssl-images-amazon.com/images/P/1338672169.01.LZZZZZZZ.jpg`,
    `https://covers.openlibrary.org/b/isbn/9781338672169-L.jpg`,
  ]},
];

async function downloadImage(url) {
  try {
    const response = await fetch(url, { 
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) return null;
    
    const buffer = Buffer.from(await response.arrayBuffer());
    // Check if it's a real image (not tiny placeholder)
    if (buffer.length < 5000) return null;
    
    return buffer;
  } catch (e) {
    return null;
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Downloading ${BOOKS.length} book covers...\\n`);

  let success = 0;
  let failed = [];

  for (const book of BOOKS) {
    const outputPath = path.join(OUTPUT_DIR, `${book.asin}.jpg`);
    
    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`✓ ${book.title} (cached)`);
      success++;
      continue;
    }

    let buffer = null;
    for (const url of book.sources) {
      buffer = await downloadImage(url);
      if (buffer) break;
    }

    if (buffer) {
      fs.writeFileSync(outputPath, buffer);
      console.log(`✓ ${book.title}`);
      success++;
    } else {
      console.log(`✗ ${book.title} - NO SOURCE WORKED`);
      failed.push(book);
    }

    // Small delay
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\\nDone! ${success}/${BOOKS.length} downloaded`);
  if (failed.length > 0) {
    console.log(`\\nFailed books:`);
    failed.forEach(b => console.log(`  - ${b.title} (${b.asin})`));
  }
}

main();
