import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { esPeticionDeDispositivo } from '@/lib/modulos/auth/claveDispositivo';
import { NOMBRE_COOKIE_SESION, verificarTokenSesion } from '@/lib/modulos/auth/sesion';
import { responderError } from '@/lib/respuestas';

// Login y logout no exigen sesión: son la forma de entrar y salir
const PREFIJO_API_AUTH = '/api/auth/';

// La API exige sesión o la clave del dispositivo; las páginas exigen sesión
export async function proxy(peticion: NextRequest) {
  if (esRutaApi(peticion.nextUrl.pathname)) {
    return responderPeticionApi(peticion);
  }
  return responderPeticionPagina(peticion);
}

function esRutaApi(ruta: string) {
  return ruta === '/api' || ruta.startsWith('/api/');
}

function leerIdUsuario(peticion: NextRequest) {
  return verificarTokenSesion(peticion.cookies.get(NOMBRE_COOKIE_SESION)?.value);
}

// La web entra con su sesión y el puente serial con la clave del dispositivo. Crear un lote y
// cambiar el modo de captura además exigen sesión en su propia ruta: la clave no basta para ellas
async function responderPeticionApi(peticion: NextRequest) {
  if (peticion.nextUrl.pathname.startsWith(PREFIJO_API_AUTH)) {
    return NextResponse.next();
  }
  if (esPeticionDeDispositivo(peticion) || (await leerIdUsuario(peticion)) !== null) {
    return NextResponse.next();
  }
  return responderError('Inicie sesión o envíe la clave del dispositivo', 401);
}

// Sin sesión válida, cualquier página redirige a /login; con sesión, /login redirige al inicio
async function responderPeticionPagina(peticion: NextRequest) {
  const idUsuario = await leerIdUsuario(peticion);
  const estaEnLogin = peticion.nextUrl.pathname === '/login';

  if (!idUsuario && !estaEnLogin) {
    return NextResponse.redirect(new URL('/login', peticion.url));
  }
  if (idUsuario && estaEnLogin) {
    return NextResponse.redirect(new URL('/', peticion.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-blanco.png|logo-negro.png).*)'],
};
