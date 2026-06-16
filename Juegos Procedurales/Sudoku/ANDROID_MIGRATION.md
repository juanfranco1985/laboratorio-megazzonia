# Android Migration Notes

## Estrategia recomendada

Empaquetar el proyecto como web estatico dentro de una `WebView` en Android Studio. Esto mantiene:

- una sola base de logica
- mismo render HTML/CSS/JS
- persistencia local simple
- costo de mantenimiento bajo

## Estado validado del wrapper

El wrapper incluido en `android/` ya esta montado y verificado en este entorno:

- `gradlew.bat :app:assembleDebug`
- `gradlew.bat :app:bundleRelease`

Artefactos generados:

- `android/app/build/outputs/apk/debug/app-debug.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

## Archivos web a copiar

El wrapper ya incluido en este repo espera los archivos web dentro de:

```text
app/src/main/assets/www/
```

Script incluido:

```powershell
./android/scripts/sync-web-assets.ps1
```

Archivos relevantes:

- `index.html`
- `manifest.webmanifest`
- `favicon.svg`
- `sw.js`
- `styles/`
- `src/`

## Carga recomendada en WebView

El wrapper implementado no carga `file:///android_asset/...` directamente. Usa `WebViewAssetLoader`, que sirve los assets locales desde:

```text
https://appassets.androidplatform.net/assets/www/index.html
```

Esto simplifica compatibilidad, aislamiento y futura integracion con capacidades modernas de WebView.

## Settings minimos de WebView

El wrapper ya activa:

- JavaScript
- DOM storage
- viewport adaptado
- soporte para orientacion vertical

Ejemplo de puntos importantes:

Ver implementacion real en `android/app/src/main/java/com/juegosprocedurales/sudoku/MainActivity.kt`.

## Offline

En Android empaquetado con assets locales, el juego ya vive offline por definicion. El `service worker` es util para navegador servido por HTTP, pero no es la pieza central del caso WebView con `file:///android_asset`.

## Persistencia

La persistencia actual usa `localStorage` y ademas guarda un espejo nativo mediante `SharedPreferences` cuando corre dentro del wrapper Android.

Consideraciones:

- en la mayoria de implementaciones de WebView esto funciona bien si `domStorageEnabled` esta activo
- el espejo nativo reduce friccion si `localStorage` falla o queda inconsistente en alguna variante de WebView
- si luego quieres mayor robustez aun, puedes migrar a IndexedDB o a una capa nativa mas rica sin tocar el motor Sudoku

## Boton Back

Recomendacion:

1. Si hay modal abierto, cerrar modal.
2. Si la partida esta activa, pausar antes de salir.
3. Si ya estas en home, recien entonces salir de la actividad.

Esto conviene resolverlo del lado nativo, consultando opcionalmente el estado web via `evaluateJavascript`.

## Fullscreen

Sugerencia:

- usar edge-to-edge
- respetar insets
- mantener la UI web con `viewport-fit=cover`

La app web ya usa espaciado compatible con `safe-area`.

## Splash screen

Recomendado hacerlo nativo en Android, no web.

Ventaja:

- arranque mas profesional
- ocultas el tiempo de inicializacion de WebView
- preparas terreno para branding y monetizacion

## Integracion futura de anuncios

La ruta mas limpia:

1. Mantener el juego web aislado.
2. Gestionar AdMob del lado nativo.
3. Exponer un bridge simple JS <-> Android para eventos concretos.

Ejemplos de eventos futuros:

- `onPuzzleStart`
- `onPuzzleWin`
- `requestInterstitial`
- `requestRewardedHint`

No integres anuncios directamente en la capa web si quieres conservar mantenibilidad.

## Contrato JS ya preparado

La capa web ya contempla un bridge opcional llamado `AndroidBridge` con estos metodos esperados:

- `vibrate(payloadJson)`
- `trackEvent(payloadJson)`
- `setBackContext(payloadJson)`
- `requestRewardedHint(payloadJson)`

Ademas, la capa web expone:

- `window.SudokuApp.handleSystemBack()`
- `window.__sudokuAndroidBridge.resolveRewardedHint(requestId, granted)`

Eso permite que Android consulte o delegue el comportamiento contextual del boton back sin duplicar logica de negocio.

Ademas, el wrapper ya puede:

- `storageGetItem(payloadJson)`
- `storageSetItem(payloadJson)`
- `storageRemoveItem(payloadJson)`

Y la capa web expone handlers de ciclo de vida:

- `window.SudokuApp.onHostPause()`
- `window.SudokuApp.onHostResume()`

## Haptics y features nativas futuras

La capa web ya deja preparada la idea con `navigator.vibrate` cuando esta disponible. Luego puedes reemplazar o complementar esto con un bridge nativo para:

- vibracion precisa
- share sheet
- review prompt
- rating dialog
- achievements

## Generacion de AAB

Flujo recomendado:

1. Sincronizar assets web:

```powershell
./android/scripts/sync-web-assets.ps1
```

2. Entrar a la carpeta Android:

```powershell
cd android
```

3. Generar APK debug:

```powershell
.\gradlew.bat :app:assembleDebug
```

4. Generar bundle release:

```powershell
.\scripts\build-aab.ps1
```

5. Recoger el AAB en:

```text
app/build/outputs/bundle/release/app-release.aab
```

## Riesgos a vigilar

- diferencias de comportamiento de `localStorage` segun WebView muy viejas
- reanudacion al volver del background
- manejo del back button con modales
- resize por teclado virtual si luego agregas inputs reales
- reemplazo del stub de rewarded hint por AdMob real
- QA en dispositivo real para persistencia, boton back y restauracion tras background

## Recomendacion final

Mantener la app web como un modulo autocontenido. El wrapper Android debe encargarse solo de:

- ciclo de vida
- back button
- ads
- splash
- permisos
- publishing

La logica de Sudoku debe quedarse en la capa web.
