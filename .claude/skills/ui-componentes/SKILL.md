---
name: ui-componentes
description: Crear o modificar componentes y pantallas de ChromaCheck respetando la identidad visual para usuarios mayores de 55 años. Úsala cada vez que la tarea toque la UI (app/**/page.tsx, app/componentes/, app/globals.css o app/layout.tsx).
---

# Cómo construimos UI en ChromaCheck

1. Menos es más: entre menos tenga que preguntarse el usuario, mejor funciona el sistema. Cada pantalla dice qué hacer sin que el usuario pregunte nada.
2. Antes de escribir estilos, lee `docs/diseno/identidad-visual.md` y la spec de la funcionalidad en `docs/specs/`.
3. Colores: usa solo los tokens de la paleta definidos en `app/globals.css` (`@theme`). Nada de hex sueltos en las clases; la única excepción es el color real de la pintura (`resultado_hex`), que va en `style`. Los colores de marca puros (Firebug, Luxurious, Bay View, Vulcan) son solo para el logo y piezas gráficas, nunca para la interfaz.
4. Cuadro de color: el color de la pintura va sin borde y su código hex debajo, nunca encima; solo el cuadro vacío ("Sin lectura") lleva línea punteada.
5. Tipografía: Montserrat Bold (700) para títulos, dictamen y ΔE grandes; Montserrat SemiBold (600) para subtítulos, botones, enlaces de navegación, encabezados de tabla, etiquetas e insignias; Inter Regular (400) para texto y datos. Inter solo se carga en 400: ningún texto en Inter lleva negrita.
6. Componentes en `app/componentes/`, uno por archivo, en PascalCase y en español (`PantallaCaptura.tsx`), con props tipadas en una `interface Propiedades<Nombre>`. Booleanos como pregunta (`estaAbierto`, `tieneMuestra`); funciones que empiezan con verbo (`cambiarModo`); comentarios en español.
7. Sin reglas de negocio en los componentes: viven en `lib/modulos/<modulo>/reglas.ts`. Las páginas (servidor) leen con los servicios; los componentes cliente (`'use client'`) llaman a la API con `fetch`.
8. Tamaños para mayores de 55:
   - Texto base `text-lg` (18 px); mínimo `text-base` (16 px). Nunca `text-xs` ni `text-sm`.
   - Sin `uppercase` ni `tracking-*` en etiquetas, encabezados ni botones.
   - Botones de `h-14` (56 px) como mínimo; la acción principal de la pantalla y los botones de la pantalla completa, `h-18` (72 px). Separación mínima `gap-4`.
   - Campos de `h-14` con `<label>` visible encima.
9. Diseña primero para el computador del taller (1366 × 768), verifica en 768 px (tablet) y que nada se corte en 390 px.
10. Accesibilidad mínima:
    - Contraste de 7:1 en texto normal: los pares de la paleta ya lo cumplen, no inventes otros.
    - Nada solo por color: símbolo y palabra ("✓ Aprobado", "⚠ Pausado").
    - Foco visible (contorno de 4 px) en todo lo que se pueda pulsar.
    - Botones con texto; si llevan icono, también llevan palabra ("✕ Cerrar").
    - Diálogos y pantalla completa: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`; Esc cierra; el foco vuelve al botón que los abrió.
    - Estados con `role="status"`; errores con `role="alert"`.
11. Estados: muestra siempre enviando (el botón cambia de texto y no admite doble clic), vacío (con la acción que sigue) y error (qué pasó y qué hacer, sin disculpas).
12. Textos: trato de usted, verbo + objeto, el mismo nombre de la acción en todo el flujo ("Agregar muestra" → "Iniciar recolección" → "Terminar recolección"). Nunca muestres nombres internos (`Recoleccion`, `modo_captura`).
13. Al terminar:
    - Ejecuta `npx prettier --check .`, `npm run lint` y `npm run build`.
    - Lista los componentes creados o cambiados, con su ruta y en qué pantalla se ven (por ejemplo, `/lotes/1`).
    - Marca las casillas cumplidas en la spec y en `docs/tareas.md`.
