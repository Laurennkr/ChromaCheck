# Verificación de los criterios del back

Registro de la verificación de los "Criterios de aceptación del back" de las specs F1 a F7. Cada criterio se comprobó con peticiones reales a la API (o al servicio y la página, en F6 y F7), no leyendo el código.

## Cuándo y cómo

- **Fecha:** 2026-11-21, sobre la rama `development` (commit `d9fc534`).
- **Aplicación:** `next dev` con la sesión del operario y la clave del dispositivo, igual que en producción.
- **Base de datos:** PostgreSQL local con las migraciones `0001_esquema_inicial.sql` y `0002_reglas_de_negocio.sql`, el mismo esquema de la rama `desarrollo` de Neon. Usuario creado con `scripts/crear-usuario.ts`.
- **Umbral de ΔE:** los criterios que dependen del umbral se compararon con las constantes de `lib/modulos/tarros/reglas.ts` (`UMBRAL_TOLERANCIA_DELTA_E = 8.0`, `UMBRAL_ALERTA_ROJA_DELTA_E = 15.0`), como dicen F4 y F5. El 0,8 sigue siendo la regla teórica de los documentos.

## Resultado

**61 de 61 criterios cumplen.** No quedó ningún criterio del back sin cumplir.

| Spec | Criterios | Cumplen | Cómo se verificó                                                                                                                             |
| ---- | --------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| F1   | 9         | 9       | Peticiones a `/api/auth/*` y `/api/lotes`; el servidor se reinició sin `CLAVE_DISPOSITIVO` y con una clave de 5 caracteres (las dos dan 401) |
| F2   | 7         | 7       | Peticiones a `/api/lotes`                                                                                                                    |
| F3   | 11        | 11      | Peticiones a `/api/lotes/[id]/captura` y `/api/tarros`; las dos pruebas de concurrencia se repitieron 10 veces cada una                      |
| F4   | 13        | 13      | Peticiones a `/api/tarros`; CP-03 comparado con un cálculo CIE76 hecho aparte (diferencia 0 en los tres pares)                               |
| F5   | 13        | 13      | Secuencias de lecturas por `/api/tarros` y `/api/lotes/[id]/reanudar`, revisando la tabla `alertas` y el lote en la base                     |
| F6   | 6         | 6       | `obtenerHistorialTarros` sobre datos conocidos y la página `/historial`; el log de PostgreSQL confirma 0 consultas sin sesión                |
| F7   | 2         | 2       | Botón "Oscuro" en el navegador (cookie `tema=oscuro`, vence en 365 días) y la página con cookies `tema` alteradas (queda `claro`)            |

## Lo que hay que saber al leer las casillas

- **Criterios con números del umbral.** En F4 y F5, el texto usa los valores teóricos (0,8 y 8). Con los valores calibrados del código, la lectura `#E65A3C` (ΔE 2,71) da "Aprobado", y la roja grave dice "(límite 15)". Se verificó la misma regla con lecturas equivalentes: por encima de 8 es "No Aprobado", exactamente 8,00 es "Aprobado", amarilla entre 8 y 15 y roja grave desde 15.
- **DEF-01 / CP-07 queda cerrado.** `POST /api/lotes` con código vacío o solo con espacios responde 400 y no crea el lote.
- **Cerrar sesión.** `POST /api/auth/logout` borra la cookie del navegador, y la siguiente petición responde 401. La sesión es una cookie firmada sin registro en la base: si alguien copió la cookie antes de cerrar sesión, esa copia sigue sirviendo hasta que vence (8 horas). El criterio no pide más que esto.
