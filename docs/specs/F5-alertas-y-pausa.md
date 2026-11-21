# F5 · Alertas y pausa del lote

## Historia

Como operario, quiero que el sistema avise cuando un tarro se desvía y que detenga el lote cuando la desviación es grande, se repite o va en aumento, para corregir la mezcla antes de producir más tarros malos.

## Relación

Reglas en `lib/modulos/tarros/reglas.ts`; registro en `lib/modulos/alertas/`. Historia HU-H5; casos CP-04 y CP-05 (tabla de decisión de las alertas). Atributo ACQ-04.

## Comportamiento

Las reglas se revisan en este orden y gana la primera que se cumple. "Las tres últimas lecturas" son las del lote, incluida la nueva.

| #   | Situación de la lectura                                                      | Dictamen    | Alerta   | Mensaje                                                                | Lote               |
| --- | ---------------------------------------------------------------------------- | ----------- | -------- | ---------------------------------------------------------------------- | ------------------ |
| 1   | ΔE de 0,8 o menos                                                            | Aprobado    | Ninguna  | —                                                                      | Sigue Activo       |
| 2   | ΔE de 8 o más (grave)                                                        | No aprobado | Roja     | "Desviación grave de <ΔE> ΔE (límite 8)"                               | Pausado e Inactivo |
| 3   | Las tres últimas lecturas mayores que 0,8, aunque no sean crecientes         | No aprobado | Roja     | "Desviación repetida: 3 lecturas seguidas fuera de tolerancia"         | Pausado e Inactivo |
| 4   | Las tres últimas lecturas estrictamente crecientes y la última mayor que 0,8 | No aprobado | Roja     | "Desviación acumulativa detectada: revisar mezclador o posibles fugas" | Pausado e Inactivo |
| 5   | Cualquier otro caso con ΔE mayor que 0,8 y menor que 8 (desviación aislada)  | No aprobado | Amarilla | "Desviación aislada de <ΔE> ΔE"                                        | Sigue Activo       |

El umbral de aprobación es 0,8 (decisión del 2026-11-20 en [decisiones.md](../decisiones.md)) y se ajusta al calibrar el sensor en el sitio de entrega. Esta tabla es la regla teórica. El prototipo aplica en `lib/modulos/tarros/reglas.ts` los valores calibrados con el sensor, y el código no se cambia (decisión del 2026-11-20, diferencia B7 de [datos/modelo.md](../datos/modelo.md)).

Si varias reglas de roja se cumplen a la vez, el mensaje es el de la más grave: grave (2) > repetida (3) > acumulativa (4). Ejemplos con las tres últimas lecturas:

| Lecturas (ΔE)   | Alerta de la última             |
| --------------- | ------------------------------- |
| 0,80            | Ninguna                         |
| 0,81 o 7,99     | Amarilla                        |
| 8 o 20          | Roja (grave)                    |
| 1 → 20          | Roja (grave)                    |
| 9 → 9 → 9       | Roja (grave)                    |
| 3 → 1 → 2       | Roja (repetida)                 |
| 1 → 2 → 3       | Roja (repetida, no acumulativa) |
| 0,3 → 0,5 → 0,9 | Roja (acumulativa)              |
| 1 → 0,3 → 2     | Amarilla                        |

1. Con alerta amarilla, la pantalla completa de F4 cambia la franja a dorado, muestra "⚠ Alerta amarilla: desviación aislada" y la revisión sigue.
2. Con alerta roja, la pantalla completa cambia a rojo: "⚠ Lote pausado", el motivo y la hora. El lote ya no acepta lecturas.
3. Durante 5 segundos la pantalla completa solo muestra el aviso, para que el operario lea el motivo. Después aparecen el botón principal "Reanudar recolección" y el secundario "Entendido".
4. "Reanudar recolección" devuelve el lote a Activo y a modo `Recoleccion` en una sola operación, y la pantalla completa vuelve a "Recolectando tarros del lote …". Si la siguiente lectura vuelve a cumplir una regla de roja, el lote se pausa de nuevo. Las reglas de lecturas repetidas y crecientes solo cuentan las lecturas posteriores a la última alerta roja: después de reanudar, la primera lectura mayor que 0,8 da alerta amarilla y la tercera seguida fuera de tolerancia da roja. Una lectura con ΔE de 8 o más pausa de inmediato.
5. "Entendido" cierra la pantalla completa y deja el lote pausado; la pantalla del lote muestra el aviso de lote pausado arriba, la lista de alertas y, como acción principal, "Reanudar recolección" (sin la espera de 5 segundos).

## Criterios de aceptación

Ya en `development`:

- [ ] El 100 % de las lecturas con ΔE mayor que 0,8 registran una alerta (amarilla o roja) (en la teoría; el prototipo aplica los valores calibrados de `reglas.ts`, decisión del 2026-11-20).
- [ ] Una lectura con ΔE de 8 o más da alerta roja y pausa el lote, sin importar las anteriores (en la teoría; el prototipo aplica los valores calibrados de `reglas.ts`, decisión del 2026-11-20).
- [ ] Tres lecturas seguidas con ΔE mayor que 0,8 dan alerta roja aunque suban, bajen o se repitan (en la teoría; el prototipo aplica los valores calibrados de `reglas.ts`, decisión del 2026-11-20).
- [x] Con varias reglas de roja a la vez, el mensaje es el de la más grave (grave > repetida > acumulativa).
- [x] La alerta roja pausa el lote y pone su captura en `Inactivo` en la misma sentencia.
- [x] Un lote pausado rechaza lecturas (409); su única acción es "Reanudar recolección".
- [x] La pantalla del lote muestra el aviso de pausa con el motivo y la lista de alertas, de la más reciente a la más antigua.

