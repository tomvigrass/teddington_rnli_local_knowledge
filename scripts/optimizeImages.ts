/**
 * Image optimization script
 * Converts source JPEGs/PNGs to WebP format, resized to max 1200px width.
 *
 * Usage: npx tsx scripts/optimizeImages.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../local_knowledge_jpg_imgs_anonymised');
const OUTPUT_DIR = path.resolve(__dirname, '../assets/images');
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 75;

// Map source directory names to output directory names
const CATEGORY_MAP: Record<string, string> = {
  'Bridges (11)': 'bridges',
  'Evac Point - Non-Tidal (10)': 'evacuation_points/non_tidal',
  'Evac Point - Tidal (9)': 'evacuation_points/tidal',
  'Islands (15)': 'islands',
  'Locks (3)': 'locks',
  'Pubs, Hotels, Restaurants (25)': 'establishments',
  'Roads, Parks, Rivers, POI (54)': 'poi',
  'Water Clubs, Activity Centres (29)': 'water_clubs',
};

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

async function processImage(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await sharp(inputPath)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outputPath);
}

async function main(): Promise<void> {
  let totalProcessed = 0;
  let totalErrors = 0;

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }

  const categoryDirs = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const categoryDir of categoryDirs) {
    const outputCategory = CATEGORY_MAP[categoryDir.name];
    if (!outputCategory) {
      console.warn(`Unknown category directory: ${categoryDir.name}, skipping`);
      continue;
    }

    const categoryPath = path.join(SOURCE_DIR, categoryDir.name);
    const locationDirs = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter((d) => d.isDirectory());

    for (const locationDir of locationDirs) {
      const locationPath = path.join(categoryPath, locationDir.name);
      const sanitizedLocation = sanitizeFilename(locationDir.name);

      const files = fs.readdirSync(locationPath).filter((f) =>
        /\.(jpe?g|png|heic)$/i.test(f)
      );

      for (let i = 0; i < files.length; i++) {
        const inputFile = path.join(locationPath, files[i]);
        const outputFilename = `${sanitizedLocation}_${i + 1}.webp`;
        const outputPath = path.join(OUTPUT_DIR, outputCategory, outputFilename);

        try {
          await processImage(inputFile, outputPath);
          totalProcessed++;
          if (totalProcessed % 50 === 0) {
            console.log(`Processed ${totalProcessed} images...`);
          }
        } catch (err) {
          console.error(`Error processing ${inputFile}: ${err}`);
          totalErrors++;
        }
      }
    }
  }

  console.log(`\nDone!`);
  console.log(`  Processed: ${totalProcessed}`);
  console.log(`  Errors: ${totalErrors}`);
}

main().catch(console.error);
