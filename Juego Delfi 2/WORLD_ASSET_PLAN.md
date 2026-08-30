# Juego Delfi 2 — Biblia visual y paquete de mundos

Fecha: 12 de agosto de 2026.

## Alcance consolidado

Este paquete fija una primera dirección visual común para los dos hermanos y los siete universos. Incluye:

- 2 hojas de movimiento, con 8 poses por personaje.
- 1 hoja de poderes con Fuego, Agua, Hielo y Rayo para ambos protagonistas.
- 1 hoja de objetos compartidos con portal, checkpoint, cristal, vida, llave, bloque de recompensa y baliza de reencuentro.
- 7 fondos panorámicos 16:9.
- 7 hojas ambientales con 8 piezas por mundo.
- 88 recortes PNG individuales con transparencia real, además de sus 11 hojas maestras.

Los PNG originales del proyecto no fueron modificados. Las generaciones nuevas viven en `assets/generated/`; los cromas conservados para trazabilidad están en `assets/generated/sources-chroma/`.

## Protagonistas

Los personajes continúan el diseño de la ficha aportada:

- **El chico:** cabello castaño corto, camiseta celeste, pantalón azul oscuro y zapatillas azules.
- **La chica:** cabello castaño largo, moño rosa, vestido rosa, medias blancas y zapatos rosas.

Ambos tienen las mismas ocho poses: reposo, dos pasos, carrera, despegue, salto, caída y celebración/reencuentro. Las cuatro transformaciones elementales conservan sus rostros y siluetas.

## Lenguaje jugable común

Cada universo posee la misma estructura funcional:

1. Plataforma larga de suelo.
2. Plataforma corta.
3. Puente o paso estrecho.
4. Elemento de rebote.
5. Checkpoint temático.
6. Elemento vertical o peligro secundario.
7. Peligro o bloque característico.
8. Marco de portal propio del mundo.

Esta repetición permite enseñar la mecánica una vez y cambiar su apariencia por universo sin perjudicar la lectura del jugador.

## Identidad de los mundos

### Galaxia

Nebulosas índigo, planetas gigantes, islas cristalinas y arquitectura alienígena. Su kit contiene roca meteórica, piedra lunar, puente tecnológico, rebote de cometa, checkpoint estelar, columna alienígena, agujero negro y portal cósmico.

Enemigos sugeridos: Alien, Meteor y Fire Ghost, Star Friend y Dogballoon.

### Lava

Volcanes, obsidiana, ríos de magma y una fortaleza distante. Su kit contiene basalto, saliente de obsidiana, puente forjado, respiradero de rebote, checkpoint ígneo, estalactita con gota, géiser y portal volcánico.

Enemigos sugeridos: Tear Drop, Biter y Grayball.

### Oscuridad

Bosque nocturno, ruinas góticas, luna creciente y niebla azul. Es misterioso y familiar, sin terror gráfico. Su kit contiene piedra con raíces, ruina corta, puente de ramas, niebla de rebote, farol-checkpoint, arbusto falso, bloque rompible y portal gótico.

Enemigos sugeridos: Pinkegg, Faketree, Blob y Cat.

### Océano

Ruinas sumergidas, arrecifes, algas, rayos solares y agua turquesa. Su kit contiene suelo coralino, concha, muelle, perlas de rebote, checkpoint, alga escalable, corriente ascendente y portal de coral.

Enemigos sugeridos: Cangrejo, Pingüino, Foca y Jumpin Dolphin.

### Fantasía

Islas flotantes, castillos blancos, nubes, flores gigantes y cascadas cristalinas. Su kit contiene isla florida, nube, puente mágico, hongo de rebote, checkpoint estelar, enredadera, bloque rúnico y portal floral.

Enemigos sugeridos: Cotton Cloud y Flower Trio.

### Pradera

Colinas, flores, montañas, bosque, río, molinos y aldea lejana. Su kit contiene suelo de tierra, saliente florida, puente de madera, fardo de rebote, molino-checkpoint, árbol escalable, baba ralentizadora y portal rústico.

Enemigos sugeridos: Caracol, Jirafa, Mono, Group of Bears, Zebra y Sapo.

### Desierto

Dunas, mesetas, ruinas de arenisca, oasis y observatorio semienterrado. Su kit contiene suelo de arenisca, ruina corta, toldo, hojas de rebote, checkpoint de oasis, cactus, Sleeping Face y portal tallado.

Enemigos sugeridos: Sodaash y Sleeping Face.

La distribución de enemigos es una recomendación de diseño, no una restricción técnica. Se pueden reutilizar variantes entre mundos.

## Decisiones narrativas todavía abiertas

- Cómo entran los hermanos al primer universo.
- Por qué se separan y por qué cada uno recorre mundos distintos o rutas paralelas.
- Orden definitivo de los siete mundos.
- Cuál es el mundo final del reencuentro.
- Si las llaves, los cristales o los portales causan el viaje dimensional.

Por esa razón, ningún fondo muestra el evento inicial ni fija un mundo como final. El paquete sí incorpora los símbolos necesarios para prototipar cualquiera de esas opciones.

## Estado técnico y siguiente etapa

Los fondos funcionan como bases panorámicas completas. Las hojas y recortes tienen transparencia real y nombres estables. Antes del runtime final todavía conviene:

1. Elegir resolución base, escala de personaje y tamaño de celda del motor.
2. Definir hitboxes y puntos de anclaje; para plataformas, usar una superficie superior simple.
3. Separar los fondos en capas físicas de parallax si el motor requiere movimiento independiente.
4. Normalizar y animar los enemigos originales siguiendo `INSTRUCTIVO_ENEMIGOS.md`.
5. Añadir animaciones intermedias, VFX y proyectiles una vez validado el control del personaje.
6. Decidir la premisa del viaje antes de producir cinemáticas o arte narrativo definitivo.

La colección actual es apta para construir un prototipo visual consistente y diseñar niveles; no reemplaza todavía un atlas final optimizado para un motor concreto.