Pendientes (identidad visual):

- [x] Estado rojo de la pantalla completa: franja roja, "⚠ Lote pausado", el motivo y la hora.
- [x] La alerta roja no se cierra sola: espera "Reanudar recolección" o "Entendido".
- [x] Alertas de la lista con 18 px, nivel escrito ("Alerta roja", "Alerta amarilla") y hora.

Pendientes (reanudar el lote):

- [x] Los botones "Reanudar recolección" y "Entendido" aparecen 5 segundos después de la alerta roja, no antes; mientras tanto no hay "✕ Cerrar" y Esc no hace nada.
- [x] `POST /api/lotes/[id]/reanudar` pasa el lote a Activo y a `Recoleccion` en la misma sentencia (ver [contratos/api.md](../contratos/api.md)).
- [x] Si otro lote usa el sensor, "Reanudar recolección" no se permite y la pantalla dice cuál lote lo usa.
- [x] En la pantalla de un lote pausado, "Reanudar recolección" es la acción principal y abre la pantalla completa de F4.
- [x] Después de reanudar, la cuenta de lecturas repetidas y crecientes empieza de nuevo.

## Criterios de aceptación del back

Formato Dado / Cuando / Entonces, contra la API (sin usar el formulario). La casilla se marca cuando el criterio se verificó contra la API (Thunder Client sobre la rama `desarrollo` de Neon o prueba E2E). Los no marcados quedan pendientes de verificación. Los códigos y mensajes exactos están en [contratos/api.md](../contratos/api.md). Los valores de ΔE siguen la tabla de arriba: aprobado con 0,8 o menos, amarilla aislada entre 0,8 y 8, roja grave con 8 o más. El prototipo aplica los valores calibrados de `reglas.ts`: al verificarlos, los criterios que dependen del umbral se comparan con las constantes de ese archivo, no con el número fijo.

- [ ] Dado un lote en `Recoleccion`, cuando llega una lectura con ΔE entre 0,81 y 7,99 (por ejemplo `#E65A3C`, ΔE 2,71) y las anteriores están en tolerancia, entonces se registra una alerta `Amarilla` "Desviación aislada de <ΔE> ΔE" y el lote sigue `Activo` y en `Recoleccion`.
- [ ] Dado un lote en `Recoleccion`, cuando llega una lectura con ΔE de 8 o más (por ejemplo `#B45336`, ΔE 21,56), entonces se registra una alerta `Roja` "Desviación grave de 21.56 ΔE (límite 8)" y el lote queda `Pausado` e `Inactivo` en la misma sentencia.
- [ ] Dadas tres lecturas seguidas mayores que 0,8 y menores que 8 (3 → 1 → 2), cuando llega la tercera, entonces su alerta es `Roja` "Desviación repetida: 3 lecturas seguidas fuera de tolerancia" y el lote se pausa.
- [ ] Dadas tres lecturas estrictamente crecientes con la última mayor que 0,8 (0,3 → 0,5 → 0,9), cuando llega la tercera, entonces su alerta es `Roja` "Desviación acumulativa detectada: revisar mezclador o posibles fugas".
- [ ] Dadas varias reglas de roja a la vez (1 → 2 → 3), cuando llega la tercera, entonces el mensaje es el de la más grave: repetida antes que acumulativa.
- [ ] Dadas 5 lecturas con desviación conocida mayor que 0,8 (reanudando el lote cuando una roja lo pausa), cuando se registran, entonces las 5 tienen su fila en `alertas` (ACQ-04: 100 %).
- [ ] Dado un lote `Pausado`, cuando el puente envía una lectura, entonces responde 409 "El lote está pausado por una alerta roja y no acepta lecturas" y no se guarda.
- [ ] Dado un lote `Pausado` y el sensor libre, cuando un usuario con sesión envía `POST /api/lotes/[id]/reanudar`, entonces responde 200 con el lote `Activo` y en `Recoleccion`.
- [ ] Dado un lote reanudado tras una alerta repetida, cuando llega la primera lectura con ΔE entre 0,81 y 7,99, entonces su alerta es `Amarilla` (la cuenta empezó de nuevo); la tercera seguida fuera de tolerancia vuelve a dar `Roja`.
- [ ] Dado un lote `Activo`, cuando se pide reanudarlo, entonces responde 409 "El lote está Activo; solo se puede reanudar un lote Pausado".
- [ ] Dado que otro lote está capturando, cuando se pide reanudar un lote `Pausado`, entonces responde 409 con el código del otro lote y el lote sigue `Pausado`.
- [ ] Dado el puente con su clave y sin sesión, cuando pide reanudar un lote, entonces responde 401 "Inicia sesión para reanudar el lote".
- [ ] Dado un id que no es un entero positivo (`abc`) o un lote que no existe, cuando se pide reanudar, entonces responde 400 o 404 respectivamente.

## Fuera de alcance

Avisos por correo o mensaje de texto.
