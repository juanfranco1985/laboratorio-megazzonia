# Roadmap del nivel 1 — Pradera

## Visión

La Pradera debe ser una aventura introductoria de 4 a 6 minutos, no una sucesión de plataformas. Su misión es enseñar movimiento, salto, enemigos, poderes, checkpoint, rutas alternativas, cristales y portal sin recurrir a textos largos.

Dirección visual: valle fantástico luminoso conectado al Nexo dimensional. El recorrido comienza por la mañana y termina con luz cálida frente al portal. Referencia aprobada: [concepto panorámico](output/concepts/pradera-nivel-1-concepto-v1.png).

La arquitectura detallada de botes, interiores, bifurcaciones y gemas está en el [mapa técnico de los tres elementos](NIVEL_1_MAPA_TECNICO.md).

## Diagnóstico actual

- Diez plataformas estiradas con poca variedad de silueta.
- Dos enemigos y un solo peligro, sin progresión pedagógica.
- Los tres cristales no definen rutas ni desafíos diferentes.
- Fondo único sin parallax ni hitos visuales.
- Checkpoint, rebote y portal existen, pero no forman escenas memorables.
- El arte y los colliders ya están separados, pero falta un kit modular coherente.

## Métricas de diseño

Con la física actual, Delfi recorre aproximadamente 240 px en un salto completo y Nova 277 px. La altura máxima ronda 120–136 px.

- Hueco inicial seguro: 90–140 px.
- Hueco normal: 140–175 px.
- Desafío opcional: 180–215 px.
- Escalón vertical habitual: 45–80 px.
- Escalón vertical máximo sin rebote: 100 px.
- Ningún salto obligatorio debe exigir precisión extrema.
- Cada superficie física debe coincidir visualmente con su borde superior.

## Recorrido propuesto

| Zona | Coordenadas | Función | Contenido |
|---|---:|---|---|
| 1. Claro de llegada | 0–800 | Enseñar caminar y saltar | Piso seguro, dos huecos pequeños, cartel visual, primer Caracol |
| 2. Arroyo de madera | 800–1700 | Introducir caída y rutas | Puente modular, troncos, agua segura con salida, cristal 1 visible |
| 3. Molino del checkpoint | 1700–2600 | Enseñar guardado y bifurcación | Molino, checkpoint, ruta baja sencilla y ruta alta con recompensa |
| 4. Campo de heno | 2600–3600 | Combinar rebote y peligro | Fardos, dos rebotes, charcos de limo, Escarabajo, cristal 2 elevado |
| 5. Jardín del portal | 3600–4600 | Examen breve y cierre | Plataformas florales, enemigo volador, cristal 3, corazón opcional y portal seguro |

## Enemigos

### Caracol de musgo

- Primer enemigo; patrulla lenta y predecible.
- Un impacto, vulnerable al salto y a cualquier poder.
- Se presenta primero en terreno completamente seguro.
- Animación: avanzar, pestañear, esconderse brevemente.

### Escarabajo guardián

- Sustituye al cangrejo en la Pradera para mantener coherencia temática.
- Dos impactos; caparazón resistente de frente.
- Se derrota saltando encima o atacando desde atrás.
- Animación: caminar, advertir con cuernos y quedar aturdido.

### Polilla de polen

- Primer enemigo aéreo, reservado para el último tercio.
- Describe una trayectoria ondulada corta y claramente anticipada.
- Un impacto; nunca debe atacar sobre un salto ciego.
- Sirve como preparación para enemigos voladores posteriores.

### Limo

- Sigue siendo peligro de escenario, no enemigo.
- Color verde brillante, burbujas y borde inequívoco.
- Primero ralentiza; una variante profunda puede causar daño solo al final.

## Kit de plataformas

- Suelo de pradera modular: inicio, centro, final y esquina; nunca estirar una única ilustración.
- Cornisas florales en tres anchos: 160, 240 y 320 px.
- Puente modular: cabecera, tramo y cuerda; collider continuo y poco profundo.
- Tronco horizontal para rutas bajas.
- Fardos de heno normales y fardos de rebote.
- Plataforma de piedra del portal con piso de seguridad integrado.
- Entrada de cueva opcional para un corazón o una vista secreta.

Los colliders seguirán siendo rectángulos de código independientes del dibujo. Las imágenes no determinarán la física.

## Cristales y recompensas

