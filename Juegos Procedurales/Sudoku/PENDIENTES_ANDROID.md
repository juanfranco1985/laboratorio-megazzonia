# Pendientes Android

Documento de continuidad para retomar el wrapper Android y la capa web asociada sin reconstruir contexto desde cero.

Fecha de ultimo cierre verificado: 2026-04-11

## Estado actual verificado

- El juego web compila y los assets estan sincronizados en `android/app/src/main/assets/www/`.
- El wrapper Android ya incluye:
  - `WebViewAssetLoader`
  - `AndroidBridge`
  - splash nativo
  - iconos adaptativos
  - orientacion vertical fija
  - back button contextual via `window.SudokuApp.handleSystemBack()`
  - espejo nativo de persistencia con `SharedPreferences`
  - hooks de ciclo de vida `onHostPause()` y `onHostResume()`
- El proyecto Android ya tiene wrapper Gradle completo:
  - `android/gradlew`
  - `android/gradlew.bat`
  - `android/gradle/wrapper/gradle-wrapper.jar`

## Verificaciones ya ejecutadas

- `node --check` sobre todos los modulos web
- `android\\gradlew.bat :app:assembleDebug`
- `android\\gradlew.bat :app:bundleRelease`
- `android\\scripts\\build-aab.ps1`

Artefactos ya generados:

- `android/app/build/outputs/apk/debug/app-debug.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

## Pendientes reales

### 1. QA en dispositivo real

Todavia falta validar en emulador y sobre todo en dispositivo fisico:

- persistencia al minimizar y volver
- persistencia al cerrar y reabrir la app
- back button en:
  - modal abierto
  - partida activa
  - partida pausada
  - home
- restauracion correcta tras background
- consistencia entre `localStorage` y espejo nativo
- teclado virtual / resize si aparece algun caso raro

### 2. Rewarded hint real

Hoy `requestRewardedHint()` sigue siendo un stub nativo con dialogo local.

Falta:

- integrar rewarded ads reales, idealmente AdMob nativo
- reemplazar el dialogo temporal en `AndroidBridge.kt`
- mantener el contrato asincrono actual hacia JS
- definir politica de fallback si el anuncio falla o no carga

### 3. Analytics real

Hoy `trackEvent()` solo hace logging local.

Falta:

- decidir destino real de eventos
- integrar proveedor nativo o backend
- drenar la cola local web de forma controlada
- evitar perdida de eventos en background o cierre

### 4. Firma release definitiva

El pipeline release ya funciona, pero falta endurecerlo para publicacion real:

- generar keystore final
- completar `keystore.properties`
- revisar nombre de paquete definitivo si cambia branding
- validar firma release en Android Studio

### 5. Publicacion real

Antes de Play Store todavia faltaria:

- iconos finales si se cambia branding
- politicas de anuncios si se integra AdMob
- revisar `versionCode` y `versionName`
- generar AAB final firmado

## Orden recomendado para retomarlo

1. Abrir `android/` en Android Studio.
2. Ejecutar en dispositivo real.
3. Pasar checklist de persistencia, background y back button.
4. Si eso queda estable, reemplazar el stub de rewarded hint por rewarded ad real.
5. Luego conectar analytics real.
6. Por ultimo cerrar firma release y pipeline final de publicacion.

## Archivos clave para la siguiente sesion

### Web

- `src/main.js`
- `src/core/GameState.js`
- `src/core/Storage.js`
- `src/platform/NativeBridge.js`

### Android

- `android/app/src/main/java/com/juegosprocedurales/sudoku/MainActivity.kt`
- `android/app/src/main/java/com/juegosprocedurales/sudoku/AndroidBridge.kt`
- `android/app/build.gradle.kts`
- `android/scripts/build-aab.ps1`

## Casos concretos a probar primero

- Iniciar partida, minimizar app, volver y confirmar que quede pausada pero consistente.
- Cerrar app completamente y volver a abrirla.
- Desde una partida activa, pulsar back y confirmar pausa.
- Desde pausa, pulsar back y confirmar vuelta a home.
- Desde home, pulsar back y confirmar salida de la actividad.
- Cambiar tema, cerrar app, reabrir y verificar persistencia.
- Usar notas, cerrar app, reabrir y verificar persistencia.
- Probar `Descartar partida guardada` y confirmar que limpia estado web y espejo nativo.

## Notas tecnicas importantes

- `compileSdk` y `targetSdk` quedaron en `36`.
- `buildToolsVersion` quedo fijado en `36.0.0`.
- El build ya paso con el entorno local que tiene SDK `android-36`.
- Si otra maquina no tiene ese SDK, primero hay que instalarlo o ajustar esos valores.

## Comandos utiles

Sincronizar web -> Android:

```powershell
./android/scripts/sync-web-assets.ps1
```

Build debug:

```powershell
cd android
.\gradlew.bat :app:assembleDebug
```

Build release bundle:

```powershell
cd android
.\scripts\build-aab.ps1
```
