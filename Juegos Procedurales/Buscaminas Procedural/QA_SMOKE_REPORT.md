# QA Smoke Report

## Estado general

- Web app: verificacion parcial completada en este entorno.
- Android shell: implementado, pero no ejecutado aqui por ausencia de JDK, Gradle, SDK Android, `adb` y dispositivo/emulador.

## Verificaciones realizadas aqui

- `node --check` sobre todos los modulos de `src/`
- `node --check sw.js`
- prueba de runtime del motor para:
  - safe first move
  - seed reproducible
  - challenge code replay
  - chording
  - modo zen sin derrota inmediata

Resultado: `advanced-engine-ok`

## Android real-device smoke test

No fue posible correrlo en este entorno. Faltan estas herramientas locales:

- `java`
- `gradle`
- `adb`
- `sdkmanager`
- dispositivo Android o emulador

## Checklist con estado real

### Pasado aqui

- [x] Primer movimiento seguro en motor
- [x] Conteo de minas y numeros en motor
- [x] Flood reveal en motor
- [x] Chording en motor
- [x] Seed manual reproducible en motor
- [x] Codigo `bp1|...` reproducible en motor
- [x] Modo zen sin derrota inmediata en motor
- [x] Sintaxis del bundle web

### Implementado pero no probado en dispositivo

- [ ] `localStorage` dentro de `WebView` Android
- [ ] Pausa / reanudacion con ciclo de vida Android real
- [ ] Boton back nativo delegando al juego
- [ ] Clipboard nativo desde `WebView`
- [ ] Share sheet nativo desde `WebView`
- [ ] Splash screen nativo
- [ ] Adaptive icons en launcher real
- [ ] Legibilidad en pantallas Android chicas / altas densidades
- [ ] Apertura y build del proyecto Android Studio
- [ ] Generacion de AAB firmada

## Proximo paso recomendado

Abrir `android/` en Android Studio y ejecutar el smoke test manual de [QA_CHECKLIST.md](</c:/Documentos/Juegos Procedurales/Buscaminas Procedural/QA_CHECKLIST.md>) sobre un dispositivo real o emulador API 26+.
