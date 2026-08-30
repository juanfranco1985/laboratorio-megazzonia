# Nivel 1 — Mapa técnico de los tres elementos

Referencia visual: [plano técnico SVG](output/concepts/pradera-nivel-1-mapa-tecnico-v1.svg).

## Estructura general

El nivel conserva 4600 px de ancho y se organiza como un viaje continuo con dos trayectos en bote y tres estructuras jugables.

```text
Llegada
  ↓
Muelle A → Bote de ida → Estructura del Tronco → Gema 1
                                           ↓
                                      Muelle B
                                           ↓
                              Bote de regreso al Molino
                                           ↓
                  Molino: interior fácil ↘   ↙ exterior difícil
                                      Cima → Gema 2
                                           ↓
                                  Laberinto de Heno
                                           ↓
                                        Gema 3
                                           ↓
                                   Portal al Desierto
```

## Distribución por coordenadas

| Tramo | X aproximada | Altura jugable | Propósito |
|---|---:|---:|---|
| Llegada y muelle A | 0–500 | Y 500–665 | Tutorial breve y embarque |
| Río de ida | 500–850 | Y 610 | Presentar el bote sin peligro severo |
| Estructura del Tronco | 850–1900 | Y 150–620 | Interior vertical, balcón y gema 1 |
| Río de regreso | 1900–2350 | Y 610 | Transición visual hacia el molino |
| Molino | 2350–3400 | Y 120–620 | Bifurcación interior/exterior y gema 2 |
| Henal | 3400–4200 | Y 250–640 | Laberinto, rebotes, limo y gema 3 |
| Jardín del portal | 4200–4600 | Y 500–665 | Cierre seguro y transición al mundo 2 |

## Elemento 1 — Estructura del Tronco

### Entrada

- El bote se detiene automáticamente en el muelle de raíces.
- El jugador desembarca sobre piso seguro.
- La única entrada principal es un tronco hueco horizontal.
- Flores luminosas y corriente de aire indican que el tronco se puede atravesar.

### Interior vertical

1. Cámara de raíces: Caracol de musgo y primer salto interior.
2. Pozo central: plataformas de corteza alternadas a izquierda y derecha.
3. Rama móvil: plataforma lenta que enseña a esperar y subir.
4. Cámara de savia: pequeño charco de limo y corazón opcional.
5. Salida superior: pasadizo de tronco que desemboca en el balcón.

### Balcón y gema 1

- El balcón funciona como descanso y punto de observación.
- Desde allí se realiza un salto claro a una plataforma floral exterior.
- La primera gema está totalmente visible sobre esa plataforma.
- Al recogerla se activa una rampa de hojas que devuelve al jugador al muelle B.
- El bote de regreso no parte hasta que la gema 1 haya sido recogida.

### Enemigos y riesgos

- Un Caracol en la cámara de raíces.
- Una Polilla de polen cerca de la salida, sin colocarse sobre un salto ciego.
- Un único limo lento en la ruta del corazón; no bloquea la ruta principal.
- Caer dentro de la estructura devuelve a la última repisa segura.

## Elemento 2 — Molino

### Llegada y checkpoint

- El bote atraca directamente en la base del molino.
- El checkpoint está fuera de la puerta y se activa antes de elegir ruta.
- Desde el mismo punto se ven la puerta interior y la escalera exterior.

### Ruta A — Interior del molino

- Ruta más segura y narrativa.
- Plataformas formadas por vigas, sacos y engranajes detenidos.
- Un interruptor pone en marcha lentamente el mecanismo.
- El jugador asciende por tres niveles interiores.
- Contiene un corazón o poder secundario, pero no una gema adicional.
- Termina en una trampilla que conecta con la terraza superior.

### Ruta B — Escalera exterior

- Ruta más rápida y exigente.
- Escalera, balcones estrechos y dos saltos alrededor de las aspas.
- Una Polilla marca el ritmo, pero no empuja al jugador al vacío.
- Ofrece más riesgo a cambio de evitar el rompecabezas interior.
- Converge con la ruta A en la terraza superior.

### Cima y gema 2

- La segunda gema está en la punta del molino, visible desde la llegada.
- Ambas rutas deben poder alcanzarla con Delfi y Nova.
- Al recogerla, el molino orienta sus aspas y despliega una lona/rampa hacia el henal.
- La caída desde la cima conduce a la ruta siguiente, no a la muerte.

### Enemigos y riesgos

