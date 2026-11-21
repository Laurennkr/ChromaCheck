# Bitácora de IA · ChromaCheck

Registro de lo que propuso la IA en cada trabajo y de lo que se corrigió antes de aceptarlo. La autora y responsable de las decisiones es Lauren Castro; la IA propone, ella decide.

## 2026-11-20 · Especificación del backend (U4, Lab "Plano de instalaciones")

**Herramienta:** Claude (Anthropic). **Rama:** `feature/docs-backend`. **Alcance:** solo documentación, sin cambios de código ni de base de datos.

### Prompts usados

1. Entrevista de datos (adaptado de la guía M4 · U4): leer `producto.md`, `arquitectura.md`, las specs y los `repositorio.ts`, y proponer `docs/datos/modelo.md` con ER en Mermaid, una tabla por entidad, restricciones, reglas de negocio por capa y dueño de cada fila. Sin SQL ni código.
2. Contrato y criterios del back: completar `docs/contratos/api.md` comparando cada operación con su `route.ts` (entrada, respuesta con ejemplo JSON, errores con código HTTP y mensaje exacto) y agregar a cada spec la sección "Criterios de aceptación del back" en formato Dado / Cuando / Entonces, con al menos un caso de error.

### Qué propuso la IA

- `docs/datos/modelo.md` con las cuatro tablas reales (`lotes`, `tarros`, `alertas`, `usuarios`), 16 reglas de negocio con su capa, el dueño de cada fila y seis brechas (B1 a B6).
- Un contrato completo: errores comunes, tabla "acción de pantalla → operación", ejemplos JSON y el mensaje exacto de cada error, más cinco diferencias entre el contrato y el código (D1 a D5).
- Criterios del back para F1 a F7, la skill `backend-seguro` adaptada a Neon y la sección "Backend" de `CLAUDE.md`.

### Qué se corrigió o se decidió distinto

| Propuesta inicial                                                                     | Corrección                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| La guía del módulo trae el modelo, la skill y las migraciones para Supabase con RLS   | Se mantiene Neon con Route Handlers y sin RLS: solo el servidor toca la base y el dueño de las filas es el taller (decisión del 2026-11-20)                                                      |
| Escribir los tipos de todas las columnas como si fueran seguros                       | Solo `usuarios` tiene su definición en el repositorio; los demás tipos se marcan con ¹ y se confirman con las consultas del anexo antes de darlos por ciertos                                    |
| Agregar `created_at` a cada tabla para cumplir el checklist                           | No se renombra ni se agrega nada: `fecha_inicio`, `timestamp` y `fecha_creacion` cumplen ese papel y renombrarlas rompería el código y los datos reales                                          |
| Criterio de F4: "un lote en `Inactivo` rechaza la lectura con el mensaje de modo"     | Al revisar `obtenerMotivoRechazoLectura`, ese mensaje solo sale si el lote ya tiene muestra; el criterio se precisó                                                                              |
| Criterio de F5: "10 lecturas fuera de tolerancia generan 10 alertas"                  | La primera roja pausa el lote y rechaza las siguientes; se cambió a 5 lecturas reanudando el lote, como dice ACQ-04                                                                              |
| Escribir en las specs y criterios el umbral que hoy tiene la constante de `reglas.ts` | Lauren fijó el umbral de aprobación en 0,8 para todos los documentos (decisión del 2026-11-20). La diferencia con el código queda como brecha B7 y tarea 9.13; el código no se cambia en este PR |
| Corregir de una vez los mensajes con "tú" y con `Recoleccion`                         | Se dejan anotados (D1 a D3) y como tareas 9.10 y 9.11: este PR es solo de documentación                                                                                                          |

### Revisión del equipo

Pendiente: Lauren revisa el modelo con el checklist del interventor, ejecuta las consultas del anexo en Neon y anota aquí lo que cambie.

## 2026-11-20 · Cimientos de la base (U4, Lab "Cimientos", adaptado a Neon)

**Herramienta:** Claude (Anthropic) con el MCP de Neon. **Rama:** `feature/db-cimientos`. **Alcance:** migraciones, restricciones en la base, datos semilla por la API y documentación. Sin cambios en `lib/` ni en `app/`.

### Prompt usado

Lab "Cimientos" adaptado a Neon (sin Supabase), con la skill `backend-seguro`: leer el esquema real en una rama `desarrollo` de Neon, revisar si hace falta RLS, contar las filas que violarían las reglas nuevas, escribir `0001_esquema_inicial.sql` y `0002_reglas_de_negocio.sql`, esperar la aprobación, aplicar solo en `desarrollo`, sembrar datos `TEST_` por la API, probar los intentos que deben fallar y documentar.

### Qué propuso e hizo la IA

