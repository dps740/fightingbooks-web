// Who Would Win? Book Series by Jerry Pallotta
// Amazon affiliate links - replace AFFILIATE_TAG with your Amazon Associates tag

export interface WhoWouldWinBook {
  title: string;
  animals: [string, string];
  amazonUrl: string;
  coverImage: string;
  asin: string;
}

export const AFFILIATE_TAG = 'fightingbooks-20'; // TODO: Replace with real tag

export const WHO_WOULD_WIN_BOOKS: WhoWouldWinBook[] = [
  {
    title: "Lion vs. Tiger",
    animals: ["Lion", "Tiger"],
    asin: "0545175712",
    amazonUrl: `https://www.amazon.com/dp/0545175712?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61NsHWsxDQL._SY466_.jpg",
  },
  {
    title: "Polar Bear vs. Grizzly Bear",
    animals: ["Polar Bear", "Grizzly Bear"],
    asin: "0545175720",
    amazonUrl: `https://www.amazon.com/dp/0545175720?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61KPQqJZURL._SY466_.jpg",
  },
  {
    title: "Komodo Dragon vs. King Cobra",
    animals: ["Komodo Dragon", "King Cobra"],
    asin: "0545301718",
    amazonUrl: `https://www.amazon.com/dp/0545301718?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61mKZ3pXURL._SY466_.jpg",
  },
  {
    title: "Killer Whale vs. Great White Shark",
    animals: ["Killer Whale", "Great White Shark"],
    asin: "0545160758",
    amazonUrl: `https://www.amazon.com/dp/0545160758?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61r3gMJAL4L._SY466_.jpg",
  },
  {
    title: "Tyrannosaurus Rex vs. Velociraptor",
    animals: ["Tyrannosaurus Rex", "Velociraptor"],
    asin: "0545175739",
    amazonUrl: `https://www.amazon.com/dp/0545175739?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61YYSB2HwbL._SY466_.jpg",
  },
  {
    title: "Whale vs. Giant Squid",
    animals: ["Whale", "Giant Squid"],
    asin: "0545175747",
    amazonUrl: `https://www.amazon.com/dp/0545175747?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61EKXeJZURL._SY466_.jpg",
  },
  {
    title: "Tarantula vs. Scorpion",
    animals: ["Tarantula", "Scorpion"],
    asin: "0545301726",
    amazonUrl: `https://www.amazon.com/dp/0545301726?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61gXJB3wURL._SY466_.jpg",
  },
  {
    title: "Hammerhead vs. Bull Shark",
    animals: ["Hammerhead Shark", "Bull Shark"],
    asin: "0545301734",
    amazonUrl: `https://www.amazon.com/dp/0545301734?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61r9mXJAL4L._SY466_.jpg",
  },
  {
    title: "Rhino vs. Hippo",
    animals: ["Rhino", "Hippo"],
    asin: "0545451914",
    amazonUrl: `https://www.amazon.com/dp/0545451914?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61mPLXJAL4L._SY466_.jpg",
  },
  {
    title: "Wolverine vs. Tasmanian Devil",
    animals: ["Wolverine", "Tasmanian Devil"],
    asin: "0545451906",
    amazonUrl: `https://www.amazon.com/dp/0545451906?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61nHWsxDQL._SY466_.jpg",
  },
  {
    title: "Hornet vs. Wasp",
    animals: ["Hornet", "Wasp"],
    asin: "0545451922",
    amazonUrl: `https://www.amazon.com/dp/0545451922?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61KPQqJZURL._SY466_.jpg",
  },
  {
    title: "Alligator vs. Python",
    animals: ["Alligator", "Python"],
    asin: "0545451930",
    amazonUrl: `https://www.amazon.com/dp/0545451930?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61r3gMJAL4L._SY466_.jpg",
  },
  {
    title: "Lobster vs. Crab",
    animals: ["Lobster", "Crab"],
    asin: "0545681138",
    amazonUrl: `https://www.amazon.com/dp/0545681138?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61YYSB2HwbL._SY466_.jpg",
  },
  {
    title: "Falcon vs. Hawk",
    animals: ["Falcon", "Hawk"],
    asin: "0545681146",
    amazonUrl: `https://www.amazon.com/dp/0545681146?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61EKXeJZURL._SY466_.jpg",
  },
  {
    title: "Jaguar vs. Skunk",
    animals: ["Jaguar", "Skunk"],
    asin: "0545681154",
    amazonUrl: `https://www.amazon.com/dp/0545681154?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61gXJB3wURL._SY466_.jpg",
  },
  {
    title: "Hyena vs. Honey Badger",
    animals: ["Hyena", "Honey Badger"],
    asin: "0545681162",
    amazonUrl: `https://www.amazon.com/dp/0545681162?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61r9mXJAL4L._SY466_.jpg",
  },
  {
    title: "Triceratops vs. Spinosaurus",
    animals: ["Triceratops", "Spinosaurus"],
    asin: "0545681170",
    amazonUrl: `https://www.amazon.com/dp/0545681170?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61mPLXJAL4L._SY466_.jpg",
  },
  {
    title: "Green Ants vs. Army Ants",
    animals: ["Green Ants", "Army Ants"],
    asin: "1338320262",
    amazonUrl: `https://www.amazon.com/dp/1338320262?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61nHWsxDQL._SY466_.jpg",
  },
  {
    title: "Ultimate Ocean Rumble",
    animals: ["Ocean Animals", "Ocean Animals"],
    asin: "0545681189",
    amazonUrl: `https://www.amazon.com/dp/0545681189?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61KPQqJZURL._SY466_.jpg",
  },
  {
    title: "Ultimate Jungle Rumble",
    animals: ["Jungle Animals", "Jungle Animals"],
    asin: "0545946085",
    amazonUrl: `https://www.amazon.com/dp/0545946085?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61r3gMJAL4L._SY466_.jpg",
  },
  {
    title: "Ultimate Dinosaur Rumble",
    animals: ["Dinosaurs", "Dinosaurs"],
    asin: "1338153951",
    amazonUrl: `https://www.amazon.com/dp/1338153951?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61YYSB2HwbL._SY466_.jpg",
  },
  {
    title: "Ultimate Shark Rumble",
    animals: ["Sharks", "Sharks"],
    asin: "1338320254",
    amazonUrl: `https://www.amazon.com/dp/1338320254?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61EKXeJZURL._SY466_.jpg",
  },
  {
    title: "Ultimate Bug Rumble",
    animals: ["Bugs", "Bugs"],
    asin: "1338320270",
    amazonUrl: `https://www.amazon.com/dp/1338320270?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61gXJB3wURL._SY466_.jpg",
  },
  {
    title: "Ultimate Reptile Rumble",
    animals: ["Reptiles", "Reptiles"],
    asin: "1338672126",
    amazonUrl: `https://www.amazon.com/dp/1338672126?tag=${AFFILIATE_TAG}`,
    coverImage: "https://m.media-amazon.com/images/I/61r9mXJAL4L._SY466_.jpg",
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
