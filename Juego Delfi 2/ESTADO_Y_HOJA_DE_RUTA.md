# Juego Delfi 2 — Estado, decisiones y hoja de ruta

Última actualización: 12 de agosto de 2026.

Este documento es el punto oficial de reanudación del proyecto. Al volver a trabajar en **Juego Delfi 2**, debe leerse primero y contrastarse únicamente con cambios posteriores que hayan quedado registrados en esta misma bitácora.

## Resumen ejecutivo

El proyecto pasó de ser una colección de 19 láminas conceptuales de enemigos a contar con:

- Un instructivo estructurado para 25 enemigos o entidades.
- Una dirección visual común para los dos protagonistas y siete universos.
- Siete fondos panorámicos y siete kits ambientales.
- Hojas de movimiento, poderes y objetos compartidos.
- 88 sprites individuales con transparencia real.
- Una copia runtime recortada y organizada con 95 PNG en total.
- Un prototipo técnico jugable en Phaser para validar escala, controles, cámara y colisiones.
- Una compilación de producción válida en `dist/`.

El juego todavía no posee niveles definitivos, historia de apertura cerrada, orden narrativo confirmado ni enemigos integrados al runtime. El prototipo actual es una sala de pruebas y no debe confundirse con el juego final.

## Premisa confirmada

Los protagonistas son dos hermanos, un niño y una niña. Viajan por distintos universos y se reencuentran al llegar al último mundo.

Universos confirmados:

1. Galaxia.
2. Lava.
3. Oscuridad.
4. Océano.
5. Fantasía.
6. Pradera.
7. Desierto.

El orden de esta lista no constituye el orden narrativo definitivo.

## Trabajo realizado

### 1. Auditoría de materiales originales

- Se inventariaron 19 PNG conceptuales situados en la raíz del proyecto.
- Se comprobó que las láminas originales declaran RGBA, pero tienen el fondo cuadriculado incrustado y no poseen transparencia utilizable.
- Se conservaron todos los originales sin modificaciones.
- Se asociaron las láminas con 25 entidades de juego.
- Se registraron hashes, tamaños, correspondencias y dudas en `asset-manifest.json` y `ASSET_MANIFEST.md`.

### 2. Instructivo de enemigos

El texto suministrado por el usuario se normalizó en `INSTRUCTIVO_ENEMIGOS.md` sin alterar la intención de las mecánicas. Incluye:

- Caracol, Cangrejo, Jirafa, Pinkegg, Mono y Group of Bears.
- Sodaash, Biter, Cotton Cloud, Alien, Zebra y Grayball.
- Pingüino, Foca, Faketree y Sapo.
- Meteor y Fire Ghost, Star Friend, Tear Drop y Sleeping Face.
- Blob, Flower Trio, Jumpin Dolphin, Cat y Dogballoon.

Todavía existen correspondencias visuales que deben confirmarse antes de recortar y animar todas las láminas originales.

### 3. Protagonistas y poderes

Se tomó como referencia obligatoria la ficha aportada por el usuario.

- El chico conserva cabello castaño corto, camiseta celeste y pantalón azul oscuro.
- La chica conserva cabello castaño largo, moño y vestido rosa.
- Cada protagonista posee ocho poses: reposo, dos pasos, carrera, despegue, salto, caída y celebración/reencuentro.
- Ambos cuentan con transformaciones de Fuego, Agua, Hielo y Rayo.
- Los sprites finales poseen transparencia real y están recortados individualmente.

### 4. Ambientes y objetos

Para cada universo se produjo:

- Un fondo panorámico 16:9.
- Plataforma larga y plataforma corta.
- Puente o paso estrecho.
- Elemento de rebote.
- Checkpoint temático.
- Elemento vertical o peligro secundario.
- Peligro o bloque característico.
- Marco de portal propio.

También se creó un kit compartido con portal apagado y activo, checkpoint, cristal dimensional, corazón, llave, bloque de recompensa y baliza de reencuentro.

La dirección de arte y la propuesta de distribución de enemigos están explicadas en `WORLD_ASSET_PLAN.md`. La relación máquina-legible de todos los elementos se encuentra en `world-assets-manifest.json`.

### 5. Preparación runtime

El script `scripts/prepare-runtime-assets.ps1`:

- Copia los siete fondos a `assets/runtime/`.
- Detecta el contorno visible de cada sprite.
- Recorta márgenes transparentes conservando un pequeño padding.
- Genera una estructura estable para personajes, objetos y mundos.

