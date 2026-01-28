/**
 * Alpmera Brand Configuration
 * Single source of truth for brand colors and asset dimensions
 */

export const BRAND_COLORS = {
  primary: '#1B4D3E',      // Deep Forest
  secondary: '#E8DED1',    // Warm Stone
  accent: '#C9A962',       // Muted Gold
  success: '#3A6B5A',      // Forest Light
  danger: '#8B3A3A',       // Muted Burgundy
  text: '#2D2D2D',         // Soft Black
  textLight: '#5A5A5A',    // Secondary text
  background: '#FAFAF8',   // Off-white warm
  border: '#D4CFC7',       // Warm gray
  tableAlt: '#F5F2ED'      // Alternating rows
};

export const PLATFORM_DIMENSIONS = {
  x: {
    header: { width: 1500, height: 500 },
    profile: { width: 400, height: 400 }
  },
  linkedin: {
    banner: { width: 1584, height: 396 },
    profile: { width: 400, height: 400 }
  }
};

export const BRAND_FONTS = {
  display: 'Libre Baskerville',
  body: 'Inter'
};
