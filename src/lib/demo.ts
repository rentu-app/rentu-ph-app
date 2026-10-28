/**
 * La cuenta demo es compartida por todos los evaluadores: no puede crear
 * copropiedades (ni, más adelante, borrarse). Esta constante es la única
 * fuente del correo; la UI la usa para ocultar controles y el servidor para
 * rechazar la acción de todos modos.
 */
export const EMAIL_DEMO_ADMIN = "admin.demo@example.com";

export function esCuentaDemo(email: string): boolean {
  return email.trim().toLowerCase() === EMAIL_DEMO_ADMIN;
}
