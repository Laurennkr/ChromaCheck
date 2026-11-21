// Seguridad de la API (docs/contratos/api.md, "Acceso"): sin sesión ni clave no se registra nada,
// y la clave del dispositivo no basta para las rutas que solo usa la web
import { expect, test } from '@playwright/test';
import { convertirRgbAHex, RGB_MUESTRA_PRUEBAS } from './apoyo/colores';
import { obtenerVariableObligatoria } from './apoyo/entorno';
import { generarCodigoLote } from './apoyo/lotes';
import { ENCABEZADO_CLAVE_DISPOSITIVO } from './apoyo/puente';

test.describe('Seguridad de la API', () => {
  test('POST /api/tarros sin clave ni sesión responde 401', async ({ request }) => {
    const respuesta = await request.post('/api/tarros', {
      data: {
        loteId: 1,
        resultadoHex: convertirRgbAHex(RGB_MUESTRA_PRUEBAS),
        rgb: RGB_MUESTRA_PRUEBAS,
      },
    });

    expect(respuesta.status()).toBe(401);
    expect(await respuesta.json()).toEqual({
      exito: false,
      error: 'Inicie sesión o envíe la clave del dispositivo',
    });
  });

  test('POST /api/lotes solo con la clave del dispositivo responde 401', async ({ request }) => {
    const respuesta = await request.post('/api/lotes', {
      headers: {
        [ENCABEZADO_CLAVE_DISPOSITIVO]: obtenerVariableObligatoria('CLAVE_DISPOSITIVO'),
      },
      data: { codigo: generarCodigoLote('SEG') },
    });

    expect(respuesta.status()).toBe(401);
    expect(await respuesta.json()).toEqual({
      exito: false,
      error: 'Inicia sesión para crear un lote',
    });
  });
});
