# ROI Analytics Android

Aplicacion Android en Kotlin + Jetpack Compose para consultar un backend FastAPI de analisis de campanas publicitarias multicanal.

El objetivo de esta version es que el proyecto sea mostrable como pieza de portfolio: compila, puede abrir un APK debug, funciona aunque el backend local no este disponible y documenta el flujo tecnico principal.

## Estado actual

- Build Android verificado con `assembleDebug`.
- UI en Jetpack Compose + Material 3.
- Navegacion inferior entre Dashboard, Plataformas, Insights, KPIs y Predicciones.
- Filtros por plataforma, segmento y anio.
- Consumo remoto con Retrofit + OkHttp + kotlinx.serialization.
- Fallback local si el backend FastAPI no responde.
- Refresco remoto del dataset.
- Exportacion de reporte PDF desde backend o PDF local de respaldo.
- FileProvider para compartir el PDF desde Android.
- Network Security Config para permitir HTTP local hacia `10.0.2.2`.

## Caso de portfolio

La ficha visual esta en:

```text
../portfolio/projects/roi-analytics-android/index.html
```

Resume problema, arquitectura, flujo de producto, evidencia tecnica, estado de madurez y proximas mejoras.

## Arquitectura

```text
Compose UI
  -> RoiAnalyticsViewModel
  -> RoiAnalyticsRepository
  -> RoiAnalyticsApi / fallback local / PDF local
```

Capas principales:

- `MainActivity.kt`: shell Compose, filtros, navegacion y pantallas.
- `RoiAnalyticsViewModel.kt`: estado con `StateFlow`, seleccion de destino, filtros, refresh y exportacion.
- `RoiAnalyticsRepository.kt`: llamadas remotas, fallback local y generacion de PDF.
- `RoiAnalyticsApi.kt`: contrato Retrofit contra FastAPI.
- `AnalyticsModels.kt`: modelos serializables del dominio.

## Desarrollo local

La app usa por defecto:

```text
http://10.0.2.2:8000/
```

Eso apunta desde el emulador Android a tu PC local.

Endpoints esperados:

```text
GET  /analytics/dashboard
POST /analytics/dataset/refresh
GET  /analytics/report.pdf
```

## Build verificado

Desde esta carpeta:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:GRADLE_USER_HOME=(Resolve-Path '.\.gradle-user-home').Path
.\gradlew.bat assembleDebug
```

APK generado:

```text
app/build/outputs/apk/debug/app-debug.apk
```

## Siguientes mejoras recomendadas

- Capturas reales o video corto del flujo mobile.
- Graficos nativos en Compose.
- Modo tablet.
- Cache local con Room.
- Persistencia offline.
- Backend publico con HTTPS.
- Manejo fino de errores HTTP.

## Nota de seguridad

La configuracion de cleartext/HTTP incluida es solo para desarrollo local. Para produccion conviene usar backend publico con HTTPS y quitar esa excepcion.
