# Laboratorio Megazzonia - version hosting

Generado como version para hosting del blog-portafolio.

## Como probar

```powershell
cd "blog-portafolio-hosting"
python -m http.server 8092 --bind 127.0.0.1
```

Luego abrir:

- http://127.0.0.1:8092/

Tambien se puede servir desde cualquier hosting estatico. La carpeta fue
preparada para funcionar con rutas relativas.

## Contenido incluido

- Hub web del portfolio en la raiz del paquete.
- Simulador laboral interno y assets locales necesarios.
- Fichas de caso en `portfolio/projects/`.
- Capturas reales en `portfolio/assets/screenshots/`.
- Builds estaticos ya generados para proyectos Vite principales.
- Demos web estaticas seleccionadas sin `node_modules`, zips, logs ni builds nativos.
- READMEs tecnicos para proyectos que quedan como articulo o evidencia.
- Fichas y capturas para demos pesadas que se conservan en el paquete completo/local.


## Contenido no incluido

- Dependencias de desarrollo.
- Carpetas Android nativas de proyectos secundarios.
- Backends, entornos Streamlit, bases de datos privadas o servicios externos.
- Archivos de salida temporales, logs y paquetes zip.
- Demos pesadas con audio/imagenes grandes: South American Runner, Cronicas del ultimo piloto, World Pong 2026, Real Turn Pong y Gato & Humano.


## Nota de publicacion

Antes de subir a hosting publico, ejecutar una prueba HTTP local y revisar
`EXPORT_MANIFEST.json` para confirmar el alcance del paquete. La version
hosting no borra ni modifica las demos completas; solo no las copia a este
artefacto.
