# Pase de producción v2

## Dirección de personaje

San Martín dejó de utilizar una figura estática como representación principal. El motor consume un atlas 4×3 con doce poses de un personaje 2D estilizado y no fotográfico:

1. reposo;
2. reposo con viento;
3–6. ciclo de marcha;
7. salto ascendente;
8. caída;
9. orden;
10. ayuda;
11. descanso;
12. impacto.

La ilustración original permanece únicamente como respaldo de carga.

Granaderos y arrieros utilizan un segundo atlas 4×2. La animación refleja marcha, cansancio, descanso y ayuda, y responde a las órdenes y a la cohesión de la columna.

## Estructura de la travesía

La ruta total mide 11.200 unidades y se divide en cinco capítulos continuos:

1. El Plumerillo.
2. Primer ascenso.
3. Noche en la cordillera.
4. Paso de alta montaña.
5. Descenso hacia Chile.

Cada capítulo modifica objetivo, color, frío, viento y presentación. Cuatro hitos funcionan como checkpoints persistentes.

## Lenguaje visual

- Atlas propio para rocas, suministros, tienda, fogata, rama helada, equipo médico, hito e hielo.
- Terreno con gradiente mineral, borde nevado, textura, pendientes y profundidad en grietas.
- Respiración visible desde el capítulo nocturno.
- Nieve, polvo, pulsos de mando, aterrizajes, impactos y rescates con partículas.
- Noche con estrellas y viñeta; alta montaña con niebla y viento reforzado.

## Progresión

La partida registra tiempo, liderazgo, moral, cohesión, integrantes, rescates y tropiezos. El progreso local conserva checkpoint, mejor tiempo, mejor liderazgo, mejor medalla y preferencias de sonido y movimiento.

## Criterios de medalla

- Oro: tres rescates, ocho integrantes, moral de 65 o más y hasta dos tropiezos.
- Plata: dos rescates y al menos siete integrantes.
- Bronce: completar la travesía.

## Verificación

`npm test` comprueba sintaxis, recursos, atlas, capítulos, checkpoints, atmósferas, resultados y puntos de integración. La auditoría de navegador valida carga de los cinco recursos gráficos, selección de poses, capítulo cuatro, final Oro, persistencia y layout móvil.