- Creó la rama `desarrollo` de Neon desde la principal y leyó el esquema con `describe_table_schema` y las consultas del anexo. Encontró tipos distintos de lo documentado (`resultado_hex varchar(7)`, `nivel varchar(10)`, `contrasena_hash varchar(255)`), dos índices no documentados y confirmó las dos claves foráneas.
- Revisó Data API, Neon Auth, roles y permisos: nada expone las tablas, así que no hace falta RLS. Contó 0 filas que violaran las reglas nuevas.
- `0001` reproduce el esquema actual. Se verificó en un esquema temporal que se revierte: los 39 elementos (columnas, restricciones e índices) coinciden con la base real.
- `0002` agrega un índice único parcial, un UNIQUE y seis CHECK, todos solo si faltan. Se aplicó en `desarrollo` y los 9 intentos que debían fallar fallaron con la restricción esperada.
- `scripts/sembrar-datos.mjs` crea 3 lotes `TEST_SEMILLA_*` por la API (aprobadas, una amarilla y un lote pausado por roja). Toma la URL, el usuario, la contraseña y la clave de variables de entorno.
- `.env.development.local` se generó cambiando solo el host de la `DATABASE_URL` de `.env.local`, sin mostrar la cadena de conexión.

### Qué se corrigió o se decidió distinto

| Propuesta o situación                                                                                                | Decisión                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CHECK de `resultado_hex` solo con mayúsculas (`#RRGGBB`)                                                             | Se acepta también minúsculas, igual que `lib/validacion.ts`; si no, la base rechazaría lecturas que la API acepta                                                               |
| La semilla falló: el lote real `#006_Azul_marino` venía de la principal en modo `Recoleccion` y bloqueaba la captura | Lauren eligió detenerlo por la API (`PATCH … captura` con `Inactivo`) solo en la rama `desarrollo`; la principal no se tocó                                                     |
| Colores de la semilla según los umbrales de los documentos (0,8 y 8)                                                 | El código aún usa 8 y 15 (B7, sin corregir); los colores se eligieron para el código actual y el script lo advierte                                                             |
| Documentar en `modelo.md` solo las restricciones                                                                     | Lauren pidió agregar también los índices `idx_tarros_lote` e `idx_tarros_timestamp` y corregir `contrasena_hash` a `varchar(255)` en `modelo.md` y `contratos/autenticacion.md` |
| Si dos peticiones chocan en los índices nuevos, el 23505 llega como 500                                              | No se toca `lib/` en este PR: queda como brecha B8 y tarea 9.15                                                                                                                 |
| El aviso de seguridad de `next dev` pedía correr `next upgrade`                                                      | No se ejecutó: queda fuera del alcance de este PR y se le comunicó a Lauren                                                                                                     |

### Revisión del equipo

Pendiente: Lauren revisa el SQL de `0001` y `0002`, los resultados de las pruebas en `desarrollo` y decide cuándo aplicar `0002` en la rama principal.

## 2026-11-20 · Umbral teórico y umbral del prototipo

| Propuesta                                                     | Decisión                                                                                                                                                                                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alinear `reglas.ts` con el umbral 0,8 (tarea 9.13, brecha B7) | Lauren decidió no cambiar el código: el 0,8 queda como regla teórica en los documentos y el prototipo conserva los valores calibrados. Se ajustaron B7, la tarea 9.13, F4, F5, `producto.md` y el comentario de `scripts/sembrar-datos.mjs` |

## 2026-11-21 · Pruebas end to end con Playwright

Rama `feature/pruebas-e2e`. Detalle en [docs/pruebas/e2e.md](docs/pruebas/e2e.md).

### Prompt usado

Agregar pruebas E2E con Playwright en seis fases: rama `e2e` de Neon y `.env.e2e.local`, configuración con protección contra producción, apoyos (puente simulado, colores calculados con `reglas.ts`, lotes `TEST_E2E_` y sensor libre en `afterEach`), un archivo de escenarios por spec, dos ejecuciones seguidas y documentación. Sin cambiar la lógica de `lib/` ni de `app/`.

### Qué propuso e hizo la IA

- Creó la rama `e2e` de Neon desde `desarrollo` con el MCP y el usuario de pruebas con `scripts/crear-usuario.ts`. La contraseña se generó al azar y se escribió directo en `.env.e2e.local`, sin mostrarla.
- `playwright.config.ts`: servidor compilado en el puerto 3100 con `DATABASE_URL = E2E_DATABASE_URL`, `workers: 1`, sin reutilizar un servidor ya abierto, y un error antes de correr si la base E2E falta o tiene el mismo host que `.env.local`.
- Apoyos en `e2e/apoyo/`. Los colores se eligen por búsqueda: se baja el canal rojo de `#E35336` hasta caer en cada franja de ΔE calculada con las constantes de `reglas.ts`, así que las pruebas no tienen umbrales escritos.
- 10 escenarios en 6 archivos, con los textos reales de los componentes. No hizo falta agregar ningún `aria-label` ni `data-testid`.

### Qué se corrigió durante el trabajo

| Problema                                                                                                                                                                      | Corrección                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| En la primera ejecución fallaron 2 de 10: `getByRole('alert')` encontraba también el anunciador de rutas de Next.js (`#__next-route-announcer__`, vacío y con `role="alert"`) | Las pruebas filtran la alerta por su texto (`filter({ hasText })`). Después, dos ejecuciones seguidas con 10/10 |
| No hay API para borrar lotes y la regla pide borrar los datos de prueba al terminar                                                                                           | Se documentó restablecer la rama `e2e` desde `desarrollo` (tarea 10.7); no se borra con SQL a mano              |
| Correr las E2E en GitHub necesita secretos                                                                                                                                    | No se tocó `calidad.yml`; queda la tarea 10.6                                                                   |

### Revisión del equipo

Pendiente: Lauren revisa los escenarios, la protección contra producción y decide si las E2E entran en la integración continua.
