# Laboratorio de Proyectos Analiticos

Aplicacion web estatica y version Android para consultar diez proyectos avanzados de analisis de datos desarrollados como fichas profesionales y prompts reutilizables.

## Web

Abre `web/index.html` directamente en el navegador. La app no requiere instalacion ni dependencias.

Incluye:

- Inicio ejecutivo con KPIs, distribucion por dominio y stack mas repetido.
- Catalogo con busqueda, filtro por dominio y filtro por estado.
- Favoritos persistentes en el navegador o dispositivo.
- Modo oscuro persistente.
- Enlaces profundos para compartir una vista concreta de un proyecto.
- Comparador de hasta cuatro proyectos por alcance, stack, metricas, datasets y riesgos.
- Roadmap profesional por proyecto con caso de uso real, arquitectura, equipo minimo y checklist.
- Editor local para crear, duplicar y guardar proyectos personalizados.
- Importacion y exportacion JSON de proyectos.
- Checklist interactivo de entregables y plan de entrega marcable.
- Estado por proyecto: idea, en diseno, en desarrollo o validado.
- Score profesional automatico por completitud, claridad, viabilidad y valor.
- Vista imprimible desde la interfaz.
- Ficha tecnica por proyecto.
- Prompt profesional generado desde la ficha.
- Exportacion Markdown de cada proyecto y del portfolio completo.
- PWA basica cuando se sirve por HTTP.

## Android

La carpeta `android/` contiene un proyecto Android nativo que carga los mismos assets web desde `android/app/src/main/assets/web/index.html` mediante WebView.

En Android, la exportacion usa el menu nativo de compartir para enviar la ficha o el portfolio como texto Markdown.

Para sincronizar cambios de la web hacia Android:

```powershell
powershell -ExecutionPolicy Bypass -File tools/sync-android-assets.ps1
```

Para compilar, abre `android/` con Android Studio o ejecuta Gradle si tienes Android SDK instalado.

## Contenido

Los datos fuente profesionales estan en `shared/projects.js`. La app web y Android consumen esa misma estructura.

## URL publica

La version web publicada en GitHub Pages esta disponible en:

```text
https://juanfranco1985.github.io/laboratorio-megazzonia/proyectos-analisis-datos/
```

Ejemplo de enlace profundo:

```text
https://juanfranco1985.github.io/laboratorio-megazzonia/proyectos-analisis-datos/web/?project=fraude-rnn&tab=blueprint
```
