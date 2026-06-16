# Procedural Playworks

Suite de 20 juegos procedurales en un mismo proyecto.

## Navegador

Abre `web/index.html` directamente en el navegador. La app es estatica y no requiere dependencias.

## Progreso

La app incluye perfiles locales, favoritos, filtros de biblioteca y modo `Libre / Campaña`. En campaña cada juego tiene 8 niveles con semillas derivadas y dificultad progresiva; al completar un nivel se desbloquea el siguiente.

Tambien incluye audio procedural con volumen/mute persistente y feedback visual comun: particulas, shake, flashes, textos flotantes y notificaciones de logros/desbloqueos.

Los tutoriales son persistentes por perfil. Hay onboarding del hub, tutorial contextual por cada juego, repeticion manual desde el boton `?`, guias visuales sobre el canvas y logros asociados a completar tutoriales.

## Android

El proyecto Android vive en `android/` y carga los mismos archivos web dentro de un WebView. Al compilar con Gradle o Android Studio, la tarea `syncWebAssets` copia `web/` a `android/app/src/main/assets/www/`.

Comandos utiles:

```powershell
cd android
.\gradlew.bat assembleDebug
```

El primer uso de `gradlew.bat` descarga la distribucion de Gradle configurada. Necesitas tener Java/JDK disponible en `PATH` o `JAVA_HOME`. Si ya tienes Android Studio, tambien puedes abrir la carpeta `android/` y ejecutar la app desde alli.

## Verificacion

```powershell
node --check web\main.js
node --check web\sw.js
node --test tests\smoke.mjs
powershell -ExecutionPolicy Bypass -File scripts\sync-android.ps1
```
