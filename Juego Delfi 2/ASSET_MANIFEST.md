# Juego Delfi 2 — Manifiesto de assets

Fecha de inventario: 12 de agosto de 2026.

## Diagnóstico

- Fuentes: 19 PNG.
- Todos declaran RGBA, pero ninguno contiene píxeles completamente transparentes.
- El cuadriculado visible está incrustado; no es transparencia real.
- Varias hojas incluyen textos, divisores, paletas e interfaz de edición.
- Escalas, estilos y distribución de fotogramas no están normalizados.
- Estado: referencia de preproducción, no atlas listo para runtime.

Los originales deben conservarse intactos. Los recortes futuros irán en `assets/runtime/enemies/<id>/`.

## Inventario

| Archivo | Tamaño | Entidad | Confianza | Observación |
|---|---:|---|---|---|
| `Alien.png` | 1177×912 | Alien | Alta | Pixel art con movimiento, disparo, daño y proyectiles; contiene rótulos. |
| `biter.png` | 928×1130 | Biter | Alta | Reposo, persecución, ataque, daño y derrota; estilo ilustrado. |
| `Cangrejo.png` | 1247×864 | Cangrejo | Alta | Reposo, alerta, persecución, pinza y derrota; incluye interfaz. |
| `Caracol.png` | 1395×752 | Caracol | Alta | Marcha, baba, giro y daño; el rastro debe separarse. |
| `cat.png` | 1408×768 | Cat | Alta | Pixel art, retrato y escenas de nivel en una misma imagen. |
| `cotton cloud.png` | 1470×704 | Cotton Cloud | Alta | Lanzamiento, degradación y muerte claramente representados. |
| `dogballoon.png` | 688×1529 | Dogballoon | Alta | Hoja vertical con fotogramas pequeños y mucho espacio vacío. |
| `Faketree.png` | 1008×1067 | Faketree | Alta | Estados conceptuales; estilo y proporción distintos del pixel art. |
| `Gemini_Generated_Image_hdpb4fhdpb4fhdpb.png` | 1509×688 | Hoja colectiva | Baja | Muchos personajes/objetos; requiere subdivisión e identificación. |
| `Grayball.png` | 1076×992 | Grayball | Alta | Camuflaje, ataque, daño y derrota; hoja rotulada. |
| `group of bears.png` | 1055×1008 | Grupo de osos | Alta | Variantes por color y animaciones colectivas. |
| `jirafa.png` | 896×1195 | Jirafa | Alta | Comer, mirar, escupir/cargar y derrota. |
| `mono.png` | 1559×672 | Mono | Reposo, trepa, salto/ataque y daño. |
| `pinguino y foca.png` | 1456×731 | Pingüino y Foca | Alta | Dos personajes; deben exportarse como atlas separados. |
| `pinkegg.png` | 1600×672 | Pinkegg | Alta | Transformación, ataque y derrota claramente diferenciados. |
| `Sapo.png` | 1150×912 | Sapo | Alta | Lengua, deglución, cuerpo inflado, liberación y retorno. |
| `Sodaash.png` | 1042×1008 | Sodaash | Alta | Expresiones y rodamiento; fondo incrustado. |
| `Tiralava.png` | 1408×768 | Familia lava/fuego | Media | Posible Tear Drop o Meteor/Fire Ghost; debe confirmarse. |
| `Zebra.png` | 992×1076 | Zebra | Alta | Carrera, daño y paleta; incluye texto y referencias. |

## Correspondencias sin fuente individual inequívoca

- Meteor y Fire Ghost.
- Star Friend.
- Tear Drop.
- Sleeping Face.
- Blob.
- Flower Trio.
- Jumpin Dolphin.

Hay candidatos en la hoja colectiva Gemini y en `Tiralava.png`, pero no deben recortarse hasta confirmar la asignación.

## Convención de exportación

```text
assets/
  source/                     # originales intactos
  runtime/
    enemies/<enemy_id>/
      idle_00.png
      attack_00.png
      hit_00.png
      defeated_00.png
    effects/
    projectiles/
```

- PNG con transparencia real.
- Origen consistente, preferentemente centro inferior.
- Escala base y márgenes uniformes.
- Sin textos, cuadrículas, paletas ni interfaz.
- Proyectiles y efectos en archivos separados.
- No sobrescribir los originales.

## Lote piloto recomendado

1. Caracol: caminar, baba, daño y derrota.
2. Cangrejo: patrulla, alerta, persecución, pellizco, daño y derrota.
3. Pinkegg: reposo adorable, transformación, mordida, daño y derrota.

Este lote permite validar limpieza de fondos, escala, origen y atlas antes de procesar el resto.
