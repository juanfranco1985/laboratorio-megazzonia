# Screenshots

Capturas generadas para la etapa 2 de evidencia visual del blog-portafolio.

Fecha: 2026-05-07

Actualizacion QA responsive: 2026-05-13

Actualizacion Flight/SEO: 2026-05-13

## Metodo

Servidor local:

```text
http://127.0.0.1:8090/
```

Captura:

```powershell
npx playwright screenshot --channel msedge --viewport-size=1440,1000 --wait-for-timeout=<ms> <url> <archivo>
```

Se uso Microsoft Edge instalado localmente para evitar descargar navegadores de
Playwright.

## Capturas de demos

- `demos/data-analyst-career-simulator.png`
- `demos/drone-factory.png`
- `demos/motorcraft-codex-2.png`
- `demos/flight-simulator-3d.png`
- `demos/heat-sink-simulator.png`
- `demos/analisis-estructural.png`
- `demos/consumo-electrico.png`
- `demos/south-american-runner.png`

## Capturas de casos

- `cases/home-con-destacados.png`
- `cases/catalogo-con-miniaturas.png`
- `cases/roi-analytics-android.png`
- `cases/solar-climate-dashboard.png`

## Capturas QA editoriales

- `qa-home-20260513.png`
- `qa-projects-20260513.png`
- `qa-home-mobile-20260513.png`
- `qa-projects-mobile-20260513.png`
- `qa-data-case-20260513.png`

## Notas de calidad

- `data-analyst-career-simulator.png` fue reemplazada el 2026-05-13 por una
  captura real limpia de la vista SQL, con mision activa, dataset cargado y
  query ejecutada.
- `flight-simulator-3d.png` captura el setup inicial antes de vuelo; sirve como
- `flight-simulator-3d.png` fue reemplazada el 2026-05-13 por una captura real
  en vuelo con HUD, contrato activo, ruta y minimapa, generada con
  `capture=flight`.
- La captura real de ROI Analytics Android queda pendiente porque no hay
  dispositivo conectado ni AVD disponible (`adb devices` sin entradas y
  `emulator -list-avds` vacio). La imagen actual sigue siendo captura de la
  ficha/caso.
- La captura de Solar Climate es captura de ficha/caso porque no tiene demo web
  directa dentro del hub.
- `home-con-destacados.png` y `catalogo-con-miniaturas.png` se usan como
  evidencia de que el portfolio ya integra thumbnails y lenguaje publico.
- Las capturas `qa-*20260513.png` verifican la curaduria editorial nueva:
  proyectos insignia, filtro de madurez, resumen de estados y responsive
  desktop/mobile.
