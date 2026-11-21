// F2 · Ver y agregar lotes (docs/specs/F2-lotes.md)
import { expect, test, type Page } from '@playwright/test';
import { generarCodigoLote, iniciarSesionEnNavegador } from './apoyo/lotes';

// Abre el formulario "Agregar lote", escribe el código y pulsa "Crear lote"
async function agregarLoteDesdeFormulario(page: Page, codigo: string) {
  await page.getByRole('button', { name: 'Agregar lote' }).click();
  await page.getByLabel('Código del lote').fill(codigo);
  await page.getByRole('button', { name: 'Crear lote' }).click();
}

// Cuántos lotes tienen este código sin distinguir mayúsculas (como el índice lotes_codigo_unico)
async function contarLotesConCodigo(page: Page, codigo: string): Promise<number> {
  const respuesta = await page.request.get('/api/lotes');
  expect(respuesta.status()).toBe(200);
  const lotes: { codigo: string }[] = (await respuesta.json()).datos;
  return lotes.filter((lote) => lote.codigo.toLowerCase() === codigo.toLowerCase()).length;
}

test.describe('F2 · Ver y agregar lotes', () => {
  test.beforeEach(async ({ page }) => {
    await iniciarSesionEnNavegador(page);
    await page.goto('/');
  });

  test('crear un lote lo muestra en la lista', async ({ page }) => {
    const codigo = generarCodigoLote('F2');

    await agregarLoteDesdeFormulario(page, codigo);

    const tarjeta = page.getByRole('article').filter({ hasText: codigo });
    await expect(tarjeta.getByRole('heading', { name: codigo })).toBeVisible();
    await expect(tarjeta.getByText('Sin muestra patrón')).toBeVisible();
    await expect(tarjeta.getByRole('link', { name: 'Abrir lote' })).toBeVisible();
  });

  test('un código repetido con otras mayúsculas muestra el mensaje y no crea otro lote', async ({
    page,
  }) => {
    const codigo = generarCodigoLote('F2_DUP');
    await agregarLoteDesdeFormulario(page, codigo);
    await expect(page.getByRole('heading', { name: codigo })).toBeVisible();

    const codigoRepetido = codigo.toLowerCase();
    await agregarLoteDesdeFormulario(page, codigoRepetido);

    // Next.js agrega su propio role="alert" vacío (anunciador de rutas): se filtra por el texto
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: `Ya existe un lote con el código "${codigoRepetido}"` })
    ).toBeVisible();
    expect(await contarLotesConCodigo(page, codigo)).toBe(1);
  });
});
