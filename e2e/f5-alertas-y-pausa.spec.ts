// F5 · Alertas y pausa del lote (docs/specs/F5-alertas-y-pausa.md)
import { expect, test } from '@playwright/test';
import { UMBRAL_ALERTA_ROJA_DELTA_E } from '@/lib/modulos/tarros/reglas';
import { elegirColoresDePrueba } from './apoyo/colores';
import { registrarSensorLimpio } from './apoyo/ganchos';
import { crearLoteConMuestra, iniciarSesionEnNavegador } from './apoyo/lotes';

const colores = elegirColoresDePrueba();

// Los botones del aviso rojo aparecen 5 s después de la alerta; la página se refresca cada 3 s
const ESPERA_BOTONES_AVISO_MS = 15_000;

test.describe('F5 · Alertas y pausa del lote', () => {
  const apoyos = registrarSensorLimpio();

  test('una roja grave pausa el lote → "Entendido" lo deja pausado → "Reanudar recolección" acepta lecturas', async ({
    page,
  }) => {
    const lote = await crearLoteConMuestra(apoyos.sesion, apoyos.puente, 'F5', colores.muestra.rgb);
    const mensajeRoja = `Desviación grave de ${colores.alertaRojaGrave.deltaE} ΔE (límite ${UMBRAL_ALERTA_ROJA_DELTA_E})`;
    const pantallaCompleta = page.getByRole('dialog');

    await iniciarSesionEnNavegador(page);
    await page.goto(`/lotes/${lote.id}`);

    await test.step('iniciar la recolección', async () => {
      await page.getByRole('button', { name: 'Iniciar recolección' }).click();
      await expect(pantallaCompleta.getByRole('status')).toHaveText(/Recolectando tarros…/);
    });

    await test.step('una lectura de roja grave deja el lote Pausado con su aviso', async () => {
      const respuesta = await apoyos.puente.enviarLectura(lote.id, colores.alertaRojaGrave.rgb);
      expect(respuesta.status()).toBe(201);
      expect((await respuesta.json()).datos.resultado).toBe('No Aprobado');

      await expect(pantallaCompleta.getByText(/^⚠\s*Lote pausado$/)).toBeVisible();
      await expect(pantallaCompleta.getByText(`Motivo: ${mensajeRoja}.`)).toBeVisible();
    });

    await test.step('"Entendido" cierra el aviso y el lote sigue pausado', async () => {
      await pantallaCompleta
        .getByRole('button', { name: 'Entendido' })
        .click({ timeout: ESPERA_BOTONES_AVISO_MS });
      await expect(pantallaCompleta).toBeHidden();

      await expect(page.getByText('Lote pausado: no acepta lecturas')).toBeVisible();
      await expect(page.getByText(`Motivo: ${mensajeRoja}.`, { exact: false })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Reanudar recolección' })).toBeVisible();

      const rechazo = await apoyos.puente.enviarLectura(lote.id, colores.aprobado.rgb);
      expect(rechazo.status()).toBe(409);
      expect((await rechazo.json()).error).toBe(
        'El lote está pausado por una alerta roja y no acepta lecturas'
      );
    });

    await test.step('"Reanudar recolección" vuelve a recolectar y acepta lecturas', async () => {
      await page.getByRole('button', { name: 'Reanudar recolección' }).click();
      await expect(
        pantallaCompleta.getByRole('heading', { name: `Recolección del lote ${lote.codigo}` })
      ).toBeVisible();
      await expect(pantallaCompleta.getByRole('status')).toHaveText(/Recolectando tarros…/);
      await expect(page.getByText('Lote pausado: no acepta lecturas')).toBeHidden();

      const respuesta = await apoyos.puente.enviarLectura(lote.id, colores.aprobado.rgb);
      expect(respuesta.status()).toBe(201);
      expect((await respuesta.json()).datos.resultado).toBe('Aprobado');
      await expect(pantallaCompleta.getByText(/^✓\s*Aprobado$/)).toBeVisible();
    });
  });
});
