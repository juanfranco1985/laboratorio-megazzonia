# Android Migration

## Estado actual

El repo ya incluye un contenedor Android funcional en [android](</c:/Documentos/Juegos Procedurales/Sopa de letras/android/settings.gradle.kts:1>). No hace falta crear el proyecto desde cero: solo sincronizar assets, abrir `android/` en Android Studio y continuar la integracion nativa.

## Flujo real recomendado

1. Desde la raiz del repo, ejecutar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-android-assets.ps1
```

2. Abrir la carpeta `android/` en Android Studio.
3. Esperar el primer sync de Gradle.
4. Ejecutar el modulo `app`.

## Como esta montado

- [MainActivity.kt](</c:/Documentos/Juegos Procedurales/Sopa de letras/android/app/src/main/java/com/sopainfinita/app/MainActivity.kt:1>) crea un `WebView` con `JavaScript`, `DOM storage` y `WebViewAssetLoader`.
- La app web se sirve desde `https://appassets.androidplatform.net/assets/www/index.html`.
- Los archivos web empaquetados viven en `android/app/src/main/assets/www/`.
- [scripts/sync-android-assets.ps1](</c:/Documentos/Juegos Procedurales/Sopa de letras/scripts/sync-android-assets.ps1:1>) copia `index.html`, `manifest.webmanifest`, `service-worker.js`, `packs/`, `src/` y `styles/`.

## Por que usar WebViewAssetLoader

En vez de `file:///android_asset/...`, el contenedor usa `WebViewAssetLoader` para servir los assets bajo un origen `https` local. Eso reduce friccion con rutas relativas, fetch y contenido remoto, y deja una base mas limpia para packs externos.

## Persistencia local

La persistencia del juego sigue viviendo en `localStorage`.

En Android esto depende de:

- `webView.settings.domStorageEnabled = true`
- no limpiar manualmente los datos del `WebView`

El offline principal dentro de Android viene de que la app web viaja empaquetada en `assets/www/`. El `service worker` no deberia considerarse el mecanismo critico de offline dentro del contenedor Android.

## Bridge JS nativo

El bridge nativo concreto ya existe en [WebAppBridge.kt](</c:/Documentos/Juegos Procedurales/Sopa de letras/android/app/src/main/java/com/sopainfinita/app/WebAppBridge.kt:1>) y se expone a la web como `window.AndroidBridge`.

Metodos ya definidos:

- `trackEvent(name, payload)`
- `shareText(text, title)`
- `requestPlacement(placement, payload)`
- `requestRewardedPlacement(placement, payload)`
- `requestReward(placement, payload)`

Estado actual:

- `shareText(...)` ya abre el chooser nativo de Android
- `trackEvent(...)` y placements quedan en `Log.d(...)` como stub
- rewarded devuelve `granted: false` hasta conectar un SDK real

## Rewarded hints

Placement prevista:

- `reward_hint`

Flujo:

1. El juego agota las pistas gratis.
2. Si el bridge expone reward, el boton cambia a `Reward +1`.
3. Android resuelve el rewarded.
4. Si el bridge devuelve `granted`, el juego suma una pista extra.

Para integrarlo luego:

- conecta `requestRewardedPlacement(...)` a AdMob, AppLovin o el SDK elegido
- devuelve `true`, `rewarded`, o JSON con `granted: true`

## Analytics y placements

El juego ya emite eventos hacia el bridge. La recomendacion es mantener la logica procedural del lado web y usar Android solo como adaptador:

- `trackEvent(...)` para analytics
- `requestPlacement(...)` para interstitials o placements futuras
- `shareText(...)` para compartir desafio diario o seed

## Packs externos en Android

Opciones:

1. Empaquetarlos dentro de `assets/www/packs/`
2. Cargarlos desde URL remota si el origen responde con CORS correcto

Como el contenedor usa un origen `https` local, la compatibilidad con `fetch` remoto es mas limpia que con `file://`. Si quieres modo totalmente offline, manten todos los packs dentro de assets.

## Generar AAB

1. Sincronizar assets web
2. Abrir `android/` en Android Studio
3. Probar en emulador o dispositivo
4. Integrar analytics o rewarded si aplica
5. Firmar desde Android Studio
6. Ejecutar `Build > Generate Signed Bundle / APK`
7. Elegir `Android App Bundle (AAB)`

## QA especifico para Android

- primer arranque del `WebView`
- reanudacion tras minimizar la app
- persistencia tras cerrar y reabrir
- rendimiento de arrastre tactil en varias densidades
- chooser nativo al compartir
- rewarded para pistas una vez integrado
- bloqueo correcto del desafio diario al completarlo
- carga de packs locales y remotos
- fallback correcto si el bridge nativo no esta disponible

## Recomendaciones finales

- Mantener la version web como unica fuente de verdad del juego.
- Re-sincronizar `assets/www/` cada vez que cambies `src/`, `styles/`, `packs/` o los archivos raiz web.
- No portar el motor procedural a Kotlin salvo que una limitacion real de plataforma lo exija.
