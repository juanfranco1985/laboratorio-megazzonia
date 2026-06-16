# Estado actual del proyecto

Fecha de ultima actualizacion: 2026-05-17

## Resumen

El proyecto es una suite de 20 juegos procedurales integrados en una misma aplicacion para navegador y Android. La version web funciona como app estatica en `web/`, y Android carga esos mismos archivos mediante WebView desde `android/app/src/main/assets/www/`.

## Plataformas

- Navegador: abrir `web/index.html`.
- Android: abrir `android/` en Android Studio o compilar con Gradle. La tarea `syncWebAssets` copia automaticamente `web/` hacia los assets Android.

## Juegos incluidos

1. Cripta de Relicarios
2. Fragua de Asteroides
3. Rescate Coralino
4. Rieles del Cielo
5. Serpiente de Neon
6. Carrera de Meteoros
7. Alquimia de Glifos
8. Jardin Centinela
9. Pulso de Ciudad
10. Caravana de Sal
11. Cosecha Orbital
12. Mensajeria Polar
13. Guardian del Ritmo
14. Forja Volcanica
15. Biblioteca Fantasma
16. Nanobots Inmunes
17. Minas de Senal
18. Archipielago Nuboso
19. Cartografo Estelar
20. Pinball de Cristal

## Sistemas implementados

- Motor comun canvas 16:9.
- Entrada por teclado y controles tactiles.
- Semillas procedurales reproducibles.
- Hub con biblioteca de juegos.
- Perfiles locales con 3 slots.
- Nombre de perfil editable.
- Mejores marcas, tiempos, victorias, derrotas y puntuacion acumulada.
- Logros globales, por juego, por campana y por tutoriales.
- Favoritos por perfil.
- Filtros por busqueda, genero, dificultad, duracion y favoritos.
- Modo Libre.
- Modo Campana con 8 niveles por juego.
- Desbloqueo progresivo de niveles.
- Curva de dificultad por nivel.
- Audio procedural con Web Audio.
- Mute y volumen persistentes.
- Musica ligera por categoria.
- SFX de seleccion, puntos, dano, victoria, derrota, logros y desbloqueos.
- Feedback visual comun: particulas, flash, shake y textos flotantes.
- Toasts para logros y niveles desbloqueados.
- Overlay final con puntos, mejor marca y tiempo.
- Onboarding del hub.
- Tutorial contextual por cada juego.
- Boton `?` para repetir tutorial.
- Toggle para mostrar u ocultar tutoriales nuevos.
- Guias visuales sobre canvas.
- Service worker para PWA cuando se sirve por HTTP/HTTPS.

## Archivos principales

- `web/index.html`: estructura de UI.
- `web/styles.css`: estilos responsivos.
- `web/main.js`: motor, juegos, perfiles, campana, audio, feedback y tutoriales.
- `web/manifest.webmanifest`: manifiesto PWA.
- `web/sw.js`: cache basico.
- `web/icon.svg`: icono PWA.
- `android/`: wrapper Android WebView.
- `scripts/sync-android.ps1`: sincronizacion manual de assets web a Android.
- `tests/smoke.mjs`: smoke tests automatizados con DOM/canvas simulado.
- `README.md`: instrucciones generales.

## Estado Android

Los assets web estan sincronizados en:

`android/app/src/main/assets/www/`

La app Android usa:

- `MainActivity.java` con WebView.
- `file:///android_asset/www/index.html`.
- Gradle con tarea `syncWebAssets` antes de `preBuild`.
- Gradle Wrapper (`gradlew`, `gradlew.bat`, `gradle/wrapper`) para no depender de Gradle global.

## Cambios recientes

- Separado el flujo web en preparacion y partida: la pantalla de preparacion muestra biblioteca, previews, configuracion y boton `PLAY`; al jugar se ocultan los menus y el canvas se maximiza.
- Agregada accion `Siguiente nivel` en el overlay de victoria de campana cuando existe un nivel posterior desbloqueado.
- Reordenada y descomprimida la columna izquierda para que la biblioteca de 20 juegos quede arriba como lista principal con scroll propio y muestre al menos 3 juegos completos; semilla, perfil y filtros quedan debajo como configuracion secundaria compacta.
- Agregadas miniaturas visuales compactas en las tarjetas de la biblioteca y salida de partida con `Esc` para volver a configuracion.
- Agregado cache busting para `styles.css` y `main.js`, y actualizado el service worker a `procedural-playworks-v11`.
- Corregida la generacion de Serpiente de Neon para evitar solapes entre serpiente, comida, portales y bloques.
- Corregido Minas de Senal para reservar una apertura segura en la celda inicial y evitar balizas duplicadas.
- Corregido el cruce de tutoriales al cambiar de juego o perfil.
- Estabilizados los fondos estelares para que no consuman RNG visual en cada frame.
- Agregadas salvaguardas de jugabilidad en Alquimia de Glifos, Mensajeria Polar y Cartografo Estelar.
- Mejorado el service worker con version nueva, `skipWaiting`, `clients.claim` y estrategia network-first con fallback offline.
- Agregado icono PWA en el manifiesto.
- Agregado manejo de ciclo de vida de WebView en Android (`onPause`, `onResume`, `onDestroy`).
- Agregado `touch-action: none` en canvas y controles tactiles.
- Agregada suite `tests/smoke.mjs`.

## Verificaciones recientes

Comandos ejecutados correctamente:

```powershell
node --check web\main.js
node --check web\sw.js
node --check android\app\src\main\assets\www\main.js
node --check android\app\src\main\assets\www\sw.js
node --test tests\smoke.mjs
powershell -ExecutionPolicy Bypass -File scripts\sync-android.ps1
```

Verificaciones adicionales del layout web ejecutadas el 2026-05-17:

```powershell
node --check web\main.js
node --check web\sw.js
node --test tests\smoke.mjs
```

Tambien se verifico visualmente el layout de escritorio con Edge headless a 1440x900.

Smoke tests realizados con DOM simulado:

- Carga de los 20 juegos.
- Render de los 20 juegos.
- Perfil, progreso y logros.
- Filtros y favoritos.
- Campana, desbloqueo de nivel 2 y nivel 8 forzado en los 20 juegos.
- Audio mute/volumen, feedback, dano, victoria y notificaciones.
- Tutorial del hub, tutorial por juego, persistencia, toggle y guia visual.

## Limitaciones conocidas

- No se completo una prueba visual real con Playwright porque la descarga de Chromium quedo sin tiempo en una ejecucion anterior.
- No se pudo ejecutar Gradle en esta maquina porque no hay Java/JDK en `PATH` ni `JAVA_HOME`; el wrapper ya esta incorporado.
- `web/main.js` concentra mucho codigo; el siguiente trabajo tecnico fuerte deberia modularizarlo.
- El audio procedural es sintetico y liviano; no hay assets musicales externos.
- Las pruebas actuales son smoke tests simulados; falta una suite visual real en navegador.

## Proximos paquetes recomendados

1. Modularizacion del codigo en archivos por sistema y por juego.
2. Prueba visual real con Playwright en desktop y movil.
3. Controles moviles configurables.
4. Misiones diarias/semanales con semillas compartibles.
5. Pulido de balance por juego y campana.

## Regla de mantenimiento

Este documento debe actualizarse al final de cada paquete de trabajo relevante para dejar asentado:

- Cambios implementados.
- Archivos principales modificados.
- Verificaciones ejecutadas.
- Limitaciones o riesgos pendientes.
- Siguiente paquete recomendado.
