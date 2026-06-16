# Flight Simulator 3D

Simulador de vuelo 3D construido con React, Vite y Three.js. La experiencia combina terreno procedural, clima, camara de vuelo, contratos de mensajeria, HUD, minimapa, aerodromos generados y perfil persistente del piloto.

## Que demuestra

- Motor 3D propio sobre Three.js.
- Terreno procedural por chunks con biomas configurables.
- Sistemas de clima, nubes, vegetacion, ciudades y aerodromos.
- Fisica de vuelo arcade con controles de pitch, roll, yaw, throttle y frenado.
- Contratos de ruta con origen, destino, dificultad, recompensa y registro de resultados.
- HUD con velocidad, altitud, rumbo, estado, mapa, servicios y guia de llegada.
- Persistencia local del perfil del piloto.
- Build estatico portable para integracion en Laboratorio Megazzonia.

## Stack

- React 18
- Vite
- Three.js
- JavaScript modular
- lucide-react
- LocalStorage

## Estructura

```text
src/components/         Menu, HUD, tablero de contratos y overlays
src/engine/             Motor 3D, fisica, camara, terreno, clima y aeropuertos
src/config/             Defaults de vuelo y temas de mundo
src/lib/                Perfil persistente del piloto
src/styles/             Estilos de simulador
```

## Ejecucion local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

El proyecto usa `base: "./"` en Vite para que `dist/index.html` funcione desde rutas anidadas dentro del portfolio.

## Controles

- `W/S` o flechas: pitch.
- `A/D` o flechas: roll.
- `Q/E`: yaw.
- `Shift/Ctrl`: throttle.
- `Space`: freno durante rollout.
- `C`: camara.
- `R`: reiniciar ruta.
- `U`: ocultar o mostrar HUD.

## Escenarios rapidos

- Frontier VFR: visibilidad balanceada para primera ruta.
- Coastal IFR: lluvia costera y aproximacion con menor margen visual.
- Snow Dusk: ruta alpina con nieve y luz baja.

## Upgrade aplicado

- Presets rapidos de vuelo en el menu principal.
- Tira de capacidades visibles para lectura de portfolio.
- Metadatos y favicon local.
- Build portable declarado con `base: "./"`.
- README tecnico y ficha de caso dentro del Laboratorio Megazzonia.
