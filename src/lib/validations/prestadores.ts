import { z } from "zod";
import { EstadoOrdenServicio, TipoPrestador } from "@prisma/client";
import { montoDecimalOpcionalSchema } from "@/lib/validations/dinero";

export const ETIQUETAS_TIPO_PRESTADOR: Record<TipoPrestador, string> = {
  SEGURIDAD: "Seguridad",
  ASEO: "Aseo",
  JARDINERIA: "Jardinería",
  MANTENIMIENTO: "Mantenimiento",
  OBRA: "Obra",
  PISCINA: "Piscina",
  GIMNASIO: "Gimnasio",
  OTRO: "Otro",
};

export const ETIQUETAS_ESTADO_ORDEN: Record<EstadoOrdenServicio, string> = {
  ABIERTA: "Abierta",
  EN_PROCESO: "En proceso",
  CERRADA: "Cerrada",
  CANCELADA: "Cancelada",
};

const textoOpcional = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres`).optional().or(z.literal(""));

export const crearPrestadorSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe un nombre").max(160, "Máximo 160 caracteres"),
  tipo: z.enum(TipoPrestador),
  contacto: textoOpcional(120),
  telefono: textoOpcional(30),
  // El correo es opcional, pero si viene tiene que ser válido.
  email: z.union([z.email("Correo inválido"), z.literal("")]).optional(),
  notas: textoOpcional(1000),
});

export const crearOrdenServicioSchema = z.object({
  prestadorId: z.uuid("Selecciona un prestador"),
  pqrsId: z.union([z.uuid("PQRS inválida"), z.literal("")]).optional(),
  titulo: z.string().trim().min(5, "Escribe un título").max(200, "Máximo 200 caracteres"),
  descripcion: textoOpcional(2000),
  fechaProgramada: z
    .string()
    .trim()
    .refine(
      (valor) => valor === "" || !Number.isNaN(Date.parse(valor)),
      "Fecha inválida"
    )
    .optional()
    .or(z.literal("")),
  costoEstimado: montoDecimalOpcionalSchema,
});

export const actualizarEstadoOrdenSchema = z.object({
  ordenId: z.uuid("Orden inválida"),
  estado: z.enum(EstadoOrdenServicio),
});

export type CrearPrestadorInput = z.infer<typeof crearPrestadorSchema>;
export type CrearOrdenServicioInput = z.infer<typeof crearOrdenServicioSchema>;
