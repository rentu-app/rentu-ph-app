import { z } from "zod";
import { EstadoReserva } from "@prisma/client";
import { montoDecimalOpcionalSchema } from "@/lib/validations/dinero";

export const crearZonaComunSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe un nombre").max(120, "Máximo 120 caracteres"),
  descripcion: z
    .string()
    .trim()
    .max(1000, "Máximo 1000 caracteres")
    .optional()
    .or(z.literal("")),
  aforo: z.coerce.number().int("El aforo debe ser un número entero").positive("El aforo debe ser mayor a 0"),
  costo: montoDecimalOpcionalSchema,
});

/** Solo para residentes: `inmuebleId`/`solicitadaPorId` se derivan de la sesión, nunca del formulario. */
export const crearReservaSchema = z
  .object({
    zonaComunId: z.uuid("Zona común inválida"),
    fechaInicio: z
      .string()
      .refine((valor) => !Number.isNaN(Date.parse(valor)), "Fecha de inicio inválida"),
    fechaFin: z
      .string()
      .refine((valor) => !Number.isNaN(Date.parse(valor)), "Fecha de fin inválida"),
    observaciones: z
      .string()
      .trim()
      .max(1000, "Máximo 1000 caracteres")
      .optional()
      .or(z.literal("")),
  })
  .refine((datos) => new Date(datos.fechaFin) > new Date(datos.fechaInicio), {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["fechaFin"],
  })
  .refine((datos) => new Date(datos.fechaInicio) > new Date(), {
    message: "La reserva debe ser en una fecha futura",
    path: ["fechaInicio"],
  });

export const actualizarEstadoReservaSchema = z.object({
  reservaId: z.uuid("Reserva inválida"),
  estado: z.enum(EstadoReserva),
});

export type CrearZonaComunInput = z.infer<typeof crearZonaComunSchema>;
export type CrearReservaInput = z.infer<typeof crearReservaSchema>;
export type ActualizarEstadoReservaInput = z.infer<typeof actualizarEstadoReservaSchema>;
