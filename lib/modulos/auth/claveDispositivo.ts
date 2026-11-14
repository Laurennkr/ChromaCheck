// Clave compartida del dispositivo (el puente serial): le permite usar la API sin sesión de usuario.
// Falla cerrada: si la clave del servidor falta o es corta, no se acepta ninguna petición con clave
export const NOMBRE_ENCABEZADO_CLAVE = 'x-clave-dispositivo';
export const LONGITUD_MINIMA_CLAVE = 32;

// Compara la clave recibida con la esperada en tiempo constante: el tiempo de respuesta no revela
// cuántos caracteres coinciden, porque el bucle recorre siempre la clave completa
export function esClaveDispositivoValida(
  claveRecibida: string | null | undefined,
  claveEsperada: string | undefined
): boolean {
  if (!claveEsperada || claveEsperada.length < LONGITUD_MINIMA_CLAVE) return false;
  if (!claveRecibida || claveRecibida.length !== claveEsperada.length) return false;

  let diferencia = 0;
  for (let i = 0; i < claveEsperada.length; i++) {
    diferencia |= claveRecibida.charCodeAt(i) ^ claveEsperada.charCodeAt(i);
  }
  return diferencia === 0;
}

// Indica si la petición trae en su encabezado la clave configurada en CLAVE_DISPOSITIVO
export function esPeticionDeDispositivo(peticion: Request): boolean {
  return esClaveDispositivoValida(
    peticion.headers.get(NOMBRE_ENCABEZADO_CLAVE),
    process.env.CLAVE_DISPOSITIVO
  );
}
