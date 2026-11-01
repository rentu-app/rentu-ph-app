import { z } from "zod";

/** Correo normalizado (trim + minúsculas) y validado. */
export const emailSchema = (mensaje = "Ingresa un correo válido") =>
  z.string().trim().toLowerCase().pipe(z.email(mensaje));
