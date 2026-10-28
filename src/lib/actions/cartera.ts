"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EtapaCobro, Prisma, TipoGestionCobro } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { procesarCsvUnidades } from "@/lib/csv-unidades";
import { superaLimiteTotal } from "@/lib/coeficientes";
import { calcularEtapasReactivacion, operacionesReactivarUnidad } from "@/lib/unidades-escritura";
import { getContextoAdministrador } from "@/lib/session";
import {
  importarUnidadesSchema,
  registrarAvisoSchema,
  registrarGestionSchema,
} from "@/lib/validations/cartera";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";
import type { ResultadoImportacion } from "@/lib/types/importacion";

export type EstadoAccionCartera = EstadoAccionFormulario;

const SIN_COPROPIEDAD: EstadoAccionCartera = {
  status: "error",
  message: "No tienes una copropiedad asignada todavía.",
};

/** Revalida las vistas que leen cartera. Todas viven bajo /dashboard. */
function revalidarCartera() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cartera");
}

/**
 * Verifica que la unidad pertenezca a la copropiedad activa del
 * administrador autenticado antes de escribir sobre ella.
 */
async function resolverUnidad(inmuebleId: string) {
  const { administrador, copropiedad } = await getContextoAdministrador();
  if (!copropiedad) return { administrador, copropiedad: null, unidad: null };

  const unidad = await prisma.inmueble.findFirst({
    where: { id: inmuebleId, copropiedadId: copropiedad.id, deletedAt: null },
    select: {
      id: true,
      identificador: true,
      etapaCobro: true,
      residentes: {
        where: { activo: true, deletedAt: null },
        select: { usuario: { select: { nombre: true, email: true } } },
      },
    },
  });

  return { administrador, copropiedad, unidad };
}

/**
 * Registra una entrada en la bitácora de gestión de cobro de una unidad y,
 * opcionalmente, cambia su etapa de seguimiento.
 *
 * El cambio de etapa es SIEMPRE una decisión explícita del administrador y
 * queda auditado (etapa anterior → etapa nueva, con autor y fecha). Ningún
 * proceso automático escala una unidad a PREJURIDICO/JURIDICO: esas etapas
 * son clasificación de seguimiento interno, no acciones legales.
 */
