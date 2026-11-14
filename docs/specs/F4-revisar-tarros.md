# F4 · Iniciar recolección

## Historia

Como operario, quiero pasar los tarros del lote por el sensor y ver en grande si cada uno se aprueba, para separar los que no cumplen sin depender del colorista.

## Relación

Pantalla `/lotes/[id]`. API: `PATCH /api/lotes/[id]/captura` con `{ "modo": "Recoleccion" }` y `POST /api/tarros` con `rgb` (lo envía el puente). Historias HU-H4 y HU-H8; casos CP-01, CP-02, CP-03 y CP-11. Atributos ACQ-01, ACQ-05. Diseño: [Recolección](../diseno/identidad-visual.md#recolección).

## Comportamiento

1. En la pantalla de un lote Activo, con muestra y con el sensor libre, la acción principal es "Iniciar recolección", debajo del color de la muestra y del aviso "✓ Muestra patrón guardada" (F3).
2. Al pulsarlo, el lote pasa a modo `Recoleccion` y se abre la pantalla completa: "Recolección del lote <código>", "● Recolectando tarros…" e "Pase los tarros uno por uno frente al sensor".
3. Por cada tarro que llega, la pantalla completa muestra lado a lado la muestra patrón y el último tarro, el dictamen en grande ("✓ Aprobado" o "✕ No aprobado"), la diferencia de color en ΔE y cuántos tarros se han revisado y cuántos no se aprobaron.
4. "Terminar recolección", "✕ Cerrar" o Esc devuelven el lote a `Inactivo`, cierran la pantalla completa y el foco vuelve al botón "Iniciar recolección".
5. Si llega una alerta, la pantalla completa sigue lo descrito en F5.
6. Nunca se muestra el valor interno `Recoleccion`.

## Criterios de aceptación

Ya en `development` (API y cálculo):

- [x] Solo se puede pasar a modo `Recoleccion` si el lote está Activo, tiene muestra y ningún otro lote usa el sensor.
- [x] El ΔE se calcula con CIE76 frente a la muestra patrón y se muestra con 2 decimales.
- [x] Un tarro con ΔE mayor que 8,0 queda "No aprobado"; con 8,0 o menos, "Aprobado".
- [x] El dictamen se muestra con símbolo y palabra, no solo con color.
- [x] La tabla del lote muestra las últimas 8 lecturas, de la más reciente a la más antigua.
- [x] Mientras recolecta, la pantalla se refresca cada 3 segundos.

Pendientes (flujo "Iniciar recolección"):

- [x] Con muestra, la acción principal de la pantalla del lote es "Iniciar recolección", en el mismo lugar donde estaba "Agregar muestra".
- [x] La pantalla completa dice "Recolección del lote <código>", "● Recolectando tarros…" y tiene el botón "Terminar recolección".
- [ ] En ninguna pantalla aparece la palabra `Recoleccion` (sin tilde) ni los textos antiguos "Revisar tarros", "Revisando tarros" o "Terminar revisión".
- [x] La pantalla completa cumple las mismas reglas de F3 (opaca, 48 px, botones de 72 px, Esc, foco de vuelta, abierta al recargar si el lote está en `Recoleccion`).
- [x] Antes del primer tarro dice "Esperando el primer tarro…".
- [x] El dictamen del último tarro se ve a 60 px; el ΔE como "Diferencia de color: 3,42 ΔE".
- [ ] Los cuadros de color miden al menos 160 × 160 px, sin borde, y el código hex va debajo.
- [ ] El contador dice "Tarros revisados: N. No aprobados: M" y se actualiza con cada lectura.
- [x] Un tarro nuevo se anuncia a los lectores de pantalla (`aria-live="polite"`).

## Fuera de alcance

Recolectar dos lotes a la vez, corregir o borrar una lectura, sonidos.
