# Analisis Estructural

Herramienta web para analisis preliminar de vigas. Permite configurar geometria, material, apoyos, cargas puntuales/distribuidas/triangulares/momentos, ejecutar calculos y revisar reacciones, cortante, momento, deflexion, esfuerzos, pandeo y factores de seguridad.

## Que demuestra

- Modelado interactivo de vigas con dos apoyos verticales configurables y voladizos exteriores.
- Motor de calculo separado de la interfaz.
- Diagramas con Recharts para cortante, momento, deflexion y esfuerzo.
- Integracion numerica de la curvatura `M/EI` con condiciones de apoyo.
- Verificacion visible de residuos de fuerza, momento y desplazamiento en apoyos.
- Propiedades de seccion con eje neutro real para perfiles asimetricos.
- Casos analiticos de referencia ejecutados con Vitest.
- Exportacion JSON, reporte TXT, reporte estilo PDF y CSV de diagramas.
- Persistencia en `localStorage` y estado compartible por URL hash.
- Build estatico portable para integrarlo al Laboratorio Megazzonia.

## Stack

- React 18
- Vite
- TypeScript parcial
- Recharts
- lucide-react
- CSS propio

## Estructura

```text
Analisis estructural.tsx  Interfaz principal, estado, presets y vistas
calculations.ts           Motor de calculo estructural
constants.ts              Materiales, tipos de apoyo y tipos de carga
reporting.ts              Exportacion JSON/TXT/PDF-style
csv.ts                    Exportacion CSV de diagramas
sections.ts               Propiedades geometricas de secciones
types.ts                  Tipos compartidos
styles.css                Capa visual portable sin Tailwind
```

## Ejecucion local

```bash
npm install
npm run dev
```

## Verificacion

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Build

```bash
npm run build
```

El proyecto usa `base: "./"` en Vite para que `dist/index.html` funcione desde rutas anidadas dentro del portfolio.

## Presets

- Simple: viga simplemente apoyada con carga puntual en el centro.
- Uniforme: viga simplemente apoyada con carga distribuida en toda la luz.
- Mixta: carga distribuida parcial combinada con una carga puntual.

## Atajos

- `A`: agregar carga.
- `P`: agregar carga puntual en el centro.
- `U`: agregar carga uniforme en toda la luz.

## Limitaciones

- El solver esta enfocado en dos apoyos verticales simples; no resuelve empotramientos.
- El pandeo de Euler y el esfuerzo cortante son estimaciones preliminares.
- No incluye no linealidad, segundo orden, plasticidad, conexiones ni combinaciones normativas completas.
- El reporte `.pdf` es una exportacion de texto con extension PDF; no genera un PDF tipografico real.
- Es una herramienta de portfolio y analisis preliminar, no sustituye revision profesional certificada.

## Mejoras aplicadas

- Se agrego CSS propio para reemplazar la dependencia implicita de Tailwind.
- Se preparo el build portable con rutas relativas.
- Se limpiaron metadatos del HTML y favicon local.
- Se corrigio el reporte para evitar imprimir valores de reaccion inexistentes.
- Se documento el proyecto como caso tecnico de portfolio.
- Se reemplazo la formula aproximada de deflexion por integracion numerica.
- Se corrigieron brazos de palanca firmados y momentos concentrados.
- Se corrigio la fibra extrema en secciones T.
- Se retiraron presets y resultados que excedian el alcance real del solver.
