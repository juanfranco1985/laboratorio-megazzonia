# Juego Delfi 2

Aventura de plataformas 2D para **un solo jugador**, construida con Phaser 3 y Vite. Delfi y Nova son dos héroes seleccionables dentro de la misma partida; nunca hay dos jugadores simultáneos.

La campaña incluye siete mundos, guardado persistente dentro de cada nivel, enemigos code-native animados, jefes en Fantasía y Galaxia y una interfaz inspirada en el Nexo dimensional. La Pradera ya incorpora su graybox narrativo con botes, Tronco, Molino, Henal y progresión secuencial de gemas. Versión actual: **0.9.0**.

## Ejecutar

```powershell
cd "C:\Documentos\Laboratorio Megazzonia\Juego Delfi 2"
npm install
npm run dev
```

Abrir la dirección exacta que muestra Vite, normalmente `http://127.0.0.1:5173/`. No abrir `index.html` directamente.

## Controles

- Teclado: WASD/flechas, Espacio para saltar, X para poder, F para cambiar poder, C para cambiar héroe, Esc para pausa, R para checkpoint y M para sonido.
- Joystick estándar: stick o cruceta, A para saltar, X/B para poder, Y para cambiar héroe, LB/RB para cambiar poder, Start para pausa y Back para checkpoint.
- Móvil: controles táctiles completos sobre el juego.

## Verificación

```powershell
npm run verify
```

Ejecuta validación sintáctica, inventario de recursos, pruebas de campaña y build de producción.
