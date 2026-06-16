# Biome Expansion Roadmap

## Objetivo

Guardar las ideas para una segunda expansion del runner ecologico.
Esta etapa no reemplaza el trabajo actual de patches, clima y movimiento por animal.
La idea es abrir una siguiente capa de nivel:

- senderos sinuosos con lectura clara
- sectores internos por bioma
- microambientes plausibles para el animal elegido
- fauna ambiente no interactiva

## Principios

1. El sendero puede ser natural, pero no ambiguo.
Tiene que verse organico sin perder claridad de paso.

2. La pista se delimita con ecologia, no con fauna.
Los bordes del recorrido deben construirse con flora, rocas, troncos, agua, barro o relieve.

3. La fauna ambiente no debe definir el borde jugable.
Los animales secundarios tienen que vender vida del bioma, no hacer de pared.

4. Cada bioma puede tener varios sectores si siguen siendo plausibles.
No se trata de mezclar ambientes por variedad visual, sino de mostrar microhabitats reales del mismo bioma.

5. El jugador siempre tiene que leer hacia adelante.
Aunque el sendero sea sinuoso, la navegacion debe seguir siendo justa.

6. Los sectores deben responder a la ecologia del animal elegido.
Si un guanaco pasa por una zona humeda, debe ser una vega o mallin realista, no una laguna puesta al azar.

## Course Segments

La idea futura es pasar de una pista recta a una pista con `centerline` sinuosa.
El primer paso recomendado no es hacer movimiento libre total.
Conviene mantener los 3 carriles, pero hacer que esos carriles viajen dentro de un sendero que serpentea.

Cada `course segment` deberia definir:

- `segmentType`
- `centerlineShape`
- `curveStrength`
- `curveDirection`
- `trackWidth`
- `leftBoundaryStyle`
- `rightBoundaryStyle`
- `edgeDensity`
- `hazardBias`
- `ambientFaunaSlots`
- `visibilityBudget`

Tipos base sugeridos:

- `gentle_bend`
- `s_curve`
- `wide_meander`
- `pinch`
- `opening`
- `setpiece_curve`

## Reglas de lectura

- La curva debe ser suave y acumulativa, no serruchada.
- El ancho del sendero puede variar, pero nunca de golpe.
- Los bordes deben tener silueta clara.
- El centro jugable necesita seguir limpio aunque el borde sea organico.
- La informacion importante debe aparecer antes que el hazard.
- Los sectores de mucha curva necesitan menos ruido visual.

## Sectores por bioma

Cada stage activo podria tener 3 a 5 sectores base.
Cada sector deberia cambiar:

- el suelo
- el ancho del sendero
- la densidad del borde
- el tipo de hazard
- el clima local
- la fauna ambiente

### Argentina / Guanaco

Sectores posibles:

- estepa abierta con coiron y viento largo
- mallin o vega humeda con agua baja o charcos para saltar
- pedregal ventoso con arbustos bajos y pasos mas cerrados

Fauna ambiente:

- aves lejanas
- pequenos grupos de guanacos fuera del sendero

### Bolivia / Vicuna

Sectores posibles:

- pajonal abierto de ichu
- bofedal altoandino con agua y barro leve
- ladera mineral con piedra expuesta y vegetacion muy dispersa

Fauna ambiente:

- aves altoandinas
- vicunas lejanas

### Brazil / Jaguar

Sectores posibles:

- tierra firme con raices y borde vegetal denso
- margen de igarape o paso con agua somera para saltar
- corredor cerrado de vegetacion humeda

Fauna ambiente:

- aves
- monos lejanos
- fauna de borde de agua en espacios amplios

### Chile / Culpeo Fox

Sectores posibles:

- planicie arida abierta
- quebrada con matorral mas alto
- paso rocoso con cactus y borde mas duro

Fauna ambiente:

- aves del desierto
- pequenos animales del margen

### Colombia / Spectacled Bear

Sectores posibles:

- sotobosque humedo con helechos
- quebrada o arroyo de montana
- parche de matorral alto o bosque mas comprimido

Fauna ambiente:

- aves andinas
- pequenos animales del sotobosque

## Agua y matorrales altos

Las ideas de agua y vegetacion mas alta deben entrar solo donde tengan sentido ecologico.

Buen criterio:

- agua en vegas, bofedales, arroyos, bordes inundables, quebradas humedas o pasos de selva
- matorral alto en quebradas, sotobosques, bordes cerrados o sectores con compresion natural

Mal criterio:

- poner agua como skin de hazard sin relacion con el habitat
- cerrar un sendero con vegetacion alta en un bioma que deberia respirar

## Ambient Fauna

La fauna secundaria deberia ser una capa `ambientFauna`.
No debe colisionar ni forzar decisiones de gameplay.

Reglas:

- aparece fuera del corredor jugable o en bolsillos laterales
- usa poca frecuencia y buena silueta
- entra mejor en openings o silencios visuales
- puede tener animacion minima: mirar, caminar, beber, cruzar al fondo
- nunca debe competir con la lectura del hazard

## Objetos de sistema sugeridos

Cuando llegue el momento de implementarlo, las piezas naturales serian:

- `COURSE_SEGMENTS`
- `BIOME_SECTORS`
- `SECTOR_TRANSITIONS`
- `EDGE_BOUNDARY_LIBRARY`
- `AMBIENT_FAUNA_LIBRARY`
- `TRACK_CENTERLINE_RULES`

## Orden recomendado de implementacion

1. Hacer que la pista serpentee manteniendo los 3 carriles.
2. Definir bordes ecologicos por segmento.
3. Crear 3 sectores por cada uno de los 5 stages activos.
4. Agregar hazards y clima a nivel sector.
5. Sumar fauna ambiente no interactiva.
6. Evaluar mas adelante si conviene pasar de carriles a seguimiento libre del sendero.

## Decision actual

Estas ideas quedan guardadas como roadmap de expansion.
No forman parte del cierre del backlog ecologico actual.
Primero conviene estabilizar:

- ecologia por patches
- clima jugable
- movimiento por animal

Despues se puede abrir esta segunda fase con menos riesgo.
