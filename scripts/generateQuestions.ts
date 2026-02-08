/**
 * Question Generation Script
 * Generates image identification and text questions for all locations with images.
 *
 * Usage: npx tsx scripts/generateQuestions.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Paths ──────────────────────────────────────────────────────────────────
const SOURCE_DIR = path.resolve(__dirname, '../RNLI Local Knowledge images');
const EXISTING_QUESTIONS_PATH = path.resolve(__dirname, '../src/data/questions.json');
const LOP_TEXT_PATH = path.resolve(__dirname, 'data/lop-extracted.txt');
const OUTPUT_PATH = path.resolve(__dirname, 'output/generated-questions.json');
const REPORT_PATH = path.resolve(__dirname, 'output/generation-report.txt');

// ─── Types ──────────────────────────────────────────────────────────────────
interface Question {
  id: string;
  type: string;
  category: string;
  difficulty: string;
  questionText: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
  referenceSection: string;
  imageRef?: string;
}

interface LocationEntry {
  displayName: string;
  shortName: string;
  sourceDir: string;
  sourceCategoryDir: string;
  imageCategory: string;
  questionCategory: string;
  referenceSection: string;
  imageRefs: string[];
  usedImageRefs: string[];
  unusedImageRefs: string[];
  imageCount: number;
  itemType: string;
}

// ─── sanitizeFilename (matches optimizeImages.ts exactly) ───────────────────
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

// ─── Category Mapping ───────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, {
  imageCategory: string;
  questionCategory: string;
  referenceSection: string;
  itemType: string;
}> = {
  'Bridges (11)': {
    imageCategory: 'bridges',
    questionCategory: 'bridges',
    referenceSection: 'Bridges',
    itemType: 'bridge',
  },
  'Evac Point - Non-Tidal (10)': {
    imageCategory: 'evacuation_points/non_tidal',
    questionCategory: 'evacuationPoints',
    referenceSection: 'Evacuation Points - Non-Tidal',
    itemType: 'non-tidal evacuation point',
  },
  'Evac Point - Tidal (9)': {
    imageCategory: 'evacuation_points/tidal',
    questionCategory: 'evacuationPoints',
    referenceSection: 'Evacuation Points - Tidal',
    itemType: 'tidal evacuation point',
  },
  'Islands (15)': {
    imageCategory: 'islands',
    questionCategory: 'islands',
    referenceSection: 'Islands',
    itemType: 'island',
  },
  'Locks (3)': {
    imageCategory: 'locks',
    questionCategory: '_locks_', // assigned per-location below
    referenceSection: '_locks_',
    itemType: 'lock',
  },
  'Pubs, Hotels, Restaurants (25)': {
    imageCategory: 'establishments',
    questionCategory: 'establishments',
    referenceSection: 'Pubs / Hotels / Bars / Restaurants',
    itemType: 'establishment',
  },
  'Roads, Parks, Rivers, POI (54)': {
    imageCategory: 'poi',
    questionCategory: 'pointsOfInterest',
    referenceSection: 'Roads / Parks / Rivers / Points Of Interest',
    itemType: 'location',
  },
  'Water Clubs, Activity Centres (29)': {
    imageCategory: 'water_clubs',
    questionCategory: 'establishments',
    referenceSection: 'Clubs and Water Activity Centres',
    itemType: 'club or water activity centre',
  },
};

// ─── Lock-specific mappings ─────────────────────────────────────────────────
function getLockMapping(locationDirName: string): {
  questionCategory: string;
  referenceSection: string;
} {
  const lower = locationDirName.toLowerCase();
  if (lower.includes('richmond')) {
    return { questionCategory: 'richmondLock', referenceSection: 'The Locks - Richmond Lock and Weir' };
  }
  if (lower.includes('teddington')) {
    return { questionCategory: 'teddingtonLock', referenceSection: 'The Locks - Teddington Lock' };
  }
  // Molesey - no dedicated category, use pointsOfInterest
  return { questionCategory: 'pointsOfInterest', referenceSection: 'The Locks - Molesey Lock and Weir' };
}

// ─── Display name overrides for very long evacuation point names ────────────
// Use a function to find overrides - normalizes smart quotes for matching
function getDisplayNameOverride(dirName: string): string | null {
  // Normalize the directory name for lookup (replace smart quotes with straight)
  const normalized = dirName.replace(/[\u2018\u2019\u201C\u201D]/g, (c) => {
    if (c === '\u2018' || c === '\u2019') return "'";
    return '"';
  });

  const overrides: Record<string, string> = {
    'Albany Park Canoe:Sailing Ctr, Lower Ham Rd, Kingston': 'Albany Park Canoe & Sailing Centre',
    'By Thames Ditton Island Footbridge (Ye Old Swan, Summer Rd, Thames Ditton)': 'Thames Ditton Island Footbridge Evacuation Point',
    'Ditton Reach Slip, Thames Ditton (off Portsmouth Rd) (Nr Ajax Sea Cadets)': 'Ditton Reach Slip, Thames Ditton',
    'Hampton Court Landing Stage (Colliers Launches)': 'Hampton Court Landing Stage',
    'Kingston Steadfast Sea Cadets, Thames Side, Kingston': 'Kingston Sea Cadets, Thames Side',
    'Town End Pier, High St Kingston (Turks Launches)': 'Town End Pier, Kingston',
    'London Apprentice Slipway, Church St, Isleworth': 'London Apprentice Slipway, Isleworth',
    'Richmond Bridge Slip (upstream:East Twickenham side)': 'Richmond Bridge Slip',
    'Eel Pie Footbridge, Water Lane, Twickenham': 'Eel Pie Footbridge Evacuation Point',
    'White Cross Hotel Slip, Water Lane, Richmond': 'White Cross Hotel Slip',
    'White Swan Beach, Riverside, Twickenham': 'White Swan Beach, Twickenham',
    'Canbury Secret Cafe, Canbury Gdns, Kingston': 'Canbury Secret Cafe, Kingston',
    'The London Apprentice, Church St, Isleworth': 'The London Apprentice, Isleworth',
    'The Town Wharf, Swan St, Isleworth': 'The Town Wharf, Isleworth',
    'BMYC (The River Club) Thames Ditton': 'BMYC, Thames Ditton',
    'Dittons Skiff & Punting Club, Thames Ditton': 'Dittons Skiff & Punting Club',
    'Ajax Sea Scouts, Ditton Reach, Thames Ditton': 'Ajax Sea Scouts, Thames Ditton',
    'Albany Park Canoe & Sailing Ctr, Kingston': 'Albany Park Canoe & Sailing Centre',
    'Kingston Grammar School BC, Thames Ditton': 'Kingston Grammar School BC',
    'Harts Boatyard Boat Rental, Surbiton': 'Harts Boatyard Boat Rental',
    'Royal Canoe Club & Walbrook RC, Trowlock Island': 'Royal Canoe Club & Walbrook RC',
    'Thames Ditton Marina, Thames Ditton': 'Thames Ditton Marina',
    'Thames Motor Yacht Club, East Molesey': 'Thames Motor Yacht Club',
    'Kingston Royals Dragon Boat club': 'Kingston Royals Dragon Boat Club',
    'Molesey Lock & Weir': 'Molesey Lock and Weir',
    'Richmond Lock & Weir': 'Richmond Lock and Weir',
    'Hampton Court Palace:Barge Walk': 'Hampton Court Palace / Barge Walk',
    'Home Park:Barge Walk': 'Home Park / Barge Walk',
    'Albany Reach (Thames Ditton Road)': 'Albany Reach, Thames Ditton',
    'Ranelagh Drive, St Margarets': 'Ranelagh Drive',
    'Thistleworth Marine, Isleworth': 'Thistleworth Marine',
    'Lion Wharf Road, Isleworth': 'Lion Wharf Road',
    'Church Street, Isleworth': 'Church Street, Isleworth',
    'River Crane, Isleworth': 'River Crane',
    'River Mole, Ember': 'River Mole / Ember',
  };

  // Also handle entries with apostrophes/smart quotes dynamically
  const smartQuoteOverrides: Record<string, string> = {
    "East Molesey Wharf (just upstream of Bridge : J Martin & Sons \"boats for hire\")": 'East Molesey Wharf',
    "Steps on Barge Walk, Opposite side of river to Charter Quay, Kingston (150m upstream of bridge)": 'Steps on Barge Walk, Kingston',
    "Ginger Bee's Cafe, Queen's Promenade, Surbiton": "Ginger Bee's Cafe, Surbiton",
    "Small Boat Club, Steven's Eyot": 'Small Boat Club',
    "Duke of Northumberland's River, Isleworth": "Duke of Northumberland's River",
    "Hammerton's Pier, Twickenham": "Hammerton's Pier",
    "Marble Hill House & Park, Twickenham": 'Marble Hill House & Park',
    "Ham House & Ham House Car Park": 'Ham House',
    "The River Rythe, by Ferry Rd, Thames Ditton": 'River Rythe, Thames Ditton',
    "Woody's Kingston": "Woody's, Kingston",
    "Ye Old Swan, Thames Ditton": "Ye Olde Swan, Thames Ditton",
  };

  // Try direct match first
  if (overrides[dirName]) return overrides[dirName];
  if (overrides[normalized]) return overrides[normalized];

  // Try smart-quote-aware matches
  for (const [key, value] of Object.entries(smartQuoteOverrides)) {
    // Normalize both sides
    const normalizedKey = key.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    if (normalized === normalizedKey || dirName === key) return value;
  }

  // Handle the remaining tricky evacuation points with regex matching
  if (normalized.includes('Teddington Lock') && normalized.includes('Duke')) {
    return 'Teddington Lock Evacuation Point';
  }
  if (normalized.includes('Slip between London River Yacht Club')) {
    return 'Slip between LRYC & TSC, Surbiton';
  }
  if (normalized.includes('East Molesey Wharf')) {
    return 'East Molesey Wharf';
  }

  return null;
}

// ─── Question text templates ────────────────────────────────────────────────
const QUESTION_TEMPLATES: Record<string, string[]> = {
  bridge: [
    'Identify this bridge.',
    'Name the bridge shown in this photograph.',
    'Which bridge is pictured here?',
    'What bridge can be seen in this image?',
    'Identify the bridge shown here.',
    'Which bridge is shown in this photograph?',
    'Name the bridge pictured in this image.',
    'What bridge is shown here?',
  ],
  island: [
    'Name the island shown in this photograph.',
    'Identify this island.',
    'Which island is pictured here?',
    'What island can be seen in this image?',
    'Identify the island shown here.',
    'Which island is shown in this photograph?',
    'Name the island pictured in this image.',
    'What island is shown here?',
  ],
  establishment: [
    'Name this riverside establishment.',
    'Identify the establishment shown in this photograph.',
    'Which establishment is pictured here?',
    'What establishment can be seen in this image?',
    'Identify this establishment.',
    'Which establishment is shown in this photograph?',
    'Name the establishment pictured in this image.',
    'What establishment is shown here?',
  ],
  'non-tidal evacuation point': [
    'Identify this non-tidal evacuation point.',
    'Name the evacuation point shown in this photograph.',
    'Which non-tidal evacuation point is pictured here?',
    'What evacuation point can be seen in this image?',
    'Identify the evacuation point shown here.',
    'Which evacuation point is shown in this photograph?',
    'Name the non-tidal evacuation point pictured in this image.',
    'What non-tidal evacuation point is shown here?',
  ],
  'tidal evacuation point': [
    'Identify this tidal evacuation point.',
    'Name the evacuation point shown in this photograph.',
    'Which tidal evacuation point is pictured here?',
    'What evacuation point can be seen in this image?',
    'Identify the evacuation point shown here.',
    'Which evacuation point is shown in this photograph?',
    'Name the tidal evacuation point pictured in this image.',
    'What tidal evacuation point is shown here?',
  ],
  lock: [
    'Identify this lock.',
    'Name the lock shown in this photograph.',
    'Which lock is pictured here?',
    'What lock can be seen in this image?',
    'Identify the lock shown here.',
    'Which lock is shown in this photograph?',
    'Name the lock pictured in this image.',
    'What lock is shown here?',
  ],
  location: [
    'Identify this location.',
    'Name the location shown in this photograph.',
    'Which location is pictured here?',
    'What location can be seen in this image?',
    'Identify the location shown here.',
    'Which location is shown in this photograph?',
    'Name the location pictured in this image.',
    'What location is shown here?',
  ],
  'club or water activity centre': [
    'Identify this club or water activity centre.',
    'Name the club shown in this photograph.',
    'Which water activity centre is pictured here?',
    'What club can be seen in this image?',
    'Identify the club or centre shown here.',
    'Which club is shown in this photograph?',
    'Name the water activity centre pictured in this image.',
    'What water activity centre is shown here?',
  ],
};

// ─── Shuffle utility ────────────────────────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ─── Build Location Registry ────────────────────────────────────────────────
function buildLocationRegistry(existingQuestions: Question[]): LocationEntry[] {
  const usedImageRefs = new Set(
    existingQuestions
      .filter((q) => q.imageRef)
      .map((q) => q.imageRef!)
  );

  const locations: LocationEntry[] = [];

  const categoryDirs = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const categoryDir of categoryDirs) {
    const mapping = CATEGORY_MAP[categoryDir.name];
    if (!mapping) {
      console.warn(`Unknown category directory: ${categoryDir.name}, skipping`);
      continue;
    }

    const categoryPath = path.join(SOURCE_DIR, categoryDir.name);
    const locationDirs = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const locationDir of locationDirs) {
      const locationPath = path.join(categoryPath, locationDir.name);
      const files = fs.readdirSync(locationPath)
        .filter((f) => /\.(jpe?g|png|heic)$/i.test(f))
        .sort();

      const sanitizedLocation = sanitizeFilename(locationDir.name);
      const imageRefs = files.map((_, i) =>
        `${mapping.imageCategory}/${sanitizedLocation}_${i + 1}`
      );

      const used = imageRefs.filter((ref) => usedImageRefs.has(ref));
      const unused = imageRefs.filter((ref) => !usedImageRefs.has(ref));

      // Handle lock-specific category/referenceSection
      let questionCategory = mapping.questionCategory;
      let referenceSection = mapping.referenceSection;
      if (mapping.questionCategory === '_locks_') {
        const lockMapping = getLockMapping(locationDir.name);
        questionCategory = lockMapping.questionCategory;
        referenceSection = lockMapping.referenceSection;
      }

      const displayName = getDisplayNameOverride(locationDir.name) || locationDir.name;

      // Build a short name for use as correct answer (strip redundant location qualifiers)
      const shortName = displayName;

      locations.push({
        displayName,
        shortName,
        sourceDir: locationDir.name,
        sourceCategoryDir: categoryDir.name,
        imageCategory: mapping.imageCategory,
        questionCategory,
        referenceSection,
        imageRefs,
        usedImageRefs: used,
        unusedImageRefs: unused,
        imageCount: files.length,
        itemType: mapping.itemType,
      });
    }
  }

  return locations;
}

// ─── LOP Content Search ────────────────────────────────────────────────────
function loadLopText(): string {
  if (!fs.existsSync(LOP_TEXT_PATH)) {
    console.warn('LOP text file not found, explanations will use fallback text');
    return '';
  }
  return fs.readFileSync(LOP_TEXT_PATH, 'utf-8');
}

function searchLopForLocation(lopText: string, displayName: string): string | null {
  if (!lopText) return null;

  // Try searching for the display name or parts of it
  const searchTerms = [
    displayName,
    // Try just the first part before any comma
    displayName.split(',')[0].trim(),
  ];

  for (const term of searchTerms) {
    if (term.length < 4) continue;
    // Escape regex special chars
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`[^\n]*${escaped}[^\n]*`, 'gi');
    const matches = lopText.match(regex);
    if (matches) {
      // Filter out lines that are just the name itself, header/footer lines, or very short
      const useful = matches.filter((line) => {
        const cleaned = line.trim();
        // Skip if the line is essentially just the location name (no additional context)
        if (cleaned.length < term.length + 10) return false;
        // Skip header/footer lines
        if (cleaned.startsWith('Check Horizon') || cleaned.startsWith('RNLI Classification')) return false;
        if (cleaned.startsWith('LOP Teddington')) return false;
        if (/^Page \d+$/.test(cleaned)) return false;
        return true;
      });
      if (useful.length > 0) {
        return useful[0].trim();
      }
    }
  }

  return null;
}

// ─── Explanation Generator ──────────────────────────────────────────────────
function generateExplanation(
  location: LocationEntry,
  lopText: string
): string {
  const lopContent = searchLopForLocation(lopText, location.displayName);

  // Build a contextual explanation
  const parts: string[] = [];

  if (lopContent && lopContent.length > 20) {
    // Clean up the LOP content
    const cleaned = lopContent
      .replace(/^Check Horizon.*$/m, '')
      .replace(/^RNLI Classification.*$/m, '')
      .replace(/^LOP Teddington.*$/m, '')
      .replace(/^Page \d+$/m, '')
      .trim();
    if (cleaned.length > 20) {
      parts.push(cleaned);
    }
  }

  // Build a generic explanation if LOP didn't provide much
  if (parts.length === 0) {
    const articleMap: Record<string, string> = {
      'bridge': 'a bridge',
      'island': 'an island',
      'establishment': 'an establishment',
      'non-tidal evacuation point': 'a non-tidal evacuation point',
      'tidal evacuation point': 'a tidal evacuation point',
      'lock': 'a lock',
      'location': 'a location',
      'club or water activity centre': 'a club or water activity centre',
    };
    const article = articleMap[location.itemType] || `a ${location.itemType}`;
    parts.push(
      `${location.displayName} is ${article} in the Teddington RNLI area of operations.`
    );
  }

  // Add reference section context
  parts.push(`Listed under "${location.referenceSection}" in the Local Operating Procedure.`);

  return parts.join(' ');
}

// ─── Distractor Generator ───────────────────────────────────────────────────
function getDistractors(
  location: LocationEntry,
  allLocations: LocationEntry[],
  count: number = 3
): string[] {
  // Find other locations in the same category
  let pool = allLocations.filter(
    (loc) =>
      loc.questionCategory === location.questionCategory &&
      loc.shortName !== location.shortName
  );

  // If not enough in same category, expand to adjacent categories
  if (pool.length < count) {
    const adjacentCategories: Record<string, string[]> = {
      bridges: ['pointsOfInterest'],
      islands: ['pointsOfInterest'],
      evacuationPoints: ['pointsOfInterest', 'establishments'],
      establishments: ['pointsOfInterest'],
      pointsOfInterest: ['establishments', 'islands'],
      richmondLock: ['teddingtonLock', 'pointsOfInterest'],
      teddingtonLock: ['richmondLock', 'pointsOfInterest'],
    };
    const adjacent = adjacentCategories[location.questionCategory] || ['pointsOfInterest'];
    for (const cat of adjacent) {
      pool = pool.concat(
        allLocations.filter(
          (loc) =>
            loc.questionCategory === cat &&
            loc.shortName !== location.shortName &&
            !pool.some((p) => p.shortName === loc.shortName)
        )
      );
      if (pool.length >= count) break;
    }
  }

  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, count).map((loc) => loc.shortName);
}

// ─── Difficulty Assignment ──────────────────────────────────────────────────
function getDifficulty(imageIndex: number): string {
  if (imageIndex === 1) return 'easy';
  if (imageIndex <= 5) return 'medium';
  return 'hard';
}

// ─── Question Generator ─────────────────────────────────────────────────────
function generateImageQuestions(
  locations: LocationEntry[],
  lopText: string,
  startId: number
): Question[] {
  const questions: Question[] = [];
  let currentId = startId;
  let templateCounters: Record<string, number> = {};

  for (const location of locations) {
    for (const imageRef of location.unusedImageRefs) {
      // Extract image number from ref (e.g., "bridges/kingston_bridge_2" -> 2)
      const match = imageRef.match(/_(\d+)$/);
      const imageIndex = match ? parseInt(match[1], 10) : 1;

      // Round-robin template selection
      const templateKey = location.itemType;
      const templates = QUESTION_TEMPLATES[templateKey] || QUESTION_TEMPLATES['location'];
      const counter = templateCounters[templateKey] || 0;
      templateCounters[templateKey] = counter + 1;
      const questionText = templates[counter % templates.length];

      // Generate distractors
      const distractors = getDistractors(location, locations, 3);

      // If we couldn't get 3 distractors, skip this question
      if (distractors.length < 3) {
        console.warn(`Not enough distractors for ${location.displayName}, only got ${distractors.length}`);
        continue;
      }

      // Build options array with correct answer + 3 distractors, shuffled
      const options = shuffleArray([location.shortName, ...distractors]);

      const difficulty = getDifficulty(imageIndex);
      const explanation = generateExplanation(location, lopText);

      const id = `q_${String(currentId).padStart(3, '0')}`;
      currentId++;

      questions.push({
        id,
        type: 'imageIdentification',
        category: location.questionCategory,
        difficulty,
        questionText,
        correctAnswer: location.shortName,
        options,
        explanation,
        referenceSection: location.referenceSection,
        imageRef,
      });
    }
  }

  return questions;
}

// ─── Text Question Generator ────────────────────────────────────────────────
function generateTextQuestions(
  locations: LocationEntry[],
  lopText: string,
  startId: number
): Question[] {
  const questions: Question[] = [];
  let currentId = startId;

  // Group unique locations (by displayName) to avoid duplicates
  const seen = new Set<string>();

  for (const location of locations) {
    if (seen.has(location.shortName)) continue;
    seen.add(location.shortName);

    // Skip categories that already have rich text questions (PLA warnings, EA warnings, hazards)
    // These don't have images and already have dedicated text questions
    if (['plaWarnings', 'environmentAgencyWarnings', 'hazards'].includes(location.questionCategory)) {
      continue;
    }

    // Generate an "In which area is X located?" question for each location
    const areaName = extractArea(location);
    if (areaName) {
      const distractorAreas = getAreaDistractors(areaName);
      if (distractorAreas.length >= 3) {
        const options = shuffleArray([areaName, ...distractorAreas.slice(0, 3)]);
        const id = `q_${String(currentId).padStart(3, '0')}`;
        currentId++;

        const explanation = generateExplanation(location, lopText);

        questions.push({
          id,
          type: 'textMultipleChoice',
          category: location.questionCategory,
          difficulty: 'medium',
          questionText: `In which area is ${location.shortName} located?`,
          correctAnswer: areaName,
          options,
          explanation,
          referenceSection: location.referenceSection,
        });
      }
    }
  }

  return questions;
}

// ─── Area extraction helpers ────────────────────────────────────────────────
function extractArea(location: LocationEntry): string | null {
  const name = location.sourceDir;

  // Try to extract area from location name patterns like "X, Kingston" or "X, Twickenham"
  // Order matters: check longer/more specific names first to avoid false matches
  // (e.g., "Hampton Court" before "Ham", "East Molesey" before "Molesey")
  const areas = [
    'Hampton Court', 'East Molesey', 'Thames Ditton', 'St Margarets',
    'Kingston', 'Richmond', 'Twickenham', 'Teddington', 'Surbiton',
    'Isleworth', 'Petersham', 'Ham',
  ];

  for (const area of areas) {
    // Use word boundary-like matching to avoid "Ham" matching "Hampton"
    // Check for area appearing after a comma/space separator or at the end
    const patterns = [
      new RegExp(`,\\s*${area}\\b`, 'i'),  // ", Kingston" pattern
      new RegExp(`\\b${area}$`, 'i'),       // ends with area name
      new RegExp(`\\b${area},`, 'i'),       // "Kingston, ..." pattern
      new RegExp(`\\b${area}\\s`, 'i'),     // "Kingston " pattern
    ];

    // Special case: if the area is in the name as a standalone word
    if (area === 'Ham') {
      // Only match "Ham" as a standalone word, not as part of "Hampton", "Hampshire", etc.
      if (/\bHam\b/i.test(name) && !/Hampton/i.test(name)) return area;
      continue;
    }

    for (const pattern of patterns) {
      if (pattern.test(name)) return area;
    }
  }

  return null;
}

function getAreaDistractors(correctArea: string): string[] {
  const allAreas = [
    'Kingston', 'Richmond', 'Twickenham', 'Teddington', 'Surbiton',
    'Thames Ditton', 'Isleworth', 'Ham', 'Petersham', 'East Molesey',
  ];
  return shuffleArray(allAreas.filter((a) => a !== correctArea)).slice(0, 3);
}

// ─── Validator ──────────────────────────────────────────────────────────────
function validateQuestions(
  questions: Question[],
  validImageRefs: Set<string>
): { valid: Question[]; errors: string[] } {
  const errors: string[] = [];
  const valid: Question[] = [];
  const ids = new Set<string>();

  const validCategories = new Set([
    'evacuationPoints', 'islands', 'bridges', 'establishments',
    'pointsOfInterest', 'richmondLock', 'teddingtonLock',
    'plaWarnings', 'environmentAgencyWarnings', 'hazards',
  ]);
  const validTypes = new Set([
    'textMultipleChoice', 'imageIdentification', 'operational', 'safety', 'sequence',
  ]);
  const validDifficulties = new Set(['easy', 'medium', 'hard']);

  for (const q of questions) {
    const qErrors: string[] = [];

    // Required fields
    if (!q.id) qErrors.push('missing id');
    if (!q.type) qErrors.push('missing type');
    if (!q.category) qErrors.push('missing category');
    if (!q.difficulty) qErrors.push('missing difficulty');
    if (!q.questionText) qErrors.push('missing questionText');
    if (!q.correctAnswer) qErrors.push('missing correctAnswer');
    if (!q.explanation) qErrors.push('missing explanation');
    if (!q.referenceSection) qErrors.push('missing referenceSection');

    // Options validation
    if (!q.options || q.options.length !== 4) {
      qErrors.push(`expected 4 options, got ${q.options?.length || 0}`);
    } else if (!q.options.includes(q.correctAnswer)) {
      qErrors.push('correctAnswer not in options');
    }

    // Check for duplicate options
    if (q.options && new Set(q.options).size !== q.options.length) {
      qErrors.push('duplicate options detected');
    }

    // Enum validation
    if (!validCategories.has(q.category)) qErrors.push(`invalid category: ${q.category}`);
    if (!validTypes.has(q.type)) qErrors.push(`invalid type: ${q.type}`);
    if (!validDifficulties.has(q.difficulty)) qErrors.push(`invalid difficulty: ${q.difficulty}`);

    // Unique ID
    if (ids.has(q.id)) qErrors.push(`duplicate id: ${q.id}`);
    ids.add(q.id);

    // ImageRef validation for image questions
    if (q.type === 'imageIdentification') {
      if (!q.imageRef) {
        qErrors.push('imageIdentification question missing imageRef');
      } else if (!validImageRefs.has(q.imageRef)) {
        qErrors.push(`imageRef not found in ImageService: ${q.imageRef}`);
      }
    }

    if (qErrors.length > 0) {
      errors.push(`${q.id}: ${qErrors.join(', ')}`);
    } else {
      valid.push(q);
    }
  }

  return { valid, errors };
}

// ─── Get valid image refs from processed assets ─────────────────────────────
function getValidImageRefs(): Set<string> {
  const imagesDir = path.resolve(__dirname, '../assets/images');
  const refs = new Set<string>();

  function walk(dir: string, baseDir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, baseDir);
      } else if (entry.name.endsWith('.webp')) {
        const relative = path.relative(baseDir, fullPath).replace(/\.webp$/, '');
        refs.add(relative);
      }
    }
  }

  walk(imagesDir, imagesDir);
  return refs;
}

// ─── Main ───────────────────────────────────────────────────────────────────
function main(): void {
  console.log('=== Question Generation Script ===\n');

  // Load existing questions
  const existingData = JSON.parse(fs.readFileSync(EXISTING_QUESTIONS_PATH, 'utf-8'));
  const existingQuestions: Question[] = existingData.questions;
  console.log(`Loaded ${existingQuestions.length} existing questions`);

  // Find the max existing ID number
  const maxExistingId = existingQuestions.reduce((max, q) => {
    const num = parseInt(q.id.replace('q_', ''), 10);
    return num > max ? num : max;
  }, 0);
  console.log(`Max existing question ID: q_${String(maxExistingId).padStart(3, '0')}`);

  // Load LOP text
  const lopText = loadLopText();
  console.log(`LOP text loaded: ${lopText.length} characters`);

  // Get valid image refs
  const validImageRefs = getValidImageRefs();
  console.log(`Valid image refs in assets: ${validImageRefs.size}`);

  // Build location registry
  const locations = buildLocationRegistry(existingQuestions);
  console.log(`Found ${locations.length} locations across all categories`);

  const totalUnused = locations.reduce((sum, loc) => sum + loc.unusedImageRefs.length, 0);
  console.log(`Unused images: ${totalUnused}`);

  // Generate image identification questions
  const imageQuestions = generateImageQuestions(locations, lopText, maxExistingId + 1);
  console.log(`Generated ${imageQuestions.length} image identification questions`);

  // Generate text questions
  const textQuestions = generateTextQuestions(
    locations,
    lopText,
    maxExistingId + 1 + imageQuestions.length
  );
  console.log(`Generated ${textQuestions.length} text questions`);

  const allNewQuestions = [...imageQuestions, ...textQuestions];

  // Validate
  const { valid, errors } = validateQuestions(allNewQuestions, validImageRefs);
  console.log(`\nValidation: ${valid.length} valid, ${errors.length} errors`);
  if (errors.length > 0) {
    console.log('\nValidation errors:');
    for (const err of errors.slice(0, 20)) {
      console.log(`  - ${err}`);
    }
    if (errors.length > 20) {
      console.log(`  ... and ${errors.length - 20} more`);
    }
  }

  // Write output
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify({ questions: valid }, null, 2),
    'utf-8'
  );
  console.log(`\nWrote ${valid.length} questions to ${OUTPUT_PATH}`);

  // Generate report
  const report = generateReport(locations, existingQuestions, valid, errors);
  fs.writeFileSync(REPORT_PATH, report, 'utf-8');
  console.log(`Wrote report to ${REPORT_PATH}`);

  // Category distribution
  console.log('\n=== Category Distribution (new questions) ===');
  const catCounts: Record<string, number> = {};
  for (const q of valid) {
    catCounts[q.category] = (catCounts[q.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(catCounts).sort()) {
    console.log(`  ${cat}: ${count}`);
  }

  console.log(`\n=== Total questions after merge: ${existingQuestions.length + valid.length} ===`);
}

// ─── Report Generator ───────────────────────────────────────────────────────
function generateReport(
  locations: LocationEntry[],
  existing: Question[],
  generated: Question[],
  errors: string[]
): string {
  const lines: string[] = [];
  lines.push('=== Question Generation Report ===');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`Existing questions: ${existing.length}`);
  lines.push(`New questions generated: ${generated.length}`);
  lines.push(`Validation errors: ${errors.length}`);
  lines.push(`Total after merge: ${existing.length + generated.length}`);
  lines.push('');

  // Per-category breakdown
  lines.push('=== Per-Category Breakdown ===');
  const categories = new Map<string, { existing: number; image: number; text: number }>();

  for (const q of existing) {
    const entry = categories.get(q.category) || { existing: 0, image: 0, text: 0 };
    entry.existing++;
    categories.set(q.category, entry);
  }
  for (const q of generated) {
    const entry = categories.get(q.category) || { existing: 0, image: 0, text: 0 };
    if (q.type === 'imageIdentification') entry.image++;
    else entry.text++;
    categories.set(q.category, entry);
  }

  for (const [cat, counts] of Array.from(categories.entries()).sort()) {
    const total = counts.existing + counts.image + counts.text;
    lines.push(`${cat}: ${total} total (${counts.existing} existing, ${counts.image} new image, ${counts.text} new text)`);
  }

  lines.push('');

  // Per-location summary
  lines.push('=== Per-Location Coverage ===');
  for (const loc of locations) {
    lines.push(
      `${loc.displayName}: ${loc.imageCount} images total, ` +
      `${loc.usedImageRefs.length} already used, ${loc.unusedImageRefs.length} new questions`
    );
  }

  lines.push('');

  // Errors
  if (errors.length > 0) {
    lines.push('=== Validation Errors ===');
    for (const err of errors) {
      lines.push(`  ${err}`);
    }
  }

  return lines.join('\n');
}

main();
