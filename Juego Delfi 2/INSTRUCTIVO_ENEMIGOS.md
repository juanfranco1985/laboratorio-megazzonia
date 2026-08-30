# Juego Delfi 2 — Especificación de enemigos

Fecha de normalización: 12 de agosto de 2026.

## Alcance

Este documento convierte el concepto original en una especificación utilizable para diseño y programación. Los valores son relativos porque el protagonista, su movilidad y su combate se definirán después.

## Escalas provisionales

- Daño bajo: contacto frecuente o castigo menor.
- Daño medio: ataque evitable que afecta el encuentro sin decidirlo por sí solo.
- Daño alto: ataque excepcional, muy anunciado y difícil de encadenar.
- Alcance cercano, medio y lejano: se calcularán después a partir de la pantalla y movilidad del protagonista.

## Reglas globales

- Todo ataque tendrá anticipación visual y, cuando corresponda, sonora.
- Ralentización, ceguera, hipnosis, deglución y transporte concederán inmunidad temporal al terminar.
- Dos enemigos no podrán encadenar indefinidamente efectos que quiten control.
- Todo enemigo camuflado conservará una pista: ojos, silueta, brillo, movimiento o alteración del entorno.
- Proyectiles, áreas peligrosas y superficies alteradas deberán distinguirse del fondo.
- Efectos y proyectiles reutilizables se exportarán separados del cuerpo del enemigo.

## Catálogo funcional

### 01. Caracol (`snail`)

- Rol y activación: controlador de terreno; patrulla lentamente de forma permanente.
- Bucle: caminar → depositar baba → continuar.
- Efecto: ralentiza únicamente mientras el jugador pisa la baba; sin daño directo.
- Contrajuego: saltar el rastro o abandonar la superficie.
- Estados/animaciones: `idle`, `walk`, `trail`, `hit`, `defeated`; baba separada.
- Pendiente: duración del rastro y porcentaje de ralentización.

### 02. Cangrejo (`crab`)

- Rol y activación: perseguidor territorial; detecta al jugador a alcance medio.
- Bucle: patrullar → alertarse → perseguir → pellizcar → recuperarse.
- Efecto: pellizco de daño medio.
- Contrajuego: distancia, desnivel o ataque durante la recuperación.
- Estados/animaciones: `idle`, `patrol`, `alert`, `chase`, `pinch`, `recover`, `hit`, `defeated`.

### 03. Jirafa (`giraffe`)

- Rol y activación: artillería de pradera; comienza comiendo pasto.
- Bucle: comer → levantar cabeza → apuntar → escupir planta → volver a comer.
- Efecto: proyectil vegetal de daño medio.
- Contrajuego: moverse durante la elevación de la cabeza.
- Estados/animaciones: `graze`, `notice`, `aim`, `spit`, `recover`, `hit`, `defeated`; proyectil separado.

### 04. Pinkegg (`pink_egg`)

- Rol y activación: emboscador; parece adorable hasta que el jugador se acerca.
- Bucle: reposo tierno → transformación → mordida → recuperación.
- Efecto: mordida de daño medio.
- Contrajuego: provocar la transformación desde una posición segura.
- Estados/animaciones: `cute_idle`, `notice`, `transform`, `bite`, `recover`, `hit`, `defeated`.

### 05. Mono (`monkey`)

- Rol y activación: atacante vertical limitado a zonas con árboles.
- Bucle: trepar → observar → saltar hacia abajo → patadas → regresar.
- Efecto: patadas de daño medio y posible empuje.
- Contrajuego: salir del marcador de caída y atacar durante el regreso.
- Estados/animaciones: `tree_idle`, `climb`, `aim`, `dive`, `kick`, `recover`, `return`, `hit`, `defeated`.

### 06. Grupo de osos (`bear_group`)

- Rol y activación: perseguidor colectivo; se alerta al encontrar al jugador.
- Bucle: caminar en formación → perseguir → ataques individuales.
- Retirada: si el jugador se aleja o mueren al menos tres integrantes.
- Efecto: daño bajo por oso, peligro alto por acumulación.
- Contrajuego: separar al grupo y reducir su moral eliminando tres miembros.
- Estados: grupo `wander/alert/chase/retreat/disbanded`; individuo `walk/attack/hit/defeated`.
- Pendiente: cantidad inicial exacta de osos.

### 07. Sodaash (`sodaash`)

- Rol y activación: rodillo persistente que busca al jugador.
- Bucle: orientar → acelerar → embestir → corregir trayectoria.
- Efecto: choque de daño medio.
- Contrajuego: saltar o atacar después de una colisión fallida.
- Salida: derrota o gran distancia respecto del jugador.
- Estados/animaciones: `idle`, `target`, `roll`, `collision`, `stunned`, `hit`, `defeated`.

