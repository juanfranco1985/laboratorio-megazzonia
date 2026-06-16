# Sopa Infinita

Base de producto para una sopa de letras procedural, responsive, mobile-first y offline-first, construida con HTML, CSS y JavaScript modular ES6. La app corre como sitio estatico y ahora incluye un contenedor Android minimo listo para abrirse en Android Studio.

## Stack

- HTML5 semantico
- CSS modular con tema claro/oscuro
- JavaScript ES modules sin frameworks
- `localStorage` para persistencia
- Service Worker para cache offline en navegador
- Contenedor Android nativo con `WebView`

## Que incluye ahora

- Generacion procedural de tableros con seed reutilizable
- Cuatro dificultades con cambios de tamano, cantidad de palabras y direcciones validas
- Siete categorias integradas
- Desafio diario real con perfil fijo del dia, racha diaria y bloqueo tras completarlo
- Modo zen sin cronometro
- Pistas gratis por partida y pistas extra condicionables a rewarded via bridge nativo
- Compartir seed y link por Web Share, clipboard o bridge nativo
- Carga de packs externos desde JSON local o remoto
- Panel de fuentes instaladas con activar, desactivar y quitar por origen
- Seleccion tactil y con mouse por arrastre en linea recta
- Validacion contra posiciones reales de las palabras colocadas
- Pausa, reinicio de la grilla actual y nueva partida
- Continuidad de partida tras recarga
- Estadisticas basicas, mejor tiempo por categoria/dificultad y racha diaria
- Bridge opcional para analytics y futuras placements nativas
- Contenedor Android con `WebViewAssetLoader` y bridge JS ya cableado

## Estructura

```text
/
|- index.html
|- manifest.webmanifest
|- service-worker.js
|- packs/
|- src/
|- styles/
|- android/
|  |- app/
|  |  |- src/main/java/com/sopainfinita/app/
|  |  |- src/main/res/
|  |  `- src/main/assets/www/
|  |- build.gradle.kts
|  |- gradle.properties
|  `- settings.gradle.kts
`- scripts/
   `- sync-android-assets.ps1
```

## Como ejecutarlo en navegador

La app puede abrirse como sitio estatico. Para que el Service Worker funcione correctamente, conviene levantar un servidor local simple.

### Opcion 1: Python

```bash
python -m http.server 8080
```

Abrir `http://localhost:8080`.

### Opcion 2: VS Code Live Server

Abrir el proyecto y servir `index.html`.

## Arquitectura y decisiones

- `GameController` coordina flujo, timer, ranked daily, rewarded hints, share, persistencia y bridge nativo.
- `WordSearchEngine` crea la partida a partir de categoria, dificultad, modo y seed.
- `GridGenerator` intenta colocar todas las palabras requeridas, priorizando cruces validos y regenerando si la combinacion falla.
- `GridView` abstrae la interaccion tactil con `pointer events` para unificar touch y mouse.
- `ContentManager` centraliza categorias y mezcla contenido integrado con fuentes externas sin tocar el motor.
- `PackLoader` es la unica pieza que conoce el formato JSON de packs remotos.
- `NativeBridge` encapsula share, analytics, rewarded y futuras placements nativas como mejora progresiva.

## Modos de juego

- `Clasica`: usa seed manual o aleatoria.
- `Diaria`: usa seed diaria para la combinacion actual y sirve para reproducibilidad/share.
- `Desafio diario`: usa un perfil fijo del dia, suma racha diaria y se bloquea tras completarse.
- `Crono`: registra tiempo y mejores marcas.
- `Zen`: oculta el reloj efectivo y no guarda records de tiempo.

## Desafio diario real

- El perfil diario se calcula de forma deterministica por fecha usando categorias integradas.
- Al completarlo, se registra la fecha y se actualiza la racha diaria.
- Si ya fue completado hoy, el boton `Desafio diario` queda bloqueado.
- Si el desafio de hoy esta en curso, el boton pasa a `Continuar diario`.

## Pistas y rewarded

- Cada partida arranca con una cantidad base de pistas segun el ritmo.
- Cuando se agotan, el boton puede convertirse en `Reward +1` si el bridge nativo expone rewarded.
- Si no hay bridge nativo, las pistas extra no se desbloquean y la app sigue funcionando sin romperse.

Contrato esperado en bridge nativo:

- `requestRewardedPlacement(placement, payload)` o `requestReward(placement, payload)`
- Debe devolver `true`, `rewarded`, o un objeto con `granted/rewarded`

## Como ampliar categorias integradas

Editar [src/data/categories.js](</c:/Documentos/Juegos Procedurales/Sopa de letras/src/data/categories.js:1>).

Cada categoria usa esta forma:

```js
{
  id: 'my-pack',
  label: 'Mi pack',
  description: 'Descripcion corta',
  words: ['PALABRA', 'OTRA', 'OTRA_MAS']
}
```

