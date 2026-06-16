# Gato & Humano Ascenso al Rascacielos Celestial

Primer nivel jugable en Canvas ambientado en una cafeteria magica urbana. El protagonista es el humano y el gato de fuego aparece como companero clave con una primera version del vuelo/impulso aereo.

## Como ejecutarlo

Abre `index.html` directamente en el navegador o levanta un servidor simple desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Luego abre `http://localhost:8000`.

## Controles

- `A/D` o flechas: mover
- `W`, flecha arriba o `Espacio`: saltar y hacer doble salto
- `J` o `K`: atacar o interactuar con carteles/notas cercanas
- `E`: vincular/sujetar al gato. En el aire activa el impulso y, si lo mantienes, suaviza la caida
- `R`: reiniciar el nivel una vez completado

## Donde reemplazar sprites

- Sheet principal: `assets/level1_spritesheet.png`
- Fondos derivados: `assets/level1_background.png`, `assets/level1_midground.png`, `assets/level1_foreground.png`
- Atlas manual editable: `src/assets.js`

Las coordenadas del atlas estan centralizadas y comentadas para poder corregir recortes sin tocar logica de gameplay.

## Como ajustar hitboxes

- Jugador: `src/entities/Player.js`
- Gato: `src/entities/CatCompanion.js`
- Enemigos: `src/entities/Enemy.js`
- Pickups: `src/entities/Pickup.js`
- Colisiones y resolucion: `src/physics.js`

## Como agregar niveles nuevos

1. Crea un nuevo archivo basado en `src/level1.js`.
2. Define `spawn`, `platforms`, `pickups`, `enemies`, `hazards`, `decorations` y `storyZones`.
3. Instancia el nuevo blueprint desde `src/game.js`.
4. Si necesitas nuevos sprites, agragalos al atlas en `src/assets.js`.