export async function registrarGestionCobro(
  _prevState: EstadoAccionCartera,
  formData: FormData
): Promise<EstadoAccionCartera> {
  const validado = registrarGestionSchema.safeParse({
    inmuebleId: formData.get("inmuebleId"),
    tipo: formData.get("tipo"),
    etapaNueva: formData.get("etapaNueva") ?? "",
    nota: formData.get("nota"),
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { inmuebleId, tipo, etapaNueva, nota } = validado.data;

  try {
    const { administrador, copropiedad, unidad } = await resolverUnidad(inmuebleId);
    if (!copropiedad) return SIN_COPROPIEDAD;
    if (!unidad) {
      return { status: "error", message: "La unidad no existe en esta copropiedad." };
    }

    const cambiaEtapa = !!etapaNueva && etapaNueva !== unidad.etapaCobro;

    await prisma.$transaction(async (tx) => {
      await tx.gestionCobro.create({
        data: {
          inmuebleId: unidad.id,
          registradoPorId: administrador.id,
          tipo: cambiaEtapa ? TipoGestionCobro.CAMBIO_ETAPA : tipo,
          etapaAnterior: cambiaEtapa ? unidad.etapaCobro : null,
          etapaNueva: cambiaEtapa ? etapaNueva : null,
          nota,
        },
      });

      if (cambiaEtapa) {
        await tx.inmueble.update({
          where: { id: unidad.id },
          data: { etapaCobro: etapaNueva },
        });
      }
    });

    revalidarCartera();

    return {
      status: "success",
      message: cambiaEtapa
        ? `Gestión registrada y ${unidad.identificador} pasó a etapa "${etapaNueva}".`
        : `Gestión registrada en ${unidad.identificador}.`,
    };
  } catch (error) {
    console.error("registrarGestionCobro", error);
    return { status: "error", message: "No se pudo registrar la gestión." };
  }
}

/**
 * Guarda un aviso de cobro en el historial de la unidad.
 *
 * ⚠️ SIMULACIÓN: Rentu no tiene proveedor de correo ni de WhatsApp
 * conectado. Esta acción NO envía nada: redacta y archiva el mensaje para
 * que quede trazabilidad de que el administrador lo emitió, y la fila se
 * guarda con `simulada: true`. La UI lo declara explícitamente en el
 * formulario y en el historial.
 */
export async function registrarAvisoCobro(
  _prevState: EstadoAccionCartera,
  formData: FormData
): Promise<EstadoAccionCartera> {
  const validado = registrarAvisoSchema.safeParse({
    inmuebleId: formData.get("inmuebleId"),
    canal: formData.get("canal"),
    asunto: formData.get("asunto"),
    cuerpo: formData.get("cuerpo"),
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { inmuebleId, canal, asunto, cuerpo } = validado.data;

  try {
    const { administrador, copropiedad, unidad } = await resolverUnidad(inmuebleId);
    if (!copropiedad) return SIN_COPROPIEDAD;
    if (!unidad) {
      return { status: "error", message: "La unidad no existe en esta copropiedad." };
    }

    const destinatarios =
      unidad.residentes.map((vinculo) => vinculo.usuario.email).join(", ") ||
      "(la unidad no tiene residentes con correo registrado)";

    await prisma.$transaction(async (tx) => {
      await tx.notificacionCobro.create({
        data: {
          inmuebleId: unidad.id,
          creadoPorId: administrador.id,
          canal,
          asunto,
          cuerpo,
          destinatarios,
          simulada: true,
        },
      });

      await tx.gestionCobro.create({
        data: {
          inmuebleId: unidad.id,
          registradoPorId: administrador.id,
          tipo: TipoGestionCobro.AVISO_ENVIADO,
          nota: `Aviso registrado (${canal}): ${asunto}. Simulación MVP — no se envió mensaje real.`,
        },
      });
    });

    revalidarCartera();

    return {
      status: "success",
      message:
        "Aviso guardado en el historial de la unidad. Simulación MVP: no se envió ningún mensaje real.",
    };
  } catch (error) {
    console.error("registrarAvisoCobro", error);
    return { status: "error", message: "No se pudo registrar el aviso." };
  }
}

/**
 * Importa el padrón de unidades desde un CSV. El encabezado se reconoce por
 * nombre y en cualquier orden (ver `procesarCsvUnidades`); `identificador` y
 * `coeficiente` son obligatorias, `torre`, `area_m2` y `estado` opcionales.
 *
 * Es una importación REAL, no una maqueta: valida fila por fila, reporta los
 * errores con número de línea y solo escribe cuando el administrador
 * confirma. Al confirmar, el servidor vuelve a leer y validar el CSV completo
 * que llega en `contenido`; nunca se aceptan filas ya "validadas" desde el
 * cliente. Es idempotente por `[copropiedadId, identificador]`: una unidad
 * que ya existe se actualiza, no se duplica.
 *
 * Alcance deliberado: NO importa cartera histórica ni pagos. Cargar saldos
 * desde un Excel requiere decidir cómo conciliar periodos y recargos, y eso
 * pide una conversación con el administrador antes de codificarse.
 */
export async function importarUnidadesCsv(
  _prevState: ResultadoImportacion,
  formData: FormData
): Promise<ResultadoImportacion> {
  const contenidoCrudo = String(formData.get("contenido") ?? "");
  const confirmar = formData.get("confirmar") === "true";
  const formatoPedido = formData.get("formato");
  const formatoForzado =
    formatoPedido === "porcentaje" || formatoPedido === "fraccion" ? formatoPedido : undefined;

  // Antes se perdía el contenido en silencio y la confirmación terminaba en 0
  // filas: ahora un contenido vacío es siempre un error explícito.
  if (contenidoCrudo.trim().length === 0) {
    return {
      status: "error",
      message: confirmar
        ? "No llegó el contenido del CSV, así que no se importó nada. Vuelve a validar el archivo."
        : "Pega el contenido del CSV o adjunta el archivo.",
    };
  }

  const validado = importarUnidadesSchema.safeParse({
    contenido: contenidoCrudo,
    confirmar: confirmar ? "true" : "false",
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "El contenido del CSV no es válido (máximo 200.000 caracteres).",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { contenido } = validado.data;

  try {
    const { copropiedad } = await getContextoAdministrador();
    if (!copropiedad) return SIN_COPROPIEDAD;

    const procesado = procesarCsvUnidades(contenido, formatoForzado);
    if ("error" in procesado) {
      return { status: "error", message: procesado.error };
    }
    const { erroresFila, formato, formatoDetectado, sumaPorcentaje, tieneEstado } = procesado;

    const existentes = await prisma.inmueble.findMany({
      where: { copropiedadId: copropiedad.id },
      select: { id: true, identificador: true, deletedAt: true, coeficiente: true },
    });
    const porIdentificador = new Map(
      existentes.map((unidad) => [unidad.identificador, unidad])
    );

    const filasValidas = procesado.filasValidas.map((fila) => ({
      ...fila,
      yaExiste: porIdentificador.get(fila.identificador)?.deletedAt === null,
    }));

    // Suma total que tendría la copropiedad: lo que ya existe y NO se toca +
    // lo que traería este archivo (las unidades que el archivo actualiza
    // reemplazan su coeficiente anterior).
    const idsDelArchivo = new Set(filasValidas.map((fila) => fila.identificador));
    const sumaResultante = [
      ...existentes
        .filter((unidad) => unidad.deletedAt === null && !idsDelArchivo.has(unidad.identificador))
        .map((unidad) => unidad.coeficiente),
      ...filasValidas.map((fila) => new Prisma.Decimal(fila.coeficiente)),
    ].reduce((acc, valor) => acc.plus(valor), new Prisma.Decimal(0));
    const bloqueada = filasValidas.length > 0 && superaLimiteTotal(sumaResultante);
    const sumaResultantePorcentaje = sumaResultante.mul(100).toFixed(3);
    const textoBloqueo = `La suma total de la copropiedad quedaría en ${sumaResultantePorcentaje} % (lo que ya existe más este archivo), por encima de 100.001 %. Revisa que el formato de los coeficientes sea el correcto.`;

    const detalle = {
      formatoCoeficiente: formato,
      formatoDetectado,
      sumaArchivoPorcentaje: sumaPorcentaje,
      sumaResultantePorcentaje,
      bloqueada,
      contenidoValidado: contenido,
    } as const;
    const textoFormato = `Coeficientes en ${
      formato === "porcentaje" ? "porcentaje" : "fracción de 1"
    }${formatoForzado ? " (elegido por ti)" : " (detectado)"}; el archivo suma ${sumaPorcentaje} %.`;

    if (!confirmar) {
      return {
        status: filasValidas.length > 0 && !bloqueada ? "success" : "error",
        message: bloqueada
          ? textoBloqueo
          : filasValidas.length > 0
            ? `Vista previa: ${filasValidas.length} fila(s) válida(s), ${erroresFila.length} con error. ${textoFormato} Nada se ha guardado todavía.`
            : "Ninguna fila es válida. Revisa los errores y vuelve a intentar.",
        filasValidas,
        erroresFila,
        confirmado: false,
        ...detalle,
      };
    }

    if (filasValidas.length === 0) {
      return {
        status: "error",
        message: "No hay filas válidas para importar, así que no se guardó nada.",
        erroresFila,
        confirmado: false,
        ...detalle,
      };
    }

    if (bloqueada) {
      return {
        status: "error",
        message: `${textoBloqueo} No se guardó nada.`,
        filasValidas,
        erroresFila,
        confirmado: false,
        ...detalle,
      };
    }

    const etapas = await calcularEtapasReactivacion(
      filasValidas.flatMap((fila) => {
        const existente = porIdentificador.get(fila.identificador);
        return existente?.deletedAt ? [existente.id] : [];
      })
    );

    const operaciones = filasValidas.flatMap((fila) => {
      const datos = {
        torre: fila.torre,
        coeficiente: new Prisma.Decimal(fila.coeficiente),
        areaM2: fila.areaM2 ? new Prisma.Decimal(fila.areaM2) : null,
      };
      const existente = porIdentificador.get(fila.identificador);

      // Una unidad borrada que vuelve en el CSV se reactiva como nueva (ver
      // `operacionesReactivarUnidad`); una activa solo actualiza sus datos.
      if (existente?.deletedAt) {
        return [
          ...operacionesReactivarUnidad(
            existente.id,
            etapas.get(existente.id) ?? EtapaCobro.AL_DIA,
            { ...datos, estado: fila.estado }
          ),
        ];
      }
      return [
        prisma.inmueble.upsert({
          where: {
            copropiedadId_identificador: {
              copropiedadId: copropiedad.id,
              identificador: fila.identificador,
            },
          },
          // Sin columna `estado` en el CSV no se pisa el estado de una unidad
          // que ya existe; las nuevas nacen OCUPADO.
          update: tieneEstado ? { ...datos, estado: fila.estado } : datos,
          create: {
            copropiedadId: copropiedad.id,
            identificador: fila.identificador,
            ...datos,
            estado: fila.estado,
          },
        }),
      ];
    });

    await prisma.$transaction(operaciones);

    revalidarCartera();
    revalidatePath("/dashboard/unidades");
    revalidatePath("/dashboard/residentes");

    const creadas = filasValidas.filter((fila) => !fila.yaExiste).length;
    const actualizadas = filasValidas.length - creadas;

    return {
      status: "success",
      message: `Importación aplicada: ${creadas} unidad(es) creada(s) y ${actualizadas} actualizada(s).${
        erroresFila.length > 0 ? ` ${erroresFila.length} fila(s) se omitieron por errores.` : ""
      }`,
      filasValidas,
      erroresFila,
      confirmado: true,
      ...detalle,
    };
  } catch (error) {
    console.error("importarUnidadesCsv", error);
    return { status: "error", message: "No se pudo procesar el archivo." };
  }
}
