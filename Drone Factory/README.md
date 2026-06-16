# Drone Factory

Juego incremental y simulador de fabrica de drones en app web estatica. El proyecto combina loop de produccion, economia incremental, contratos diarios, eventos temporales, prestigio, telemetria local y una consola visual de planta.

## Que Demuestra

- Arquitectura JavaScript modular con sistemas separados.
- Loop incremental: energia, estaciones, upgrades, ensamblaje y prestigio.
- Sistema de fabrica por componentes: Frame, Rotor, Battery, Avionics y Shell.
- Contratos diarios, misiones, racha y recompensas.
- Eventos temporales de fabrica con cooldown.
- Telemetria local exportable.
- Persistencia en LocalStorage y progreso offline.
- UI responsive con modo de panel secundario y atajos de teclado.
- Vista `Factory Floor` en Canvas 2D para comunicar el estado de produccion.

## Stack

- HTML
- CSS
- JavaScript ES Modules
- Canvas 2D
- LocalStorage
- Node test runner

## Ejecucion Local

Desde la raiz del laboratorio:

```bash
python -m http.server 8090 --bind 127.0.0.1
```

Abrir:

```text
http://127.0.0.1:8090/Drone%20Factory/index.html
```

Tambien puede abrirse desde la tarjeta del portfolio.

## Tests

```bash
cd "Drone Factory"
node --test tests/*.mjs
node scripts/balance-sim.mjs
```

## Estructura

- `index.html` - Shell de la app y layout de juego.
- `styles.css` - Sistema visual responsive.
- `main.js` - Entrada ligera que carga `src/main.mjs`.
- `src/game-manager.mjs` - Orquestacion principal.
- `src/systems/` - Economia, fabrica, misiones, guardado, offline, prestigio y telemetria.
- `src/ui/` - Render y cache de DOM.
- `tests/` - Pruebas de economia y fabrica.
- `scripts/` - Simulacion de balance.

## Upgrade Aplicado

- Rediseño visual hacia el sistema oscuro verde/marron del Laboratorio Megazzonia.
- Nueva consola `Factory Floor` en Canvas con estaciones, stock, deficits y ensamblaje.
- Panel de plan operativo con objetivo, receta, EPS, contratos y evento activo.
- Mejoras de responsive para evitar controles cortados en pantallas chicas.
- README tecnico y ficha de portfolio.

## Proximas Mejoras

- Modo comparativo de estrategias de produccion.
- Animacion de piezas moviendose por la cinta.
- Perfil de fabrica con objetivos a largo plazo.
- Balance fino de progresion para sesiones de 5, 15 y 30 minutos.
- Exportacion de reporte de telemetria en archivo JSON.
