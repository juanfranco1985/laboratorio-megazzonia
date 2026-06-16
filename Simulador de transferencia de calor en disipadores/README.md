# Simulador de transferencia de calor en disipadores

Simulador tecnico construido con React y Vite para explorar el rendimiento termico de disipadores con aletas. Permite ajustar potencia del chip, area, material, geometria, conveccion y velocidad de aire, y devuelve metricas utiles para comparar alternativas.

## Que demuestra

- Modelado conceptual de resistencia termica, eficiencia de aletas y coeficiente de conveccion.
- UI interactiva con controles por sliders, presets tecnicos y visualizacion en canvas.
- Guardado local de hasta 8 disenos para comparar configuraciones.
- Exportacion de reporte tecnico en TXT.
- Build estatico portable para integrarlo al Laboratorio Megazzonia.

## Stack

- React 18
- Vite
- JavaScript modular
- Canvas 2D
- LocalStorage
- lucide-react

## Estructura

```text
src/
  components/              Paneles de control, metricas y disenos guardados
  constants/materials.js   Propiedades termicas de materiales
  utils/
    thermalCalculations.js Motor de calculo termico
    canvasRenderer.js      Visualizacion 2D del disipador
    optimizationEngine.js  Recomendaciones automaticas
    reportGenerator.js     Exportacion de reporte
  App.jsx                  Orquestacion de estado, presets y layout
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

## Upgrade aplicado

- Presets rapidos para nodo IoT fanless, CPU edge y GPU compacta.
- Persistencia local de disenos guardados.
- Canvas con escala dinamica para evitar cortes en geometria grande.
- Estetica alineada al Laboratorio Megazzonia: fondo oscuro, verdes tecnicos y tonos cobre.
- Metadatos y favicon local sin dependencia del asset default de Vite.
