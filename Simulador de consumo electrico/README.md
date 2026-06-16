# Simulador de Consumo Electrico

Dashboard web estatico para estimar consumo electrico mensual, costo proyectado, equipos criticos e historico de escenarios. Forma parte del Laboratorio Megazzonia como muestra de producto tecnico con UI de datos, persistencia local y visualizacion propia en canvas.

## Que Demuestra

- Interfaz tipo dashboard orientada a decision.
- Presets de escenarios: casa eficiente, departamento, taller tecnico y setup creativo.
- Alta y baja de equipos con potencia, horas por dia y dias de uso mensual.
- Calculo automatico de kWh, costo, equipo dominante y margen contra umbral.
- Graficos propios en canvas, sin dependencias externas.
- Diagnostico automatico con recomendaciones accionables.
- Historial persistente en LocalStorage.
- Exportacion de resumen TXT e historial CSV.
- App portable: funciona servida desde el laboratorio por HTTP sin build ni CDN.

## Stack

- HTML
- CSS
- JavaScript
- Canvas 2D
- LocalStorage

## Ejecucion Local

Desde la raiz del laboratorio:

```bash
python -m http.server 8090 --bind 127.0.0.1
```

Abrir:

```text
http://127.0.0.1:8090/Simulador%20de%20consumo%20electrico/index.html
```

Tambien se puede abrir desde la tarjeta del portfolio.

## Estructura

- `index.html` - UI, estilos y layout responsive.
- `simulador.js` - Estado, calculos, presets, graficos canvas, exportacion e historial.
- `README.md` - Ficha tecnica del proyecto.

## Upgrade Aplicado

- Reemplazo de Bootstrap y Chart.js por una app estatica autosuficiente.
- Limpieza completa de mojibake en textos.
- Dashboard oscuro verde/marron alineado al Laboratorio Megazzonia.
- Metricas principales arriba de la experiencia.
- Presets de consumo para mostrar valor inmediato.
- Diagnostico automatico y exportaciones.
- Preparacion para ficha de caso dentro del portfolio.

## Proximas Mejoras

- Agregar comparador entre dos escenarios.
- Modelar franjas tarifarias y cargos fijos.
- Incorporar potencia pico simultanea.
- Agregar objetivos de ahorro y simulacion de reemplazo por equipos eficientes.
- Exportar informe PDF.
