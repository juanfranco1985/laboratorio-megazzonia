# QA Checklist

## Generacion y motor

- [ ] Generar varias partidas por cada dificultad.
- [ ] Confirmar que cada puzzle tenga solucion unica.
- [ ] Verificar que la solucion generada completa sea valida en filas, columnas y subcuadriculas.
- [ ] Revisar que Facil, Media, Dificil y Experto cambien cantidad de pistas y carga de resolucion.

## Gameplay

- [ ] Seleccionar celdas con mouse.
- [ ] Seleccionar celdas con toque en movil.
- [ ] Ingresar numeros del 1 al 9 desde keypad.
- [ ] Ingresar numeros del 1 al 9 desde teclado fisico.
- [ ] Borrar una celda editable.
- [ ] Confirmar que una celda fija no pueda alterarse.
- [ ] Activar modo notas y alternar candidatos.
- [ ] Confirmar que al poner valor se limpien notas de la celda.

## Validacion visual

- [ ] Resaltar fila, columna y caja de la celda activa.
- [ ] Resaltar coincidencias del valor seleccionado.
- [ ] Marcar duplicados/conflictos al repetir numeros.
- [ ] Activar y desactivar "mostrar errores".
- [ ] Confirmar que errores de solucion solo aparezcan si la opcion esta activa.

## Flujo de partida

- [ ] Cronometro inicia al empezar.
- [ ] Pausa congela el tiempo.
- [ ] Continuar reanuda el tiempo.
- [ ] Undo revierte valor o nota.
- [ ] Redo reaplica la accion revertida.
- [ ] Reiniciar vuelve el tablero al estado inicial.
- [ ] Nueva partida permite elegir dificultad.
- [ ] Daily challenge usa semilla estable para la misma fecha.
- [ ] La victoria aparece solo al completar correctamente el puzzle.
- [ ] La victoria actualiza estadisticas.

## Persistencia

- [ ] Recargar la pagina con partida activa.
- [ ] Confirmar continuacion automatica.
- [ ] Confirmar que al volver a abrir la app arranque en el menu principal con tarjeta de reanudacion.
- [ ] Confirmar que "Descartar partida" elimina la sesion guardada.
- [ ] Verificar que notas, tiempo y dificultad se mantengan.
- [ ] Cambiar tema y recargar.
- [ ] Cambiar "mostrar errores" y recargar.
- [ ] Confirmar que las estadisticas sigan presentes.

## Responsive y tactil

- [ ] Probar ancho movil pequeno.
- [ ] Probar tablet / desktop.
- [ ] Confirmar botones con area tactil comoda.
- [ ] Activar modo sin distracciones y verificar que el tablero gane protagonismo sin romper controles.
- [ ] Revisar que el tablero mantenga proporcion 1:1.
- [ ] Validar orientacion vertical como flujo principal.

## Tema visual

- [ ] Tema claro legible.
- [ ] Tema oscuro legible.
- [ ] Cambio de tema desde home.
- [ ] Cambio de tema durante partida.

## Offline

- [ ] Cargar el juego servido por HTTP.
- [ ] Confirmar cache inicial del service worker.
- [ ] Reabrir sin red despues de haber cargado una vez.

## Android packaging futuro

- [ ] Verificar carga desde assets en WebView.
- [ ] Confirmar persistencia con `domStorageEnabled`.
- [ ] Confirmar que el espejo nativo de almacenamiento restaure partida y settings al reabrir la app.
- [ ] Verificar `window.SudokuApp.handleSystemBack()` desde wrapper nativo.
- [ ] Verificar puente `requestRewardedHint()` cuando exista rewarded ad real.
- [ ] Validar boton back contra modales y pausa.
- [ ] Revisar comportamiento al mandar la app al background y volver.
- [ ] Confirmar que `onHostPause()` pause y guarde la partida al minimizar.
- [ ] Confirmar que `onHostResume()` deje la partida consistente al volver.
