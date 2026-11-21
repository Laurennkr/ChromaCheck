// F1 · Iniciar sesión (docs/specs/F1-iniciar-sesion.md)
import { expect, test } from '@playwright/test';
import { obtenerVariableObligatoria } from './apoyo/entorno';

test.describe('F1 · Iniciar sesión', () => {
  test('con credenciales incorrectas muestra el mensaje genérico, sin decir qué campo falló', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Usuario').fill(obtenerVariableObligatoria('E2E_USUARIO'));
    await page.getByLabel('Contraseña', { exact: true }).fill('contrasena-equivocada');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    // Next.js agrega su propio role="alert" vacío (anunciador de rutas): se filtra por el texto
    await expect(
      page.getByRole('alert').filter({ hasText: 'Usuario o contraseña incorrectos' })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('sin sesión, /historial redirige a /login', async ({ page }) => {
    await page.goto('/historial');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('con credenciales correctas entra a la lista de lotes y "Cerrar sesión" vuelve a /login', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Usuario').fill(obtenerVariableObligatoria('E2E_USUARIO'));
    await page
      .getByLabel('Contraseña', { exact: true })
      .fill(obtenerVariableObligatoria('E2E_CONTRASENA'));
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Lotes en producción' })).toBeVisible();

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();

    await expect(page).toHaveURL(/\/login$/);
    // La sesión quedó cerrada: volver al inicio lleva otra vez a /login
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });
});
