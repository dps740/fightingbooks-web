// Who Would Win? Book Series by Jerry Pallotta
// Amazon affiliate links with locally hosted covers

export interface WhoWouldWinBook {
  title: string;
  animals: [string, string];
  amazonUrl: string;
  coverImage: string;
  asin: string;
}

export const AFFILIATE_TAG = 'fightingbooks-20'; // TODO: Replace with real tag

// Local cover image path
const localCover = (asin: string) => `/covers/${asin}.jpg`;

export const WHO_WOULD_WIN_BOOKS: WhoWouldWinBook[] = [
  // === VERIFIED ASIN MAPPINGS ===
  {
    title: "Lion vs. Tiger",
    animals: ["Lion", "Tiger"],
    asin: "0545175712",
    amazonUrl: `https://www.amazon.com/dp/0545175712?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545175712"),
  },
  {
    title: "Polar Bear vs. Grizzly Bear",
    animals: ["Polar Bear", "Grizzly Bear"],
    asin: "0545175720",
    amazonUrl: `https://www.amazon.com/dp/0545175720?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545175720"),
  },
  {
    title: "Komodo Dragon vs. King Cobra",
    animals: ["Komodo Dragon", "King Cobra"],
    asin: "0545301718",
    amazonUrl: `https://www.amazon.com/dp/0545301718?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545301718"),
  },
  {
    title: "Killer Whale vs. Great White Shark",
    animals: ["Killer Whale", "Great White Shark"],
    asin: "0545160758",
    amazonUrl: `https://www.amazon.com/dp/0545160758?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545160758"),
  },
  {
    title: "Tyrannosaurus Rex vs. Velociraptor",
    animals: ["Tyrannosaurus Rex", "Velociraptor"],
    asin: "0545175739",
    amazonUrl: `https://www.amazon.com/dp/0545175739?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545175739"),
  },
  {
    title: "Tarantula vs. Scorpion",
    animals: ["Tarantula", "Scorpion"],
    asin: "0545301726",
    amazonUrl: `https://www.amazon.com/dp/0545301726?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545301726"),
  },
  {
    title: "Hammerhead vs. Bull Shark",
    animals: ["Hammerhead Shark", "Bull Shark"],
    asin: "0545301734",
    amazonUrl: `https://www.amazon.com/dp/0545301734?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545301734"),
  },
  {
    title: "Rhino vs. Hippo",
    animals: ["Rhino", "Hippo"],
    asin: "0545451914",
    amazonUrl: `https://www.amazon.com/dp/0545451914?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545451914"),
  },
  {
    title: "Wolverine vs. Tasmanian Devil",
    animals: ["Wolverine", "Tasmanian Devil"],
    asin: "0545451906",
    amazonUrl: `https://www.amazon.com/dp/0545451906?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545451906"),
  },
  {
    title: "Alligator vs. Python",
    animals: ["Alligator", "Python"],
    asin: "0545451922",
    amazonUrl: `https://www.amazon.com/dp/0545451922?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545451922"),
  },
  {
    title: "Jaguar vs. Skunk",
    animals: ["Jaguar", "Skunk"],
    asin: "0545681154",
    amazonUrl: `https://www.amazon.com/dp/0545681154?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545681154"),
  },
  {
    title: "Lobster vs. Crab",
    animals: ["Lobster", "Crab"],
    asin: "0545681219",
    amazonUrl: `https://www.amazon.com/dp/0545681219?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545681219"),
  },
  {
    title: "Falcon vs. Hawk",
    animals: ["Falcon", "Hawk"],
    asin: "1338320262",
    amazonUrl: `https://www.amazon.com/dp/1338320262?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("1338320262"),
  },
  {
    title: "Hyena vs. Honey Badger",
    animals: ["Hyena", "Honey Badger"],
    asin: "0545946107",
    amazonUrl: `https://www.amazon.com/dp/0545946107?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545946107"),
  },
  {
    title: "Triceratops vs. Spinosaurus",
    animals: ["Triceratops", "Spinosaurus"],
    asin: "1098252624",
    amazonUrl: `https://www.amazon.com/dp/1098252624?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("1098252624"),
  },
  {
    title: "Whale vs. Giant Squid",
    animals: ["Whale", "Giant Squid"],
    asin: "0545175747",
    amazonUrl: `https://www.amazon.com/dp/0545175747?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545175747"),
  },
  // === RUMBLES ===
  {
    title: "Ultimate Ocean Rumble",
    animals: ["Ocean Animals", "Ocean Animals"],
    asin: "0545681189",
    amazonUrl: `https://www.amazon.com/dp/0545681189?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545681189"),
  },
  {
    title: "Ultimate Jungle Rumble",
    animals: ["Jungle Animals", "Jungle Animals"],
    asin: "0545946085",
    amazonUrl: `https://www.amazon.com/dp/0545946085?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("0545946085"),
  },
  {
    title: "Ultimate Dinosaur Rumble",
    animals: ["Dinosaurs", "Dinosaurs"],
    asin: "1338320254",
    amazonUrl: `https://www.amazon.com/dp/1338320254?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("1338320254"),
  },
  {
    title: "Ultimate Bug Rumble",
    animals: ["Bugs", "Bugs"],
    asin: "1338320270",
    amazonUrl: `https://www.amazon.com/dp/1338320270?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("1338320270"),
  },
  {
    title: "Ultimate Reptile Rumble",
    animals: ["Reptiles", "Reptiles"],
    asin: "1338672169",
    amazonUrl: `https://www.amazon.com/dp/1338672169?tag=${AFFILIATE_TAG}`,
    coverImage: localCover("1338672169"),
  },
];

// Helper to find related books for a given animal matchup
export function findRelatedBooks(animalA: string, animalB: string): WhoWouldWinBook[] {
  const searchTerms = [animalA.toLowerCase(), animalB.toLowerCase()];
  
  return WHO_WOULD_WIN_BOOKS.filter(book => {
    const bookAnimals = book.animals.map(a => a.toLowerCase());
    return searchTerms.some(term => 
      bookAnimals.some(animal => animal.includes(term) || term.includes(animal))
    );
  });
}

// Get all battle books (excluding rumbles)
export function getBattleBooks(): WhoWouldWinBook[] {
  return WHO_WOULD_WIN_BOOKS.filter(book => !book.title.includes('Rumble'));
}

// Get all rumble books
export function getRumbleBooks(): WhoWouldWinBook[] {
  return WHO_WOULD_WIN_BOOKS.filter(book => book.title.includes('Rumble'));
}
