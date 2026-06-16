# 3D Motor Winding Lab

Advanced Three.js simulator for building, validating, and presenting three-phase AC stator windings in 3D. The project is part of Laboratorio Megazzonia as a technical showcase for WebGL, modular JavaScript, engineering UI, and export tooling.

## What It Demonstrates

- Interactive WebGL scene with orbit controls and CSS2D slot labels.
- Configurable stator setup: slots, poles, connection type, coil pitch, and frequency.
- Phase-aware coil placement with color-coded A/B/C winding geometry.
- Validation layer for SPP, coil pitch, slot congestion, and base winding checks.
- Rotating magnetic field visualization with speed control.
- Tutorial and exam micro-modes for technical onboarding.
- JSON save/load plus PNG/PDF export.
- Portable Vite build for static hosting inside the portfolio.

## Tech Stack

- JavaScript ES modules
- Three.js
- OrbitControls and CSS2DRenderer
- Vite
- html2canvas
- jsPDF

## Local Execution

```bash
cd "Motorcraft CODEX 2"
npm install
npm run dev
```

The development server is configured for `http://localhost:5174`.

## Production Build

```bash
cd "Motorcraft CODEX 2"
npm run build
```

The compiled app is generated in `dist/` and uses relative asset paths, so it can be opened from the Laboratorio Megazzonia HTTP server.

## Portfolio Demo Mode

The app supports a portfolio-friendly URL mode:

```text
dist/index.html?demo=1&field=1
```

This loads a balanced sample winding and starts the rotating field animation automatically, making the embedded case study more useful as a first impression.

## Project Structure

- `index.html` - App shell and control layout.
- `src/main.js` - Entry point wiring the scene, phase system, validator, and UI.
- `src/core/` - Scene setup, renderer, loop, lighting, camera, and controls.
- `src/models/` - Stator, slot, and coil geometry.
- `src/logic/` - Phase system, winding logic, validator, field animation, and export helpers.
- `src/ui/` - UI controller and interaction flow.
- `src/styles/` - Dark technical UI theme.
- `public/` - Static assets.

## Upgrade Notes

- Replaced CDN/import-map setup with a normal Vite dependency workflow.
- Added `vite.config.js` with relative `base: "./"` for portable builds.
- Added a portfolio demo panel and one-click winding template.
- Cleaned mojibake from user-facing technical copy.
- Added a darker green/brown lab theme aligned with the main portfolio.

## Future Extensions

- Add winding tables and automatic coil sequence generation.
- Add harmonic spectrum and MMF waveform views.
- Model conductor count, slot fill factor, current density, and thermal load.
- Add named motor presets for education, industrial, and EV cases.
- Persist exam progress and scored tutorial completion.