## Como cargar packs externos o remotos

### Opcion A: manifest local

Editar [packs/manifest.json](</c:/Documentos/Juegos Procedurales/Sopa de letras/packs/manifest.json:1>) y agregar rutas JSON.

### Opcion B: UI

Usar el campo `Packs externos o remotos` de la pantalla inicial y cargar una ruta local o una URL remota.

### Gestion por fuente

El panel de fuentes permite:

- `Desactivar`: deja de ofrecer las categorias de esa fuente
- `Activar`: vuelve a publicarlas
- `Quitar`: elimina la fuente solo si fue agregada por el usuario

### Formato JSON soportado

```json
{
  "source": {
    "id": "creative-pack",
    "label": "Pack creativo"
  },
  "packs": [
    {
      "id": "mythology",
      "label": "Mitologia",
      "description": "Descripcion",
      "words": ["ZEUS", "HADES", "ATENEA"]
    }
  ]
}
```

Tambien se acepta un array directo de packs.

## Persistencia

Se guardan en `localStorage`:

- categoria seleccionada
- dificultad seleccionada
- modo de juego y ritmo
- tema actual
- seed manual
- fuentes externas agregadas por el usuario
- fuentes pausadas por el usuario
- partida en curso
- estadisticas generales
- progreso de desafio diario y racha diaria

La partida activa se persiste de forma incremental y se restaura automaticamente al recargar. Los desafios diarios ranked vencidos no se restauran al dia siguiente.

## Share y seed links

El boton `Compartir` genera un link con:

- categoria
- dificultad
- modo
- ritmo
- seed
- packs externos necesarios para reproducir la partida

Si el entorno soporta `navigator.share`, se usa ese canal. Si no, intenta `clipboard`. En Android puede resolverse por bridge nativo.

## Bridge nativo opcional

La clase [NativeBridge.js](</c:/Documentos/Juegos Procedurales/Sopa de letras/src/core/NativeBridge.js:1>) busca opcionalmente `window.AndroidBridge` y soporta:

- `trackEvent(name, payload)`
- `shareText(text, title)`
- `requestPlacement(placement, payload)`
- `requestRewardedPlacement(placement, payload)` o `requestReward(placement, payload)`

La app funciona igual en navegador si el bridge no existe.

## Contenedor Android incluido

- [android](</c:/Documentos/Juegos Procedurales/Sopa de letras/android/settings.gradle.kts:1>) contiene un proyecto Android minimo con `WebView`.
- [MainActivity.kt](</c:/Documentos/Juegos Procedurales/Sopa de letras/android/app/src/main/java/com/sopainfinita/app/MainActivity.kt:1>) carga la app desde `assets/www/index.html` mediante `WebViewAssetLoader`.
- [WebAppBridge.kt](</c:/Documentos/Juegos Procedurales/Sopa de letras/android/app/src/main/java/com/sopainfinita/app/WebAppBridge.kt:1>) expone `trackEvent`, `shareText`, `requestPlacement` y rewarded como stub.
- [scripts/sync-android-assets.ps1](</c:/Documentos/Juegos Procedurales/Sopa de letras/scripts/sync-android-assets.ps1:1>) sincroniza la version web actual dentro de `android/app/src/main/assets/www/`.

## Como abrir la version Android

1. Ejecutar `powershell -ExecutionPolicy Bypass -File .\scripts\sync-android-assets.ps1`
2. Abrir la carpeta `android/` en Android Studio
3. Esperar el sync de Gradle
4. Ejecutar el modulo `app` en emulador o dispositivo

En Android, el offline principal viene de los assets empaquetados. El `service worker` sigue siendo util para navegador y no deberia ser tu dependencia principal dentro del `WebView`.

## Simplificaciones explicitas

- El desafio diario real usa categorias integradas para mantener estabilidad entre instalaciones.
- Las pistas rewarded no fuerzan un SDK web; dependen del bridge nativo opcional.
- Los packs remotos dependen de que la URL responda JSON valido y permita ser consumida por el navegador o `WebView`.
- El bridge Android queda listo, pero analytics y rewarded siguen en modo stub hasta conectar SDKs reales.

## Preparacion para Android Studio

- No hay dependencias web de build ni frameworks externos.
- Toda la logica vive en archivos estaticos faciles de sincronizar a `android/app/src/main/assets/www/`.
- La persistencia local ya funciona con `localStorage`, compatible con `WebView`.
- El bridge nativo ya esta encapsulado para integraciones futuras.
- La UI es tactil, sin sprites ni assets pesados.

Mas detalle en [ANDROID_MIGRATION.md](</c:/Documentos/Juegos Procedurales/Sopa de letras/ANDROID_MIGRATION.md:1>).
