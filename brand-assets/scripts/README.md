# Alpmera Brand Asset Generator

Automated generation of platform-specific brand assets following the Alpmera Brand System.

## Overview

This project generates platform-optimized images for social media profiles using:
- Alpmera brand colors (Deep Forest, Warm Stone, Muted Gold)
- Geometric, restrained visual language
- Trust-first design principles
- No shopping metaphors or promotional imagery

## Requirements

- Node.js 18+ (for ES modules support)
- npm or yarn

## Installation

```bash
cd brand-assets/scripts
npm install
```

## Usage

### Generate X (Twitter) Assets

```bash
npm run generate:x
```

Outputs:
- `output/x/header-1500x500.png` - Profile header banner
- `output/x/profile-400x400.png` - Profile picture

### Generate LinkedIn Assets

```bash
npm run generate:linkedin
```

Outputs:
- `output/linkedin/banner-1584x396.png` - Profile banner
- `output/linkedin/profile-400x400.png` - Profile picture

### Generate All Assets

```bash
npm run generate:all
```

## Design Concepts

### X (Twitter)

**Header (1500x500)**
- Warm Stone background (#E8DED1)
- Nested rectangles suggesting containment/escrow protection
- Centered "ALPMERA" wordmark in Deep Forest
- Institutional, calm aesthetic

**Profile (400x400)**
- Concentric circles representing layers of protection
- Circular format optimized for profile display
- Monochrome Deep Forest on Warm Stone

### LinkedIn

**Banner (1584x396)**
- Clean background with geometric assembly hexagon
- Professional wordmark with tagline: "Trust-First Collective Buying"
- Left-aligned pattern, right-aligned text for balance
- Corporate, trustworthy feel

**Profile (400x400)**
- Deep Forest circular badge
- Completion gate concept in white
- Stylized "A" lettermark
- Professional, recognizable at small sizes

## Brand Compliance

All assets follow:
- [BRAND_SYSTEM.md](../../docs/canon/BRAND_SYSTEM.md) - Color palette, typography, logo rules
- [BRAND_VOICE.md](../../docs/design/BRAND_VOICE.md) - Messaging principles
- [DESIGN_SYSTEM.md](../../docs/design/DESIGN_SYSTEM.md) - Component specs

### Forbidden Elements

✗ Shopping carts, price tags, arrows
✗ Growth/speed imagery
✗ Promotional language
✗ Lifestyle marketing
✗ Urgency indicators

### Required Elements

✓ Geometric, restrained design
✓ Containment/aggregation concepts
✓ Institutional trust signals
✓ Monochrome compatibility
✓ Professional typography

## Customization

To modify designs, edit:
- `brand-config.js` - Update colors and dimensions
- `generate-x-assets.js` - Modify X asset SVG templates
- `generate-linkedin-assets.js` - Modify LinkedIn asset SVG templates

## Technical Details

**Image Processing:** [sharp](https://sharp.pixelplumbing.com/) - High-performance Node.js image library

**Format:** PNG with transparency support

**Color Space:** sRGB

**Compression:** Optimized for web upload (no unnecessary metadata)

## Output Structure

```
brand-assets/
├── scripts/
│   ├── package.json
│   ├── brand-config.js
│   ├── generate-x-assets.js
│   ├── generate-linkedin-assets.js
│   └── README.md
└── output/
    ├── x/
    │   ├── header-1500x500.png
    │   └── profile-400x400.png
    └── linkedin/
        ├── banner-1584x396.png
        └── profile-400x400.png
```

## Troubleshooting

### sharp installation fails

If `npm install` fails on sharp, try:

```bash
npm install --platform=darwin --arch=x64 sharp  # macOS Intel
npm install --platform=darwin --arch=arm64 sharp  # macOS Apple Silicon
npm install --platform=win32 --arch=x64 sharp  # Windows
npm install --platform=linux --arch=x64 sharp  # Linux
```

### Images not generating

1. Check Node.js version: `node --version` (requires 18+)
2. Verify output directories exist
3. Check file permissions on output folder

## License

UNLICENSED - Internal Alpmera use only
