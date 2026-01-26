# Alpmera Project Setup — Landing Page

> **For Claude Code:** This spec is for the `/landing` subfolder within ALPMERA-WEB.
> Reference docs are in the parent project's `/docs` folder.

---

## 1. Project Structure

```
ALPMERA-WEB/
├── docs/
│   ├── canon/
│   │   ├── BRAND_SYSTEM.md              ← Brand rules (source of truth)
│   │   ├── LANGUAGE_RULES.md            ← Terminology rules
│   │   └── ...
│   └── design/
│       ├── DESIGN_SYSTEM.md             ← Design tokens
│       ├── BRAND_VOICE.md               ← Voice/copy guidelines
│       ├── LANDING_PAGE_SPEC.md         ← Landing page spec (ADD HERE)
│       └── PROJECT_SETUP.md             ← This file (ADD HERE)
│
├── landing/                              ← Landing page sub-project
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   ├── src/
│   │   ├── components/
│   │   │   ├── brand/                   ← Figma Make components
│   │   │   │   ├── AlpmeraButton.tsx
│   │   │   │   ├── AlpmeraCard.tsx
│   │   │   │   ├── AlpmeraInput.tsx
│   │   │   │   ├── AlpmeraCheckbox.tsx
│   │   │   │   ├── AlpmeraSelect.tsx
│   │   │   │   ├── AlpmeraToggle.tsx
│   │   │   │   ├── AlpmeraBadge.tsx
│   │   │   │   ├── AlpmeraStatusTag.tsx
│   │   │   │   ├── AlpmeraNav.tsx
│   │   │   │   ├── AlpmeraLogo.tsx
│   │   │   │   ├── AlpmeraTypography.tsx
│   │   │   │   └── index.ts
│   │   │   ├── forms/
│   │   │   │   ├── HoneypotField.tsx
│   │   │   │   └── TurnstileWidget.tsx
│   │   │   └── sections/
│   │   │       ├── Nav.tsx
│   │   │       ├── Hero.tsx
│   │   │       ├── WhatAlpmeraIs.tsx
│   │   │       ├── HowItWorks.tsx
│   │   │       ├── Safety.tsx
│   │   │       ├── DemandCTA.tsx
│   │   │       ├── EarlyAccessForm.tsx
│   │   │       ├── FAQ.tsx
│   │   │       └── Footer.tsx
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Demand.tsx
│   │   │   ├── Privacy.tsx
│   │   │   └── Terms.tsx
│   │   ├── lib/
│   │   │   ├── googleSheets.ts
│   │   │   └── rateLimit.ts
│   │   ├── data/
│   │   │   ├── faqData.ts
│   │   │   └── usStates.ts
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   └── fonts.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .env                                  ← Root env (SHARED - includes landing vars)
├── .env.example
└── ...
```

---

## 2. Environment Variables

### Root `.env` (ALPMERA-WEB/.env)

Add these variables to the **existing root `.env`** file:

```bash
# ============================================
# LANDING PAGE VARIABLES
# ============================================

# Google Sheets Integration
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Cloudflare Turnstile (spam protection)
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key

# Optional: Analytics
VITE_PLAUSIBLE_DOMAIN=alpmera.com
```

### Root `.env.example` (ALPMERA-WEB/.env.example)

Add to the existing template:

```bash
# ============================================
# LANDING PAGE VARIABLES
# ============================================

# Google Sheets Integration
VITE_GOOGLE_SCRIPT_URL=

# Cloudflare Turnstile (spam protection)
VITE_TURNSTILE_SITE_KEY=

# Optional: Analytics
VITE_PLAUSIBLE_DOMAIN=
```

### Vite Config (landing/vite.config.ts)

Ensure Vite reads from root `.env`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  envDir: '../',  // ← Read .env from parent directory
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## 3. Reference Paths for Claude Code

When working in the `/landing` folder, reference docs like this:

```
From: landing/src/components/...
To:   ../docs/canon/BRAND_SYSTEM.md
To:   ../docs/design/DESIGN_SYSTEM.md
To:   ../docs/design/LANDING_PAGE_SPEC.md
```

### Claude Code Prompt (Correct Paths)

```
Read these files for context:
- docs/canon/BRAND_SYSTEM.md (brand rules)
- docs/design/DESIGN_SYSTEM.md (design tokens)
- docs/design/LANDING_PAGE_SPEC.md (page structure)
- docs/design/PROJECT_SETUP.md (this setup guide)

Then work in the /landing folder to build components.
```

---

## 4. Landing Page .gitignore

The `landing/.gitignore` should include:

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/

# Logs
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Note: .env is in root, not in /landing
```

---

## 5. Spam Protection Files

### File: `landing/src/lib/rateLimit.ts`

```typescript
// Rate limiting for form submissions

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'early-access': { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  'demand-suggestion': { maxAttempts: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
};

export function checkRateLimit(formId: string): { allowed: boolean; remainingTime?: number } {
  const key = `alpmera_rate_${formId}`;
  const config = RATE_LIMITS[formId];
  
  if (!config) return { allowed: true };
  
  const stored = localStorage.getItem(key);
  const now = Date.now();
  
  if (!stored) {
    localStorage.setItem(key, JSON.stringify({ attempts: 1, firstAttempt: now }));
    return { allowed: true };
  }
  
  const data = JSON.parse(stored);
  
  // Reset if window expired
  if (now - data.firstAttempt > config.windowMs) {
    localStorage.setItem(key, JSON.stringify({ attempts: 1, firstAttempt: now }));
    return { allowed: true };
  }
  
  // Check if limit exceeded
  if (data.attempts >= config.maxAttempts) {
    const remainingTime = config.windowMs - (now - data.firstAttempt);
    return { allowed: false, remainingTime };
  }
  
  // Increment attempts
  data.attempts += 1;
  localStorage.setItem(key, JSON.stringify(data));
  return { allowed: true };
}

export function formatRemainingTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours > 1 ? 's' : ''}`;
}
```

### File: `landing/src/lib/googleSheets.ts`

```typescript
// Google Sheets Integration with Spam Protection

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

interface EarlyAccessData {
  email: string;
  interests?: string[];
  notes?: string;
  notify?: boolean;
  turnstileToken?: string;
  website?: string; // Honeypot
}

interface DemandSuggestionData {
  product_name: string;
  sku?: string;
  reference_url?: string;
  reason?: string;
  city?: string;
  state?: string;
  email?: string;
  notify?: boolean;
  turnstileToken?: string;
  website?: string; // Honeypot
}

interface SubmissionResult {
  success: boolean;
  error?: string;
}

export async function submitEarlyAccess(data: EarlyAccessData): Promise<SubmissionResult> {
  if (!GOOGLE_SCRIPT_URL) {
    console.error('VITE_GOOGLE_SCRIPT_URL not configured');
    return { success: false, error: 'Form not configured' };
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheet: 'Early Access',
        email: data.email,
        interests: data.interests?.join(', ') || '',
        notes: data.notes || '',
        notify: data.notify || false,
        source: 'landing',
        turnstileToken: data.turnstileToken,
        website: data.website,
      }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Form submission error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function submitDemandSuggestion(data: DemandSuggestionData): Promise<SubmissionResult> {
  if (!GOOGLE_SCRIPT_URL) {
    console.error('VITE_GOOGLE_SCRIPT_URL not configured');
    return { success: false, error: 'Form not configured' };
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheet: 'Demand Suggestions',
        product_name: data.product_name,
        sku: data.sku || '',
        reference_url: data.reference_url || '',
        reason: data.reason || '',
        city: data.city || '',
        state: data.state || '',
        email: data.email || '',
        notify: data.notify || false,
        turnstileToken: data.turnstileToken,
        website: data.website,
      }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Form submission error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}
```

