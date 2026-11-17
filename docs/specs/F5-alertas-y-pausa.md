# F5 · Alertas y pausa del lote

## Historia

Como operario, quiero que el sistema avise cuando un tarro se desvía y que detenga el lote cuando la desviación es grande, se repite o va en aumento, para corregir la mezcla antes de producir más tarros malos.

## Relación

Reglas en `lib/modulos/tarros/reglas.ts`; registro en `lib/modulos/alertas/`. Historia HU-H5; casos CP-04 y CP-05 (tabla de decisión de las alertas). Atributo ACQ-04.

## Comportamiento

Las reglas se revisan en este orden y gana la primera que se cumple. "Las tres últimas lecturas" son las del lote, incluida la nueva.

| #   | Situación de la lectura                                                        | Dictamen    | Alerta   | Mensaje                                                                | Lote               |
| --- | ------------------------------------------------------------------------------ | ----------- | -------- | ---------------------------------------------------------------------- | ------------------ |
| 1   | ΔE de 8,0 o menos                                                              | Aprobado    | Ninguna  | —                                                                      | Sigue Activo       |
| 2   | ΔE de 15,0 o más (grave)                                                       | No aprobado | Roja     | "Desviación grave de <ΔE> ΔE (límite 15)"                              | Pausado e Inactivo |
| 3   | Las tres últimas lecturas mayores que 8,0, aunque no sean crecientes           | No aprobado | Roja     | "Desviación repetida: 3 lecturas seguidas fuera de tolerancia"         | Pausado e Inactivo |
| 4   | Las tres últimas lecturas estrictamente crecientes y la última mayor que 8,0   | No aprobado | Roja     | "Desviación acumulativa detectada: revisar mezclador o posibles fugas" | Pausado e Inactivo |
| 5   | Cualquier otro caso con ΔE mayor que 8,0 y menor que 15,0 (desviación aislada) | No aprobado | Amarilla | "Desviación aislada de <ΔE> ΔE"                                        | Sigue Activo       |

Si varias reglas de roja se cumplen a la vez, el mensaje es el de la más grave: grave (2) > repetida (3) > acumulativa (4). Ejemplos con las tres últimas lecturas:

| Lecturas (ΔE) | Alerta de la última             |
| ------------- | ------------------------------- |
| 8,00          | Ninguna                         |
| 8,01 o 14,99  | Amarilla                        |
| 15,00 o 20    | Roja (grave)                    |
| 9 → 20        | Roja (grave)                    |
| 16 → 16 → 16  | Roja (grave)                    |
| 12 → 9 → 10   | Roja (repetida)                 |
| 9 → 10 → 11   | Roja (repetida, no acumulativa) |
| 2 → 5 → 9     | Roja (acumulativa)              |
| 9 → 3 → 10    | Amarilla                        |

1. Con alerta amarilla, la pantalla completa de F4 cambia la franja a dorado, muestra "⚠ Alerta amarilla: desviación aislada" y la revisión sigue.
2. Con alerta roja, la pantalla completa cambia a rojo: "⚠ Lote pausado", el motivo y la hora. El lote ya no acepta lecturas.
3. Durante 5 segundos la pantalla completa solo muestra el aviso, para que el operario lea el motivo. Después aparecen el botón principal "Reanudar recolección" y el secundario "Entendido".
4. "Reanudar recolección" devuelve el lote a Activo y a modo `Recoleccion` en una sola operación, y la pantalla completa vuelve a "Recolectando tarros del lote …". Si la siguiente lectura vuelve a cumplir una regla de roja, el lote se pausa de nuevo. Las lecturas de antes de la pausa siguen contando: si se pausó por tres lecturas seguidas fuera de tolerancia, la siguiente lectura mayor que 8,0 lo vuelve a pausar.
5. "Entendido" cierra la pantalla completa y deja el lote pausado; la pantalla del lote muestra el aviso de lote pausado arriba, la lista de alertas y, como acción principal, "Reanudar recolección" (sin la espera de 5 segundos).

## Criterios de aceptación

Ya en `development`:

- [x] El 100 % de las lecturas con ΔE mayor que 8,0 registran una alerta (amarilla o roja).
- [x] Una lectura con ΔE de 15,0 o más da alerta roja y pausa el lote, sin importar las anteriores.
- [x] Tres lecturas seguidas con ΔE mayor que 8,0 dan alerta roja aunque suban, bajen o se repitan.
- [x] Con varias reglas de roja a la vez, el mensaje es el de la más grave (grave > repetida > acumulativa).
- [x] La alerta roja pausa el lote y pone su captura en `Inactivo` en la misma sentencia.
- [x] Un lote pausado rechaza lecturas (409) y no muestra botones de captura.
- [x] La pantalla del lote muestra el aviso de pausa con el motivo y la lista de alertas, de la más reciente a la más antigua.

Pendientes (identidad visual):

- [ ] Estados dorado y rojo de la pantalla completa, con "⚠" y palabra.
- [ ] La alerta roja no se cierra sola: espera "Reanudar recolección" o "Entendido".
- [x] Alertas de la lista con 18 px, nivel escrito ("Alerta roja", "Alerta amarilla") y hora.

Pendientes (reanudar el lote):

- [ ] Los botones "Reanudar recolección" y "Entendido" aparecen 5 segundos después de la alerta roja, no antes.
- [ ] `POST /api/lotes/[id]/reanudar` pasa el lote a Activo y a `Recoleccion` en la misma sentencia (ver [contratos/api.md](../contratos/api.md)).
- [ ] Si otro lote usa el sensor, "Reanudar recolección" no se permite y la pantalla dice cuál lote lo usa.
- [ ] En la pantalla de un lote pausado, "Reanudar recolección" es la acción principal y abre la pantalla completa de F4.

## Fuera de alcance

Avisos por correo o mensaje de texto.
