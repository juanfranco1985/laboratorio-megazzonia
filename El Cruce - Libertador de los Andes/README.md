# El Cruce — Libertador de los Andes

Minijuego 2D histórico sobre liderazgo, resistencia y cuidado de la columna durante el Cruce de los Andes de 1817.

## Ejecutar

```powershell
npm run dev
```

Abrir `http://127.0.0.1:8092`.

## Controles

- `A/D` o flechas: mover.
- `W`, flecha arriba o espacio: saltar; volver a pulsar en el aire para realizar el doble salto.
- `E`: ayudar e interactuar.
- `1`: avanzar.
- `2`: reagrupar.
- `3`: descansar usando una provisión.
- `P` o `Escape`: pausa.

También incluye controles táctiles.

## Propósito

La experiencia pone el foco en el liderazgo: llegar primero no basta. La medalla depende de mantener la moral, cuidar a la columna, administrar provisiones y rescatar a quienes lo necesiten.

Todos los recursos se almacenan localmente. No hay dependencias de ejecución, telemetría ni servicios externos.

## Pase profesional v4

- San Martin combina un ciclo de marcha de ocho cuadros con doce estados coherentes: reposo, giro, despegue, ascenso, vertice, caida, aterrizaje, orden, ayuda, descanso e impacto.
- Las transiciones de giro y aterrizaje evitan cambios bruscos; centros corporales y puntos de apoyo se calibran por fotograma.
- Granaderos y arrieros saltan grietas, rocas, ramas y hielo mediante trayectorias visibles, sin desaparecer ni reaparecer.
- La camara anticipa la direccion de marcha y las pisadas distinguen roca, nieve y aterrizajes fuertes.
- Rocas, suministros, vivacs, fogatas, ramas, hitos e hielo usan sprites pintados.
- La ruta se divide en cinco capitulos continuos con clima, objetivos y color propios.
- Cuatro puestos de control guardan el avance localmente.
- El terreno incorpora nieve, grietas profundas con señal previa, bordes fracturados, particulas descendentes y textura mineral.
- Se agregaron respiracion por frio, pulsos de mando, particulas, audio contextual y resultados de liderazgo.
- La extension total es de 11.200 unidades para una partida de aproximadamente un minuto, segun decisiones y tropiezos.

## Medallas

- Oro: tres rescates, columna completa, moral minima de 65 y no mas de dos tropiezos.
- Plata: al menos dos rescates y siete integrantes.
- Bronce: completar la travesia.

El progreso, mejor medalla, mejor tiempo, liderazgo y preferencias de accesibilidad se almacenan en `localStorage`.