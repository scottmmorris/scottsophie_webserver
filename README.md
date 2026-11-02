# Scott & Sophie's site

Home page branching to **Tech** and **Travel**, built with Vite + Three.js and hosted on GitHub Pages.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | Home page (Tech / Travel split) |
| `travel/index.html`, `src/globe.js` | Travel page: the 3D globe |
| `public/travel/*.html` | Individual trip pages (copied as-is into the build) |
| `public/interests/*.html` | Climbing and Shin Chan pages |
| `tech/index.html` | Tech page listing projects |
| `tech/kalman-filters/index.html`, `src/kalman.js` | "The need for Kalman filters" driving demo |
| `public/images/` | Photos, globe textures, background (must be committed) |

To add a new Tech project: make `tech/<name>/index.html`, add it to `build.rollupOptions.input` in `vite.config.js`, and link it from `tech/index.html`.

## Develop

```
npm install
npm run dev
```

## Deploy

1. Repo **Settings > Pages > Build and deployment > Source: GitHub Actions**.
2. Push to `main`. `.github/workflows/deploy.yml` builds and publishes `dist/`.

To build onto a server instead: `OUT_DIR=/var/www/html npm run build`.
