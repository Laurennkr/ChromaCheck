# F6 · Historial de tarros

## Historia

Como operario, quiero consultar todos los tarros revisados con su lote, color, ΔE y dictamen, para comparar el dictamen del sistema con el juicio visual y tener la trazabilidad de cada lote.

Es una consulta secundaria: se abre desde el enlace "Historial" del encabezado y no forma parte del flujo principal (abrir lote → agregar muestra → iniciar recolección).

## Relación

Pantalla `/historial`. Historia HU-H7; caso CP-10.

## Comportamiento

1. La tabla muestra los tarros del más reciente al más antiguo: tarro, lote, color medido, ΔE y resultado.
2. Muestra 6 tarros por página, con botones para pasar de página.

## Criterios de aceptación

Ya en `development`:

- [x] El primer tarro de la lista es el de fecha y hora más reciente.
- [x] 6 tarros por página (`?pagina=N`).
- [x] ΔE con 2 decimales ("—" si no está calculado) y resultado con símbolo y palabra.

Pendientes (identidad visual):

- [x] Encabezados de tabla en 16 px negrita, sin mayúsculas sostenidas; filas en 18 px.
- [x] Botones "Página anterior" y "Página siguiente" de 56 px con texto, y "Página 2 de 5" visible.
- [x] El cuadro del color medido mide al menos 32 px y tiene borde.

## Criterios de aceptación del back

La pantalla no usa la API: lee con `obtenerHistorialTarros` (`lib/modulos/tarros/servicio.ts`) en el servidor. Los criterios se comprueban contra ese servicio y contra la página. La casilla se marca cuando el criterio se verificó contra ese servicio y la página (sobre la rama `desarrollo` de Neon o con prueba E2E). Los no marcados quedan pendientes de verificación.

- [ ] Dados dos lotes con su muestra y 7 lecturas en total, cuando se pide la página 1 con 6 por página, entonces el servicio devuelve 6 lecturas (sin las muestras), de la más reciente a la más antigua, y `totalTarros` es 7.
- [ ] Dadas dos lecturas con el mismo `timestamp`, cuando se listan, entonces va primero la de `id_tarro` mayor.
- [ ] Dada cada fila del historial, cuando se devuelve, entonces trae `lote_codigo` además del color, el ΔE y el resultado.
- [ ] Dado `/historial?pagina=abc` o `?pagina=0`, cuando se abre, entonces muestra la página 1 sin error.
- [ ] Dado `/historial?pagina=99` con solo 2 páginas, cuando se abre, entonces redirige a `/historial?pagina=2`.
- [ ] Dado un visitante sin sesión, cuando abre `/historial`, entonces lo redirige a `/login` y no se consulta la base.

## Fuera de alcance

Exportar a Excel o PDF, filtros por fecha o por lote.
