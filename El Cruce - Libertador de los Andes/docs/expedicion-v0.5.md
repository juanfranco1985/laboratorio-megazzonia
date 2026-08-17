# Expedición v0.5.0

Esta versión convierte el prototipo lineal en una expedición por etapas, con terreno vertical, decisiones logísticas y una acción colectiva central.

## Recorrido

1. El Plumerillo: cargar raciones, revisar equipo y embalar el puente portátil.
2. Salida de Mendoza: iniciar el ascenso con la columna preparada.
3. Quebrada del río: examinar el paso, asignar equipos, construir y asegurar el puente.
4. Cuesta del Espinacito: administrar esfuerzo, obstáculos y carga en una pendiente marcada.
5. Noche en la cordillera: buscar vivac y conservar el abrigo.
6. Paso de alta montaña: proteger la cohesión frente al viento y el frío.
7. Descenso al Aconcagua: reunir la columna y completar la travesía.

## Criterios de coherencia

- El puente es una superficie física compartida: San Martín y los acompañantes usan la misma altura.
- La marcha queda bloqueada hasta completar la preparación y el puente.
- Fondo, terreno, objetos, personajes, sombras y partículas responden a la cámara vertical.
- Los puntos de apoyo de los atlas están medidos para evitar objetos flotantes.
- El guardado v2 conserva preparación, construcción, recursos y estado de la columna.

## Control de calidad

La prueba automatizada verifica los siete capítulos, más de 850 píxeles de ascenso, descenso perceptible, tres tareas iniciales, quebrada de más de 400 píxeles y disponibilidad de todos los recursos. La pasada en Edge valida además el flujo completo del puente y la ausencia de errores de consola.
