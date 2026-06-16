# QA Checklist

## Logica base

- [ ] El primer movimiento nunca revela una mina.
- [ ] El primer movimiento despeja una zona inicial util.
- [ ] La cantidad de minas coincide con la dificultad elegida.
- [ ] Los numeros vecinos son correctos en todo el tablero.
- [ ] El flood reveal abre regiones vacias y bordes numerados correctamente.
- [ ] El chord sobre numeros revelados abre vecinos correctamente cuando las banderas coinciden.

## Interaccion

- [ ] Tap revela cuando el modo principal es `Revelar`.
- [ ] Tap marca bandera cuando el modo principal es `Bandera`.
- [ ] Long press en movil marca o desmarca bandera.
- [ ] Click derecho en desktop marca o desmarca bandera.
- [ ] No se puede revelar una celda marcada.
- [ ] El seed manual reproduce el mismo tablero con la misma apertura.
- [ ] El codigo `bp1|...` reproduce dificultad, seed y apertura automaticamente.
- [ ] Copiar codigo funciona en navegador y en `WebView`.
- [ ] Compartir codigo abre share sheet en Android o `navigator.share` en web compatible.

## Estados de partida

- [ ] Victoria se detecta al revelar todas las celdas seguras.
- [ ] Derrota se detecta al revelar una mina.
- [ ] El tablero se bloquea en pausa.
- [ ] El cronometro se congela durante la pausa.
- [ ] Reiniciar actual conserva la misma configuracion.
- [ ] Nueva partida usa la dificultad seleccionada en el panel.
- [ ] En modo zen una mina tocada no produce derrota y se auto-marca.
- [ ] En modo zen no corre el cronometro.

## Persistencia

- [ ] Una partida en curso se restaura tras refresh.
- [ ] Dificultad y configuracion personalizada se conservan.
- [ ] Modo zen y seed/codigo se conservan.
- [ ] Tema y modo tactil se conservan.
- [ ] Las estadisticas sobreviven al refresh.

## UI y responsive

- [ ] El tablero es legible en movil portrait.
- [ ] El tablero sigue siendo usable en escritorio.
- [ ] El tema claro se ve consistente.
- [ ] El tema oscuro se ve consistente.
- [ ] Los modales de pausa, victoria y derrota son claros.
- [ ] El tablero dificil sigue siendo usable en moviles angostos mediante scroll horizontal controlado.

## Android / WebView

- [ ] La app corre dentro de `WebView` con `domStorageEnabled = true`.
- [ ] La sesion persiste entre aperturas de la app.
- [ ] El boton back no rompe la experiencia.
- [ ] No hay dependencia de red para jugar.
- [ ] Los hooks `BuscaminasApp` funcionan desde `WebView`.
