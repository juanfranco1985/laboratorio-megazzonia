# Estado de Juego Delfi 2

Actualizado: 28 de agosto de 2026, cierre técnico previo al playtesting.

## Estado actual

El proyecto pasó de prototipo técnico a **vertical slice jugable para un jugador**. Incluye menú, continuación, siete mundos con recorridos diferentes, 21 cristales, portales con condición de apertura, checkpoints, vidas, tres familias de enemigos, combate, cuatro poderes, cambio entre Delfi y Nova, pausa, sonido sintetizado, controles táctiles y joystick estándar.

La carga de imágenes ahora usa el inventario estático de Vite, evitando las rutas `undefined` que provocaban el escenario negro. La progresión se guarda localmente en el navegador y finaliza en una pantalla de victoria; Galaxia ya no vuelve al primer mundo.

La versión 0.6 amplía el guardado: conserva mundo, checkpoint, cristales recogidos dentro del nivel, vidas, héroe, poder activo y derrota del jefe. Fantasía incorpora al Guardián Rúnico y Galaxia al Centinela Cósmico; ambos tienen resistencia propia, indicador de vida y deben ser vencidos para activar el portal. También se corrigió el daño encadenado de Rayo para que pueda derrotar correctamente a un enemigo secundario.

La versión 0.7 cierra el pendiente visual sin servicios pagos: Caracol, Cangrejo y Pinkegg poseen ahora tres fotogramas code-native cada uno, siluetas diferenciadas, parpadeo, variación corporal y animación durante patrulla o salto. Se canceló el flujo API antes de incorporar recursos externos y se retiró su lote temporal; el runtime no depende de una clave ni genera costos.

## Próximos cambios recomendados

1. Realizar una ronda externa de playtesting —incluidos los dos jefes y un joystick físico— y ajustar distancias, daño, saltos y duración por nivel con métricas reales.
2. Añadir música original por familias de mundos, mezcla, control de volumen y subtítulos visuales para señales sonoras.
3. Crear cinemáticas breves de apertura, transición y reencuentro, junto con diálogos contextuales.
4. Ampliar accesibilidad con remapeo de botones, modo alto contraste y asistencia de plataforma.
5. Preparar publicación: iconos, PWA o empaquetado de escritorio, créditos, licencia de recursos y pipeline de despliegue.

## Criterio de lanzamiento

Antes de presentarlo como juego terminado se recomienda superar una sesión completa de siete mundos sin errores, probar al menos un joystick Xbox/PlayStation/genérico y validar el build con `npm run verify`.
