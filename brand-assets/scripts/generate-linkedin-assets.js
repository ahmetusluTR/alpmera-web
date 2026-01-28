/**
 * LinkedIn Brand Asset Generator
 * Generates banner (1584x396) and profile (400x400) images
 */

import sharp from 'sharp';
import { BRAND_COLORS, PLATFORM_DIMENSIONS } from './brand-config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = join(__dirname, '..', 'output', 'linkedin');

/**
 * Generate LinkedIn banner image (1584x396)
 * Design: Professional, institutional feel with geometric assembly concept
 */
async function generateBanner() {
  const { width, height } = PLATFORM_DIMENSIONS.linkedin.banner;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="${BRAND_COLORS.background}"/>

      <!-- Left section - geometric pattern -->
      <g transform="translate(200, ${height / 2})">
        <!-- Hexagon assembly concept -->
        <path d="M 0,-80 L 69,-40 L 69,40 L 0,80 L -69,40 L -69,-40 Z"
              stroke="${BRAND_COLORS.primary}" stroke-width="3" fill="none"/>
        <line x1="0" y1="-80" x2="0" y2="0" stroke="${BRAND_COLORS.primary}" stroke-width="2"/>
        <line x1="69" y1="-40" x2="0" y2="0" stroke="${BRAND_COLORS.primary}" stroke-width="2"/>
        <line x1="69" y1="40" x2="0" y2="0" stroke="${BRAND_COLORS.primary}" stroke-width="2"/>
        <line x1="0" y1="80" x2="0" y2="0" stroke="${BRAND_COLORS.primary}" stroke-width="2"/>
        <line x1="-69" y1="40" x2="0" y2="0" stroke="${BRAND_COLORS.primary}" stroke-width="2"/>
        <line x1="-69" y1="-40" x2="0" y2="0" stroke="${BRAND_COLORS.primary}" stroke-width="2"/>
        <circle cx="0" cy="0" r="12" fill="${BRAND_COLORS.primary}"/>
      </g>

      <!-- Right section - branding -->
      <g transform="translate(${width - 300}, ${height / 2})">
        <text x="0" y="-20" font-family="Georgia, serif" font-size="64" font-weight="400"
              fill="${BRAND_COLORS.primary}" text-anchor="middle">
          ALPMERA
        </text>
        <text x="0" y="25" font-family="sans-serif" font-size="20" font-weight="400"
              fill="${BRAND_COLORS.textLight}" text-anchor="middle">
          Trust-First Collective Buying
        </text>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(OUTPUT_DIR, 'banner-1584x396.png'));

  console.log('✓ Generated LinkedIn banner: banner-1584x396.png');
}

/**
 * Generate LinkedIn profile image (400x400)
 * Design: Professional circular badge with completion gate concept
 */
async function generateProfile() {
  const { width, height } = PLATFORM_DIMENSIONS.linkedin.profile;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background circle -->
      <circle cx="${width / 2}" cy="${height / 2}" r="${width / 2}" fill="${BRAND_COLORS.primary}"/>

      <!-- Completion gate concept in white -->
      <g transform="translate(${width / 2}, ${height / 2})">
        <!-- Gate pillars -->
        <rect x="-60" y="-80" width="15" height="100" fill="${BRAND_COLORS.background}"/>
        <rect x="45" y="-80" width="15" height="100" fill="${BRAND_COLORS.background}"/>

        <!-- Gate top -->
        <rect x="-45" y="-80" width="90" height="15" fill="${BRAND_COLORS.background}"/>

        <!-- Inner thresholds -->
        <rect x="-35" y="-50" width="70" height="4" fill="${BRAND_COLORS.background}"/>
        <rect x="-35" y="-30" width="70" height="4" fill="${BRAND_COLORS.background}"/>
        <rect x="-35" y="-10" width="70" height="4" fill="${BRAND_COLORS.background}"/>

        <!-- Base -->
        <rect x="-70" y="20" width="140" height="5" fill="${BRAND_COLORS.background}"/>

        <!-- Letter mark -->
        <text x="0" y="70" font-family="Georgia, serif" font-size="72" font-weight="700"
              fill="${BRAND_COLORS.background}" text-anchor="middle">
          A
        </text>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(OUTPUT_DIR, 'profile-400x400.png'));

  console.log('✓ Generated LinkedIn profile: profile-400x400.png');
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Generating LinkedIn brand assets...\n');

  try {
    await generateBanner();
    await generateProfile();
    console.log('\n✅ All LinkedIn assets generated successfully!');
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('❌ Error generating assets:', error);
    process.exit(1);
  }
}

main();