### File: `landing/src/components/forms/HoneypotField.tsx`

```tsx
// Honeypot field to catch bots
// Invisible to users, bots will fill it

export function HoneypotField() {
  return (
    <div 
      aria-hidden="true" 
      style={{ 
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        opacity: 0,
        pointerEvents: 'none',
        height: 0,
        overflow: 'hidden',
      }}
    >
      <label htmlFor="website">Website</label>
      <input 
        type="text"
        id="website"
        name="website"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
```

### File: `landing/src/components/forms/TurnstileWidget.tsx`

```tsx
// Cloudflare Turnstile integration
// Install: npm install @marsidev/react-turnstile

import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export function TurnstileWidget({ onSuccess, onError, onExpire }: TurnstileWidgetProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  
  if (!siteKey) {
    // Turnstile not configured - skip silently in development
    return null;
  }
  
  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onSuccess}
      onError={onError}
      onExpire={onExpire}
      options={{
        theme: 'light',
        size: 'normal',
      }}
    />
  );
}
```

---

## 6. Google Apps Script (In Google Sheets)

```javascript
// Code.gs - Deploy as Web App

const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
const TURNSTILE_SECRET_KEY = 'YOUR_TURNSTILE_SECRET_KEY'; // Optional

function verifyTurnstile(token) {
  if (!TURNSTILE_SECRET_KEY || !token) return true; // Skip if not configured
  
  try {
    const response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      payload: {
        secret: TURNSTILE_SECRET_KEY,
        response: token,
      },
    });
    const result = JSON.parse(response.getContentText());
    return result.success;
  } catch (e) {
    return false;
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Verify Turnstile if token provided
    if (data.turnstileToken && !verifyTurnstile(data.turnstileToken)) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Verification failed' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Honeypot check - if filled, it's a bot
    if (data.website && data.website !== '') {
      // Return success but don't save (fool the bot)
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(data.sheet);
    
    if (data.sheet === 'Early Access') {
      sheet.appendRow([
        data.email,
        data.interests || '',
        data.notes || '',
        data.notify || false,
        new Date().toISOString(),
        data.source || 'landing'
      ]);
    } else if (data.sheet === 'Demand Suggestions') {
      sheet.appendRow([
        data.product_name,
        data.sku || '',
        data.reference_url || '',
        data.reason || '',
        data.city || '',
        data.state || '',
        data.email || '',
        data.notify || false,
        new Date().toISOString()
      ]);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('Alpmera Forms API')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

---

## 7. Claude Code Prompts for Landing

### Initial Setup

```
I'm working in the /landing subfolder of ALPMERA-WEB.

Read these docs for context:
- docs/canon/BRAND_SYSTEM.md
- docs/design/DESIGN_SYSTEM.md
- docs/design/LANDING_PAGE_SPEC.md
- docs/design/PROJECT_SETUP.md

Set up the landing page structure:
1. Create landing/src/lib/rateLimit.ts
2. Create landing/src/lib/googleSheets.ts
3. Create landing/src/components/forms/HoneypotField.tsx
4. Create landing/src/components/forms/TurnstileWidget.tsx
5. Update landing/vite.config.ts to read env from parent directory
```

### Build Sections

```
Build the landing page sections in landing/src/components/sections/
following LANDING_PAGE_SPEC.md. Use components from landing/src/components/brand/.
```

---

## 8. File Placement Summary

| File | Location |
|------|----------|
| BRAND_SYSTEM.md | `docs/canon/` |
| DESIGN_SYSTEM.md | `docs/design/` |
| LANDING_PAGE_SPEC.md | `docs/design/` |
| PROJECT_SETUP.md | `docs/design/` |
| .env | Root (`ALPMERA-WEB/`) |
| Landing source code | `landing/src/` |

---

**End of Setup Spec**
