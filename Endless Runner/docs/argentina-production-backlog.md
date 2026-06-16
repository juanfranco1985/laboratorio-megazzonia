# Argentina Production Backlog

## Objetivo

Convertir el nivel de Argentina en un stage con 3 sectores claramente reconocibles sin perder su lectura larga.
La meta no es solo agregar arte; la meta es que el jugador sienta tres microambientes distintos dentro de la estepa patagonica.

## Diagnostico actual

### Lo que ya funciona

- El nivel ya tiene tres sectores bien planteados a nivel conceptual: `Open Steppe`, `Wet Vega` y `Wind Cut`.
- El guanaco y la fisica del nivel ya venden bien lectura larga, viento y desplazamiento noble.
- La `Wet Vega` ya tiene una firma jugable mas marcada porque cuenta con agua, humedad y un boundary distinto.
- Los hazards base del nivel ya son coherentes con el bioma: piedra, shrub, tussock, agua baja y scree.

### Lo que hoy no se lee lo suficiente

- `Open Steppe` y `Wind Cut` comparten demasiado ADN visual.
- El sector 3 usa el mismo `boundaryStyle` que el sector 1, asi que el cierre del nivel no cambia de silueta con suficiente fuerza.
- Argentina no tiene una `SECTOR_VISUAL_LIBRARY` propia como Brazil; eso hace que el sendero, el color y la atmosfera cambien poco entre sectores.
- Solo `Wet Vega` tiene hidrologia sectorial clara. Los otros dos sectores dependen mas del generador que de una direccion visual fuerte.
- Falta un vocabulario de borde para roca y scree. Hoy el nivel habla bien “vegetacion baja” y “vega humeda”, pero no habla tan bien “pedregal ventoso”.

## Identidad rectora del nivel

Argentina debe leerse como:

1. apertura amplia y noble
2. tramo humedo bajo y vivo
3. cierre mineral, seco y mas cortante

La identidad fuerte del nivel no debe venir de “muchas cosas”, sino de:

- horizonte amplio
- viento lateral
- vegetacion baja y separada
- cambios sutiles pero claros del suelo
- bordes que no ahogan el corredor

## Firma de sectores

## 1. Open Steppe

### Emocion buscada

Respirar, leer lejos, sentir amplitud.

### Firma visual

- cielo visible y horizonte amplio
- bordes bajos y separados
- coiron y neneo como lenguaje dominante
- sendero claro y relativamente limpio
- polvo ligero, no drama visual

### Capas que deben dominar

- `far`: amplitud
- `boundary`: bajo y abierto
- `trail`: claro y estable
- `atmosphere`: viento seco fino

### Lo que no debe pasar

- demasiada piedra junta
- demasiada vegetacion de borde
- sombras o humedades que le quiten aire

## 2. Wet Vega

### Emocion buscada

Un respiro humedo dentro de la estepa, mas blando y mas vivo, pero todavia abierto.

### Firma visual

- suelo mas oscuro
- brillo humedo bajo
- juncos cortos, manchas verdes y charcos planos
- sendero un poco mas comprimido pero todavia legible
- menos polvo y mas reflejo suave

### Capas que deben dominar

- `trail`: humedad visible
- `groundDecor`: agua baja y pasto mojado
- `boundary`: juncal corto y vegetacion humeda baja
- `atmosphere`: humedad tenue

### Lo que no debe pasar

- convertirlo en pantano denso
- meter reeds demasiado altos o de lectura selvática
- perder horizonte y aire lateral

## 3. Wind Cut

### Emocion buscada

Final mas duro y mas filoso, con viento, roca y sendero mas exigente.

### Firma visual

- pedregal ventoso
- bordes mas rotos y minerales
- menos vegetacion y mas scree
- sendero mas angosto y mas seco
- polvo mas duro y rafagas mas agresivas

### Capas que deben dominar

- `boundary`: roca y scrub seco
- `trail`: mas duro y cortante
- `mid`: afloramiento mineral
- `atmosphere`: viento fuerte y polvo

### Lo que no debe pasar

- reutilizar el mismo look de `Open Steppe`
- seguir leyendo “pastizal bajo” en vez de “corte mineral”
- meter demasiada humedad residual

## Cambios prioritarios sin nuevos sprites

## P0

### 1. Crear un boundary propio para `Wind Cut`

