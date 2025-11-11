# Value‑Curve Canvas (Standalone)

A minimal, dependency‑light React app to score and visualise strategy value curves (0–10) for multiple profiles, then export CSV/PNG or save JSON configs.

## Quick start

```bash
# inside tools/value-curve-canvas
npm install
npm run dev
# build static files in dist/ for GitHub Pages
npm run build
```

## Deploy on GitHub Pages

1. Commit this folder into your repo (e.g. `verse-al-learning-labs/tools/value-curve-canvas`).  
2. Build static files:
   ```bash
   npm run build
   ```
3. Serve `dist/` via Pages (or copy into your site at `/tools/value-curve-canvas/`).

## Notes
- No Tailwind/shadcn required.  
- Factors and default profiles are in `src/App.tsx`.  
- Exports: CSV, PNG, and JSON config.
