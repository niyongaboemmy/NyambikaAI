#!/usr/bin/env node

/**
 * PWA Validation Script
 * Validates that all required PWA assets are present and correctly configured
 */

const fs = require('fs');
const path = require('path');

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

const publicDir = path.resolve(__dirname, '../public');
let errors = 0;
let warnings = 0;

console.log('\n🔍 PWA Validation Report\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. Check manifest.json
log.info('Checking manifest.json...');
const manifestPath = path.join(publicDir, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  log.error('manifest.json not found');
  errors++;
} else {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Validate required fields
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    requiredFields.forEach(field => {
      if (!manifest[field]) {
        log.error(`manifest.json missing required field: ${field}`);
        errors++;
      } else {
        log.success(`Found ${field}: ${typeof manifest[field] === 'string' ? manifest[field] : `(${Array.isArray(manifest[field]) ? manifest[field].length + ' items' : 'object'})`}`);
      }
    });
    
    // Check icon sizes
    if (manifest.icons) {
      const sizes = manifest.icons.map(icon => icon.sizes);
      const hasMinRequired = sizes.some(s => s === '192x192') && sizes.some(s => s === '512x512');
      if (hasMinRequired) {
        log.success(`Icons include required sizes (192x192 and 512x512)`);
      } else {
        log.error('Missing required icon sizes (192x192 and 512x512)');
        errors++;
      }
      
      // Check for maskable icons
      const hasMaskable = manifest.icons.some(icon => icon.purpose && icon.purpose.includes('maskable'));
      if (hasMaskable) {
        log.success('Maskable icons configured');
      } else {
        log.warning('No maskable icons found (recommended for Android)');
        warnings++;
      }
    }
    
  } catch (error) {
    log.error(`Invalid manifest.json: ${error.message}`);
    errors++;
  }
}

console.log('');

// 2. Check required icons
log.info('Checking PWA icons...');
const requiredIcons = [
  { file: 'icon-192x192.png', desc: 'Standard 192x192' },
  { file: 'icon-512x512.png', desc: 'Standard 512x512' },
  { file: 'icon-192x192-maskable.png', desc: 'Maskable 192x192' },
  { file: 'icon-512x512-maskable.png', desc: 'Maskable 512x512' },
];

requiredIcons.forEach(({ file, desc }) => {
  const iconPath = path.join(publicDir, file);
  if (fs.existsSync(iconPath)) {
    const stats = fs.statSync(iconPath);
    log.success(`${desc}: ${(stats.size / 1024).toFixed(2)} KB`);
  } else {
    log.error(`Missing ${desc}: ${file}`);
    errors++;
  }
});

console.log('');

// 3. Check Apple Touch icons
log.info('Checking Apple Touch icons...');
const appleIcons = ['apple-touch-icon.png', 'apple-touch-icon-180x180.png'];
appleIcons.forEach(file => {
  const iconPath = path.join(publicDir, file);
  if (fs.existsSync(iconPath)) {
    log.success(`Found ${file}`);
  } else {
    log.warning(`Missing ${file} (recommended for iOS)`);
    warnings++;
  }
});

console.log('');

// 4. Check favicon
log.info('Checking favicon...');
const faviconPath = path.join(publicDir, 'favicon.ico');
if (fs.existsSync(faviconPath)) {
  log.success('favicon.ico found');
} else {
  log.warning('favicon.ico not found');
  warnings++;
}

console.log('');

// 5. Check service worker
log.info('Checking service worker...');
const swPath = path.join(publicDir, 'sw.js');
if (fs.existsSync(swPath)) {
  log.success('Service worker (sw.js) found');
} else {
  log.warning('Service worker not found (will be generated during build)');
  warnings++;
}

console.log('');

// 6. Check browserconfig.xml
log.info('Checking Windows tile configuration...');
const browserConfigPath = path.join(publicDir, 'browserconfig.xml');
if (fs.existsSync(browserConfigPath)) {
  log.success('browserconfig.xml found');
} else {
  log.warning('browserconfig.xml not found (optional for Windows tiles)');
  warnings++;
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Summary
if (errors === 0 && warnings === 0) {
  log.success('🎉 All PWA validations passed!');
  log.success('Your app is ready for PWA installation\n');
  console.log('Next steps:');
  console.log('  1. Run: npm run build');
  console.log('  2. Test on: https://localhost:3000 or your domain');
  console.log('  3. Run Lighthouse audit in Chrome DevTools');
  console.log('  4. Test installation on multiple devices\n');
} else {
  if (errors > 0) {
    log.error(`Found ${errors} error(s)`);
  }
  if (warnings > 0) {
    log.warning(`Found ${warnings} warning(s)`);
  }
  console.log('');
  if (errors > 0) {
    console.log('Please fix the errors before deploying.\n');
    process.exit(1);
  } else {
    console.log('Warnings are optional but recommended to fix.\n');
  }
}
