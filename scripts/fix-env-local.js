/**
 * Script to fix .env.local file formatting
 * Removes quotes, fixes spacing, ensures correct format
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env.local');

console.log('🔧 Fixing .env.local file...\n');

if (!existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.error('   Expected location:', envPath);
  process.exit(1);
}

// Read the file
let content = readFileSync(envPath, 'utf-8');
const originalContent = content;

// Split into lines
const lines = content.split('\n');
const fixedLines = [];
let changes = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();

  // Skip empty lines and comments
  if (!line || line.startsWith('#')) {
    fixedLines.push(lines[i]); // Keep original formatting for comments/empty lines
    continue;
  }

  // Check if it's a PADDLE variable
  if (line.startsWith('PADDLE_')) {
    const originalLine = line;

    // Remove quotes from value
    // Match: PADDLE_KEY="value" or PADDLE_KEY='value' or PADDLE_KEY = "value"
    line = line.replace(/^([A-Z_]+)\s*=\s*["'](.+)["']\s*$/, '$1=$2');

    // Remove any spaces around =
    line = line.replace(/\s*=\s*/, '=');

    // Remove trailing spaces
    line = line.trim();

    if (originalLine !== line) {
      changes++;
      console.log(`  ✅ Fixed: ${line.substring(0, 30)}...`);
    }
  }

  fixedLines.push(line);
}

// Write back
const fixedContent = fixedLines.join('\n');

if (changes > 0) {
  writeFileSync(envPath, fixedContent, 'utf-8');
  console.log(`\n✅ Fixed ${changes} line(s) in .env.local`);
  console.log('   Please restart "npx vercel dev" for changes to take effect.\n');
} else {
  console.log('✅ No changes needed - file looks good!\n');
}

// Verify Paddle variables
console.log('🔍 Verifying Paddle variables...\n');
const paddleVars = [
  'PADDLE_VENDOR_ID',
  'PADDLE_API_KEY',
  'PADDLE_ENV',
  'PADDLE_PRICE_SUPPORTER_MONTHLY',
  'PADDLE_PRICE_SUPPORTER_YEARLY',
  'PADDLE_PRICE_UNLIMITED_MONTHLY',
  'PADDLE_PRICE_UNLIMITED_YEARLY',
  'PADDLE_PRICE_FAMILY_MONTHLY',
  'PADDLE_PRICE_FAMILY_YEARLY',
];

const foundVars = [];
const missingVars = [];

for (const varName of paddleVars) {
  const regex = new RegExp(`^${varName}=(.+)$`, 'm');
  const match = fixedContent.match(regex);

  if (match && match[1] && match[1].trim()) {
    const value = match[1].trim();
    const hasQuotes = value.startsWith('"') || value.startsWith("'");
    foundVars.push({ name: varName, value: value.substring(0, 20) + '...', hasQuotes });

    if (hasQuotes) {
      console.log(`  ⚠️  ${varName} still has quotes!`);
    }
  } else {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.log(`\n❌ Missing variables:`);
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\n   Please add these to .env.local\n');
} else {
  console.log(`\n✅ All ${paddleVars.length} Paddle variables found!\n`);
}

console.log('📋 Summary:');
console.log(`   Found: ${foundVars.length}/${paddleVars.length}`);
console.log(`   Missing: ${missingVars.length}`);
console.log(`   Fixed: ${changes} line(s)\n`);
