// Carga las variables de las pruebas E2E sin escribir ningún valor secreto en el código.
// .env.e2e.local trae la base de la rama "e2e" de Neon y el usuario de pruebas; AUTH_SECRET y
// CLAVE_DISPOSITIVO salen de .env.local. Nunca se imprime ningún valor
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const RAIZ_PROYECTO = path.resolve(__dirname, '..', '..');

// La aplicación de las pruebas corre en su propio puerto, separada de `npm run dev` (3000)
export const PUERTO_E2E = 3100;
export const URL_BASE_E2E = `http://localhost:${PUERTO_E2E}`;

export const ARCHIVO_ENTORNO_E2E = '.env.e2e.local';
export const ARCHIVO_ENTORNO_LOCAL = '.env.local';

// Lee un archivo .env (NOMBRE=valor por línea, # para comentarios). Si no existe, devuelve {}
export function leerArchivoEntorno(nombreArchivo: string): Record<string, string> {
  const ruta = path.join(RAIZ_PROYECTO, nombreArchivo);
  if (!existsSync(ruta)) return {};

  const variables: Record<string, string> = {};
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const coincidencia = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linea);
    if (!coincidencia) continue;
    variables[coincidencia[1]] = quitarComillas(coincidencia[2]);
  }
  return variables;
}

function quitarComillas(valor: string): string {
  const estaEntreComillas = /^(['"]).*\1$/.test(valor);
  return estaEntreComillas ? valor.slice(1, -1) : valor;
}

// Devuelve el host de una cadena de conexión, o null si no se puede leer
export function obtenerHostBaseDatos(cadenaConexion: string | undefined): string | null {
  if (!cadenaConexion) return null;
  try {
    return new URL(cadenaConexion).hostname.toLowerCase();
  } catch {
    return null;
  }
}

// Lee una variable que las pruebas necesitan; si falta, falla con un mensaje claro (sin el valor)
export function obtenerVariableObligatoria(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(
      `Falta la variable ${nombre}. Revise ${ARCHIVO_ENTORNO_E2E} y ${ARCHIVO_ENTORNO_LOCAL} (docs/pruebas/e2e.md).`
    );
  }
  return valor;
}
