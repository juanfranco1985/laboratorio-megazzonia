# Sudoku Procedural

Sudoku procedural 9x9 hecho con HTML, CSS y JavaScript modular ES6. La base esta pensada para correr bien como juego standalone en navegador y para migrarse luego con poca friccion a Android Studio usando WebView.

## Enfoque tecnico

- Sin frameworks ni dependencias runtime.
- Arquitectura modular separando motor Sudoku, estado, persistencia y UI.
- Mobile-first, tactil, vertical y liviano.
- Offline-first con `localStorage` y `service worker` para navegador servido por HTTP.
- Preparado para empaquetado futuro en Android Studio sin reescribir la capa de juego.

## Stack

- HTML5
- CSS3
- JavaScript ES modules
- `localStorage` para partida, settings y estadisticas
- `Service Worker` para cache offline en navegador

## Estructura

```text
/
  index.html
  manifest.webmanifest
  sw.js
  favicon.svg
  package.json
  README.md
  ANDROID_MIGRATION.md
  QA_CHECKLIST.md
  /src
    main.js
    /core
      GameState.js
      PuzzleGenerator.js
      Settings.js
      Storage.js
      SudokuEngine.js
      Timer.js
      Validator.js
    /platform
      Analytics.js
      NativeBridge.js
    /ui
      BoardView.js
      ControlsView.js
      ModalView.js
      Renderer.js
      StatsView.js
      ThemeManager.js
    /utils
      constants.js
      helpers.js
      random.js
  /styles
    main.css
    responsive.css
    themes.css
```

## Como ejecutar

La opcion mas estable es servirlo como sitio estatico:

```bash
python -m http.server 8080
```

Luego abrir:

```text
http://localhost:8080
```

Tambien funciona como archivos web estaticos dentro de un contenedor Android WebView.

## Calidad del motor Sudoku

El motor incluye:

- generacion de solucion completa valida por backtracking aleatorio
- remocion de celdas con control de unicidad de solucion
- puzzles 9x9 por dificultad
- heuristica de dificultad basada en:
  - rango de pistas
  - carga de resolucion por singles
  - hidden singles
  - branching y profundidad cuando hace falta

### Simplificacion documentada

La clasificacion de dificultad no intenta replicar un rating humano avanzado tipo torneo. En cambio usa una heuristica mantenible y suficientemente seria para producto:

- pistas objetivo por dificultad
- puntaje de esfuerzo logico
- penalizacion por branching
- control de profundidad maxima

Esto mantiene un generador real, unico y razonable sin sobredisenar el proyecto.

## Persistencia

Se guarda localmente:

- partida actual
- tablero actual
- notas
- historial reversible en memoria para undo/redo
- semilla
- tiempo
- pausa
- configuracion visual
- mostrar errores
- estadisticas basicas

El juego reanuda automaticamente la ultima partida al recargar si habia una sesion activa.

## UX / UI

- pantalla inicial con acceso rapido por dificultad
- tablero responsive y tactil
- keypad numerico visible
- modo notas
- pausa
- victoria
- selector de nueva partida
- desafio diario basado en fecha
- undo / redo
- pista premiada preparada para wrapper nativo
- modo sin distracciones
- tema claro / oscuro / auto
- resaltado de fila, columna, caja y coincidencias
- conflictos y errores opcionales

## Archivos clave para ampliar features

- `src/core/PuzzleGenerator.js`: generacion, unicidad y rating de dificultad
- `src/core/GameState.js`: reglas de flujo, autoguardado, pistas y estadisticas
- `src/platform/NativeBridge.js`: contrato de integracion con Android
- `src/platform/Analytics.js`: cola local de eventos desacoplada
- `src/ui/Renderer.js`: wiring general de interfaz y modales
- `src/ui/BoardView.js`: render del tablero
- `src/ui/ControlsView.js`: keypad y acciones de juego
- `styles/main.css`: look principal
- `styles/themes.css`: variables de tema

## Roadmap sugerido

1. Reemplazar el stub nativo de rewarded hint por rewarded ads reales.
2. Enviar la cola local de analytics a una capa nativa o backend.
3. Hacer QA en dispositivo real para back button, reanudacion y persistencia.
4. Profundizar aun mas el solver logico con hidden pairs o x-wing si luego necesitas rating mas fino.
5. Definir branding final: iconos definitivos, firma release y publicacion.

## Verificacion local usada

- `node --check` sobre todos los modulos JS
- prueba de humo del generador en Node con verificacion de solucion unica
- `android\\gradlew.bat :app:assembleDebug` verificado
- `android\\gradlew.bat :app:bundleRelease` verificado
- artefactos generados:
  - `android/app/build/outputs/apk/debug/app-debug.apk`
  - `android/app/build/outputs/bundle/release/app-release.aab`

## Packaging futuro

Ya existe un wrapper nativo validado en [android/README.md](./android/README.md).

Flujo rapido:

```powershell
./android/scripts/sync-web-assets.ps1
```

Luego:

```powershell
cd android
.\gradlew.bat :app:assembleDebug
```

Para bundle:

```powershell
.\scripts\build-aab.ps1
```

Ver [ANDROID_MIGRATION.md](./ANDROID_MIGRATION.md) para el detalle de migracion y extension nativa.
