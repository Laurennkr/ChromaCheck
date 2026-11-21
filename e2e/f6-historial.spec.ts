// F6 · Historial de tarros (docs/specs/F6-historial.md)
import { expect, test } from '@playwright/test';
import { elegirColoresDePrueba } from './apoyo/colores';
import { registrarSensorLimpio } from './apoyo/ganchos';
import { cambiarModoCaptura, crearLoteConMuestra, iniciarSesionEnNavegador } from './apoyo/lotes';

const colores = elegirColoresDePrueba();

test.describe('F6 · Historial de tarros', () => {
  const apoyos = registrarSensorLimpio();

  test('la última lectura enviada aparece primera en /historial con el código de su lote', async ({
    page,
  }) => {
    const lote = await crearLoteConMuestra(apoyos.sesion, apoyos.puente, 'F6', colores.muestra.rgb);
    await cambiarModoCaptura(apoyos.sesion, lote.id, 'Recoleccion');

    const respuesta = await apoyos.puente.enviarLectura(lote.id, colores.aprobado.rgb);
    expect(respuesta.status()).toBe(201);
    const idTarro: number = (await respuesta.json()).datos.id_tarro;
    await cambiarModoCaptura(apoyos.sesion, lote.id, 'Inactivo');

    await iniciarSesionEnNavegador(page);
    await page.goto('/historial');

    // La primera fila de datos (la fila 0 es la de los encabezados)
    const primeraFila = page.getByRole('row').nth(1);
    await expect(primeraFila.getByRole('cell').nth(0)).toHaveText(`#TR-${idTarro}`);
    await expect(primeraFila.getByRole('cell').nth(1)).toHaveText(lote.codigo);
    await expect(primeraFila).toContainText(colores.aprobado.hex);
    await expect(primeraFila).toContainText('Aprobado');
  });
});
