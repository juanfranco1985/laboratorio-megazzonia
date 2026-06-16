# Active Level Direction Guide

## Objetivo

Definir de manera profesional los 5 niveles activos para que cada uno tenga:

- identidad jugable clara
- sectores internos reconocibles
- cambios de capa legibles dentro del mismo bioma
- prioridades concretas de arte y produccion

Este documento no reemplaza la logica ecologica actual.
La idea es convertir la base que ya existe en una direccion de produccion util.

## Niveles activos

- Argentina / Guanaco / Patagonian Steppe
- Bolivia / Vicuna / Altiplano
- Brazil / Jaguar / Amazon Rainforest
- Chile / Culpeo Fox / Atacama Desert
- Colombia / Spectacled Bear / Cloud Forest

## Modelo de capas

Cada sector debe cambiar como minimo 4 capas a la vez.
Si solo cambia una, el jugador no siente un sector nuevo.

Capas de lectura:

1. `far`
Silueta lejana, horizonte, cielo visible, masa del paisaje.

2. `mid`
Masa media del bioma. Define profundidad y compresion.

3. `boundary`
Bordes del sendero. Es la capa mas importante para marcar sector.

4. `trail`
Color, ancho, humedad, brillo, suciedad y legibilidad del camino.

5. `groundDecor`
Props sin colision que apoyan el suelo del sector.

6. `hazards`
Familias de obstaculos que deben sentirse propias de ese sector.

7. `atmosphere`
Viento, polvo, humedad, niebla, lluvia, sombra o brillo.

8. `ambientFauna`
Animales no interactivos fuera del corredor jugable.

## Regla de contraste entre sectores

Cada cambio de sector debe alterar:

- ancho del sendero
- densidad de borde
- familia dominante de hazards
- tratamiento atmosferico

Ademas conviene cambiar una quinta capa:

- silueta del horizonte
- color del suelo
- fauna ambiente
- cantidad de cielo visible

## Regla de produccion

No hace falta resolver todo con sprites.
La estructura correcta es:

- primero definir la lectura por capas
- despues elegir 2 o 3 sprites firma por sector
- dejar el resto en procedural controlado

Eso evita llenar el proyecto de assets sin una direccion clara.

## Argentina

### Rol del nivel

Nivel de lectura larga.
Debe vender aire, viento y nobleza de movimiento.
El guanaco tiene que sentirse comodo en un espacio abierto.

### Sectores

#### 1. Open Steppe

Lectura buscada:
Un corredor amplio con horizonte largo y bordes bajos.

Capas:

- `far`: montanas bajas y cielo amplio
- `mid`: manchas de matorral muy separadas
- `boundary`: coiron y neneo bajos, abiertos
- `trail`: seco, claro, poco ruido
- `groundDecor`: piedras chicas, pastos cortos, polvo liviano
- `hazards`: piedra y shrub aislado
- `atmosphere`: viento lateral y rafagas secas
- `ambientFauna`: aves o guanacos lejanos

Sprites firma recomendados:

- parche de coiron ancho
- grupo de neneo bajo
- piedra patagonica mediana

Puede seguir procedural:

- polvo
- variacion de pastos
- pequenas piedras

#### 2. Wet Vega

Lectura buscada:
Una franja mas humeda y blanda dentro de la estepa, con vegetacion un poco mas viva y agua baja.

Capas:

- `far`: horizonte todavia abierto
- `mid`: manchas humedas verdes bajas
- `boundary`: juncos bajos, vegas, barro suave
- `trail`: mas oscuro, con brillo humedo sutil
- `groundDecor`: charcos, pasto aplastado, suelo mojado
- `hazards`: agua baja y piedras resbalosas
- `atmosphere`: menos polvo, algo de brillo humedo
- `ambientFauna`: aves de humedal pequenas

Sprites firma recomendados:

- charco de vega
- mata humeda baja
- borde de junco corto

Puede seguir procedural:

- reflejos
- brillo del suelo
- suciedad humeda

#### 3. Wind Cut

Lectura buscada:
Una zona mas dura, pedregosa y barrida por el viento.

Capas:

- `far`: roca y ladera mas visible
- `mid`: afloramientos minerales
- `boundary`: bordes mas secos y rotos
- `trail`: mas angosto y duro
- `groundDecor`: piedra suelta y arbusto bajo
- `hazards`: roca, gate, cambio de carril por masa mineral
- `atmosphere`: viento mas fuerte y polvo duro
- `ambientFauna`: casi nada

Sprites firma recomendados:

- scree shelf
- roca cortante baja
- arbusto patagonico seco

### Estado deseado del nivel

Argentina debe leerse como:

- inicio abierto
- tramo humedo puntual
- cierre mineral y ventoso

Si los tres sectores se sienten igual, faltan contrastes en `trail`, `boundary` y `atmosphere`.

## Bolivia

### Rol del nivel

Nivel de aire fino y timing limpio.
La vicuna tiene que sentirse liviana, elegante y silenciosa.

### Sectores

#### 1. Ichu Flats

Lectura buscada:
Planicie alta con vegetacion baja y piedra expuesta.

Capas:

- `far`: meseta amplia y aire lejano
- `mid`: islas de ichu y tola
- `boundary`: muy bajo, muy respirado
- `trail`: seco y claro
- `groundDecor`: ichu disperso y piedra fina
- `hazards`: piedra media y brush bajo
- `atmosphere`: silencio visual y aire fino
- `ambientFauna`: vicunas o aves lejanas

Sprites firma recomendados:

- mata de ichu
- tola baja
- piedra salina mediana

#### 2. Bofedal

Lectura buscada:
Un humedal altoandino bajo y extendido, no una selva.

Capas:

- `far`: sigue habiendo aire
- `mid`: manchas verdes bajas y agua somera
- `boundary`: barro, musgo, agua muy plana
- `trail`: mas oscuro y humedo
- `groundDecor`: charcos, musgo, vegetacion pegada al suelo
- `hazards`: agua, barro, piedra humeda
- `atmosphere`: leve neblina mojada, no lluvia fuerte
- `ambientFauna`: aves de humedal y camelidos lejanos

Sprites firma recomendados:

- parche de bofedal
- agua somera plana
- yareta hero asset rara

#### 3. Mineral Ridge

Lectura buscada:
Tramo mas mineral, menos vegetacion, mas roca y filo visual.

Capas:

- `far`: ladera, salares, masa mineral
- `mid`: bloques rocosos y talud
- `boundary`: piedra expuesta
- `trail`: angosto y duro
- `groundDecor`: grava, roca quebrada
- `hazards`: roca, shelf, salto largo limpio
- `atmosphere`: luz dura, poco ruido
- `ambientFauna`: casi nula

Sprites firma recomendados:

- ridge slab
- boulder altoandino
- costra mineral

### Estado deseado del nivel

Bolivia debe leerse como:

- apertura de altura
- humedal altoandino
- salida rocosa y mineral

La clave es no sobrecargarlo. Si parece lleno, esta mal.

## Brazil

### Rol del nivel

Nivel de compresion y elasticidad.
El jaguar debe sentirse bajo, preciso y rapido entre masas vivas.

### Sectores

#### 1. Lush Understory

Lectura buscada:
Selva viva, frondosa y humeda, con corredor aun navegable.

Capas:

- `far`: poco cielo, masa de canopy
- `mid`: bromelias, vegetacion media, sombras
- `boundary`: bordes verdes y densos
- `trail`: humedo pero aun legible
- `groundDecor`: hojas, raices bajas, suelo blando
- `hazards`: bromeliad, root, branch vegetal
- `atmosphere`: humedad, sombra, bruma leve
- `ambientFauna`: aves y monos lejanos

Sprites firma recomendados:

- masa de bromelia
- pared vegetal baja
- raiz ancha de tierra firme

#### 2. Flooded Igarape

Lectura buscada:
Sendero estrecho de agua y barro, con bordes mojados muy marcados.

Capas:

- `far`: mas apertura lateral al agua
- `mid`: manchas de agua y reeds
- `boundary`: juncales, orilla, raiz mojada
- `trail`: mas estrecho, mas oscuro, mas brillante
- `groundDecor`: charcos, barro, restos vegetales
- `hazards`: water, reedbed, root shelf
- `atmosphere`: humedad alta, lluvia ligera si corresponde
- `ambientFauna`: aves de borde de agua, pequenos animales

Sprites firma recomendados:

- bank de igarape
- charco agrupado grande
- reed curtain humedo

#### 3. Deadfall Corridor

Lectura buscada:
Tramo duro, oscuro y minado de madera caida.

Capas:

- `far`: canopy mas roto
- `mid`: troncos y raices secas
- `boundary`: madera y debris
- `trail`: mas oscuro y comprimido
- `groundDecor`: ramas, corteza, suelo sucio
- `hazards`: log, suspended deadfall, root bank
- `atmosphere`: menos agua abierta, mas presion visual
- `ambientFauna`: muy poca

Sprites firma recomendados:

- deadfall barricade
- trunk horizontal pesado
- root bank astillado

### Estado deseado del nivel

Brazil debe leerse como:

- selva viva
- agua comprimida
- corredor de troncos

Este es el nivel donde mas hay que exagerar `boundary`, `trail` y `hazards`.

## Chile

### Rol del nivel

Nivel de vacio, lectura a distancia y precision.
El zorro debe sentirse rapido y astuto.

### Sectores

#### 1. Open Flats

Lectura buscada:
Gran aire, poco clutter, siluetas aisladas.

Capas:

- `far`: desierto abierto y cielo dominante
- `mid`: dunas bajas o roca lejana
- `boundary`: casi vacio
- `trail`: claro, seco, visible
- `groundDecor`: piedra chica y flora muy escasa
- `hazards`: cactus puntual, roca baja, branch seca
- `atmosphere`: calor, polvo y brillo
- `ambientFauna`: aves lejanas

Sprites firma recomendados:

- cardon aislado
- piedra desertica baja
- pasto arido corto

#### 2. Brush Quebrada

Lectura buscada:
Un cauce o quebrada donde el sendero se comprime y aparece matorral mas alto.

Capas:

- `far`: paredes o laderas mas cercanas
- `mid`: matorral alto y sombra local
- `boundary`: brush mas cerrado
- `trail`: un poco mas angosto
- `groundDecor`: ramas secas, piedra, arena rota
- `hazards`: brush wall, cactus, stone gate
- `atmosphere`: menos horizonte, mas polvo local
- `ambientFauna`: ave de quebrada o pequeno animal lateral

Sprites firma recomendados:

- matorral alto
- pared de quebrada
- roca quebrada vertical

#### 3. Rock Shelf

Lectura buscada:
Tramo mas mineral y duro, casi sin vegetacion.

Capas:

- `far`: masa rocosa fuerte
- `mid`: shelf y estrato mineral
- `boundary`: roca seca
- `trail`: duro y definido
- `groundDecor`: grava, roca rota, casi nada verde
- `hazards`: boulder, branch seca, shelf
- `atmosphere`: calor duro y brillo seco
- `ambientFauna`: casi ninguna

Sprites firma recomendados:

- plataforma rocosa lateral
- boulder anguloso
- costra salina

### Estado deseado del nivel

Chile debe leerse como:

- vacio abierto
- quebrada con matorral
- salida rocosa

El error a evitar es meter demasiada vegetacion y volverlo visualmente selvatco.

## Colombia

### Rol del nivel

Nivel de humedad, niebla y peso.
El oso debe sentirse fuerte y algo mas pesado dentro de un bosque humedo que respira en capas.

### Sectores

#### 1. Fern Floor

Lectura buscada:
Suelo de helechos y humedad constante, con sendero aun claro.

Capas:

- `far`: bosque nublado con visibilidad media
- `mid`: helechos grandes y troncos suaves
- `boundary`: franja de fern floor
- `trail`: humedo y oscuro
- `groundDecor`: hojas, musgo, helechos bajos
- `hazards`: fern, root, log bajo
- `atmosphere`: niebla fina y aire frio
- `ambientFauna`: aves y roedores discretos

Sprites firma recomendados:

- tree fern
- parche de musgo
- root mossy baja

#### 2. Creek Crossing

Lectura buscada:
Tramo de arroyo de montana, piedra humeda y cruce angosto.

Capas:

- `far`: quiebre de relieve y bruma
- `mid`: agua, piedra mojada y orilla
- `boundary`: creek bank y roca
- `trail`: estrecho y brillante
- `groundDecor`: agua, musgo, ramas mojadas
- `hazards`: water, log, root slick
- `atmosphere`: humedad alta y salpicadura
- `ambientFauna`: aves de arroyo

Sprites firma recomendados:

- creek stone
- arroyo estrecho
- tronco humedo de cruce

#### 3. Dense Understory

Lectura buscada:
Cierre mas comprimido, mas oscuro y con pared vegetal.

Capas:

- `far`: casi sin horizonte
- `mid`: masa vegetal y ramas
- `boundary`: pared densa de chusquea o sotobosque
- `trail`: mas comprimido y oscuro
- `groundDecor`: ramas, helechos rotos, barro
- `hazards`: dense root, fern wall, low log
- `atmosphere`: niebla densa y sombra
- `ambientFauna`: muy baja

Sprites firma recomendados:

- dense understory wall
- bamboo or chusquea cluster
- root knot grande

### Estado deseado del nivel

Colombia debe leerse como:

- suelo de helechos
- arroyo humedo
- cierre denso y oscuro

La clave es separarlo de Brazil. Colombia debe sentirse mas fria, nebulosa y de montana.

## Prioridad de assets por nivel

No hace falta producir todo junto.
Este es el orden recomendable:

### Argentina

- charco de vega
- parche de coiron reconocible
- scree shelf

### Bolivia

- parche de bofedal
- yareta rara
- ridge mineral

### Brazil

- deadfall barricade
- bank de igarape
- pared de bromelias

### Chile

- brush quebrada
- plataforma rocosa
- cardon hero

### Colombia

- tree fern grande
- creek stone set
- dense understory wall

## Que puede seguir procedural

Puede seguir procedural por bastante tiempo:

- polvo, niebla, lluvia y viento
- pequenas piedras
- variacion de pastos
- brillo humedo del trail
- debris chico de suelo
- fauna ambiente lejana

Conviene resolver con sprite antes que nada:

- firmas de sector
- masas de borde
- grandes logs
- walls vegetales
- agua o barro caracteristico

## Criterios de aprobacion

Cada nivel deberia pasar estas pruebas:

1. Mirar una captura y reconocer el pais en 2 segundos.
2. Mirar otra captura y reconocer el sector del nivel en 2 o 3 segundos.
3. Ver el borde del sendero sin depender del HUD ni del collider debug.
4. Identificar el hazard principal del sector por familia visual.
5. Sentir un cambio claro de ritmo y de atmosfera entre el sector 1 y el sector 3.

## Siguiente paso recomendado

Tomar esta guia y convertirla en un backlog pequeno por nivel:

- `visual changes`
- `sprite needs`
- `procedural adjustments`
- `sector acceptance checks`

Eso permitiria trabajar por nivel sin perder direccion general.