Resultado actual:

- 7 fondos runtime.
- 88 sprites runtime recortados.
- 95 PNG runtime en total.
- 117 PNG dentro de `assets/generated/`, incluyendo hojas maestras, recortes y cromas conservados para trazabilidad.

Si se regeneran o sustituyen los recursos generados, debe volver a ejecutarse este script antes de abrir el prototipo.

### 6. Prototipo técnico jugable

Se creó una aplicación web local con:

- Phaser 3.90.0.
- Vite 7.1.1.
- Resolución lógica 1280×720.
- Escenario horizontal técnico de 4600×720.
- Física Arcade.
- Movimiento lateral, aceleración, salto, caída y cambio de pose.
- Alternancia entre los dos hermanos.
- Cámara con seguimiento y parallax provisional.
- Acceso a los siete universos.
- Plataformas, rebote, checkpoint, daño, ralentización y portal.
- Reaparición y tres puntos de vida.
- Controles de teclado y botones táctiles.

La lógica principal está en `src/main.js`; la presentación externa está en `src/styles.css`.

## Decisiones técnicas provisionales

- Motor: Phaser 3.90.0.
- Empaquetador: Vite 7.1.1.
- Resolución lógica: 1280×720.
- Altura visual del protagonista: 112 px.
- Pivote de personajes y piezas: centro inferior.
- Mundo técnico: 4600 px de ancho.
- Cámara: seguimiento suavizado.
- Física: Arcade.
- Parallax: fondo fijo con desplazamiento interno y capa ambiental a factor 0.18.

Estos valores sirven para probar el juego. No están congelados y deben revisarse tras una sesión jugable.

## Controles del prototipo

- Flechas o WASD: movimiento.
- Espacio, W o flecha arriba: salto.
- C: alternar entre chico y chica.
- Q/E: universo anterior o siguiente.
- Números 1–7: seleccionar un universo.
- R: reaparecer en el último checkpoint.
- En dispositivos táctiles aparecen dirección y salto en pantalla.

## Cómo volver a ejecutar el proyecto

Desde PowerShell:

```powershell
cd "C:\Documentos\Laboratorio Megazzonia\Juego Delfi 2"
npm.cmd install
npm.cmd run dev
```

Abrir la dirección local indicada por Vite.

Para comprobar y compilar:

```powershell
npm.cmd run check
npm.cmd run build
```

