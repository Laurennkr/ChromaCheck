# Migraciones

Cada cambio de esquema de la base (PostgreSQL 17 en Neon) es un archivo `NNNN_descripcion.sql` en esta carpeta. El modelo que resulta de aplicarlas todas está en [docs/datos/modelo.md](../../docs/datos/modelo.md).

| Archivo                      | Qué hace                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `0001_esquema_inicial.sql`   | Crea las tablas, claves, índices y CHECK tal como existían el 2026-11-20. En una base existente no cambia nada |
| `0002_reglas_de_negocio.sql` | Una muestra por lote, una alerta por tarro, valores permitidos, formato del hex y coherencia (B1, B2, B3, B5)  |

## Orden

Se aplican en orden numérico, una sola vez cada una. Cada archivo va dentro de una transacción (`BEGIN … COMMIT`): si algo falla, no queda nada a medias. Las restricciones se agregan solo si faltan, así que volver a ejecutar un archivo no da error.

Una base nueva se crea aplicando todas, de la 0001 a la última. Una migración aplicada no se edita: un cambio nuevo es un archivo nuevo con el número siguiente.

## Cómo se aplica una migración

1. **Primero en la rama `desarrollo` de Neon**, nunca directo en la principal. Antes de escribirla se cuentan las filas que la violarían; si hay alguna, se decide con el equipo qué hacer con ellas antes de seguir.
2. Se prueba ahí: la migración aplica sin error y las inserciones que deben fallar fallan (ver el PR de la migración).
3. Se muestra el SQL y se espera la aprobación de Lauren.
4. **Solo con esa aprobación** se aplica a la rama principal, como explica [docs/operacion/despliegue.md](../../docs/operacion/despliegue.md#migraciones-de-la-base).
5. En el mismo PR se actualiza `docs/datos/modelo.md`.

Nunca se escriben cadenas de conexión ni contraseñas en estos archivos ni en los comandos que se suben al repositorio.
