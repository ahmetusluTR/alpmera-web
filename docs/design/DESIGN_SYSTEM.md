# Alpmera Design System

> Reference for all UI components. Use these exact values.

---

## Colors

```css
:root {
  --color-primary: #1B4D3E;        /* Deep Forest */
  --color-secondary: #E8DED1;      /* Warm Stone */
  --color-accent: #C9A962;         /* Muted Gold */
  --color-success: #3A6B5A;        /* Forest Light */
  --color-danger: #8B3A3A;         /* Muted Burgundy */
  --color-text: #2D2D2D;           /* Soft Black */
  --color-text-light: #5A5A5A;     /* Secondary text */
  --color-background: #FAFAF8;     /* Off-white warm */
  --color-border: #D4CFC7;         /* Warm gray */
  --color-table-alt: #F5F2ED;      /* Alternating rows */
}
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'alpmera': {
          'primary': '#1B4D3E',
          'secondary': '#E8DED1',
          'accent': '#C9A962',
          'success': '#3A6B5A',
          'danger': '#8B3A3A',
          'text': '#2D2D2D',
          'text-light': '#5A5A5A',
          'background': '#FAFAF8',
          'border': '#D4CFC7',
          'table-alt': '#F5F2ED',
        }
      },
      fontFamily: {
        'display': ['Libre Baskerville', 'Georgia', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  }
}
```

---

## Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| H1 | Libre Baskerville | 400 | 48px (3rem) | 1.2 |
| H2 | Libre Baskerville | 400 | 32px (2rem) | 1.25 |
| H3 | Libre Baskerville | 400 | 24px (1.5rem) | 1.3 |
| Body | Inter | 400 | 16px (1rem) | 1.5 |
| Body Small | Inter | 400 | 14px (0.875rem) | 1.5 |
| UI/Labels | Inter | 500 | 14px (0.875rem) | 1.4 |
| Caption | Inter | 400 | 12px (0.75rem) | 1.4 |

### Google Fonts Import

```html
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## Components

### Button

```typescript
type ButtonVariant = 'primary' | 'secondary' | 'ghost';

// Primary: bg-alpmera-primary text-white
// Secondary: bg-transparent border-alpmera-primary text-alpmera-primary
// Ghost: bg-transparent text-alpmera-primary hover:underline
```

| Variant | Background | Text | Border | Hover |
|---------|------------|------|--------|-------|
| primary | #1B4D3E | white | none | opacity 90% |
| secondary | transparent | #1B4D3E | 1px #1B4D3E | bg #1B4D3E/10 |
| ghost | transparent | #1B4D3E | none | underline |

**Specs:** `padding: 12px 24px`, `border-radius: 6px`, `font: Inter 500 14px`

---

### Card

```typescript
// Base card styles
// bg-alpmera-secondary border border-alpmera-border rounded-lg p-6 shadow-sm
```

| Property | Value |
|----------|-------|
| Background | #E8DED1 |
| Border | 1px solid #D4CFC7 |
| Border Radius | 8px |
| Padding | 24px |
| Shadow | 0 1px 3px rgba(45, 45, 45, 0.08) |

---

### Badge

```typescript
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'outline';
```

| Variant | Background | Text |
|---------|------------|------|
| default | #1B4D3E | white |
| success | #3A6B5A | white |
| warning | #C9A962 | #2D2D2D |
| danger | #8B3A3A | white |
| outline | transparent | #1B4D3E, border #1B4D3E |

**Specs:** `padding: 4px 12px`, `border-radius: 9999px`, `font: Inter 500 12px`

---

### Status Tag

```typescript
type StatusTagVariant = 'info' | 'success' | 'progress' | 'danger';
```

| Variant | Background | Text | Use Case |
|---------|------------|------|----------|
| info | #1B4D3E/10 | #1B4D3E | Neutral info |
| success | #3A6B5A/10 | #3A6B5A | Goal reached, complete |
| progress | #C9A962/10 | #C9A962 | In progress, building |
| danger | #8B3A3A/10 | #8B3A3A | Failed, error |

---

### Alpmera Certified Badge

```typescript
// Fixed component, no variants
// ✓ Alpmera Certified Manufacturer
```

| Property | Value |
|----------|-------|
| Icon | Checkmark (✓) |
| Text | "Alpmera Certified Manufacturer" |
| Color | #3A6B5A (Forest Light) |
| Font | Inter SemiBold 14px |

---

### Progress Stage Display

**NOT a progress bar. Text-based stages only.**

```typescript
type ProgressStage = 'gathering' | 'building' | 'momentum' | 'almost' | 'reached';

function getProgressDisplay(percentage: number): string {
  if (percentage === 100) return "Goal Reached ✓";
  if (percentage >= 76) return "Almost There (approaching 100%)";
  if (percentage === 75) return "Gaining Momentum (75% reached)";
  if (percentage >= 51) return "Gaining Momentum (approaching 75%)";
  if (percentage === 50) return "Building (50% reached)";
  if (percentage >= 21) return "Building (approaching 50%)";
  if (percentage === 20) return "Gathering (20% reached)";
  return "Gathering (approaching 20%)";
}
```

| Range | Stage Name | Display |
|-------|------------|---------|
| 0-19% | Gathering | "Gathering (approaching 20%)" |
| 20% | Gathering | "Gathering (20% reached)" |
| 21-49% | Building | "Building (approaching 50%)" |
| 50% | Building | "Building (50% reached)" |
| 51-74% | Gaining Momentum | "Gaining Momentum (approaching 75%)" |
| 75% | Gaining Momentum | "Gaining Momentum (75% reached)" |
| 76-99% | Almost There | "Almost There (approaching 100%)" |
| 100% | Goal Reached | "Goal Reached ✓" |

---

### Form Inputs

| Property | Value |
|----------|-------|
| Background | white |
| Border | 1px solid #D4CFC7 |
| Border (focus) | 1px solid #1B4D3E |
| Border Radius | 6px |
| Padding | 12px 16px |
| Font | Inter 400 16px |
| Placeholder color | #5A5A5A |

---

### Toast / Banner

| Type | Background | Border Left | Icon Color |
|------|------------|-------------|------------|
| success | #3A6B5A/10 | 4px #3A6B5A | #3A6B5A |
| error | #8B3A3A/10 | 4px #8B3A3A | #8B3A3A |
| info | #1B4D3E/10 | 4px #1B4D3E | #1B4D3E |
| warning | #C9A962/10 | 4px #C9A962 | #C9A962 |

---

## Spacing Scale

Use 4px base unit:

| Name | Value |
|------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |

---

## Border Radius

| Name | Value | Use |
|------|-------|-----|
| sm | 4px | Small elements |
| md | 6px | Buttons, inputs |
| lg | 8px | Cards |
| xl | 12px | Modals |
| full | 9999px | Badges, pills |

---

## Shadows

```css
--shadow-sm: 0 1px 2px rgba(45, 45, 45, 0.05);
--shadow-md: 0 1px 3px rgba(45, 45, 45, 0.08);
--shadow-lg: 0 4px 12px rgba(45, 45, 45, 0.1);
```

---

## Z-Index Scale

| Name | Value | Use |
|------|-------|-----|
| dropdown | 10 | Dropdowns, popovers |
| sticky | 20 | Sticky headers |
| modal | 30 | Modal overlays |
| toast | 40 | Toast notifications |
