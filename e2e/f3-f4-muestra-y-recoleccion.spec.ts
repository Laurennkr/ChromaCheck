// F3 · Tomar la muestra patrón y F4 · Iniciar recolección: el flujo principal completo
// (docs/specs/F3-tomar-muestra-patron.md y docs/specs/F4-revisar-tarros.md)
import { expect, test } from '@playwright/test';
import { formatearDeltaE } from '@/lib/formato';
import { elegirColoresDePrueba } from './apoyo/colores';
import { registrarSensorLimpio } from './apoyo/ganchos';
import { crearLote, generarCodigoLote, iniciarSesionEnNavegador } from './apoyo/lotes';

const colores = elegirColoresDePrueba();

test.describe('F3 y F4 · Muestra patrón y recolección', () => {
  const apoyos = registrarSensorLimpio();

  test('abrir lote → agregar muestra → iniciar recolección → aprobado, no aprobado y terminar', async ({
    page,
  }) => {
    const lote = await crearLote(apoyos.sesion, generarCodigoLote('F3F4'));
    await iniciarSesionEnNavegador(page);

    await test.step('abrir el lote desde la lista', async () => {
      await page.goto('/');
      await page
        .getByRole('article')
        .filter({ hasText: lote.codigo })
        .getByRole('link', { name: 'Abrir lote' })
        .click();
      await expect(page).toHaveURL(new RegExp(`/lotes/${lote.id}$`));
    });

    const pantallaCompleta = page.getByRole('dialog');

    await test.step('estado A: la pantalla completa pide la muestra patrón', async () => {
      await expect(pantallaCompleta).toBeVisible();
      await expect(
        pantallaCompleta.getByRole('heading', { name: `Lote ${lote.codigo}` })
      ).toBeVisible();
      await expect(
        pantallaCompleta.getByText('Agregue la muestra patrón de este lote')
      ).toBeVisible();
    });

    await test.step('"Agregar muestra" deja el sensor esperando la muestra', async () => {
      await pantallaCompleta.getByRole('button', { name: 'Agregar muestra' }).click();
      await expect(pantallaCompleta.getByText('Coloque la muestra en el sensor')).toBeVisible();
      await expect(pantallaCompleta.getByRole('status')).toHaveText(/Esperando la muestra…/);
      await expect(pantallaCompleta.getByRole('button', { name: 'Cancelar' })).toBeVisible();
    });

    await test.step('el puente envía la muestra y la pantalla completa se cierra sola', async () => {
      const respuesta = await apoyos.puente.enviarMuestra(lote.id, colores.muestra.rgb);
      expect(respuesta.status()).toBe(201);

      await expect(pantallaCompleta).toBeHidden();
      await expect(page.getByText('Muestra patrón guardada')).toBeVisible();
      await expect(page.getByText(colores.muestra.hex, { exact: true }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Iniciar recolección' })).toBeVisible();
    });

    await test.step('"Iniciar recolección" abre la pantalla de recolección', async () => {
      await page.getByRole('button', { name: 'Iniciar recolección' }).click();
      await expect(
        pantallaCompleta.getByRole('heading', { name: `Recolección del lote ${lote.codigo}` })
      ).toBeVisible();
      await expect(pantallaCompleta.getByRole('status')).toHaveText(/Recolectando tarros…/);
      await expect(pantallaCompleta.getByText('Esperando el primer tarro…')).toBeVisible();
    });

    await test.step('una lectura aprobada aparece como Aprobado', async () => {
      const respuesta = await apoyos.puente.enviarLectura(lote.id, colores.aprobado.rgb);
      expect(respuesta.status()).toBe(201);
      expect((await respuesta.json()).datos.resultado).toBe('Aprobado');

      await expect(pantallaCompleta.getByText(/^✓\s*Aprobado$/)).toBeVisible();
      await expect(
        pantallaCompleta.getByText(
          `Diferencia de color: ${formatearDeltaE(colores.aprobado.deltaE)} ΔE`
        )
      ).toBeVisible();
    });

    await test.step('una lectura fuera de tolerancia aparece como No aprobado con alerta amarilla', async () => {
      const respuesta = await apoyos.puente.enviarLectura(lote.id, colores.alertaAmarilla.rgb);
      expect(respuesta.status()).toBe(201);
      expect((await respuesta.json()).datos.resultado).toBe('No Aprobado');

      await expect(pantallaCompleta.getByText(/^✕\s*No aprobado$/)).toBeVisible();
      await expect(
        pantallaCompleta.getByText(
          `Diferencia de color: ${formatearDeltaE(colores.alertaAmarilla.deltaE)} ΔE`
        )
      ).toBeVisible();
      // La alerta amarilla no pausa: la recolección sigue abierta
      await expect(pantallaCompleta.getByRole('status')).toHaveText(/Recolectando tarros…/);
    });

    await test.step('"Terminar recolección" cierra la pantalla y deja la alerta amarilla en la lista', async () => {
      await pantallaCompleta.getByRole('button', { name: 'Terminar recolección' }).click();
      await expect(pantallaCompleta).toBeHidden();
      await expect(page.getByRole('button', { name: 'Iniciar recolección' })).toBeVisible();

      const alertas = page.getByRole('listitem').filter({ hasText: 'Alerta amarilla' });
      await expect(alertas).toHaveCount(1);
      await expect(alertas).toContainText(
        `Desviación aislada de ${colores.alertaAmarilla.deltaE} ΔE`
      );
    });

    await test.step('una lectura enviada después de terminar recibe 409', async () => {
      const respuesta = await apoyos.puente.enviarLectura(lote.id, colores.aprobado.rgb);
      expect(respuesta.status()).toBe(409);
      expect((await respuesta.json()).error).toContain('modo actual: Inactivo');
    });
  });
});
