/**
 * X (Twitter) Brand Asset Generator
 * Generates header (1500x500) and profile (400x400) images
 */

import sharp from 'sharp';
import { BRAND_COLORS, PLATFORM_DIMENSIONS } from './brand-config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = join(__dirname, '..', 'output', 'x');

/**
 * Generate X header image (1500x500)
 * Design: Warm Stone background with Deep Forest geometric pattern
 */
async function generateHeader() {
  const { width, height } = PLATFORM_DIMENSIONS.x.header;

  // Convert hex to RGB
  const bgColor = hexToRgb(BRAND_COLORS.secondary);
  const fgColor = hexToRgb(BRAND_COLORS.primary);

  // Create SVG for header
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="${BRAND_COLORS.secondary}"/>

      <!-- Geometric pattern - nested rectangles suggesting containment -->
      <g transform="translate(${width / 2}, ${height / 2})">
        <rect x="-200" y="-150" width="400" height="300" fill="none" stroke="${BRAND_COLORS.primary}" stroke-width="3"/>
        <rect x="-160" y="-120" width="320" height="240" fill="none" stroke="${BRAND_COLORS.primary}" stroke-width="2"/>
        <rect x="-120" y="-90" width="240" height="180" fill="none" stroke="${BRAND_COLORS.primary}" stroke-width="2"/>
        <rect x="-80" y="-60" width="160" height="120" fill="${BRAND_COLORS.primary}"/>

        <!-- Text -->
        <text x="0" y="10" font-family="Georgia, serif" font-size="48" font-weight="400"
              fill="${BRAND_COLORS.background}" text-anchor="middle">
          ALPMERA
        </text>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(OUTPUT_DIR, 'header-1500x500.png'));

  console.log('✓ Generated X header: header-1500x500.png');
}

/**
 * Generate X profile image (400x400)
 * Design: Circular badge with nested containment concept
 */
async function generateProfile() {
  const { width, height } = PLATFORM_DIMENSIONS.x.profile;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background circle -->
      <circle cx="${width / 2}" cy="${height / 2}" r="${width / 2}" fill="${BRAND_COLORS.secondary}"/>

      <!-- Nested circles - containment concept -->
      <g transform="translate(${width / 2}, ${height / 2})">
        <circle r="140" fill="none" stroke="${BRAND_COLORS.primary}" stroke-width="3"/>
        <circle r="105" fill="none" stroke="${BRAND_COLORS.primary}" stroke-width="2"/>
        <circle r="70" fill="none" stroke="${BRAND_COLORS.primary}" stroke-width="2"/>
        <circle r="35" fill="${BRAND_COLORS.primary}"/>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(OUTPUT_DIR, 'profile-400x400.png'));

  console.log('✓ Generated X profile: profile-400x400.png');
}

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Generating X (Twitter) brand assets...\n');

  try {
    await generateHeader();
    await generateProfile();
    console.log('\n✅ All X assets generated successfully!');
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('❌ Error generating assets:', error);
    process.exit(1);
  }
}

main();
