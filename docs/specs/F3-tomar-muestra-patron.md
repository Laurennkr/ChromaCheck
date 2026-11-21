# F3 · Agregar la muestra patrón

## Historia

Como operario, quiero que al abrir un lote sin muestra la pantalla me diga qué hacer, y registrar el tarro patrón con un solo botón, para que el sistema tenga contra qué comparar los demás tarros sin que yo tenga que preguntar nada.

## Relación

Pantalla `/lotes/[id]`. API: `PATCH /api/lotes/[id]/captura` con `{ "modo": "Muestra" }` y `POST /api/tarros` con `esMuestra: true` (lo envía el puente). Regla: `necesitaMuestraPatron` en `lib/modulos/lotes/reglas.ts` (el lote está Activo, en modo `Inactivo` y sin muestra). Diseño: [pantalla completa de captura](../diseno/identidad-visual.md#pantalla-completa-de-captura). Atributo ACQ-01.

## Comportamiento

1. **Estado A.** Al abrir un lote Activo, en modo `Inactivo` y sin muestra, la pantalla completa se abre sola: franja con "Lote <código>" y "✕ Cerrar"; título "Agregue la muestra patrón de este lote"; descripción "Haga clic en Agregar muestra y luego coloque el tarro patrón frente al sensor."; botón principal centrado de 72 px "Agregar muestra".
2. En el estado A, "✕ Cerrar" y Esc cierran la pantalla sin llamar a la API. El lote queda con el botón centrado "Agregar muestra" y el texto "Este lote todavía no tiene muestra patrón".
3. La pantalla del estado A vuelve a salir cada vez que se entra al lote mientras no tenga muestra.
4. **Estado B.** Al pulsar "Agregar muestra" (en la pantalla completa o en la pantalla del lote), el lote pasa a modo `Muestra` y la pantalla completa muestra: título "Coloque la muestra en el sensor", estado "● Esperando la muestra…" y botón "Cancelar".
5. En el estado B, "Cancelar", "✕ Cerrar" y Esc hacen lo mismo: devuelven el lote a `Inactivo`, cierran la pantalla completa y el foco vuelve al botón "Agregar muestra".
6. Cuando el puente envía la lectura, la pantalla completa se cierra sola. La pantalla del lote muestra el color de la muestra (cuadro sin borde, código hex debajo) y el aviso "✓ Muestra patrón guardada", y la acción principal pasa a ser "Iniciar recolección" (F4), en el mismo lugar.

## Criterios de aceptación

Ya en `development` (API):

- [x] Solo se puede pasar a modo `Muestra` si el lote está Activo, no tiene muestra y ningún otro lote usa el sensor; si no, la API responde 409 con el motivo.
- [x] Al registrarse la muestra, el lote vuelve solo a `Inactivo`.
- [x] Si otro lote usa el sensor, la pantalla dice cuál, con enlace a ese lote, y no permite empezar.
- [x] Mientras espera, la pantalla se refresca cada 3 segundos.
- [x] Mientras se envía el cambio de modo, el botón dice "Abriendo…" y no admite un segundo clic.

Pendientes (flujo "Agregar muestra"):

- [x] Existe la regla `necesitaMuestraPatron` en `lib/modulos/lotes/reglas.ts`, con pruebas: verdadera solo si el lote está Activo, en modo `Inactivo` y sin muestra.
- [x] Al abrir un lote que cumple `necesitaMuestraPatron`, la pantalla completa del estado A aparece sola, con "Lote <código>", "✕ Cerrar", "Agregue la muestra patrón de este lote", la descripción y el botón centrado "Agregar muestra" de 72 px.
- [x] Un lote pausado, o uno que ya tiene muestra, no abre la pantalla del estado A.
- [x] En el estado A, "✕ Cerrar" y Esc cierran la pantalla sin ninguna llamada a la API (se comprueba en la pestaña Red del navegador).
- [x] Con el estado A cerrado, el lote muestra "Este lote todavía no tiene muestra patrón" y el botón centrado "Agregar muestra".
- [x] Al salir del lote y volver a entrar sin muestra, la pantalla del estado A sale otra vez.
- [x] Al pulsar "Agregar muestra", el lote pasa a modo `Muestra` y la pantalla dice "Coloque la muestra en el sensor", "● Esperando la muestra…" y "Cancelar".
- [x] En el estado B, "Cancelar", "✕ Cerrar" y Esc devuelven el lote a `Inactivo`.
- [x] Al guardarse la muestra, la pantalla completa se cierra sola, el lote muestra el color con "✓ Muestra patrón guardada" y la acción principal es "Iniciar recolección".
- [x] El cuadro de la muestra no tiene borde y su código hex va debajo.
- [x] La pantalla completa cubre todo el viewport con fondo opaco; mientras está abierta no se puede usar lo que hay detrás.
- [x] Título de 48 px, una sola instrucción y botones de 72 px de alto.
- [x] Al cerrarla, el foco vuelve al botón principal de la pantalla del lote.
- [x] Al recargar la página con el lote en modo `Muestra`, la pantalla completa aparece abierta en el estado B.
- [x] Si la API rechaza el cambio, el motivo se muestra en texto de 18 px con "⚠" y lo que hay que hacer.
- [x] Usa `role="dialog"`, `aria-modal="true"` y `aria-labelledby` apuntando al título; "● Esperando la muestra…" usa `role="status"`.

## Criterios de aceptación del back

Formato Dado / Cuando / Entonces, contra la API (sin usar el formulario). La casilla se marca cuando el criterio se verificó contra la API (Thunder Client sobre la rama `desarrollo` de Neon, prueba E2E o la verificación registrada en [pruebas/criterios-back.md](../pruebas/criterios-back.md)). Los no marcados quedan pendientes de verificación. Los códigos y mensajes exactos están en [contratos/api.md](../contratos/api.md).

- [x] Dado un lote `Activo`, sin muestra y con el sensor libre, cuando un usuario con sesión pide `PATCH /api/lotes/[id]/captura` con `Muestra`, entonces responde 200 y el lote queda en modo `Muestra`.
- [x] Dado un lote en modo `Muestra`, cuando el puente envía `POST /api/tarros` con `{ loteId, resultadoHex: "#E35336", esMuestra: true }`, entonces responde 201 con `resultado: "Muestra"` y `desviacion_delta_e: null`, y el lote vuelve a `Inactivo` en la misma transacción.
- [x] Dado un lote que ya tiene muestra, cuando se pide el modo `Muestra`, entonces responde 409 "El lote ya tiene muestra registrada; usa el modo Recoleccion" y el modo no cambia.
- [x] Dado que otro lote está capturando, cuando se pide el modo `Muestra` para este lote, entonces responde 409 con el código del otro lote y este lote sigue en `Inactivo`.
- [x] Dadas dos peticiones al mismo tiempo que ponen dos lotes distintos en modo `Muestra`, cuando las dos llegan, entonces solo una responde 200 y la otra 409 (lo garantiza `lotes_un_lote_capturando`).
- [x] Dado un lote en modo `Inactivo`, cuando el puente envía una muestra, entonces responde 409 "El lote no está en modo Muestra (modo actual: Inactivo)…" y no se guarda el tarro.
- [x] Dadas dos muestras del mismo lote enviadas al mismo tiempo, cuando llegan, entonces solo una responde 201 y el lote tiene una sola muestra.
- [x] Dado un modo inventado (`"Foto"`), cuando se pide el cambio, entonces responde 400 `El campo "modo" debe ser uno de: Inactivo, Muestra, Recoleccion`.
- [x] Dado un lote que no existe (id 999999), cuando se pide el cambio de modo, entonces responde 404 "El lote 999999 no existe".
- [x] Dado el puente con su clave y sin sesión, cuando pide `PATCH /api/lotes/[id]/captura`, entonces responde 401 "Inicia sesión para cambiar el modo de captura".
- [x] Dado un lote en modo `Muestra`, cuando se envía una muestra con `resultadoHex: "rojo"`, entonces responde 400 `El campo "resultadoHex" debe tener el formato #RRGGBB`.

## Fuera de alcance

Cambiar la muestra de un lote que ya la tiene, calibrar el sensor desde la web.
