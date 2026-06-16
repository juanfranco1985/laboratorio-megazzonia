# Android Migration Guide

## Objetivo

Empaquetar este Buscaminas dentro de Android Studio usando `WebView`, manteniendo:

- carga local sin red
- persistencia local
- UX tactil consistente
- futura base para anuncios o monetizacion

## Estado actual del repo

El repositorio ya incluye un shell Android real en `android/` con:

- `MainActivity` + `WebView`
- `WebViewAssetLoader`
- splash screen
- adaptive icons
- bridge nativo
- assets web copiados en `android/app/src/main/assets/minesweeper/`
- plantilla de firma release por `signing.properties`

## WebView basico

### Kotlin

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        val webView = findViewById<WebView>(R.id.webView)
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            mediaPlaybackRequiresUserGesture = false
        }

        webView.webViewClient = object : WebViewClientCompat() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ) = assetLoader.shouldInterceptRequest(request.url)
        }

        webView.loadUrl("https://appassets.androidplatform.net/assets/minesweeper/index.html")
    }
}
```

## Bridge nativo disponible

El proyecto ahora expone `window.BuscaminasApp` para integracion desde Android:

- `getCurrentState()`
- `getCurrentChallengeCode()`
- `copyCurrentChallengeCode()`
- `importChallengeCode(code)`
- `pauseGame()`
- `resumeGame()`
- `handleBack()`

Tambien emite eventos hacia la capa nativa mediante `NativeBridge`:

- `app-ready`
- `game-started`
- `game-won`
- `game-lost`
- `game-paused`
- `flag-toggled`
- `chord-used`
- `zen-mine-resolved`
- `challenge-imported`
- `challenge-copied`
- `challenge-shared`
- `stats-reset`

Si queres capturarlos desde Android, implementa alguno de estos contratos:

- `window.BuscaminasNative.postEvent(name, payloadJson)`
- `window.BuscaminasNative.postMessage(payloadJson)`
- `window.AndroidBridge.postEvent(name, payloadJson)`
- `window.AndroidBridge.postMessage(payloadJson)`

## Persistencia

- El juego usa `localStorage`.
- En Android `WebView`, `domStorageEnabled = true` es obligatorio.
- Mientras la app no limpie datos, la sesion y las estadisticas se conservan.
- El shell actual pausa explicitamente el juego en `onPause()` para reforzar continuidad al fondo.

## Boton Back

Si queres usar el boton fisico o gestual como control de navegacion interna:

1. Si hay modal abierto, cerrar el modal.
2. Si la partida esta activa, ofrecer una pausa o confirmacion de salida.
3. Si el `WebView` tiene historial, usar `goBack()`.
4. Si no hay historial, cerrar la actividad.

### Enfoque recomendado

- Dejar `Back` como cierre de modal primero.
- Luego salida de actividad.
- Evitar una pila de navegacion compleja dentro de la SPA.

## Offline

- El bundle ya es local, por lo que funciona sin internet incluso sin `service worker`.
- El shell actual usa `https://appassets.androidplatform.net/...` con `WebViewAssetLoader`, lo que da una origin segura manteniendo assets locales.
- Si luego se sirve desde una URL remota o CDN, el `service worker` suma cache offline adicional.

## Rendimiento en gama media

- Mantener aceleracion por hardware activada.
- No cargar librerias externas innecesarias.
- No agregar animaciones pesadas ni canvas full-screen sin una razon fuerte.
- Conservar el render de tablero via DOM/CSS, suficiente para este volumen de celdas.

## Futuras ideas de monetizacion

### Banner discreto

- Reservar un contenedor nativo debajo del `WebView`.
- Evitar banners dentro del tablero para no romper precision tactil.

### Interstitial

- Mostrar solo entre partidas, nunca durante una sesion activa.
- Aplicar frecuencia moderada y respetar sesiones cortas.
- El evento `game-won` o `game-lost` es un buen punto de disparo desde nativo.

### Rewarded

- Puede encajar para reintento, tema extra o estadistica extendida.
- No debe alterar la logica base del Buscaminas.
- El bridge permite decidir esto desde Android sin acoplar anuncios al codigo web.

## Manejo de tamano y notch

- Mantener `viewport-fit=cover`.
- Respetar `safe-area-inset-*`.
- Probar en portrait primero.

## Generacion de AAB

1. Abrir la carpeta `android/` en Android Studio.
2. Confirmar SDK 36, Build Tools 36.0.0 y JDK 17.
3. Copiar `android/signing.properties.template` a `android/signing.properties`.
4. Crear o copiar el keystore real en `android/keystore/`.
5. Ir a `Build > Generate Signed Bundle / APK`.
6. Elegir `Android App Bundle`.
7. Completar firma `release` y generar el `.aab`.

## Recomendaciones antes de publicar

- Probar restauracion de sesion al cerrar y reabrir la app.
- Probar orientacion portrait y landscape.
- Validar que `localStorage` persiste tras reinicio del proceso.
- Confirmar que el boton back no interrumpe una partida sin feedback.
- Medir legibilidad y precision tactil en pantallas chicas.
