# Biome Design Sheet

## Objetivo

Pasar de un runner con skins tematicos a un runner con logica ecologica.
Cada uno de los 5 niveles base debe sentirse construido por su bioma:

- como se distribuyen las plantas
- que zonas quedan abiertas o cerradas
- que peligros aparecen juntos
- como se mueve el aire, la niebla, el polvo o la humedad
- como responde el animal a ese entorno

Este documento define la base de produccion para:

- Argentina / Guanaco / Patagonian Steppe
- Bolivia / Vicuna / Altiplano
- Brazil / Jaguar / Amazon Rainforest
- Chile / Culpeo Fox / Atacama Desert
- Colombia / Spectacled Bear / Cloud Forest

## Principios globales

1. Cada bioma necesita una gramatica ambiental.
No se deben mezclar props al azar. Cada stage debe tener familias de distribucion repetibles.

2. La vegetacion se debe generar en parches, no en sprites sueltos.
Un parche puede ser abierto, medio o denso. Cada bioma define sus propios tipos de parche.

3. El nivel necesita silencios visuales.
Si todo el tiempo hay decoracion y obstaculos, la lectura se rompe. Cada 6 a 10 segundos tiene que haber una ventana de aire.

4. Obstaculo y decoracion no son lo mismo.
Los props del bioma deben apoyar la lectura del peligro, no competir con ella.

5. Cada animal necesita locomocion propia.
No alcanza con cambiar el sprite. El salto, la caida, el aterrizaje y la respuesta lateral tienen que reforzar la identidad del animal.

6. El clima debe entrar al gameplay.
Viento, niebla, humedad, brillo, polvo o barro tienen que alterar percepcion, timing o friccion.

7. El audio debe ser ecologico.
Cada stage necesita cama sonora, fauna, aire y materiales de contacto coherentes con su suelo.

## Sistema base de distribucion

Cada stage deberia manejar 4 capas:

- `far`: silueta lejana del bioma
- `mid`: masa media que define lectura del paisaje
- `groundDecor`: props de piso sin colision
- `hazards`: obstaculos de gameplay

Cada capa deberia obedecer una densidad por tramo:

- `open`: lectura larga, pocos props, mucho aire
- `broken`: alternancia de grupos y claros
- `dense`: compresion visual controlada
- `setpiece`: densidad dramatica con composicion intencional

Cada tramo necesita:

- especie dominante
- especie secundaria
- probabilidad de piedra o tronco
- clima activo
- ancho visual libre de la pista
- ritmo de encounter

## Argentina

### Identidad

Estepa fria, viento constante, horizonte amplio, manchas vegetales bajas y separadas.
El guanaco debe sentirse ligero y continuo, con lectura larga y desplazamiento noble.

### Distribucion vegetal

- Dominantes: coiron y neneo
- Secundarias: mata negra y molle patagonico
- Cobertura visual: baja a media
- Regla: usar parches separados por corredores amplios
- Regla: arbustos densos solo en los bordes o en eventos de cierre

### Logica del terreno

- Muchas lineas de fuga y aire lateral
- Piedras chicas frecuentes
- Rocas grandes solo como eventos de cambio de carril
- El centro de pista debe quedar mas limpio que los bordes

### Clima y atmosfera

- Viento lateral como firma principal
- Polvo ligero y rafagas secas
- Pocos momentos de saturacion visual

### Ritmo de juego

- Stage de lectura larga
- Mas weave y gate que slide
- Descansos visuales frecuentes

### Prioridades de polish

- Variar tamano y separacion de matas de coiron
- Hacer que los parches de shrubs aparezcan como familias y no como unidades aisladas
- Reforzar el viento sobre el sprite del guanaco y sobre el polvo del piso

## Bolivia

### Identidad

Altiplano alto, seco, frio, pedregoso y con vegetacion baja muy dispersa.
La vicuna debe sentirse liviana, flotante y silenciosa.

### Distribucion vegetal

- Dominantes: ichu y tola
- Secundarias: yareta y arbusto puneno
- Cobertura visual: baja
- Regla: nunca llenar demasiado la pista
- Regla: agrupar vegetacion en islas pequenas separadas por piedra expuesta

### Logica del terreno

- Mucha presencia mineral
- Parches pequenos de vegetacion pegados al suelo
- Rocas medianas mas frecuentes que en Argentina
- Evitar paredes vegetales; el altiplano respira

### Clima y atmosfera

- Aire fino y lejania
- Poca particula, mucho silencio
- Luz dura y suelo seco

### Ritmo de juego

- Stage de saltos largos y timing limpio
- Mas jump chains que clutter lateral
- Claridad ante todo

### Prioridades de polish

- Bajar densidad general de props si el nivel se siente cargado
- Dar a la yareta un rol especial, mas raro y mas reconocible
- Reforzar el vacio visual entre grupos para vender altura y amplitud

## Brazil

### Identidad

Amazonia cerrada, humeda, vertical, con capas y lectura comprimida.
El jaguar debe sentirse elastico, bajo y preciso, como cazando dentro de una geometria viva.

### Distribucion vegetal

