# Standalone Landing Page Deployment

## Setup on Digital Ocean Droplet

1. Create a fresh directory for the standalone landing page:
```bash
mkdir -p /var/www/alpmera-landing-standalone
cd /var/www/alpmera-landing-standalone
```

2. Initialize a new git repo and add ONLY the landing page:
```bash
git init
git remote add origin <your-repo-url>
git config core.sparseCheckout true
echo "landing/" >> .git/info/sparse-checkout
git pull origin dev
```

OR simply copy the landing directory:
```bash
# From your local machine
scp -r landing/* user@your-droplet:/var/www/alpmera-landing-standalone/
```

3. Install dependencies:
```bash
npm install
```

4. Create .env.production:
```bash
cat > .env.production << 'ENVEOF'
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbwSaQoBmMrBlEqY00u5v6QHGwg-1k2YRrkjVf-uGa8RfrWsAXKqogFXLiLEolZgsNqOzA/exec
ENVEOF
```

5. Update vite.config.ts to ALWAYS use current directory:
```bash
# Change envDir line to always use current directory
# envDir: "." instead of conditional
```

6. Build:
```bash
npm run build
```

7. Verify URL is embedded:
```bash
grep -o "AKfycbwSaQoBmMrBlEqY00u5v6QHGwg" dist/assets/*.js
```

8. Serve the dist folder with nginx pointing to this location.

## Why this works better:
- No parent directory confusion
- .env.production is right where Vite expects it
- Standalone deployment, easier to manage
- No monorepo complexity for a simple landing page