- Escarabajo guardián en la base interior.
- Polilla de polen en la ruta exterior.
- Engranajes lentos y muy visibles; causan empuje o daño leve.
- Ninguna aspa debe atravesar una plataforma sin señal anticipada.

## Elemento 3 — Henal

### Entrada

- La rampa del molino deposita al jugador sobre un gran fardo.
- La entrada parece un túnel abierto dentro del heno.
- La puerta del henal se habilita al recoger la gema 2.

### Laberinto

1. Pasillo superior de fardos: ruta principal visible.
2. Caída controlada al interior: impide regresar accidentalmente al molino.
3. Cámara de rebotes: dos fardos elásticos para ascenso vertical.
4. Pasillo del limo: alterna plataformas seguras y charcos.
5. Cámara central: Escarabajo y gema 3.
6. Salida de granero: atajo que se abre después de recoger la gema.

### Gema 3 y salida

- La tercera gema está en el núcleo del henal, no junto al portal.
- Al recogerla cambian las luces de violeta a dorado y se abre la salida.
- Un conducto de heno conduce al jardín exterior.
- El portal solamente se activa cuando el inventario registra las tres gemas.

### Enemigos y riesgos

- Un Escarabajo en un espacio amplio.
- Dos zonas de limo: ralentización primero, daño después.
- Una Polilla opcional protege el corazón secreto.
- Los fardos de rebote tienen color y animación distintos de los fardos normales.

## Jardín del portal

- Plataforma continua desde la salida del henal hasta el portal.
- Sin enemigos obligatorios después de obtener la gema 3.
- Tres pedestales se iluminan para representar las gemas.
- Si falta una gema, el portal permanece sólido y muestra cuál estructura falta.
- Con las tres gemas, el portal se vuelve atravesable y conduce al Desierto.

## Estados y bloqueos

| Estado | Se habilita |
|---|---|
| Inicio | Bote de ida |
| Gema 1 recogida | Rampa de regreso y bote al molino |
| Llegada al molino | Checkpoint y dos rutas |
| Gema 2 recogida | Rampa al henal y puerta de entrada |
| Gema 3 recogida | Salida del henal y portal activo |

Los bloqueos deben sentirse como consecuencias del mundo: bote que llega, molino que despliega una rampa, heno que abre un conducto y pedestales que energizan el portal. No deben parecer paredes invisibles.

## Objetos técnicos nuevos

- `boat-platform`: plataforma móvil con ruta, espera y transporte del jugador.
- `dock-trigger`: sensor de embarque y desembarque.
- `interior-trigger`: cambia fachada, iluminación y límites de cámara.
- `camera-zone`: fija la cámara durante ascensos verticales.
- `branch-platform`: plataforma móvil lenta.
- `mill-switch`: activa engranajes y atajo interior.
- `mill-ramp`: salida desplegable después de la gema 2.
- `hay-bounce`: rebote con animación propia.
- `structure-gate`: bloqueo visual dependiente de gema.
- `safe-fall-zone`: devuelve al último piso estable sin quitar vida en zonas tutoriales.

## Arquitectura recomendada

- Mantener todo dentro de `AdventureScene` y del mismo mundo de 4600 px.
- Construir interiores en el mismo rango X de cada fachada.
- Al entrar, atenuar la fachada y mostrar las plataformas interiores.
- Usar zonas de cámara para el ascenso del tronco y del molino.
- Guardar gema, checkpoint, interruptor y bote en el estado de la partida.
- Mantener arte y collider como entidades separadas.

## Orden de implementación

1. Graybox del recorrido completo y de ambos botes.
2. Interior del Tronco, balcón y gema 1.
3. Molino con las dos rutas y gema 2.
4. Henal, gema 3 y puerta de salida.
5. Estados de bloqueo y portal.
6. Enemigos.
7. Arte definitivo, parallax, partículas y sonido.
8. Prueba humana completa con teclado y joystick.

## Condiciones de aceptación

- El jugador entiende dónde embarcar sin texto obligatorio.
- No puede perder el bote ni quedar encerrado.
- La gema 1 exige atravesar el Tronco y salir por el balcón.
- Las dos rutas del Molino convergen correctamente en la gema 2.
- La gema 3 exige entrar al Henal.
- El portal no se activa antes de las tres gemas.
- Toda caída tiene muerte clara o recuperación segura; nunca un vacío accidental.
- Checkpoint, guardado y recarga conservan el capítulo alcanzado.
