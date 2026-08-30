# Especificación runtime — prototipo 0.1

## Tecnología elegida

- Phaser 3.90 con Vite.
- Canvas/WebGL adaptable a escritorio y móvil.
- Física Arcade para validar sensación, colisiones y cámara antes de construir niveles finales.
- Resolución lógica: 1280×720 (16:9).
- Mundo técnico horizontal: 4600×720.

Se eligió Phaser porque el proyecto todavía no tenía motor ni código y el laboratorio ya contiene experiencia previa con esta tecnología. Esta elección permite probar el juego en un navegador y empaquetarlo más adelante para web o Android.

## Escala y anclajes

- Protagonista: 112 px de alto en pantalla.
- Anclaje visual: centro inferior (`0.5, 1`).
- Cuerpo provisional: 52% del ancho y 78% de la altura útil del sprite.
- Plataformas: colisión rectangular sobre el 26% superior de la imagen.
- Checkpoints, rebotes, peligros y portales: anclaje centro inferior.

Estos valores son de prototipo. Deben revisarse tras una sesión jugable antes de producir animaciones definitivas.

## Parallax provisional

- Fondo principal: fijo a cámara con desplazamiento interno de 0.08.
- Capa ambiental secundaria: factor horizontal 0.18, sin cuerpos físicos.
- Gameplay y colisiones: factor 1.

Los fondos actuales son imágenes compuestas. Para parallax artístico definitivo deberán separarse en cielo, horizonte, medio y primer plano. El prototipo evita aplicar factores distintos de 1 a objetos físicos.

## Controles

- Flechas o WASD: movimiento.
- Espacio, W o flecha arriba: salto.
- C: alternar entre los hermanos.
- Q/E o números 1–7: cambiar de mundo.
- R: reaparecer en el último checkpoint.
- Móvil: botones táctiles de dirección y salto.

## Criterios para aprobar esta etapa

1. Ambos personajes se leen bien a 112 px.
2. Las plataformas se distinguen del fondo en los siete mundos.
3. El salto permite alcanzar plataformas de prueba sin sentirse flotante.
4. Rebote, checkpoint, daño, ralentización y portal se reconocen sin explicación extensa.
5. La cámara no expone bordes vacíos ni provoca vibración visible.
6. Los controles táctiles no ocultan al personaje en una pantalla 16:9.

## Próxima iteración

Después de probar la sala técnica se ajustarán escala, aceleración, salto y hitboxes. Luego corresponde separar parallax real y construir el primer nivel completo del mundo que se elija como inicio.