Para regenerar los recortes runtime:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\prepare-runtime-assets.ps1
```

## Validaciones realizadas

- `npm.cmd run check`: correcto.
- `npm.cmd run build`: correcto.
- Compilación generada en `dist/`.
- Prueba local HTTP: respuesta 200.
- Captura headless generada para comprobar carga y renderizado.
- Auditoría de dependencias de producción: cero vulnerabilidades.
- Los 19 PNG conceptuales originales permanecen intactos.

Vite informa que el paquete JavaScript supera 500 kB debido principalmente a Phaser. Es una advertencia de optimización, no un error funcional, y puede abordarse antes de publicación.

## Limitaciones conocidas del estado actual

- El prototipo utiliza los fondos panorámicos como imágenes compuestas; todavía no existen cuatro capas artísticas independientes de parallax.
- Las poses son imágenes individuales intercambiadas por código, no atlas temporizados con animaciones completas.
- Las hitboxes son rectángulos provisionales.
- El recorrido es una sala técnica repetible, no siete niveles diseñados.
- Los marcos de portal no contienen todavía un efecto animado propio del runtime.
- Los checkpoints y peligros tienen lógica inicial, pero requieren feedback sonoro y VFX.
- No hay enemigos integrados, combate, proyectiles ni poderes funcionales.
- No hay menús, pausa, guardado, selección de partida, audio ni opciones de accesibilidad.
- No se ha probado formalmente en una matriz de navegadores y teléfonos.
- Las capturas `prototype-smoke.png` y `prototype-smoke-final.png` son artefactos de validación, no recursos del juego.

## Decisiones narrativas pendientes

No producir una cinemática definitiva hasta resolver:

1. Cómo ingresan los hermanos al primer universo.
2. Por qué se separan.
3. Si recorren rutas paralelas o si el jugador alterna entre ambos.
4. Orden de los siete mundos.
5. Mundo final del reencuentro.
6. Función narrativa exacta de cristales, llaves y portales.
7. Antagonista central o causa del desequilibrio dimensional.

## Dudas pendientes sobre enemigos

- Confirmar las regiones e identidades de la hoja colectiva `Gemini_Generated_Image_hdpb4fhdpb4fhdpb.png`.
- Confirmar si `Tiralava.png` representa Tear Drop, Meteor y Fire Ghost, o ambos conceptos.
- Confirmar si Flower Trio se compone de dos o tres flores.
- Definir el resultado positivo de esperar diez segundos frente a Cat.
- Fijar probabilidades y comportamiento exacto de Jumpin Dolphin.

## Hoja de ruta para la próxima reanudación

### Prioridad 1 — Sesión jugable de calibración

Este es el punto exacto desde el cual se recomienda retomar.

1. Ejecutar `npm.cmd run dev`.
2. Recorrer los siete ambientes con ambos hermanos.
3. Evaluar visualmente la escala de 112 px.
4. Ajustar velocidad, aceleración, frenado, gravedad y altura de salto.
5. Ajustar cuerpos de colisión y altura de las plataformas.
6. Comprobar controles táctiles en una pantalla real.
7. Registrar los valores aprobados como constantes de gameplay.

### Prioridad 2 — Definir la estructura narrativa mínima

Elegir el mecanismo de viaje, orden de mundos y mundo final. La recomendación provisional es comenzar jugablemente en Pradera por su claridad visual y dificultad amigable, pero esta propuesta no está aprobada como canon.

### Prioridad 3 — Construir el primer nivel completo

Una vez aprobado el control:

1. Diseñar un mapa de 3 a 5 minutos.
2. Dividirlo en introducción, enseñanza, combinación, desafío y salida.
3. Integrar plataformas del kit del mundo elegido.
4. Colocar checkpoint, coleccionables, peligro y portal.
5. Crear límites, cámara y ruta alternativa breve.
6. Realizar una primera prueba completa sin enemigos.

### Prioridad 4 — Primer lote de enemigos runtime

El lote piloto recomendado continúa siendo:

1. Caracol: caminar, baba, daño y derrota.
2. Cangrejo: patrulla, alerta, persecución, pellizco, daño y derrota.
3. Pinkegg: reposo adorable, transformación, mordida, daño y derrota.

Cada enemigo debe exportarse sin rótulos ni fondos, con escala, pivote y estados normalizados. Proyectiles, rastros y VFX deben ser archivos independientes.

### Prioridad 5 — Poderes y progresión

- Definir cómo se obtienen Fuego, Agua, Hielo y Rayo.
- Asignar función transversal y uso contextual en cada universo.
- Evitar que un poder sea únicamente un cambio de color.
- Implementar un poder completo antes de desarrollar los cuatro.

### Prioridad 6 — Parallax, audio y acabado

- Separar cada fondo en cielo, horizonte, plano medio y primer plano.
- Añadir ambiente, pasos, salto, impacto, checkpoint y portal.
- Añadir VFX de daño, rebote y transformación.
- Construir HUD definitivo y menús.
- Optimizar carga, atlas y tamaño del bundle.

### Prioridad 7 — Publicación y dispositivos

- Pruebas en Chrome, Edge, Firefox y navegadores móviles.
- Revisión de rendimiento y memoria.
- Pantalla completa y orientación.
- Guardado local.
- Paquete web desplegable y evaluación posterior de Android.

## Archivos que deben consultarse al retomar

1. `ESTADO_Y_HOJA_DE_RUTA.md`: estado general y siguiente acción.
2. `RUNTIME_SPEC.md`: escala, anclajes, cámara y criterios técnicos.
3. `WORLD_ASSET_PLAN.md`: identidad visual y contenido de los mundos.
4. `INSTRUCTIVO_ENEMIGOS.md`: comportamiento de enemigos.
5. `world-assets-manifest.json`: rutas y contenido de los assets generados.
6. `asset-manifest.json`: inventario de las fuentes originales.
7. `src/main.js`: implementación vigente del prototipo.

## Regla de continuidad

Al cerrar una futura sesión de trabajo, actualizar este documento con:

- Fecha.
- Cambios implementados.
- Pruebas realizadas.
- Problemas encontrados.
- Decisiones aprobadas.
- Próxima acción exacta.

El siguiente trabajo no debe comenzar regenerando assets ni eligiendo otro motor. Debe empezar jugando y calibrando el prototipo actual, salvo que el usuario decida explícitamente cambiar de dirección.