- Dominantes: masas de vegetacion humeda y bromelias
- Secundarias: raices, rocas humedas, troncos
- Cobertura visual: alta
- Regla: trabajar por corredores estrechos, no por decoracion uniforme
- Regla: combinar suelo, media altura y canopy en el mismo tramo

### Logica del terreno

- Raices y troncos deben aparecer con causalidad visual
- Si hay tronco grande, cerca puede haber roca humeda o vegetacion densa
- Los bordes de pista pueden invadir mas que en otros stages
- El centro no siempre tiene que ser el espacio mas limpio

### Clima y atmosfera

- Humedad, sombra, bruma leve
- Sonido de selva y presion de canopy
- Menos cielo visible

### Ritmo de juego

- Stage de compresion
- Alternar amenazas altas y bajas rapido
- Menos descanso, pero descansos mas valiosos

### Prioridades de polish

- Separar mejor lectura de hazard y decoracion
- Usar troncos sprite como lenguaje propio del stage
- Hacer que los grupos vegetales generen verdaderos corredores, no ruido visual plano

## Chile

### Identidad

Desierto duro, rocoso, con vacio dominante y vegetacion escasa.
El zorro debe sentirse rapido, astuto y reactivo, en un espacio donde todo se lee a distancia.

### Distribucion vegetal

- Dominantes: pastos aridos y flora desértica baja
- Secundarias: rocas y troncos secos
- Cobertura visual: muy baja a baja
- Regla: grandes zonas peladas con irrupciones puntuales
- Regla: la vegetacion debe ser una excepcion visible, no un tapiz

### Logica del terreno

- Roca como masa principal
- Tronco seco como acento, no como frecuencia alta
- Props aislados con buena silueta
- Horizonte despejado y contraste alto

### Clima y atmosfera

- Calor, polvo, brillo y leve espejismo
- Mucho aire y poco canopy
- Sonido seco y espacio abierto

### Ritmo de juego

- Stage de lectura rapida y precision
- Menos compresion vertical
- Mas valor en lane choice limpia

### Prioridades de polish

- Bajar clutter cuando el suelo ya tiene mucha roca
- Reservar los troncos para momentos donde cambian la decision
- Reforzar silencios visuales para que la pista respire

## Colombia

### Identidad

Bosque nublado humedo, musgoso, con capas de hojas, troncos y niebla.
El oso debe sentirse pesado, estable y poderoso dentro de un entorno denso pero organico.

### Distribucion vegetal

- Dominantes: helechos y vegetacion de sotobosque
- Secundarias: troncos con musgo, raices, masas de hojas
- Cobertura visual: media a alta
- Regla: usar densidad escalonada, con primer plano activo y fondo filtrado por niebla
- Regla: los grupos vegetales deben parecer colonias humedas, no props sueltos

### Logica del terreno

- Troncos y raices como obstaculos naturales del bosque
- Helechos grandes para pantalla parcial
- Piedras menos protagonistas que en Chile o Bolivia
- Sensacion de peso y humedad en el piso

### Clima y atmosfera

- Niebla y gotas
- Menos contraste que Brazil
- Audio de bosque humedo, hojas y agua lejana

### Ritmo de juego

- Stage de compresion suave
- Menos velocidad percibida, mas presencia de masa
- Buen lugar para aterrizajes pesados y recovery fuerte

### Prioridades de polish

- Afinar colliders y aterrizajes del oso hasta que se sienta pesado pero justo
- Hacer que la niebla entre por pulsos y no como filtro constante
- Construir mejores parejas visuales entre helechos, troncos y musgo

## Reglas de profesionalizacion inmediata

- Cada stage debe tener 3 tipos de parche visual predefinidos y reutilizables
- Cada stage debe tener 2 ventanas climaticas que afecten lectura o fisica
- Cada animal debe tener landing, recover y anticipation propios
- Cada bioma debe tener al menos 1 tramo de silencio visual fuerte
- Ningun obstacle sprite debe usarse sin una razon ecologica dentro del stage

## Primer backlog ejecutable

1. Crear un objeto `BIOME_ECOLOGY_SHEETS` en codigo con estas reglas resumidas.
2. Separar `groundDecor` de `hazards` en la generacion.
3. Cambiar spawn aleatorio de props por generacion en parches.
4. Definir densidad `open`, `broken`, `dense` y `setpiece` para los 5 stages.
5. Dar a cada animal un paquete de movimiento propio: jump, fall, landing, lateral response.
6. Integrar clima jugable por stage: viento, niebla, humedad, calor.
7. Revisar audio por bioma en 3 capas: cama, fauna, contacto.

## Traduccion a codigo actual

Las piezas existentes ya sirven de base:

- `STAGES`: identidad visual y animal
- `STAGE_VARIANTS`: vocabulario de obstaculos y tono atmosferico
- `STAGE_SYSTEMS`: fisica y mecanica de stage
- `STAGE_PATTERN_BOOKS`: ritmo de encounters

El siguiente paso de implementacion deberia ser sumar:

- `BIOME_ECOLOGY_SHEETS`
- `PATCH_LIBRARY`
- `DECOR_DENSITY_RULES`
- `ANIMAL_MOVEMENT_PROFILES`

Con eso el juego deja de crecer por excepciones sueltas y empieza a crecer por sistema.
