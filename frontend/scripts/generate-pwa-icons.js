#!/usr/bin/env node

/**
 * PWA Icon Generator - Node.js version
 * Generates all required PWA icon sizes from a source image
 * Uses Sharp for image processing (install with: npm install sharp)
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
};

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  log.error('Sharp is not installed');
  log.info('Install it with: npm install sharp --save-dev');
  log.info('Or use the shell script: ./generate-pwa-icons.sh (requires ImageMagick)');
  process.exit(1);
}

// Get source image from command line
const sourceImage = process.argv[2];

if (!sourceImage) {
  log.error('No source image provided');
  console.log('Usage: node generate-pwa-icons.js <source-image.png>');
  console.log('Example: node generate-pwa-icons.js ../public/nyambika_dark_icon.png');
  process.exit(1);
}

// Resolve paths
const sourcePath = path.resolve(sourceImage);
const outputDir = path.resolve(__dirname, '../public');

// Check if source image exists
if (!fs.existsSync(sourcePath)) {
  log.error(`Source image not found: ${sourcePath}`);
  process.exit(1);
}

log.info('Starting PWA icon generation...');
log.info(`Source image: ${sourcePath}`);
log.info(`Output directory: ${outputDir}`);

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Define icon sizes
const iconSizes = [16, 32, 48, 64, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512, 1024];
const maskableSizes = [192, 512];
const appleTouchSizes = [120, 152, 167, 180];

// Generate standard icons
async function generateIcons() {
  let successCount = 0;
  let errorCount = 0;

  log.info(`Generating ${iconSizes.length} standard icon sizes...`);

  for (const size of iconSizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    try {
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath);
      log.success(`Generated ${size}x${size} icon`);
      successCount++;
    } catch (error) {
      log.error(`Failed to generate ${size}x${size} icon: ${error.message}`);
      errorCount++;
    }
  }

  // Generate maskable icons (with safe zone padding)
  log.info('Generating maskable icons...');

  for (const size of maskableSizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}-maskable.png`);
    // Add 20% padding for safe zone
    const safeSize = Math.floor(size * 0.8);
    try {
      await sharp(sourcePath)
        .resize(safeSize, safeSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .extend({
          top: Math.floor((size - safeSize) / 2),
          bottom: Math.ceil((size - safeSize) / 2),
          left: Math.floor((size - safeSize) / 2),
          right: Math.ceil((size - safeSize) / 2),
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath);
      log.success(`Generated ${size}x${size} maskable icon`);
      successCount++;
    } catch (error) {
      log.error(`Failed to generate ${size}x${size} maskable icon: ${error.message}`);
      errorCount++;
    }
  }

  // Generate Apple Touch icons
  log.info('Generating Apple Touch Icons...');

  for (const size of appleTouchSizes) {
    const outputPath = path.join(outputDir, `apple-touch-icon-${size}x${size}.png`);
    try {
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath);
      log.success(`Generated Apple Touch Icon ${size}x${size}`);
      successCount++;
    } catch (error) {
      log.error(`Failed to generate Apple Touch Icon ${size}x${size}: ${error.message}`);
      errorCount++;
    }
  }

  // Create default apple-touch-icon.png (180x180)
  const defaultAppleIcon = path.join(outputDir, 'apple-touch-icon.png');
  const sourceAppleIcon = path.join(outputDir, 'apple-touch-icon-180x180.png');
  
  if (fs.existsSync(sourceAppleIcon)) {
    fs.copyFileSync(sourceAppleIcon, defaultAppleIcon);
    log.success('Created default apple-touch-icon.png');
  }

  // Generate favicon.ico (16x16, 32x32, 48x48)
  log.info('Generating favicon.ico...');
  
  try {
    // Sharp doesn't support multi-resolution ICO, so we'll create a simple 32x32 favicon
    const faviconPath = path.join(outputDir, 'favicon.ico');
    await sharp(sourcePath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(faviconPath);
    log.success('Generated favicon.ico (32x32)');
    log.warning('Note: Generated as PNG. For proper ICO format, use ImageMagick script');
    successCount++;
  } catch (error) {
    log.error(`Failed to generate favicon: ${error.message}`);
    errorCount++;
  }

  // Generate browserconfig.xml
  log.info('Generating browserconfig.xml...');

  const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square70x70logo src="/icon-128x128.png"/>
            <square150x150logo src="/icon-256x256.png"/>
            <square310x310logo src="/icon-512x512.png"/>
            <TileColor>#6366f1</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;

  const browserConfigPath = path.join(outputDir, 'browserconfig.xml');
  try {
    fs.writeFileSync(browserConfigPath, browserConfig);
    log.success('Generated browserconfig.xml');
    successCount++;
  } catch (error) {
    log.error(`Failed to generate browserconfig.xml: ${error.message}`);
    errorCount++;
  }

  // Print summary
  console.log('');
  log.success('=========================================');
  log.success('Icon generation complete! 🎉');
  log.success('=========================================');
  console.log('');
  log.info(`Generated files in ${outputDir}:`);
  console.log(`  - ${iconSizes.length} standard icons`);
  console.log(`  - ${maskableSizes.length} maskable icons`);
  console.log(`  - ${appleTouchSizes.length} Apple Touch icons`);
  console.log(`  - 1 favicon.ico`);
  console.log(`  - 1 browserconfig.xml`);
  console.log('');
  log.info(`Success: ${successCount} | Errors: ${errorCount}`);
  console.log('');
  log.warning('Next steps:');
  console.log('  1. Review generated icons in', outputDir);
  console.log('  2. Verify manifest.json references correct icon paths');
  console.log('  3. Test PWA installation on all platforms');
  console.log('');
  log.info('Icon size reference:');
  console.log('  - PWA minimum: 192x192 and 512x512');
  console.log('  - Maskable: Safe zone with 20% padding');
  console.log('  - Apple: 180x180 (iPhone), 167x167 (iPad)');
  console.log('  - Favicon: 32x32');
  console.log('');

  if (errorCount > 0) {
    log.warning(`${errorCount} errors occurred during generation`);
    process.exit(1);
  }
}

// Run the generator
generateIcons().catch((error) => {
  log.error(`Generation failed: ${error.message}`);
  process.exit(1);
});
