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
