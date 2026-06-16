# Linea de Acero

Prototipo tactico de tanques en canvas 2D con pausa tactica, control de pequenos pelotones y combate de media/larga distancia.

## Estado actual

- Vertical slice jugable en `index.html`
- Seleccion individual o por arrastre
- Ordenes contextuales con click derecho
- Fuerte, torretas y taller por bando
- IA enemiga basica
- Proyectiles visibles, dano, reparacion y destruccion de estructuras
- Arquitectura modular en `src/`

## Controles

- Click izquierdo: seleccionar
- Arrastrar con click izquierdo: seleccionar varios
- Click derecho: mover o atacar segun el objetivo
- `Espacio`: pausa tactica
- `H`: mantener posicion
- `D`: volver a la linea defensiva
- `R`: retirada al taller

## Estructura

- `src/core`: constantes, loop fijo y utilidades
- `src/data`: tipos de unidad, estructuras y escenario
- `src/game`: estado compartido y helpers de batalla
- `src/map`: grid, cobertura y linea de vision
- `src/systems`: input, ordenes, IA, movimiento, combate y victoria
- `src/render`: sprites procedurales, mapa, unidades, efectos y HUD
- `src/ui`: botones y resumen de seleccion
- `legacy/`: copia del prototipo arcade anterior preservado

## Siguiente paso recomendado

- Anadir pausa tactica con cola de ordenes por unidad
- Mejorar pathing y cobertura
- Dar roles mas marcados a cada tanque
- Agregar mas escenarios y modo escaramuza
