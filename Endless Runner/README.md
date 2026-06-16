# South American Runner

Runner web 2D por biomas sudamericanos, construido con HTML, CSS y JavaScript modular sobre Canvas.

## Estado

- Demo estatica navegable desde `index.html`.
- Cinco paises activos: Argentina, Bolivia, Brazil, Chile y Colombia.
- Selector de nivel y modo expedicion completa.
- Progreso persistente con mejor distancia, reliquias y medallas por pais.
- Reset visible de progreso para demostraciones.
- Colisiones depurables con la tecla `C`, desactivadas por defecto.

## Ejecucion

Desde la raiz del laboratorio:

```powershell
cmd /c npm.cmd run dev
```

Luego abrir:

```text
http://127.0.0.1:8090/Endless%20Runner/index.html
```

Tambien funciona desde cualquier servidor HTTP estatico.

## Controles

- `A` / flecha izquierda: cambiar al carril izquierdo.
- `D` / flecha derecha: cambiar al carril derecho.
- `W`, flecha arriba o espacio: saltar.
- `S` o flecha abajo: deslizar.
- `P` o `Escape`: pausar.
- `C`: alternar vista de colisiones.

En mobile incluye botones tactiles y gestos sobre el canvas.

## Sistemas principales

- Canvas renderer.
- Generador de obstaculos, decoracion y fauna ambiente.
- Movimiento por carriles con salto, slide, buffer de input y coyote time.
- Biomas con clima, sectores internos y arte propio.
- Coleccionables, boost, rescate y medallas.
- Persistencia local con `localStorage`.

## Documentacion de produccion

- `docs/active-level-direction-guide.md`
- `docs/biome-expansion-roadmap.md`
- `docs/biome-design-sheet.md`
- `docs/argentina-production-backlog.md`

## Valor de portfolio

El proyecto muestra ejecucion de gameplay completo en navegador: direccion visual, control, feedback, progresion, assets locales, audio, estado persistente y una demo que abre sin backend.
