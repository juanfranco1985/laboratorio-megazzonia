# QA Checklist

## Generacion procedural

- [ ] Cada dificultad genera el tamano de tablero esperado.
- [ ] La cantidad de palabras visibles coincide con la dificultad.
- [ ] No aparecen palabras cortadas fuera del tablero.
- [ ] Los cruces validos conservan la misma letra compartida.
- [ ] Si una combinacion falla, el motor regenera sin romper la partida.
- [ ] La misma seed reproduce el mismo tablero.

## Desafio diario real

- [ ] `Desafio diario` usa siempre el mismo perfil para una fecha dada.
- [ ] Si el desafio diario queda en curso, el boton pasa a `Continuar diario`.
- [ ] Al completar el ranked daily, el boton queda bloqueado por el resto del dia.
- [ ] El ranked daily no se restaura al dia siguiente si quedo sin completar.
- [ ] La racha diaria sube si se completan dias consecutivos.
- [ ] La racha diaria se corta visualmente tras un dia omitido.

## Modo diario seedable y share

- [ ] `Hoy` deja lista la seed diaria para la categoria/dificultad actual.
- [ ] `Compartir` genera un link reproducible.
- [ ] Abrir un link compartido precarga categoria, dificultad, seed y modo.
- [ ] Una seed diaria compartida de otra fecha sigue reproduciendo ese tablero exacto.

## Gameplay

- [ ] El arrastre tactil selecciona una linea recta de letras.
- [ ] El arrastre con mouse funciona igual que en touch.
- [ ] Una seleccion correcta marca la palabra como resuelta.
- [ ] Una seleccion incorrecta muestra feedback de error.
- [ ] No se aceptan coincidencias accidentales fuera de las posiciones reales.
- [ ] El contador de restantes disminuye al acertar.
- [ ] La lista de palabras refleja el estado resuelto/no resuelto.

## Pistas y rewarded

- [ ] `Pista` destaca temporalmente el inicio de una palabra valida.
- [ ] El contador de pistas baja al usarlas.
- [ ] Cuando no quedan pistas gratis y hay bridge rewarded, el boton pasa a `Reward +1`.
- [ ] Completar el rewarded concede una pista extra.
- [ ] Cancelar el rewarded no rompe el flujo ni concede pista.
- [ ] En entorno web sin bridge, las pistas extra quedan deshabilitadas sin error.

## Timer y flujo

- [ ] El cronometro inicia con una nueva partida en modo crono.
- [ ] `Pausar` congela tablero y tiempo.
- [ ] `Reanudar` restablece interaccion y tiempo.
- [ ] `Reiniciar` conserva la misma grilla y reinicia el progreso.
- [ ] `Nueva` genera una grilla distinta si la seed esta vacia en modo clasico.
- [ ] La victoria abre el modal final con tiempo o estado zen y permite compartir.

## Packs externos

- [ ] El manifest local carga packs sin tocar el motor.
- [ ] Una ruta JSON local agregada desde UI incorpora nuevas categorias.
- [ ] Una URL remota valida incorpora nuevas categorias.
- [ ] Una URL invalida no rompe la app y muestra error controlado.
- [ ] `Desactivar` oculta las categorias de una fuente sin eliminarla.
- [ ] `Activar` devuelve las categorias de una fuente pausada.
- [ ] `Quitar` elimina la fuente solo si fue agregada por el usuario.
- [ ] `Limpiar remotos` elimina las fuentes agregadas por el usuario sin borrar las integradas ni las del manifest local.

## Persistencia

- [ ] Recargar la pagina restaura la partida en curso.
- [ ] La categoria elegida persiste.
- [ ] La dificultad elegida persiste.
- [ ] El modo diario o clasico persiste.
- [ ] El ritmo crono o zen persiste.
- [ ] El tema elegido persiste.
- [ ] Las fuentes externas agregadas por el usuario persisten.
- [ ] Las fuentes pausadas persisten.
- [ ] Las estadisticas y la racha diaria persisten entre sesiones.

## UI y responsive

- [ ] La home se ve bien en movil vertical.
- [ ] El tablero mantiene proporcion cuadrada.
- [ ] La barra inferior sigue siendo usable con una mano.
- [ ] El panel de ajustes se abre y se cierra sin tapar controles criticos.
- [ ] El tema oscuro y el claro mantienen contraste suficiente.
- [ ] La lista de palabras sigue siendo legible en pantallas angostas.

## Offline y Android-ready

- [ ] La app sigue abriendo tras haber sido cacheada por el service worker.
- [ ] Los packs locales incluidos en `packs/` siguen disponibles offline.
- [ ] No hay requests a assets pesados o dependencias externas obligatorias.
- [ ] `scripts/sync-android-assets.ps1` deja `android/app/src/main/assets/www/` sincronizado.
- [ ] El modulo Android abre correctamente `https://appassets.androidplatform.net/assets/www/index.html`.
- [ ] `localStorage` conserva la sesion dentro de un entorno `WebView`.
- [ ] `shareText(...)` abre el chooser nativo de Android.
- [ ] El bridge nativo opcional no rompe la experiencia web si no existe.