Hoy es el cambio mas importante.

Hay que separar el sector 3 del sector 1 con un `boundaryStyle` nuevo, algo tipo:

- `steppe_scree`

Ese boundary deberia usar:

- roca baja
- scrub seco
- menos pasto
- separacion mas quebrada
- bordes con silueta mas mineral

### 2. Crear `SECTOR_VISUAL_LIBRARY` para Argentina

Cada sector necesita por lo menos:

- `trailTintToken`
- `trailTintAlpha`
- `laneAlphaMultiplier`
- `edgeWetnessBoost` o `trailDarkenAlpha` segun corresponda
- `debrisAlpha` o `dustAlpha`

Objetivo:

- `Open Steppe`: claro y limpio
- `Wet Vega`: mas humedo y oscuro
- `Wind Cut`: mas seco, duro y mineral

### 3. Reforzar el contraste de atmosfera por sector

- `Open Steppe`: viento limpio
- `Wet Vega`: humedad baja, menos polvo
- `Wind Cut`: polvo y rafaga mas dura

Esto no necesita arte nuevo; puede salir de intensidades, particulas y tintes.

## P1

### 4. Ajustar track width y lectura del sendero por sector

La diferencia de ancho ya existe, pero necesita sentirse mas:

- `Open Steppe`: corredor amplio
- `Wet Vega`: compresion suave
- `Wind Cut`: pasillo mas duro y rocoso

### 5. Diferenciar mejor familias de hazards

- `Open Steppe`: piedra chica + tussock + shrub aislado
- `Wet Vega`: agua baja + reedbed corto + brush humedo
- `Wind Cut`: scree + stone shelf + scrub seco

La regla es que el hazard dominante del sector se pueda intuir antes de verlo de cerca.

### 6. Bajar fauna ambiente al final

El sector 3 deberia sentirse mas expuesto y menos vivo que el 1.

## Cambios prioritarios con pocos sprites nuevos

## P2

### 7. Firmas minimas para vender sector

Con 3 assets bien elegidos, Argentina puede cambiar mucho:

- `vega puddle`
- `coiron patch wide`
- `scree shelf`

## P3

### 8. Segunda tanda de firma visual

- `wet sedge cluster`
- `wind-cut scrub`
- `mineral bank`

## Assets recomendados

### Open Steppe

- parche ancho de coiron
- neneo bajo en grupo
- piedra patagonica mediana

### Wet Vega

- charco plano de vega
- junco corto
- mata humeda baja

### Wind Cut

- scree shelf
- scrub seco inclinado por viento
- afloramiento mineral bajo

## Que puede seguir procedural en Argentina

Puede seguir procedural sin problema:

- polvo
- pequenas piedras
- variacion de pasto bajo
- brillo humedo del sendero
- fauna lejana
- pequenos grupos de scrub

Conviene resolver con sprite antes:

- charco firma de `Wet Vega`
- parche hero de coiron
- borde mineral de `Wind Cut`

## Orden de implementacion recomendado

1. Crear `steppe_scree` y separarlo de `steppe_open`.
2. Agregar `SECTOR_VISUAL_LIBRARY` para los 3 sectores de Argentina.
3. Recalibrar atmosfera sectorial y sendero por sector.
4. Ajustar familias de hazards para que cada sector tenga una firma clara.
5. Agregar 3 sprites firma minimos.
6. Recien despues sumar mas decor de lujo.

## Criterios de aprobacion

Argentina queda bien encaminada si se cumple esto:

1. Una captura del sector 1 no se confunde con una del sector 3.
2. `Wet Vega` se reconoce por suelo y borde, no solo por el hazard de agua.
3. `Wind Cut` se siente mas mineral aunque no haya sprites nuevos todavia.
4. El sendero sigue siendo legible en los tres sectores.
5. El nivel conserva amplitud y no se vuelve un corredor recargado.

## Primer sprint sugerido

Sprint 1 deberia incluir solo cambios de alta relacion costo/beneficio:

- nuevo `boundaryStyle` para `Wind Cut`
- `SECTOR_VISUAL_LIBRARY` para Argentina
- tuning atmosferico por sector
- ajuste de hazards para `Wind Cut`

Eso deberia bastar para que el nivel ya deje de sentirse generico sin depender todavia de una produccion grande de sprites.