1. Cristal de movimiento: visible sobre el arroyo; enseña un salto normal.
2. Cristal de exploración: en la ruta alta del molino/campo de heno.
3. Cristal de dominio: cerca del portal, tras combinar enemigo, salto y rebote.

Recompensas secundarias:

- Un corazón en una cueva corta.
- Un mirador elevado sin recompensa obligatoria.
- Flores luminosas que indiquen la ruta principal sin usar flechas de interfaz.

## Producción de imágenes

### Fondos

- Cielo y nubes: capa distante, sin colisión.
- Colinas, pueblo y molino: capa media con parallax.
- Árboles y flores cercanas: capa frontal con movimiento más rápido.
- Gradación de mañana a atardecer a lo largo del nivel.

### Arte jugable

- Cuatro módulos de suelo con transparencia.
- Tres cornisas florales.
- Tres piezas de puente.
- Tronco, fardo normal, fardo de rebote y dos variantes de limo.
- Molino/checkpoint y santuario del portal.
- Props: carteles, flores, piedras, cercas, juncos y luciérnagas.

### Enemigos

- Hojas de 3–4 cuadros para Caracol, Escarabajo y Polilla.
- Fondo realmente transparente y márgenes consistentes.
- Collider definido por código; cada cuadro debe conservar el mismo punto de apoyo.

Las imágenes se producirán con la herramienta integrada, sin API Key facturable. Cada recurso se validará por transparencia, dimensiones y legibilidad antes de entrar en runtime.

## Fases

### Fase 1 — Graybox

- Reescribir la geometría en cinco zonas.
- Colocar los tres cristales y el checkpoint.
- Verificar todas las rutas con Delfi y Nova.
- Objetivo: que el nivel sea divertido aun con rectángulos provisionales.

### Fase 2 — Kit visual

- Generar fondos por capas y plataformas modulares.
- Implementar parallax y decoración sin colisión.
- Evitar estiramiento de texturas.

### Fase 3 — Enemigos

- Implementar Escarabajo y Polilla.
- Ajustar señales visuales, daño y recuperación.
- Distribuir enemigos con espacios de descanso.

### Fase 4 — Secretos y narrativa ambiental

- Añadir cueva, corazón y ruta alta.
- Usar molino, flores y ruinas para orientar al jugador.
- Convertir el checkpoint y el portal en hitos visuales.

### Fase 5 — Pulido

- Partículas de polen, agua, polvo, hojas y portal.
- Sonidos propios para puente, limo, rebote y checkpoint.
- Ajuste de cámara, ritmo y contraste.

### Fase 6 — QA

- Teclado, joystick y táctil.
- Delfi y Nova.
- Nueva partida, checkpoint, muerte, recarga y portal al mundo 2.
- Sin saltos ciegos, flotación, sprites inestables ni superficies desalineadas.

## Criterios de terminado

- Un jugador nuevo entiende todas las acciones sin explicación externa.
- Duración normal de 4–6 minutos.
- Tres cristales con desafíos distintos.
- Al menos una ruta alternativa y un secreto.
- Ningún salto obligatorio supera las métricas seguras.
- Portal accesible y con piso continuo.
- 60 FPS en escritorio y sin errores de recursos.
- Arte modular sin deformaciones visibles.

## Orden recomendado para la próxima sesión

1. Probar el graybox completo con Delfi y Nova, teclado y joystick.
2. Ajustar tiempos del bote, alturas y descansos según esa prueba humana.
3. Crear fondos, plataformas y enemigos por tandas pequeñas.
4. Reemplazar los volúmenes provisionales sin modificar sus colliders validados.
5. Integrar secretos, narrativa ambiental y pulido.

## Estado implementado — versión 0.9.0

- Recorrido jugable dividido en Llegada, Estructura del Tronco, Molino, Henal y Jardín del Portal.
- Bote automático de ida y bote de regreso habilitado por la primera gema.
- Ascenso vertical por el Tronco, balcón y primera gema.
- Molino con ruta interior y escalera exterior convergentes, checkpoint y segunda gema.
- Henal escalonado con peligros, enemigo provisional y tercera gema.
- Sellos físicos antes del Henal y del Jardín, abiertos por las gemas correspondientes.
- Recuperación segura al caer al agua y retorno automático de los botes para evitar bloqueos.
- Diez pruebas automáticas superadas; queda pendiente la prueba humana de ritmo y legibilidad.
