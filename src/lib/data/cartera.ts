import { cache } from "react";
import {
  EstadoCuenta,
  EstadoInmueble,
  EtapaCobro,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Cartera de UNA copropiedad.
 *
 * Toda la vista de cartera (KPIs, antigüedad, torres, unidades) se calcula a
 * partir de UNA sola consulta (`cargarCarteraCruda`) y luego se agrega en
 * memoria. Razones:
 *   1. Una PH pequeña/mediana son decenas de unidades y cientos de cuentas —
 *      cabe de sobra en memoria y evita 4–5 round-trips por pantalla (que en
 *      serverless + PgBouncer es lo que de verdad cuesta).
 *   2. El saldo exigible no es una columna: es `totalAPagar + recargos -
 *      pagos`. Calcularlo en SQL exigiría vistas o `$queryRaw` duplicando la
 *      regla que ya vive en `calcularSaldoPendiente`.
 * Si algún día una copropiedad tiene miles de unidades, esto se reemplaza por
 * agregaciones SQL — el contrato público de este módulo no cambia.
 *
 * Todos los montos SALEN como `number` (pesos), no como `Prisma.Decimal`: un
 * Decimal no es un objeto plano y Next.js no puede serializarlo hacia un
 * Client Component. La precisión decimal se conserva donde importa —
 * escrituras y comparaciones de saldo, que siguen usando Decimal.
 */

/** Saldo aún exigible de una cuenta: total + recargos de mora - lo ya pagado. */
export function calcularSaldoPendiente(cuenta: {
  totalAPagar: Prisma.Decimal;
  montoPagado: Prisma.Decimal;
  recargosMora: { monto: Prisma.Decimal }[];
}): Prisma.Decimal {
  const totalRecargos = cuenta.recargosMora.reduce(
    (suma, recargo) => suma.plus(recargo.monto),
    new Prisma.Decimal(0)
  );
  const saldo = cuenta.totalAPagar.plus(totalRecargos).minus(cuenta.montoPagado);
  return saldo.greaterThan(0) ? saldo : new Prisma.Decimal(0);
}

/**
 * Tramos de antigüedad de cartera. Son los mismos que usan los informes de
 * cartera de administración delegada, para que un administrador que ya lee
 * esos informes reconozca la vista sin explicación.
 */
export const TRAMOS_ANTIGUEDAD = [
  { id: "corriente", etiqueta: "Corriente", desde: 0, hasta: 0 },
  { id: "1-30", etiqueta: "1 a 30 días", desde: 1, hasta: 30 },
  { id: "31-60", etiqueta: "31 a 60 días", desde: 31, hasta: 60 },
  { id: "61-90", etiqueta: "61 a 90 días", desde: 61, hasta: 90 },
  { id: "mas-90", etiqueta: "Más de 90 días", desde: 91, hasta: Infinity },
] as const;

export type IdTramoAntiguedad = (typeof TRAMOS_ANTIGUEDAD)[number]["id"];

function tramoDe(diasMora: number): IdTramoAntiguedad {
  if (diasMora <= 0) return "corriente";
  if (diasMora <= 30) return "1-30";
  if (diasMora <= 60) return "31-60";
  if (diasMora <= 90) return "61-90";
  return "mas-90";
}

const MS_POR_DIA = 86_400_000;

function diasDeAtraso(fechaLimite: Date, referencia: Date): number {
  const dias = Math.floor(
    (referencia.getTime() - fechaLimite.getTime()) / MS_POR_DIA
  );
  return dias > 0 ? dias : 0;
}

export function periodoDeFecha(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

const cargarCarteraCruda = cache(async (copropiedadId: string) => {
  return prisma.inmueble.findMany({
    // `join` hace que Prisma traiga las cuatro relaciones anidadas
    // (residentes → usuario, cuentas → recargos, cuentas → pagos) con LATERAL
    // JOINs en UNA consulta. Con la estrategia por defecto emite una consulta
    // por nivel de relación, y cada ida y vuelta a Postgres cuesta ~85–180 ms
    // desde Colombia: era la diferencia entre 280 ms y 540 ms solo en esta
    // lectura. Requiere el preview feature `relationJoins` en schema.prisma.
    relationLoadStrategy: "join",
    where: { copropiedadId, deletedAt: null },
    orderBy: [{ torre: "asc" }, { identificador: "asc" }],
    select: {
      id: true,
      identificador: true,
      torre: true,
      coeficiente: true,
      areaM2: true,
      estado: true,
      etapaCobro: true,
      residentes: {
        where: { activo: true, deletedAt: null },
        select: {
          rol: true,
          usuario: { select: { id: true, nombre: true, email: true, telefono: true } },
        },
      },
      cuentasDeCobro: {
        where: { deletedAt: null },
        orderBy: { periodo: "desc" },
        select: {
          id: true,
          periodo: true,
          montoAdministracion: true,
          montoExpensas: true,
          saldoAnterior: true,
          totalAPagar: true,
          montoPagado: true,
          estado: true,
          fechaEmision: true,
          fechaLimitePago: true,
          recargosMora: {
            where: { deletedAt: null },
            select: { id: true, monto: true, motivo: true, congelado: true },
          },
          pagos: {
            where: { deletedAt: null },
            orderBy: { fechaPago: "desc" },
            select: { id: true, monto: true, metodo: true, fechaPago: true },
          },
        },
      },
    },
  });
});

type InmuebleCrudo = Awaited<ReturnType<typeof cargarCarteraCruda>>[number];

export type CuentaUnidad = {
  id: string;
  periodo: string;
  cuotaAdministracion: number;
  expensas: number;
  saldoAnterior: number;
  totalAPagar: number;
  montoPagado: number;
  recargosMora: number;
  tieneRecargoCongelado: boolean;
  saldoPendiente: number;
  estado: EstadoCuenta;
  fechaLimitePago: Date;
  diasMora: number;
  pagos: { id: string; monto: number; metodo: string; fechaPago: Date }[];
};

export type UnidadCartera = {
  id: string;
  identificador: string;
  torre: string;
  coeficiente: number;
  areaM2: number | null;
  estado: EstadoInmueble;
  etapaCobro: EtapaCobro;
  saldoTotal: number;
  /** Porción del saldo que ya está vencida (excluye la cuenta corriente aún no vencida). */
  saldoVencido: number;
  diasMora: number;
  tramo: IdTramoAntiguedad;
  cuentasPendientes: number;
  aPazYSalvo: boolean;
  ultimoPago: { fechaPago: Date; monto: number } | null;
  residentes: {
    rol: string;
    nombre: string;
    email: string;
    telefono: string | null;
    usuarioId: string;
  }[];
  cuentas: CuentaUnidad[];
};

function armarUnidad(inmueble: InmuebleCrudo, referencia: Date): UnidadCartera {
  let saldoTotal = new Prisma.Decimal(0);
  let saldoVencido = new Prisma.Decimal(0);
  let diasMora = 0;
  let cuentasPendientes = 0;

  const cuentas: CuentaUnidad[] = inmueble.cuentasDeCobro.map((cuenta) => {
    const recargos = cuenta.recargosMora.reduce(
      (suma, recargo) => suma.plus(recargo.monto),
      new Prisma.Decimal(0)
    );
    const saldo = calcularSaldoPendiente(cuenta);
    const atraso = saldo.greaterThan(0)
      ? diasDeAtraso(cuenta.fechaLimitePago, referencia)
      : 0;

    if (saldo.greaterThan(0)) {
      saldoTotal = saldoTotal.plus(saldo);
      cuentasPendientes += 1;
      if (atraso > 0) {
        saldoVencido = saldoVencido.plus(saldo);
        diasMora = Math.max(diasMora, atraso);
      }
    }

    return {
      id: cuenta.id,
      periodo: cuenta.periodo,
      cuotaAdministracion: Number(cuenta.montoAdministracion),
      expensas: Number(cuenta.montoExpensas),
      saldoAnterior: Number(cuenta.saldoAnterior),
      totalAPagar: Number(cuenta.totalAPagar),
      montoPagado: Number(cuenta.montoPagado),
      recargosMora: Number(recargos),
      tieneRecargoCongelado: cuenta.recargosMora.some((r) => r.congelado),
      saldoPendiente: Number(saldo),
      estado: cuenta.estado,
      fechaLimitePago: cuenta.fechaLimitePago,
      diasMora: atraso,
      pagos: cuenta.pagos.map((pago) => ({
        id: pago.id,
        monto: Number(pago.monto),
        metodo: pago.metodo,
        fechaPago: pago.fechaPago,
      })),
    };
  });

  const ultimoPago = cuentas
    .flatMap((cuenta) => cuenta.pagos)
    .sort((a, b) => b.fechaPago.getTime() - a.fechaPago.getTime())[0];

  return {
    id: inmueble.id,
    identificador: inmueble.identificador,
    torre: inmueble.torre,
    coeficiente: Number(inmueble.coeficiente),
    areaM2: inmueble.areaM2 === null ? null : Number(inmueble.areaM2),
    estado: inmueble.estado,
    etapaCobro: inmueble.etapaCobro,
    saldoTotal: Number(saldoTotal),
    saldoVencido: Number(saldoVencido),
    diasMora,
    tramo: tramoDe(diasMora),
    cuentasPendientes,
    // Misma regla que bloquea reservas (`inmuebleNoEstaAPazYSalvo`): cuenta
    // VENCIDA o EN_MORA. Se deriva del estado persistido, no de los días de
    // atraso calculados, para que la tarjeta y el bloqueo nunca se
    // contradigan en pantalla.
    aPazYSalvo: !inmueble.cuentasDeCobro.some(
      (cuenta) =>
        (cuenta.estado === EstadoCuenta.VENCIDA ||
          cuenta.estado === EstadoCuenta.EN_MORA) &&
        calcularSaldoPendiente(cuenta).greaterThan(0)
    ),
    ultimoPago: ultimoPago
      ? { fechaPago: ultimoPago.fechaPago, monto: ultimoPago.monto }
      : null,
    residentes: inmueble.residentes.map((vinculo) => ({
      rol: vinculo.rol,
      nombre: vinculo.usuario.nombre,
      email: vinculo.usuario.email,
      telefono: vinculo.usuario.telefono,
      usuarioId: vinculo.usuario.id,
    })),
    cuentas,
  };
}

/** Todas las unidades de la copropiedad con su cartera ya calculada. */
export const getUnidadesConCartera = cache(async (copropiedadId: string) => {
  const referencia = new Date();
  const crudo = await cargarCarteraCruda(copropiedadId);
  return crudo.map((inmueble) => armarUnidad(inmueble, referencia));
});

export type ResumenCartera = {
  periodoVigente: string;
  facturadoPeriodo: number;
  recaudoDelMes: number;
  recaudoDelPeriodo: number;
  recuperacionPeriodosAnteriores: number;
  porcentajeRecaudo: number;
  carteraTotal: number;
  carteraVencida: number;
  totalUnidades: number;
  unidadesConSaldo: number;
  unidadesEnMora: number;
  unidadesAlDia: number;
  antiguedad: {
    id: IdTramoAntiguedad;
    etiqueta: string;
    monto: number;
    unidades: number;
    porcentaje: number;
  }[];
};

/**
 * KPIs de cartera. `recaudoDelMes` es todo el dinero recibido dentro del mes
 * vigente (incluida la recuperación de meses anteriores);
 * `recaudoDelPeriodo` es solo lo aplicado a las cuentas de ese mes — la
 * diferencia entre ambos es justo el indicador de "recuperación de cartera
 * anterior" que reportan los informes de administración delegada.
 */
export const getResumenCartera = cache(
  async (copropiedadId: string): Promise<ResumenCartera> => {
    const unidades = await getUnidadesConCartera(copropiedadId);

    const periodosDisponibles = [
      ...new Set(unidades.flatMap((u) => u.cuentas.map((c) => c.periodo))),
    ].sort();
    const periodoActual = periodoDeFecha(new Date());
    const periodoVigente = periodosDisponibles.includes(periodoActual)
      ? periodoActual
      : (periodosDisponibles.at(-1) ?? periodoActual);

    let facturadoPeriodo = 0;
    let recaudoDelMes = 0;
    let recaudoDelPeriodo = 0;
    let carteraTotal = 0;
    let carteraVencida = 0;
    let unidadesConSaldo = 0;
    let unidadesEnMora = 0;

    const porTramo = new Map<IdTramoAntiguedad, { monto: number; unidades: number }>(
      TRAMOS_ANTIGUEDAD.map((tramo) => [tramo.id, { monto: 0, unidades: 0 }])
    );

    for (const unidad of unidades) {
      carteraTotal += unidad.saldoTotal;
      carteraVencida += unidad.saldoVencido;
      if (unidad.saldoTotal > 0) unidadesConSaldo += 1;
      if (unidad.diasMora > 0) unidadesEnMora += 1;

      if (unidad.saldoTotal > 0) {
        const acumulado = porTramo.get(unidad.tramo)!;
        acumulado.monto += unidad.saldoTotal;
        acumulado.unidades += 1;
      }

      for (const cuenta of unidad.cuentas) {
        if (cuenta.periodo === periodoVigente) {
          facturadoPeriodo += cuenta.cuotaAdministracion + cuenta.expensas;
        }
        for (const pago of cuenta.pagos) {
          if (periodoDeFecha(pago.fechaPago) === periodoVigente) {
            recaudoDelMes += pago.monto;
          }
          if (cuenta.periodo === periodoVigente) {
            recaudoDelPeriodo += pago.monto;
          }
        }
      }
    }

    return {
      periodoVigente,
      facturadoPeriodo,
      recaudoDelMes,
      recaudoDelPeriodo,
      recuperacionPeriodosAnteriores: Math.max(
        0,
        recaudoDelMes - recaudoDelPeriodo
      ),
      porcentajeRecaudo:
        facturadoPeriodo > 0 ? (recaudoDelPeriodo / facturadoPeriodo) * 100 : 0,
      carteraTotal,
      carteraVencida,
      totalUnidades: unidades.length,
      unidadesConSaldo,
      unidadesEnMora,
      unidadesAlDia: unidades.length - unidadesConSaldo,
      antiguedad: TRAMOS_ANTIGUEDAD.map((tramo) => {
        const acumulado = porTramo.get(tramo.id)!;
        return {
          id: tramo.id,
          etiqueta: tramo.etiqueta,
          monto: acumulado.monto,
          unidades: acumulado.unidades,
          porcentaje: carteraTotal > 0 ? (acumulado.monto / carteraTotal) * 100 : 0,
        };
      }),
    };
  }
);

export type CarteraTorre = {
  torre: string;
  unidades: number;
  unidadesConSaldo: number;
  saldoTotal: number;
  saldoVencido: number;
  porcentajeDeCartera: number;
};

/** Distribución de la cartera por torre — responde "¿qué torre concentra la mora?". */
export const getCarteraPorTorre = cache(
  async (copropiedadId: string): Promise<CarteraTorre[]> => {
    const unidades = await getUnidadesConCartera(copropiedadId);
    const carteraTotal = unidades.reduce((suma, u) => suma + u.saldoTotal, 0);

    const porTorre = new Map<string, CarteraTorre>();
    for (const unidad of unidades) {
      const actual =
        porTorre.get(unidad.torre) ??
        {
          torre: unidad.torre,
          unidades: 0,
          unidadesConSaldo: 0,
          saldoTotal: 0,
          saldoVencido: 0,
          porcentajeDeCartera: 0,
        };

      actual.unidades += 1;
      if (unidad.saldoTotal > 0) actual.unidadesConSaldo += 1;
      actual.saldoTotal += unidad.saldoTotal;
      actual.saldoVencido += unidad.saldoVencido;
      porTorre.set(unidad.torre, actual);
    }

    return [...porTorre.values()]
      .map((torre) => ({
        ...torre,
        porcentajeDeCartera:
          carteraTotal > 0 ? (torre.saldoTotal / carteraTotal) * 100 : 0,
      }))
      .sort((a, b) => b.saldoTotal - a.saldoTotal || a.torre.localeCompare(b.torre));
  }
);

export type FiltroUnidades = {
  torre?: string;
  /** "con-saldo" | "en-mora" | "al-dia" | undefined (todas) */
  situacion?: string;
  busqueda?: string;
};

/** Unidades filtradas para la tabla de cartera. El filtrado es en memoria sobre el mismo dataset cacheado. */
export async function getUnidadesFiltradas(
  copropiedadId: string,
  filtro: FiltroUnidades = {}
): Promise<UnidadCartera[]> {
  const unidades = await getUnidadesConCartera(copropiedadId);
  const busqueda = filtro.busqueda?.trim().toLowerCase();

  return unidades
    .filter((unidad) => (filtro.torre ? unidad.torre === filtro.torre : true))
    .filter((unidad) => {
      if (filtro.situacion === "con-saldo") return unidad.saldoTotal > 0;
      if (filtro.situacion === "en-mora") return unidad.diasMora > 0;
      if (filtro.situacion === "al-dia") return unidad.saldoTotal === 0;
      return true;
    })
    .filter((unidad) => {
      if (!busqueda) return true;
      return (
        unidad.identificador.toLowerCase().includes(busqueda) ||
        unidad.residentes.some((residente) =>
          residente.nombre.toLowerCase().includes(busqueda)
        )
      );
    })
    .sort((a, b) => b.saldoTotal - a.saldoTotal || a.identificador.localeCompare(b.identificador));
}

/** Unidades que más gestión requieren: mayor saldo vencido primero. */
export async function getUnidadesPrioritarias(
  copropiedadId: string,
  limite = 6
): Promise<UnidadCartera[]> {
  const unidades = await getUnidadesConCartera(copropiedadId);
  return unidades
    .filter((unidad) => unidad.saldoVencido > 0)
    .sort((a, b) => b.saldoVencido - a.saldoVencido || b.diasMora - a.diasMora)
    .slice(0, limite);
}

export type DetalleUnidad = UnidadCartera & {  gestiones: {
    id: string;
    tipo: string;
    nota: string;
    etapaAnterior: EtapaCobro | null;
    etapaNueva: EtapaCobro | null;
    createdAt: Date;
    registradoPor: string;
  }[];
  notificaciones: {
    id: string;
    canal: string;
    asunto: string;
    cuerpo: string;
    destinatarios: string;
    simulada: boolean;
    createdAt: Date;
  }[];
};

/**
 * Detalle completo de una unidad: cartera + bitácora de gestión + avisos.
 * `copropiedadId` se pasa siempre para que un id de unidad de otra
 * copropiedad no pueda leerse cambiando el query param.
 */
export async function getDetalleUnidad(
  copropiedadId: string,
  inmuebleId: string
): Promise<DetalleUnidad | null> {
  const unidades = await getUnidadesConCartera(copropiedadId);
  const unidad = unidades.find((item) => item.id === inmuebleId);
  if (!unidad) return null;

  const [gestiones, notificaciones] = await Promise.all([
    prisma.gestionCobro.findMany({
    relationLoadStrategy: "join",
      where: { inmuebleId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        tipo: true,
        nota: true,
        etapaAnterior: true,
        etapaNueva: true,
        createdAt: true,
        registradoPor: { select: { nombre: true } },
      },
    }),
    prisma.notificacionCobro.findMany({
      where: { inmuebleId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        canal: true,
        asunto: true,
        cuerpo: true,
        destinatarios: true,
        simulada: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    ...unidad,
    gestiones: gestiones.map((gestion) => ({
      id: gestion.id,
      tipo: gestion.tipo,
      nota: gestion.nota,
      etapaAnterior: gestion.etapaAnterior,
      etapaNueva: gestion.etapaNueva,
      createdAt: gestion.createdAt,
      registradoPor: gestion.registradoPor.nombre,
    })),
    notificaciones,
  };
}
