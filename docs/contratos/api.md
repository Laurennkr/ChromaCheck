# API de ChromaCheck

Contrato entre la web, el puente serial y el servidor: qué entra, qué sale y qué puede fallar en cada operación. Las tablas que hay detrás están en [datos/modelo.md](../datos/modelo.md). Si una operación no está aquí, primero se agrega al contrato y después se programa.

Las rutas viven en `app/api/**/route.ts` (Route Handlers de Next.js) y solo validan el formato y responden; las reglas están en `lib/modulos/<modulo>/servicio.ts` y `reglas.ts` (ver [arquitectura.md](../arquitectura.md#capas-del-back)).

## Formato de las respuestas

Todas las respuestas son JSON con la misma forma:

```json
{ "exito": true, "datos": ... }
{ "exito": false, "error": "mensaje para quien hizo la petición" }
```

Errores comunes a todas las rutas:

| Código | Cuándo                                                              | Mensaje                                            |
| ------ | ------------------------------------------------------------------- | -------------------------------------------------- |
| 400    | La ruta espera un cuerpo y no llega un objeto JSON                  | `El cuerpo de la petición debe ser un objeto JSON` |
| 401    | Sin sesión válida ni clave del dispositivo (lo responde `proxy.ts`) | `Inicie sesión o envíe la clave del dispositivo`   |
| 500    | Cualquier error no previsto (base caída, error de programación)     | `Error interno del servidor`                       |

Los mensajes nunca revelan detalles internos: en un 500 el error real (SQL, traza, nombre de la tabla) queda solo en el registro del servidor, con `responderErrorInterno` de `lib/respuestas.ts`.

## Acceso

`proxy.ts` revisa cada petición a `/api` antes de que llegue a la ruta. La web entra con la cookie `sesion` y el puente serial con la clave del dispositivo, que envía en el encabezado `x-clave-dispositivo` (ver [autenticacion.md](autenticacion.md#clave-del-dispositivo)).

| Ruta                                                                                 | Acceso                         |
| ------------------------------------------------------------------------------------ | ------------------------------ |
| `/api/auth/*` (login y logout)                                                       | Libre                          |
| `POST /api/tarros` y `GET /api/captura/activa`                                       | Sesión o clave del dispositivo |
| `GET /api/lotes` y `GET /api/tarros`                                                 | Sesión o clave del dispositivo |
| `POST /api/lotes`, `PATCH /api/lotes/[id]/captura` y `POST /api/lotes/[id]/reanudar` | Solo sesión                    |

Las tres rutas de "Solo sesión" vuelven a revisar la cookie en su propio `route.ts`: con la clave del dispositivo y sin sesión responden `401` con su propio mensaje (ver cada operación). El usuario siempre sale de la cookie firmada, nunca del cuerpo de la petición.

## Acciones de las pantallas y operaciones

Cada acción que cambia datos tiene su operación. Las pantallas leen los datos en el servidor, llamando directamente a los servicios (son componentes de servidor), así que mostrar una lista no pasa por la API; `proxy.ts` también protege esas páginas.

| Pantalla      | Acción                                                        | Operación                                                                               |
| ------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `/login`      | "Ingresar"                                                    | `POST /api/auth/login` ([autenticacion.md](autenticacion.md))                           |
| Encabezado    | "Cerrar sesión"                                               | `POST /api/auth/logout` ([autenticacion.md](autenticacion.md))                          |
| Encabezado    | "Fondo: Claro / Oscuro"                                       | Ninguna: la Server Function `guardarTema` guarda la cookie `tema`; no toca la base (F7) |
| `/`           | Ver la lista de lotes                                         | Sin API: `obtenerLotesConResumen` en el servidor                                        |
| `/`           | "Agregar lote"                                                | [`POST /api/lotes`](#post-apilotes)                                                     |
| `/`           | "Abrir lote"                                                  | Ninguna: navega a `/lotes/[id]`                                                         |
| `/lotes/[id]` | Ver el lote, la muestra, las últimas 8 lecturas y las alertas | Sin API: servicios de `lotes`, `tarros` y `alertas` en el servidor                      |
| `/lotes/[id]` | "Agregar muestra"                                             | [`PATCH /api/lotes/[id]/captura`](#patch-apilotesidcaptura) con `Muestra`               |
| `/lotes/[id]` | "Cancelar", "✕ Cerrar" o Esc mientras espera la muestra       | `PATCH /api/lotes/[id]/captura` con `Inactivo`                                          |
| `/lotes/[id]` | "✕ Cerrar" o Esc en el aviso "Agregue la muestra patrón"      | Ninguna: solo cierra la pantalla completa                                               |
| `/lotes/[id]` | "Iniciar recolección"                                         | `PATCH /api/lotes/[id]/captura` con `Recoleccion`                                       |
| `/lotes/[id]` | "Terminar recolección", "✕ Cerrar" o Esc mientras recolecta   | `PATCH /api/lotes/[id]/captura` con `Inactivo`                                          |
| `/lotes/[id]` | "Reanudar recolección"                                        | [`POST /api/lotes/[id]/reanudar`](#post-apilotesidreanudar)                             |
| `/lotes/[id]` | "Entendido", "✕ Cerrar" o Esc en el aviso de lote pausado     | Ninguna: el lote sigue `Pausado`                                                        |
| `/lotes/[id]` | Refresco cada 3 s mientras captura                            | Sin API: `router.refresh()` vuelve a leer con los servicios                             |
| `/historial`  | Ver una página, "Página anterior", "Página siguiente"         | Sin API: `obtenerHistorialTarros` con `?pagina=N`                                       |
| Puente serial | Saber qué lote captura y en qué modo                          | [`GET /api/captura/activa`](#get-apicapturaactiva)                                      |
| Puente serial | Enviar la muestra o una lectura                               | [`POST /api/tarros`](#post-apitarros)                                                   |

`GET /api/lotes` y `GET /api/tarros` no los usa ninguna pantalla: sirven para las pruebas de la API y para depurar.

## Lotes

### `GET /api/lotes`

**Quién:** sesión o clave del dispositivo. **Entrada:** ninguna.

Lista todos los lotes, del más reciente al más antiguo (`fecha_inicio` descendente).

```json
{
  "exito": true,
  "datos": [
    {
      "id": 2,
      "codigo": "#002_Azul_Cielo",
      "estado": "Activo",
      "modo_captura": "Inactivo",
      "fecha_inicio": "2026-11-20T15:30:00.000Z"
    },
    {
      "id": 1,
      "codigo": "#001_Terracota",
      "estado": "Pausado",
      "modo_captura": "Inactivo",
      "fecha_inicio": "2026-11-16T15:00:00.000Z"
    }
  ]
}
```

| Código | Cuándo                       | Mensaje                                          |
| ------ | ---------------------------- | ------------------------------------------------ |
| 200    | Siempre que la base responde | —                                                |
| 401    | Sin sesión ni clave          | `Inicie sesión o envíe la clave del dispositivo` |
| 500    | Error interno                | `Error interno del servidor`                     |

### `POST /api/lotes`

**Quién:** solo sesión (botón "Agregar lote"). El puente serial no la llama.

**Entrada:**

```json
{ "codigo": "#005_Azul_Cielo" }
```

| Campo    | Tipo  | Regla                                                                                                                                                  |
| -------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `codigo` | Texto | Obligatorio. De 1 a 50 caracteres sin contar los espacios de los extremos (se recortan). Único: `#005_azul` y `#005_Azul` cuentan como el mismo código |

**201 Created:** el lote nuevo, `Activo` y en modo `Inactivo`.

```json
{
  "exito": true,
  "datos": {
    "id": 5,
    "codigo": "#005_Azul_Cielo",
    "estado": "Activo",
    "modo_captura": "Inactivo",
    "fecha_inicio": "2026-11-21T14:00:00.000Z"
  }
}
```

| Código | Cuándo                                            | Mensaje                                                 |
| ------ | ------------------------------------------------- | ------------------------------------------------------- |
| 400    | El cuerpo no es un objeto JSON                    | `El cuerpo de la petición debe ser un objeto JSON`      |
| 400    | Falta `codigo`, no es texto o solo tiene espacios | `El campo "codigo" es obligatorio`                      |
| 400    | `codigo` tiene más de 50 caracteres               | `El campo "codigo" no puede tener más de 50 caracteres` |
| 401    | Sin sesión ni clave                               | `Inicie sesión o envíe la clave del dispositivo`        |
| 401    | Con la clave del dispositivo pero sin sesión      | `Inicia sesión para crear un lote`                      |
| 409    | Ya existe un lote con ese código                  | `Ya existe un lote con el código "<codigo>"`            |
| 500    | Error interno                                     | `Error interno del servidor`                            |

## Captura del sensor

Hay un solo sensor, así que la web decide qué lote recibe sus lecturas y en qué modo. El modo se guarda en `lotes.modo_captura`:

| Modo          | Qué hace                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `Inactivo`    | El lote no recibe lecturas. Es el modo por defecto                                                         |
| `Muestra`     | El próximo tarro leído se registra como muestra del lote. Al registrarla, el lote vuelve solo a `Inactivo` |
| `Recoleccion` | Cada tarro leído se registra como lectura y se compara con la muestra                                      |

Solo un lote a la vez puede tener un modo distinto de `Inactivo`. Lo garantiza el índice único parcial `lotes_un_lote_capturando`, aunque lleguen dos peticiones al mismo tiempo. Si una alerta roja pausa el lote, su modo pasa a `Inactivo` en la misma sentencia.

### `PATCH /api/lotes/[id]/captura`

**Quién:** solo sesión.

**Entrada:** `id` en la ruta (entero positivo) y el modo en el cuerpo:

```json
{ "modo": "Recoleccion" }
```

| Modo pedido   | Se permite si                                                              |
| ------------- | -------------------------------------------------------------------------- |
| `Inactivo`    | Siempre (detiene la captura), también en un lote `Pausado`                 |
| `Muestra`     | El lote está `Activo`, no tiene muestra y ningún otro lote está capturando |
| `Recoleccion` | El lote está `Activo`, ya tiene muestra y ningún otro lote está capturando |

**200 OK:** el lote actualizado.

```json
{
  "exito": true,
  "datos": {
    "id": 1,
    "codigo": "#001_Terracota",
    "estado": "Activo",
    "modo_captura": "Recoleccion",
    "fecha_inicio": "2026-11-16T15:00:00.000Z"
  }
}
```

| Código | Cuándo                                                                | Mensaje                                                                                                  |
| ------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 400    | `id` no es un entero positivo                                         | `El id del lote debe ser un entero positivo`                                                             |
| 400    | El cuerpo no es un objeto JSON                                        | `El cuerpo de la petición debe ser un objeto JSON`                                                       |
| 400    | `modo` no es uno de los tres                                          | `El campo "modo" debe ser uno de: Inactivo, Muestra, Recoleccion`                                        |
| 401    | Sin sesión ni clave                                                   | `Inicie sesión o envíe la clave del dispositivo`                                                         |
| 401    | Con la clave del dispositivo pero sin sesión                          | `Inicia sesión para cambiar el modo de captura`                                                          |
| 404    | El lote no existe                                                     | `El lote <id> no existe`                                                                                 |
| 409    | Pide `Muestra` o `Recoleccion` y el lote está `Pausado`               | `El lote está Pausado y no puede capturar lecturas`                                                      |
| 409    | Pide `Muestra` y el lote ya tiene muestra                             | `El lote ya tiene muestra registrada; usa el modo Recoleccion`                                           |
| 409    | Pide `Recoleccion` y el lote no tiene muestra                         | `El lote no tiene muestra registrada; captura primero la muestra con el modo Muestra`                    |
| 409    | Otro lote está capturando                                             | `El lote "<código del otro>" ya está capturando en modo <modo>; detén esa captura antes de iniciar otra` |
| 409    | Otro lote empezó a capturar en el mismo instante (lo frena el índice) | El mensaje anterior, o `Otro lote empezó a capturar al mismo tiempo; intenta de nuevo`                   |
| 500    | Error interno                                                         | `Error interno del servidor`                                                                             |

### `POST /api/lotes/[id]/reanudar`

**Quién:** solo sesión (botón "Reanudar recolección"). **Entrada:** `id` en la ruta; no lleva cuerpo.

Reanuda un lote `Pausado` por una alerta roja: en la misma sentencia pasa `estado` a `Activo` y `modo_captura` a `Recoleccion`, para que la revisión siga sin otro clic (ver [F5](../specs/F5-alertas-y-pausa.md)).

**200 OK:** el lote actualizado.

```json
{
  "exito": true,
  "datos": {
    "id": 1,
    "codigo": "#001_Terracota",
    "estado": "Activo",
    "modo_captura": "Recoleccion",
    "fecha_inicio": "2026-11-16T15:00:00.000Z"
  }
}
```

Las alertas y las lecturas anteriores se conservan, pero las reglas de lecturas repetidas y crecientes solo cuentan las lecturas posteriores a la última alerta roja: después de reanudar, la cuenta empieza de nuevo. Una lectura con ΔE de 8 o más vuelve a pausar el lote de inmediato.

| Código | Cuándo                                                                | Mensaje                                                                                                  |
| ------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 400    | `id` no es un entero positivo                                         | `El id del lote debe ser un entero positivo`                                                             |
| 401    | Sin sesión ni clave                                                   | `Inicie sesión o envíe la clave del dispositivo`                                                         |
| 401    | Con la clave del dispositivo pero sin sesión                          | `Inicia sesión para reanudar el lote`                                                                    |
| 404    | El lote no existe                                                     | `El lote <id> no existe`                                                                                 |
| 409    | El lote no está `Pausado`                                             | `El lote está <estado>; solo se puede reanudar un lote Pausado`                                          |
| 409    | Otro lote está capturando                                             | `El lote "<código del otro>" ya está capturando en modo <modo>; detén esa captura antes de iniciar otra` |
| 409    | Otra petición lo reanudó en el mismo instante                         | `El lote ya no está pausado; recargue la página para ver su estado`                                      |
| 409    | Otro lote empezó a capturar en el mismo instante (lo frena el índice) | El mensaje de otro lote capturando, o `Otro lote empezó a capturar al mismo tiempo; intenta de nuevo`    |
| 500    | Error interno                                                         | `Error interno del servidor`                                                                             |

### `GET /api/captura/activa`

**Quién:** sesión o clave del dispositivo; la consulta el puente serial antes de enviar cada lectura. **Entrada:** ninguna.

```json
{ "exito": true, "datos": { "loteId": 1, "codigo": "#001_Terracota", "modo": "Recoleccion" } }
{ "exito": true, "datos": null }
```

`datos` es `null` cuando ningún lote está capturando.

| Código | Cuándo                   | Mensaje                                          |
| ------ | ------------------------ | ------------------------------------------------ |
| 200    | Captura activa, o `null` | —                                                |
| 401    | Sin sesión ni clave      | `Inicie sesión o envíe la clave del dispositivo` |
| 500    | Error interno            | `Error interno del servidor`                     |

### Contrato con el puente serial

El puente lo sigue cuando se ejecuta con `--automatico` (ver `puente-serial/README.md`). Envía cada petición con el encabezado `x-clave-dispositivo`; si la API responde `401`, avisa que la clave fue rechazada y sigue leyendo. Por cada `LECTURA;R;G;B` que recibe del Arduino ([serial.md](serial.md)):

1. Consultar `GET /api/captura/activa`.
2. Si `datos` es `null`, descartar la lectura sin enviarla.
3. Si `modo` es `Muestra`, enviar `POST /api/tarros` con `{ loteId, resultadoHex, esMuestra: true }`.
4. Si `modo` es `Recoleccion`, enviar `POST /api/tarros` con `{ loteId, resultadoHex, rgb }`.
5. Si la API responde 409 (por ejemplo, porque la web cambió el modo entre la consulta y el envío), registrar el mensaje y seguir leyendo.

## Tarros

### `GET /api/tarros?loteId=N`

**Quién:** sesión o clave del dispositivo. **Entrada:** `loteId` en la URL (entero positivo).

Lista todos los tarros de un lote (muestra incluida), del más antiguo al más reciente. Si el lote no existe, la lista llega vacía.

```json
{
  "exito": true,
  "datos": [
    {
      "id_tarro": 41,
      "lote_id": 1,
      "resultado_hex": "#E35336",
      "desviacion_delta_e": null,
      "resultado": "Muestra",
      "es_muestra": true,
      "timestamp": "2026-11-16T15:05:00.000Z"
    },
    {
      "id_tarro": 42,
      "lote_id": 1,
      "resultado_hex": "#E35337",
      "desviacion_delta_e": "0.51",
      "resultado": "Aprobado",
      "es_muestra": false,
      "timestamp": "2026-11-16T15:06:10.000Z"
    }
  ]
}
```

`desviacion_delta_e` llega como texto con 2 decimales (PostgreSQL entrega así las columnas `numeric`), o `null` en la muestra.

| Código | Cuándo                                    | Mensaje                                             |
| ------ | ----------------------------------------- | --------------------------------------------------- |
| 400    | `loteId` falta o no es un entero positivo | `El parámetro "loteId" debe ser un entero positivo` |
| 401    | Sin sesión ni clave                       | `Inicie sesión o envíe la clave del dispositivo`    |
| 500    | Error interno                             | `Error interno del servidor`                        |

### `POST /api/tarros`

**Quién:** sesión o clave del dispositivo; en el taller lo envía el puente serial. Depende del modo de captura del lote (ver [Captura del sensor](#captura-del-sensor)):

- La muestra solo se acepta si el lote está en modo `Muestra`. Al registrarla, el lote vuelve a `Inactivo` en la misma transacción.
- Las lecturas solo se aceptan si el lote está `Activo`, tiene muestra y está en modo `Recoleccion`.

**Entrada.** Tarro muestra (uno por lote):

```json
{ "loteId": 1, "resultadoHex": "#E35336", "esMuestra": true }
```

Lectura del sensor (el servidor calcula ΔE frente a la muestra, decide el dictamen y registra la alerta si corresponde):

```json
{ "loteId": 1, "resultadoHex": "#E35337", "rgb": [227, 83, 55] }
```

| Campo          | Tipo        | Regla                                                                                       |
| -------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `loteId`       | Entero      | Obligatorio, positivo, de un lote existente                                                 |
| `resultadoHex` | Texto       | Obligatorio, formato `#RRGGBB`                                                              |
| `rgb`          | `[r, g, b]` | Solo en lecturas: tres enteros de 0 a 255 que representan el mismo color que `resultadoHex` |
| `esMuestra`    | Booleano    | Opcional. Solo `true` registra la muestra; cualquier otro valor se trata como lectura       |

El cliente nunca envía el ΔE, el dictamen ni el lote al que pertenece la alerta: los decide el servidor.

**201 Created:** el tarro registrado. Muestra:

```json
{
  "exito": true,
  "datos": {
    "id_tarro": 41,
    "lote_id": 1,
    "resultado_hex": "#E35336",
    "desviacion_delta_e": null,
    "resultado": "Muestra",
    "es_muestra": true,
    "timestamp": "2026-11-16T15:05:00.000Z"
  }
}
```

Lectura (si generó una alerta, no viene en la respuesta: la web la ve al refrescar la pantalla del lote):

```json
{
  "exito": true,
  "datos": {
    "id_tarro": 42,
    "lote_id": 1,
    "resultado_hex": "#E35337",
    "desviacion_delta_e": "0.51",
    "resultado": "Aprobado",
    "es_muestra": false,
    "timestamp": "2026-11-16T15:06:10.000Z"
  }
}
```

| Código | Cuándo                                                                     | Mensaje                                                                                                      |
| ------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 400    | El cuerpo no es un objeto JSON                                             | `El cuerpo de la petición debe ser un objeto JSON`                                                           |
| 400    | `loteId` falta o no es un entero positivo                                  | `El campo "loteId" debe ser un entero positivo`                                                              |
| 400    | `resultadoHex` falta o no tiene el formato                                 | `El campo "resultadoHex" debe tener el formato #RRGGBB`                                                      |
| 400    | Lectura sin `rgb` válido                                                   | `El campo "rgb" debe ser un arreglo [r, g, b] de enteros entre 0 y 255`                                      |
| 400    | `rgb` y `resultadoHex` son colores distintos                               | `Los campos "resultadoHex" y "rgb" no representan el mismo color`                                            |
| 401    | Sin sesión ni clave                                                        | `Inicie sesión o envíe la clave del dispositivo`                                                             |
| 404    | El lote no existe                                                          | `El lote <loteId> no existe`                                                                                 |
| 409    | Muestra: el lote ya tiene muestra                                          | `El lote ya tiene un tarro muestra registrado`                                                               |
| 409    | Muestra: el lote no está en modo `Muestra`, o lo dejó en el mismo instante | `El lote no está en modo Muestra (modo actual: <modo>); actívalo desde la web antes de registrar la muestra` |
| 409    | Lectura: el lote no tiene muestra                                          | `El lote no tiene tarro muestra registrado`                                                                  |
| 409    | Lectura: el lote está `Pausado`                                            | `El lote está pausado por una alerta roja y no acepta lecturas`                                              |
| 409    | Lectura: el lote no está en modo `Recoleccion`                             | `El lote no está en modo Recoleccion (modo actual: <modo>); actívalo desde la web antes de enviar lecturas`  |
| 500    | Error interno                                                              | `Error interno del servidor`                                                                                 |

## Autenticación

El login (`POST /api/auth/login`), el logout (`POST /api/auth/logout`) y la protección de las páginas y de la API con `proxy.ts` están en [autenticacion.md](autenticacion.md).

## Diferencias encontradas entre el contrato y el código

Al comparar este contrato con cada `route.ts` (20/11/2026) el código y el contrato coinciden en rutas, entradas y códigos HTTP. Quedan estas diferencias de redacción y de criterio; no se corrigen en este PR, quedan en [tareas.md](../tareas.md#9-backend-especificación-u4):

| #   | Diferencia                                                                                                                                                                                                                                                                                 | Propuesta                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| D1  | Los mensajes mezclan "usted" y "tú": `proxy.ts` dice "Inicie sesión…" y "recargue", pero las rutas dicen "Inicia sesión…", "detén", "intenta", "actívalo". La decisión del 2026-11-13 pide trato de usted                                                                                  | Unificar todos los mensajes en usted                                                             |
| D2  | Algunos 409 muestran valores internos (`Recoleccion`, `Muestra`, `Inactivo`) y la web los muestra tal cual; F4 pide que la palabra `Recoleccion` no aparezca en ninguna pantalla                                                                                                           | Redactar esos mensajes con las palabras del taller ("recolección", "muestra patrón", "detenido") |
| D3  | Los 400 de `POST /api/lotes` nombran el campo técnico (`El campo "codigo"…`) y el formulario los muestra tal cual al operario                                                                                                                                                              | Mensaje para el operario ("Escriba el código del lote") o validar antes en el formulario         |
| D4  | `GET /api/tarros` con un `loteId` que no existe responde 200 con lista vacía, mientras que las demás rutas responden 404 para un lote inexistente                                                                                                                                          | Decidir si se deja así (documentado) o responde 404                                              |
| D5  | `POST /api/tarros` acepta también la sesión de un usuario, no solo la clave del dispositivo: con sesión se pueden registrar lecturas sin el sensor. Sirve para las pruebas de la API (los datos de prueba se crean por la API, no con SQL), pero también permite registrar lecturas a mano | Mantenerlo y dejarlo explícito, o limitarlo a la clave del dispositivo                           |