### 08. Biter (`biter`)

- Rol y activación: perseguidor básico de corto alcance.
- Bucle: reposo → persecución → mordida → recuperación.
- Efecto: mordida de daño bajo/medio.
- Contrajuego: mantener distancia y castigar la recuperación.
- Estados/animaciones: `idle`, `chase`, `bite`, `recover`, `hit`, `defeated`.

### 09. Cotton Cloud (`cotton_cloud`)

- Rol y activación: perseguidor aéreo que aparece sobre el jugador.
- Bucle: seguir → lanzar algodón → perder masa → repetir.
- Recurso: cada ataque consume cuerpo; debe mostrar al menos tres etapas de degradación.
- Salida: se desintegra al agotar el algodón.
- Contrajuego: moverse para hacerle desperdiciar ataques.
- Estados/animaciones: `full`, `follow`, `throw`, `degraded_1`, `degraded_2`, `dissolve`.
- Pendiente: decidir si el algodón daña, ralentiza o ambas cosas.

### 10. Alien (`alien`)

- Rol y activación: tirador; necesita línea de visión.
- Bucle: patrullar → apuntar → disparar láser verde → enfriar arma.
- Efecto: daño medio.
- Contrajuego: romper línea de visión o saltar el disparo.
- Estados/animaciones: `idle`, `patrol`, `aim`, `fire`, `cooldown`, `hit`, `defeated`; láser separado.

### 11. Zebra (`zebra`)

- Rol y activación: amenaza transversal que entra desde un extremo.
- Bucle: aviso lateral → carga recta → salida por el otro extremo.
- Efecto: atropello de daño medio/alto.
- Contrajuego: saltar tras leer el aviso.
- Estados/animaciones: `warning`, `enter`, `charge`, `exit`, `defeated`.

### 12. Grayball (`gray_ball`)

- Rol y activación: rodillo camuflado entre fondos grises.
- Bucle: camuflaje → despertar → rodar → recuperación.
- Efecto: choque de daño medio.
- Contrajuego: reconocer su diferencia tonal y saltar.
- Estados/animaciones: `camouflaged`, `wake`, `roll`, `collision`, `recover`, `hit`, `defeated`.

### 13. Pingüino (`penguin`)

- Rol y activación: tirador terrestre de zona nevada.
- Bucle: recoger nieve → formar bola → apuntar → lanzar → recuperar.
- Efecto: daño bajo/medio.
- Contrajuego: moverse durante la preparación.
- Estados/animaciones: `idle`, `gather`, `aim`, `throw`, `recover`, `hit`, `defeated`; bola separada.

### 14. Foca (`seal`)

- Rol y activación: artillería acuática; busca peces al detectar al jugador.
- Bucle: nadar → obtener pez → apuntar → escupir → sumergirse.
- Efecto: pez de daño medio con trayectoria anunciada.
- Contrajuego: moverse después del lanzamiento.
- Estados/animaciones: `swim`, `search`, `ready`, `spit`, `dive`, `hit`, `defeated`; pez separado.

### 15. Faketree (`fake_tree`)

- Rol y activación: emboscador de bosque; los ojos revelan el camuflaje.
- Bucle: árbol quieto → seguimiento ocular → levantar rama → barrido → recuperar.
- Efecto: golpe de daño medio.
- Contrajuego: respetar el radio o saltar el barrido.
- Estados/animaciones: `camouflaged`, `watch`, `windup`, `branch_swing`, `recover`, `hit`, `defeated`.

### 16. Sapo (`swallow_frog`)

- Rol y activación: capturador territorial de proximidad.
- Bucle: reposo → amenaza → lengua → tragar → retener brevemente → escupir → retirarse.
- Efecto: daño medio y pérdida breve de control.
- Contrajuego: evitar la lengua o ejecutar una acción de escape.
- Estados/animaciones: `idle`, `warn`, `tongue`, `swallow`, `hold`, `spit`, `leave`.

### 17. Meteor y Fire Ghost (`meteor_fire_pair`)

- Rol y activación: peligro aéreo sincronizado.
- Bucle: sombra de aviso → caída conjunta → impacto.
- Efecto: daño alto si alcanzan al jugador.
- Salida: ambos desaparecen al impactar contra el suelo; se resuelven como una pareja.
- Contrajuego: abandonar el área marcada.
- Estados/animaciones: `warning`, `fall`, `impact_player`, `impact_ground`, `defeated`.

### 18. Star Friend (`star_friend`)

