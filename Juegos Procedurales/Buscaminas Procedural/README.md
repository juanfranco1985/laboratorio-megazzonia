# Buscaminas Procedural

Buscaminas moderno, procedural, responsive, mobile-first y offline-first construido con HTML, CSS y JavaScript modular ES6.

El proyecto evita sprites y dependencias externas. Toda la interfaz se resuelve con layout, color, tipografia, sombras y microinteracciones CSS. La arquitectura queda preparada para evolucionar a app Android via WebView o empaquetado hibrido liviano.

## Stack

- HTML5 semantico
- CSS modular con variables de tema
- JavaScript ES6 modules
- localStorage para persistencia
- Service Worker para cache offline cuando se sirve por HTTP/HTTPS

## Capacidades principales

- Tablero procedural generado en el primer reveal
- Primer movimiento seguro con zona protegida
- Flood reveal para regiones vacias
- Chording sobre celdas numeradas ya satisfechas
- Banderas por toggle tactil, long press o click derecho
- HUD con minas restantes, tiempo, estado, reinicio rapido y pausa
- Dificultades Facil, Medio, Dificil y Personalizado
- Seed manual y codigo compartible para reproducir partidas
- Modo zen sin cronometro ni derrota inmediata
- Persistencia local de sesion, preferencias y estadisticas
- Tema claro/oscuro/auto
- Auto-pausa al perder foco
- Bridge nativo para Android, vibracion y eventos de analitica/ads
- Documentacion lista para Android Studio

## Estructura

```text
/
|-- index.html
|-- icon.svg
|-- manifest.webmanifest
|-- sw.js
|-- README.md
|-- ANDROID_MIGRATION.md
|-- QA_CHECKLIST.md
|-- QA_SMOKE_REPORT.md
|-- android/
|-- styles/
|   |-- main.css
|   |-- responsive.css
|   `-- themes.css
`-- src/
    |-- main.js
    |-- core/
    |   |-- BoardGenerator.js
    |   |-- ChallengeCodec.js
    |   |-- GameState.js
    |   |-- MinesweeperEngine.js
    |   |-- NativeBridge.js
    |   |-- RevealSystem.js
    |   |-- Settings.js
    |   |-- StatsTracker.js
    |   |-- Storage.js
    |   |-- Timer.js
    |   `-- Validator.js
    |-- ui/
    |   |-- BoardView.js
    |   |-- ControlsView.js
    |   |-- HUDView.js
    |   |-- ModalView.js
    |   |-- Renderer.js
    |   |-- StatsView.js
    |   `-- ThemeManager.js
    `-- utils/
        |-- constants.js
        |-- helpers.js
        `-- random.js
```

## Como ejecutarlo

### Opcion simple

Abrir `index.html` en un navegador moderno. El juego funciona localmente porque no depende de APIs remotas.

### Opcion recomendada

Servir la carpeta con un servidor estatico para habilitar `service worker` y cache offline real. Ejemplos:

```bash
npx serve .
```

o

```bash
python -m http.server 8080
```

Luego abrir `http://localhost:8080`.

## Controles

- Tap o click izquierdo: accion principal segun el modo activo
- Long press en movil: bandera
- Click derecho en desktop: bandera
- Tap sobre un numero revelado: chord si la cantidad de banderas coincide
- Toggle "Revelar / Bandera": cambia la accion principal del tap
- Boton de pausa: congela el cronometro y bloquea el tablero

## Seeds y codigos

- `Seed` vacia: partida aleatoria.
- `Seed` manual: mismo seed + misma apertura segura = mismo tablero.
- `Codigo bp1|...`: reproduce dificultad, seed y apertura original automaticamente.
- `Copiar codigo`: genera un codigo compartible a partir de una partida ya abierta.
- `Compartir`: en WebView Android usa el share sheet nativo; en navegador usa `navigator.share` si existe.

## Modo zen

- Desactiva el cronometro.
- Tocar una mina no derrota: la mina se auto-marca y suma un error zen.
- La victoria ocurre al revelar todas las celdas seguras.

## Persistencia

Se guarda localmente:

- partida en curso
- dificultad elegida
- configuracion personalizada
- modo zen
- seed o codigo cargado
- preferencia de tema
- modo tactil preferido
- estadisticas por dificultad

Si la pagina se refresca, la sesion activa se restaura automaticamente.

## Decisiones de arquitectura

- La generacion del tablero ocurre en el primer reveal para garantizar safe first move.
- El motor de juego vive en `src/core/` y no depende del DOM.
- Los codigos compartibles viven en `ChallengeCodec.js` para no mezclar serializacion con UI.
- La UI esta separada en vistas reutilizables dentro de `src/ui/`.
- La persistencia usa `localStorage` porque funciona bien tanto en navegador como en WebView.
- `NativeBridge.js` expone hooks para vibracion, eventos nativos y control desde Android.
- El `service worker` suma cache offline cuando el bundle se sirve por HTTP/HTTPS.

## Adaptacion a Android Studio

Ya existe un shell Android completo en [android/README.md](</c:/Documentos/Juegos Procedurales/Buscaminas Procedural/android/README.md>).

Puntos clave:

1. Abrir `android/` como proyecto Android Studio.
2. El bundle web ya esta copiado en `android/app/src/main/assets/minesweeper/`.
3. El shell usa `WebViewAssetLoader`, bridge nativo, splash, iconos adaptativos y firma release preparada por archivo.
4. Revisar [ANDROID_MIGRATION.md](</c:/Documentos/Juegos Procedurales/Buscaminas Procedural/ANDROID_MIGRATION.md>) y [QA_SMOKE_REPORT.md](</c:/Documentos/Juegos Procedurales/Buscaminas Procedural/QA_SMOKE_REPORT.md>) antes de publicar.
