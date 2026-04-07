#!/usr/bin/env node
/**
 * migrate-files.js
 * Copies all uploaded files from backend/public/uploads/ → file-server/uploads/
 * Safe to run multiple times (skips already-copied files).
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "backend", "public", "uploads");
const DEST = path.join(__dirname, "uploads");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  Created directory: ${dir}`);
  }
}

function migrateFiles() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   Nyambika File Server — File Migration  ║");
  console.log("╚══════════════════════════════════════════╝\n");

  ensureDir(DEST);

  // Create .gitkeep so git tracks the empty folder
  const gitkeep = path.join(DEST, ".gitkeep");
  if (!fs.existsSync(gitkeep)) fs.writeFileSync(gitkeep, "");

  if (!fs.existsSync(SRC)) {
    console.error(`❌  Source directory not found: ${SRC}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SRC).filter((f) => f !== ".DS_Store" && f !== ".gitkeep");

  if (files.length === 0) {
    console.log("⚠️  No files found in source directory. Nothing to migrate.");
    return;
  }

  console.log(`📦  Found ${files.length} file(s) in:\n    ${SRC}\n`);
  console.log(`📂  Destination:\n    ${DEST}\n`);

  let copied = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const srcPath = path.join(SRC, file);
    const destPath = path.join(DEST, file);

    // Skip directories
    if (fs.statSync(srcPath).isDirectory()) continue;

    if (fs.existsSync(destPath)) {
      console.log(`  ⏭  SKIP  ${file}`);
      skipped++;
      continue;
    }

    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✅ COPY  ${file}`);
      copied++;
    } catch (err) {
      console.error(`  ❌ ERR   ${file}: ${err.message}`);
      errors++;
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`  ✅ Copied  : ${copied}`);
  console.log(`  ⏭  Skipped : ${skipped}`);
  console.log(`  ❌ Errors  : ${errors}`);
  console.log("─────────────────────────────────────────");

  if (errors === 0) {
    console.log("\n🎉  Migration complete!\n");
    console.log("Next steps:");
    console.log("  1. Verify files in file-server/uploads/");
    console.log("  2. Run migrate-db.sql against your database to update image paths");
    console.log("  3. Start the file server: cd file-server && npm run dev");
    console.log("  4. Update backend .env: FILE_SERVER_BASE_URL=http://localhost:3004\n");
  } else {
    console.warn("\n⚠️  Migration finished with errors. Please review above.\n");
    process.exit(1);
  }
}

migrateFiles();