- Rol y activación: controlador luminoso que aparece frente al jugador.
- Bucle: flotar → cargar brillo → destello → enfriamiento/salida.
- Efecto: hipnosis o inmovilización breve, inicialmente sin daño.
- Contrajuego: salir del cono luminoso o cubrirse.
- Estados/animaciones: `float`, `charge`, `flash`, `cooldown`, `leave`.
- Accesibilidad: evitar parpadeos agresivos y ofrecer reducción de flashes.

### 19. Tear Drop (`lava_tear`)

- Rol y activación: peligro de techo formado por vapor.
- Bucle: condensar → crecer → desprenderse → caer → salpicar.
- Efecto: daño medio y posible zona caliente breve.
- Contrajuego: observar el techo y salir del marcador.
- Estados/animaciones: `forming`, `ready`, `fall`, `splash`, `evaporate`.

### 20. Sleeping Face (`sleeping_face`)

- Rol y activación: emboscador enterrado en arena.
- Bucle: camuflaje → despertar → inhalar → escupir arena → enterrarse.
- Efecto: visión obstruida e inmovilización breve.
- Contrajuego: detectar el rostro, mantener distancia o saltar la nube.
- Estados/animaciones: `buried`, `wake`, `inhale`, `spit_sand`, `recover`, `burrow`; nube separada.

### 21. Blob (`bush_blob`)

- Rol y activación: imitador de arbusto; su rostro sirve como pista.
- Bucle: camuflaje → revelación → mordida → comprobar evasión.
- Reacción: si el jugador lo salta, se reubica en el extremo opuesto del área.
- Efecto: daño medio.
- Contrajuego: detectar el rostro y saltar para forzar la reubicación.
- Estados/animaciones: `camouflaged`, `notice`, `bite`, `miss`, `relocate`, `hit`, `defeated`.

### 22. Flower Trio (`flower_trio`)

- Rol y activación: controlador ambiental por proximidad.
- Bucle: reposo → florecer → liberar polen → agotarse → recuperar.
- Efecto: desmayo breve si el jugador permanece demasiado cerca.
- Contrajuego: cruzar rápido, evitar la nube o desactivar flores.
- Estados/animaciones: `idle`, `bloom`, `release`, `exhausted`, `recover`, `defeated`; polen separado.
- Pendiente: el nombre dice tres flores y el texto original menciona dos.

### 23. Jumpin Dolphin (`jumping_dolphin`)

- Rol y activación: transporte neutral e impredecible.
- Bucle: nadar → saltar → recoger → ruta riesgosa o segura → soltar.
- Resultado probable: acerca al jugador a un enemigo.
- Resultado favorable: lo adelanta evitando amenazas.
- Contrajuego: aceptar o evitar voluntariamente su trayectoria.
- Estados/animaciones: `swim`, `approach`, `jump`, `carry_risky`, `carry_safe`, `release`, `leave`.
- Pendiente: sugerencia inicial de prueba, 70 % riesgoso y 30 % favorable.

### 24. Cat (`false_cat`)

- Rol y activación: encuentro de paciencia y engaño; pide ayuda con maullidos.
- Regla: permanecer quieto diez segundos y no acercarse antes de tiempo.
- Fallo: revela su identidad, araña, quita vida y abandona el nivel.
- Persistencia: no vuelve hasta el siguiente nivel.
- Estados/animaciones: `call_for_help`, `wait_test`, `reveal`, `scratch`, `leave`, `resolved`.
- Pendiente crítico: definir la recompensa o resolución positiva de esperar correctamente.

### 25. Dogballoon (`dog_balloon`)

- Rol y activación: capturador aéreo; deambula hasta detectar al jugador.
- Bucle: perseguir durante cinco segundos → pincharse si falla o capturar si alcanza.
- Escape: saltar durante el ascenso hace que libere al jugador y continúe solo.
- Fallo: si no reacciona, eleva al jugador y lo deja caer, causando daño.
- Estados/animaciones: `wander`, `notice`, `pursue_5s`, `pop`, `capture`, `ascend`, `release`, `drop`, `leave`.

## Familias técnicas reutilizables

- Persecución terrestre: Cangrejo, Biter y osos.
- Carga/rodamiento: Zebra, Grayball y Sodaash.
- Emboscada/camuflaje: Pinkegg, Faketree, Sleeping Face, Blob y Cat.
- Ataque a distancia: Jirafa, Alien, Pingüino y Foca.
- Peligro aéreo: Cotton Cloud, Meteor/Fire Ghost y Dogballoon.
- Captura/control: Sapo, Star Friend, Sleeping Face y Dogballoon.
- Control de terreno: Caracol, Tear Drop y Flower Trio.
- Transporte neutral: Jumpin Dolphin.

## Próxima decisión

Antes de fijar números debe definirse el protagonista: tamaño, velocidad, altura de salto, vida, invulnerabilidad, ataque, acciones de escape y capacidad de cubrirse.
