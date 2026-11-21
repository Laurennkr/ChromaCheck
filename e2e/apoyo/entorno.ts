// Carga las variables de las pruebas E2E sin escribir ningún valor secreto en el código.
// En el PC, .env.e2e.local trae la base de la rama "e2e" de Neon y el usuario de pruebas, y
// AUTH_SECRET y CLAVE_DISPOSITIVO salen de .env.local. En GitHub Actions no hay archivos: todo
// llega por process.env (secretos del repositorio y claves generadas en cada ejecución).
// Nunca se imprime ningún valor
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

// En GitHub Actions (CI=true) no hay archivos .env: todo llega por process.env desde los secretos
export function esIntegracionContinua(): boolean {
  const valor = process.env.CI?.toLowerCase();
  return Boolean(valor) && valor !== 'false' && valor !== '0';
}

// Dónde se corrige una variable que falta, según dónde corren las pruebas
function dondeSeDefine(nombre: string): string {
  if (esIntegracionContinua()) {
    return nombre.startsWith('E2E_')
      ? `Agréguelo como secreto del repositorio en GitHub: Settings → Secrets and variables → Actions → "${nombre}".`
      : 'El flujo .github/workflows/e2e.yml debe generarla en cada ejecución.';
  }
  const archivo = nombre.startsWith('E2E_') ? ARCHIVO_ENTORNO_E2E : ARCHIVO_ENTORNO_LOCAL;
  return `Agréguela en ${archivo} (docs/pruebas/e2e.md).`;
}

// Lee una variable que las pruebas necesitan; si falta, falla con un mensaje claro (sin el valor)
export function obtenerVariableObligatoria(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable ${nombre}. ${dondeSeDefine(nombre)}`);
  return valor;
}

// Variables que necesitan las pruebas: las de la rama "e2e" y las de la aplicación de pruebas
export const VARIABLES_E2E = ['E2E_DATABASE_URL', 'E2E_USUARIO', 'E2E_CONTRASENA'] as const;
export const VARIABLES_APLICACION = ['AUTH_SECRET', 'CLAVE_DISPOSITIVO'] as const;
type NombreVariable = (typeof VARIABLES_E2E)[number] | (typeof VARIABLES_APLICACION)[number];

// Reúne las variables de las pruebas y aplica la protección contra producción. En el PC las lee
// de .env.e2e.local y .env.local; donde esos archivos no existen (GitHub), de process.env. Una
// variable definida en la terminal tiene prioridad sobre los archivos. Si algo no cuadra, lanza
// un error que dice qué falta o qué está mal, nunca el valor
export function prepararEntornoE2E(): Record<NombreVariable, string> {
  const entornoE2E = leerArchivoEntorno(ARCHIVO_ENTORNO_E2E);
  const entornoLocal = leerArchivoEntorno(ARCHIVO_ENTORNO_LOCAL);

  const leer = (nombre: NombreVariable): string | undefined => {
    const fuente = nombre.startsWith('E2E_') ? entornoE2E : entornoLocal;
    return process.env[nombre] || fuente[nombre] || undefined;
  };

  const faltantes = [...VARIABLES_E2E, ...VARIABLES_APLICACION].filter((nombre) => !leer(nombre));
  if (faltantes.length > 0) {
    throw new Error(
      'Faltan variables para las pruebas E2E:\n' +
        faltantes.map((nombre) => `  - ${nombre}: ${dondeSeDefine(nombre)}`).join('\n')
    );
  }

  const variables = Object.fromEntries(
    [...VARIABLES_E2E, ...VARIABLES_APLICACION].map((nombre) => [nombre, leer(nombre) as string])
  ) as Record<NombreVariable, string>;

  const hostE2E = obtenerHostBaseDatos(variables.E2E_DATABASE_URL);
  if (!hostE2E) {
    throw new Error(
      'E2E_DATABASE_URL no es una cadena de conexión válida. ' +
        'Las pruebas E2E solo corren contra la rama "e2e" de Neon (docs/pruebas/e2e.md).'
    );
  }

  if (esIntegracionContinua()) {
    // En GitHub no existe la base de desarrollo ni la principal: si alguien define DATABASE_URL
    // en el flujo, podría terminar usándose, así que no se corre nada
    if (process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL está definida en el flujo de GitHub Actions. Las pruebas E2E solo usan ' +
          'E2E_DATABASE_URL: quite DATABASE_URL de .github/workflows/e2e.yml.'
      );
    }
  } else {
    // En el PC: la base de las pruebas no puede ser la de .env.local ni la de la terminal
    const hostsProhibidos = [entornoLocal.DATABASE_URL, process.env.DATABASE_URL].map(
      obtenerHostBaseDatos
    );
    if (hostsProhibidos.includes(hostE2E)) {
      throw new Error(
        `E2E_DATABASE_URL apunta al mismo servidor que DATABASE_URL (${ARCHIVO_ENTORNO_LOCAL} o la terminal). ` +
          'Use la cadena de conexión de la rama "e2e" de Neon, nunca la de desarrollo ni la principal.'
      );
    }
  }

  return variables;
}
