/**
 * Optimize recipe images for web
 * Reduces file size while maintaining quality
 * Uses Sharp for fast, high-quality image processing
 */
import sharp from 'sharp';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGE_DIR = './Database/downloaded_images';
const OUTPUT_DIR = './Database/optimized_images';
const MAX_WIDTH = 1200;
const QUALITY = 85;

async function optimizeImage(inputPath, outputPath) {
  try {
    const stats = await stat(inputPath);
    const originalSize = stats.size;

    await sharp(inputPath)
      .resize(MAX_WIDTH, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .jpeg({ quality: QUALITY, progressive: true })
      .toFile(outputPath);

    const newStats = await stat(outputPath);
    const newSize = newStats.size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    return {
      success: true,
      originalSize,
      newSize,
      savings: `${savings}%`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log('🖼️  Optimizing recipe images...\n');

  // Ensure output directory exists
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
  }

  const files = await readdir(IMAGE_DIR);
  const imageFiles = files.filter((f) => /\.(jpg|jpeg|png)$/i.test(f));

  console.log(`Found ${imageFiles.length} images to optimize\n`);

  let processed = 0;
  let success = 0;
  let failed = 0;
  let totalOriginalSize = 0;
  let totalNewSize = 0;

  for (const file of imageFiles) {
    const inputPath = join(IMAGE_DIR, file);
    const outputPath = join(OUTPUT_DIR, file.replace(/\.(png|jpeg)$/i, '.jpg'));

    const result = await optimizeImage(inputPath, outputPath);
    processed++;

    if (result.success) {
      success++;
      totalOriginalSize += result.originalSize;
      totalNewSize += result.newSize;
      console.log(
        `✅ ${file}: ${(result.originalSize / 1024).toFixed(1)}KB → ${(result.newSize / 1024).toFixed(1)}KB (${result.savings} saved)`
      );
    } else {
      failed++;
      console.log(`❌ ${file}: ${result.error}`);
    }

    if (processed % 50 === 0) {
      console.log(`\n📊 Progress: ${processed}/${imageFiles.length}\n`);
    }
  }

  const totalSavings = ((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Optimization Complete!');
  console.log(`   Processed: ${processed}`);
  console.log(`   Success: ${success}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB → ${(totalNewSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Total savings: ${totalSavings}%`);
  console.log(`\n💾 Optimized images saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);

