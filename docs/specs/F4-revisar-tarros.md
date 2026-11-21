# F4 · Iniciar recolección

## Historia

Como operario, quiero pasar los tarros del lote por el sensor y ver en grande si cada uno se aprueba, para separar los que no cumplen sin depender del colorista.

## Relación

Pantalla `/lotes/[id]`. API: `PATCH /api/lotes/[id]/captura` con `{ "modo": "Recoleccion" }` y `POST /api/tarros` con `rgb` (lo envía el puente). Historias HU-H4 y HU-H8; casos CP-01, CP-02, CP-03 y CP-11. Atributos ACQ-01, ACQ-05. Diseño: [Recolección](../diseno/identidad-visual.md#recolección).

## Comportamiento

1. En la pantalla de un lote Activo, con muestra y con el sensor libre, la acción principal es "Iniciar recolección", arriba, debajo del título del lote. El color de la muestra está más abajo, en "Comparación de colores", con el aviso "✓ Muestra patrón guardada" debajo (F3).
2. Al pulsarlo, el lote pasa a modo `Recoleccion` y se abre la pantalla completa: "Recolección del lote <código>", "● Recolectando tarros…" e "Pase los tarros uno por uno frente al sensor".
3. Por cada tarro que llega, la pantalla completa muestra lado a lado la muestra patrón y el último tarro, el dictamen en grande ("✓ Aprobado" o "✕ No aprobado"), la diferencia de color en ΔE y cuántos tarros se han revisado y cuántos no se aprobaron.
4. "Terminar recolección", "✕ Cerrar" o Esc devuelven el lote a `Inactivo`, cierran la pantalla completa y el foco vuelve al botón "Iniciar recolección".
5. Si llega una alerta, la pantalla completa sigue lo descrito en F5.
6. Nunca se muestra el valor interno `Recoleccion`.

## Criterios de aceptación

Ya en `development` (API y cálculo):

- [x] Solo se puede pasar a modo `Recoleccion` si el lote está Activo, tiene muestra y ningún otro lote usa el sensor.
- [x] El ΔE se calcula con CIE76 frente a la muestra patrón y se muestra con 2 decimales.
- [ ] Un tarro con ΔE mayor que 0,8 queda "No aprobado"; con 0,8 o menos, "Aprobado" (en la teoría; el prototipo aplica los valores calibrados de `reglas.ts`, decisión del 2026-11-20).
- [x] El dictamen se muestra con símbolo y palabra, no solo con color.
- [x] La tabla del lote muestra las últimas 8 lecturas, de la más reciente a la más antigua.
- [x] Mientras recolecta, la pantalla se refresca cada 3 segundos.

Pendientes (flujo "Iniciar recolección"):

- [x] Con muestra, la acción principal de la pantalla del lote es "Iniciar recolección", en el mismo lugar donde estaba "Agregar muestra".
- [x] La pantalla completa dice "Recolección del lote <código>", "● Recolectando tarros…" y tiene el botón "Terminar recolección".
- [x] En ninguna pantalla aparece la palabra `Recoleccion` (sin tilde) ni los textos antiguos "Revisar tarros", "Revisando tarros" o "Terminar revisión".
- [x] La pantalla completa cumple las mismas reglas de F3 (opaca, 48 px, botones de 72 px, Esc, foco de vuelta, abierta al recargar si el lote está en `Recoleccion`).
- [x] Antes del primer tarro dice "Esperando el primer tarro…".
- [x] El dictamen del último tarro se ve a 60 px; el ΔE como "Diferencia de color: 3,42 ΔE".
- [x] Los cuadros de color miden al menos 160 × 160 px, sin borde, y el código hex va debajo.
- [x] Un tarro nuevo se anuncia a los lectores de pantalla (`aria-live="polite"`).

## Criterios de aceptación del back

Formato Dado / Cuando / Entonces, contra la API (sin usar el formulario). En la U5 cada criterio se convierte en una prueba automática; la casilla se marca cuando esa prueba pasa. Los códigos y mensajes exactos están en [contratos/api.md](../contratos/api.md). Los ejemplos usan una muestra `#E35336` (227, 83, 54); los ΔE salen de `calcularDesviacionDeltaE`. El umbral de aprobación es 0,8 en la teoría; el prototipo aplica el valor calibrado de `reglas.ts` (decisión del 2026-11-20). En las pruebas automáticas (U5), los criterios que dependen del umbral leen la constante de ese archivo en lugar de escribir el número fijo.

- [ ] Dado un lote `Activo` con muestra y el sensor libre, cuando un usuario con sesión pide el modo `Recoleccion`, entonces responde 200 y el lote queda en `Recoleccion`.
- [ ] Dado un lote sin muestra, cuando se pide el modo `Recoleccion`, entonces responde 409 "El lote no tiene muestra registrada; captura primero la muestra con el modo Muestra".
- [ ] Dado un lote en `Recoleccion`, cuando llega la lectura `{ resultadoHex: "#E35337", rgb: [227, 83, 55] }` (ΔE 0,51), entonces responde 201 con `desviacion_delta_e: "0.51"` y `resultado: "Aprobado"`.
- [ ] Dado un lote en `Recoleccion`, cuando llega la lectura `#E65A3C` / `[230, 90, 60]` (ΔE 2,71), entonces responde 201 con `resultado: "No Aprobado"`.
- [ ] Dada una lectura con ΔE de exactamente 0,80, cuando se registra, entonces queda "Aprobado" (solo un ΔE mayor que 0,8 es "No Aprobado").
- [ ] Dada una lectura cuyo `rgb` no es el mismo color que `resultadoHex`, cuando se envía, entonces responde 400 `Los campos "resultadoHex" y "rgb" no representan el mismo color` y no se guarda.
- [ ] Dada una lectura con `rgb: [256, 0, 0]` o sin `rgb`, cuando se envía, entonces responde 400 y no se guarda.
- [ ] Dada una petición que incluye `desviacion_delta_e` o `resultado` en el cuerpo, cuando se registra la lectura, entonces el servidor los ignora y guarda los que él calcula.
- [ ] Dado un lote con muestra y en modo `Inactivo`, cuando llega una lectura, entonces responde 409 "El lote no está en modo Recoleccion (modo actual: Inactivo)…" y no se guarda.
- [ ] Dado un lote en `Recoleccion`, cuando se pide el modo `Inactivo` ("Terminar recolección"), entonces responde 200 y las lecturas siguientes responden 409.
- [ ] Dada una lectura para un `loteId` que no existe, cuando se envía, entonces responde 404 "El lote <loteId> no existe".
- [ ] Dada una petición sin sesión ni clave, cuando se envía `POST /api/tarros`, entonces responde 401 y no se guarda nada.
- [ ] Dados los tres casos de CP-03, cuando se comparan con un cálculo manual CIE76, entonces la diferencia es de 0,5 ΔE o menos (ACQ-05).

## Fuera de alcance

Recolectar dos lotes a la vez, corregir o borrar una lectura, sonidos.
