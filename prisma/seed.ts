// =============================================================================
// RENTU — Seed de la demo (datos 100% ficticios)
// -----------------------------------------------------------------------------
// Ejecutar con:  pnpm prisma db seed
//
// Siembra UNA sola copropiedad, que es sobre lo que opera el producto:
//   · 1 conjunto ficticio · 3 torres · 24 apartamentos
//   · 14 residentes (algunos apartamentos con propietario + inquilino, otros
//     sin residente vinculado, y un vínculo revocado para el caso de
//     offboarding de la Ley 675)
//   · 6 periodos de cuentas de cobro con comportamiento de pago variado, para
//     que la cartera por antigüedad tenga los cinco tramos poblados
//   · zonas comunes, reservas (una pendiente), PQRS, prestadores, órdenes de
//     servicio, bitácora de gestión y avisos simulados
//
// ⚠️ NINGÚN dato acá proviene de una copropiedad real. Los nombres, NIT,
// direcciones, apartamentos y montos son inventados. No usar datos reales de
// residentes o de informes de cartera de un conjunto existente: este archivo
// se commitea al repositorio.
//
// Idempotente: se puede volver a correr. Las entidades con clave natural se
// hacen `upsert`; la cartera de un apartamento solo se genera si ese
// apartamento todavía no tiene cuentas (así no se duplican pagos).
// =============================================================================

import {
  CanalNotificacion,
  EstadoComprobante,
  EstadoCuenta,
  EstadoInmueble,
  EstadoOrdenServicio,
  EstadoPQRS,
  EstadoReserva,
  EtapaCobro,
  PrismaClient,
  RolEnInmueble,
  RolUsuario,
  TipoGestionCobro,
  TipoPQRS,
  TipoPrestador,
} from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

/**
 * Hash con `scrypt` nativo de Node. El login real lo hace Supabase Auth (ver
 * `src/lib/session.ts`); este campo existe por completitud del modelo.
 */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const PASSWORD_DEMO = hashPassword("Rentu2026*");

const NIT_DEMO = "901742358-1";
const CUOTA_BASE = 385_000; // cuota de administración mensual de referencia
const EXPENSAS_BASE = 0;

const EMAILS_ADMIN_DEMO = [
  // Cuenta pensada para mostrar el producto: su contraseña es la del seed, así
  // que sirve para entrar sin tocar las credenciales personales de nadie.
  "admin.demo@example.com",
  "juliancriverag@gmail.com",
  "isaiasmacia@gmail.com",
] as const;

// --------------------------- utilidades de fechas ---------------------------

/** "AAAA-MM" de hace `atras` meses (0 = mes actual). */
function periodoRelativo(atras: number): string {
  const hoy = new Date();
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - atras, 1);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

function fechaEnPeriodo(periodo: string, dia: number): Date {
  const [anio, mes] = periodo.split("-").map(Number);
  return new Date(anio, mes - 1, dia, 10, 0, 0);
}

/** Fecha límite: día 10 del mes siguiente al periodo facturado. */
function fechaLimiteDe(periodo: string): Date {
  const [anio, mes] = periodo.split("-").map(Number);
  return new Date(anio, mes, 10, 23, 59, 0);
}

function diasDesde(fecha: Date): number {
  return Math.floor((Date.now() - fecha.getTime()) / 86_400_000);
}

// ------------------------------ definición demo -----------------------------

/**
 * Perfil de pago de cada apartamento. Es lo que hace que la demo se parezca a
 * una cartera real: la mayoría paga al día, unos pocos concentran la mora y
 * las antigüedades quedan repartidas en los cinco tramos del informe.
 *
 * Con fecha límite el día 10 del mes siguiente, dejar de pagar desde un mes
 * concreto cae en un tramo predecible:
 *   - solo el mes corriente sin pagar (aún no vence) → "Corriente"
 *   - sin pagar desde el mes anterior               → "1 a 30 días"
 *   - sin pagar desde hace 2 meses                  → "31 a 60 días"
 *   - sin pagar desde hace 3 meses                  → "61 a 90 días"
 *   - sin pagar desde el inicio del periodo         → "Más de 90 días"
 */
type PerfilPago =
  | "alDia"
  | "corriente"
  | "atrasoLeve"
  | "abonosParciales"
  | "moraMedia"
  | "moraAlta"
  | "moraProfunda";

type DefinicionUnidad = {
  identificador: string;
  torre: string;
  coeficiente: string;
  areaM2: string;
  perfil: PerfilPago;
  etapa: EtapaCobro;
  estado?: EstadoInmueble;
};

/**
 * 24 apartamentos: 8 por torre. Los coeficientes suman 1.00000 (exigencia de
 * la Ley 675: el coeficiente es la participación del inmueble en el total).
 *
 * Reparto deliberado: 16 al día, 2 que aún no pagan la cuota del mes en curso
 * (que todavía no vence) y 6 con cartera — uno por tramo de antigüedad, más
 * los dos casos viejos concentrados en la Torre C. Así la pregunta "¿qué torre
 * concentra la mora?" tiene una respuesta visible y el porcentaje de recaudo
 * del mes queda en un rango creíble (~67%), no en un 100% irreal.
 */
const UNIDADES: DefinicionUnidad[] = [
  // --- Torre A: la torre sana ---------------------------------------------
  { identificador: "Apto A101", torre: "Torre A", coeficiente: "0.04167", areaM2: "68.00", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto A102", torre: "Torre A", coeficiente: "0.04167", areaM2: "68.00", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto A201", torre: "Torre A", coeficiente: "0.04167", areaM2: "72.50", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto A202", torre: "Torre A", coeficiente: "0.04167", areaM2: "72.50", perfil: "corriente", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto A301", torre: "Torre A", coeficiente: "0.04167", areaM2: "72.50", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto A302", torre: "Torre A", coeficiente: "0.04167", areaM2: "72.50", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto A401", torre: "Torre A", coeficiente: "0.04167", areaM2: "85.00", perfil: "atrasoLeve", etapa: EtapaCobro.RECORDATORIO },
  { identificador: "Apto A402", torre: "Torre A", coeficiente: "0.04167", areaM2: "85.00", perfil: "alDia", etapa: EtapaCobro.AL_DIA },

  // --- Torre B: mora intermedia y un acuerdo de pago ----------------------
  { identificador: "Apto B101", torre: "Torre B", coeficiente: "0.04167", areaM2: "66.00", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto B102", torre: "Torre B", coeficiente: "0.04167", areaM2: "66.00", perfil: "corriente", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto B201", torre: "Torre B", coeficiente: "0.04167", areaM2: "70.00", perfil: "moraMedia", etapa: EtapaCobro.COBRO_PERSUASIVO },
  { identificador: "Apto B202", torre: "Torre B", coeficiente: "0.04167", areaM2: "70.00", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto B301", torre: "Torre B", coeficiente: "0.04167", areaM2: "70.00", perfil: "abonosParciales", etapa: EtapaCobro.ACUERDO_PAGO },
  { identificador: "Apto B302", torre: "Torre B", coeficiente: "0.04167", areaM2: "70.00", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto B401", torre: "Torre B", coeficiente: "0.04167", areaM2: "82.00", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto B402", torre: "Torre B", coeficiente: "0.04167", areaM2: "82.00", perfil: "alDia", etapa: EtapaCobro.AL_DIA, estado: EstadoInmueble.DESOCUPADO },

  // --- Torre C: concentra la cartera vieja --------------------------------
  { identificador: "Apto C101", torre: "Torre C", coeficiente: "0.04167", areaM2: "64.00", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto C102", torre: "Torre C", coeficiente: "0.04167", areaM2: "64.00", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto C201", torre: "Torre C", coeficiente: "0.04167", areaM2: "69.00", perfil: "moraProfunda", etapa: EtapaCobro.PREJURIDICO },
  { identificador: "Apto C202", torre: "Torre C", coeficiente: "0.04167", areaM2: "69.00", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto C301", torre: "Torre C", coeficiente: "0.04167", areaM2: "69.00", perfil: "moraAlta", etapa: EtapaCobro.COBRO_PERSUASIVO },
  { identificador: "Apto C302", torre: "Torre C", coeficiente: "0.04167", areaM2: "69.00", perfil: "moraProfunda", etapa: EtapaCobro.JURIDICO, estado: EstadoInmueble.DESOCUPADO },
  { identificador: "Apto C401", torre: "Torre C", coeficiente: "0.04167", areaM2: "88.00", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
  { identificador: "Apto C402", torre: "Torre C", coeficiente: "0.04159", areaM2: "88.00", perfil: "alDia", etapa: EtapaCobro.AL_DIA },
];

type DefinicionResidente = {
  nombre: string;
  email: string;
  telefono: string;
  rolUsuario: RolUsuario;
  unidad: string;
  rolEnInmueble: RolEnInmueble;
  activo?: boolean;
  fechaFin?: Date;
};

/** Personas ficticias. Los correos usan `example.com`, reservado para pruebas. */
const RESIDENTES: DefinicionResidente[] = [
  { nombre: "Marcela Aguirre Peña", email: "marcela.aguirre@example.com", telefono: "+57 300 000 0101", rolUsuario: RolUsuario.PROPIETARIO, unidad: "Apto A101", rolEnInmueble: RolEnInmueble.PROPIETARIO },
  { nombre: "Tomás Valderrama Cruz", email: "tomas.valderrama@example.com", telefono: "+57 300 000 0102", rolUsuario: RolUsuario.PROPIETARIO, unidad: "Apto A102", rolEnInmueble: RolEnInmueble.PROPIETARIO },
  { nombre: "Liliana Escobar Ruiz", email: "liliana.escobar@example.com", telefono: "+57 300 000 0103", rolUsuario: RolUsuario.PROPIETARIO, unidad: "Apto A202", rolEnInmueble: RolEnInmueble.PROPIETARIO },
  { nombre: "Andrés Felipe Quintero", email: "andres.quintero@example.com", telefono: "+57 300 000 0104", rolUsuario: RolUsuario.INQUILINO, unidad: "Apto A202", rolEnInmueble: RolEnInmueble.INQUILINO },
  { nombre: "Sandra Milena Orozco", email: "sandra.orozco@example.com", telefono: "+57 300 000 0105", rolUsuario: RolUsuario.PROPIETARIO, unidad: "Apto A401", rolEnInmueble: RolEnInmueble.PROPIETARIO },
  { nombre: "Héctor Mauricio Lizarazo", email: "hector.lizarazo@example.com", telefono: "+57 300 000 0106", rolUsuario: RolUsuario.PROPIETARIO, unidad: "Apto B101", rolEnInmueble: RolEnInmueble.PROPIETARIO },
  { nombre: "Paula Andrea Cifuentes", email: "paula.cifuentes@example.com", telefono: "+57 300 000 0107", rolUsuario: RolUsuario.PROPIETARIO, unidad: "Apto B201", rolEnInmueble: RolEnInmueble.PROPIETARIO },
  { nombre: "Ricardo Alonso Beltrán", email: "ricardo.beltran@example.com", telefono: "+57 300 000 0108", rolUsuario: RolUsuario.INQUILINO, unidad: "Apto B301", rolEnInmueble: RolEnInmueble.INQUILINO },
  { nombre: "Gloria Inés Mendoza", email: "gloria.mendoza@example.com", telefono: "+57 300 000 0109", rolUsuario: RolUsuario.PROPIETARIO, unidad: "Apto B401", rolEnInmueble: RolEnInmueble.PROPIETARIO },
  { nombre: "Javier Eduardo Salgado", email: "javier.salgado@example.com", telefono: "+57 300 000 0110", rolUsuario: RolUsuario.PROPIETARIO, unidad: "Apto C101", rolEnInmueble: RolEnInmueble.PROPIETARIO },
  { nombre: "Natalia Restrepo Gil", email: "natalia.restrepo@example.com", telefono: "+57 300 000 0111", rolUsuario: RolUsuario.PROPIETARIO, unidad: "Apto C201", rolEnInmueble: RolEnInmueble.PROPIETARIO },
  { nombre: "Camilo Andrés Pardo", email: "camilo.pardo@example.com", telefono: "+57 300 000 0112", rolUsuario: RolUsuario.PROPIETARIO, unidad: "Apto C301", rolEnInmueble: RolEnInmueble.PROPIETARIO },
  { nombre: "Adriana Lucía Forero", email: "adriana.forero@example.com", telefono: "+57 300 000 0113", rolUsuario: RolUsuario.PROPIETARIO, unidad: "Apto C401", rolEnInmueble: RolEnInmueble.PROPIETARIO },
  // Caso borde de la Ley 675: vínculo revocado. La fila NUNCA se borra, solo
  // se marca `activo = false` con `fechaFin`, para no perder el historial.
  {
    nombre: "Óscar Iván Peñaloza",
    email: "oscar.penaloza@example.com",
    telefono: "+57 300 000 0114",
    rolUsuario: RolUsuario.INQUILINO,
    unidad: "Apto B402",
    rolEnInmueble: RolEnInmueble.INQUILINO,
    activo: false,
    fechaFin: new Date(Date.now() - 45 * 86_400_000),
  },
];

const ZONAS_COMUNES = [
  { nombre: "Salón social", descripcion: "Capacidad para 40 personas, incluye cocineta, mesas y sillas.", aforo: 40, costo: "180000" },
  { nombre: "Zona BBQ terraza", descripcion: "Dos asadores en la terraza de la Torre B.", aforo: 15, costo: "60000" },
  { nombre: "Cancha múltiple", descripcion: "Microfútbol y baloncesto. Sin costo, reserva por bloques de 2 horas.", aforo: 20, costo: "0" },
  { nombre: "Sala de juntas", descripcion: "Para reuniones del consejo y de propietarios.", aforo: 12, costo: "0" },
];

const PRESTADORES = [
  { nombre: "Vigilancia Andina Ltda.", tipo: TipoPrestador.SEGURIDAD, contacto: "Jorge Medina", telefono: "+57 601 555 1010", email: "operaciones@vigilanciaandina.example.com", notas: "Turnos 24/7, dos puestos. Contrato renovado en enero." },
  { nombre: "Aseo Integral del Norte S.A.S.", tipo: TipoPrestador.ASEO, contacto: "Luz Marina Cortés", telefono: "+57 601 555 2020", email: "contacto@aseointegral.example.com", notas: "Lunes a sábado, 6 a.m. a 2 p.m." },
  { nombre: "Jardines Verdes", tipo: TipoPrestador.JARDINERIA, contacto: "Wilson Ávila", telefono: "+57 320 555 3030", email: null, notas: "Visita cada 15 días." },
  { nombre: "Hidro Servicios Técnicos", tipo: TipoPrestador.MANTENIMIENTO, contacto: "Édgar Ramírez", telefono: "+57 311 555 4040", email: "servicio@hidroservicios.example.com", notas: "Plomería y bombas eyectoras. Atiende urgencias." },
  { nombre: "Piscinas y Tratamiento AquaPro", tipo: TipoPrestador.PISCINA, contacto: "Mónica Salas", telefono: "+57 318 555 5050", email: "aquapro@example.com", notas: "Control de pH semanal." },
];

// --------------------------------- cartera ----------------------------------

/**
 * Devuelve, para un perfil de pago y un periodo, cuánto se pagó de esa cuota.
 * `indice` es 0 para el periodo más antiguo sembrado y crece hacia el mes
 * actual.
 */
function porcentajePagado(perfil: PerfilPago, indice: number, total: number): number {
  const mesesDesdeElFinal = total - 1 - indice;

  switch (perfil) {
    case "alDia":
      return 1;
    case "corriente":
      // Pagó todo menos la cuota del mes en curso, que todavía no vence. Es el
      // comportamiento normal a mitad de mes, no una mora.
      return mesesDesdeElFinal === 0 ? 0 : 1;
    case "atrasoLeve":
      return mesesDesdeElFinal <= 1 ? 0 : 1;
    case "abonosParciales":
      // Acuerdo de pago: abona parcialmente en vez de dejar de pagar.
      if (mesesDesdeElFinal === 0) return 0;
      if (mesesDesdeElFinal === 1) return 0.5;
      if (mesesDesdeElFinal === 2) return 0.6;
      return 1;
    case "moraMedia":
      return mesesDesdeElFinal <= 2 ? 0 : 1;
    case "moraAlta":
      return mesesDesdeElFinal <= 3 ? 0 : 1;
    case "moraProfunda":
      // Solo hizo un abono al comienzo del periodo sembrado y nada más.
      return indice === 0 ? 0.35 : 0;
  }
}

async function main() {
  console.log("🌱 Sembrando la demo de Rentu (datos ficticios)…");
  // ---------------------------------------------------------------------
  // 1. Copropiedad única
  // ---------------------------------------------------------------------
  const copropiedad = await prisma.copropiedad.upsert({
    where: { nit: NIT_DEMO },
    update: {
      nombre: "Conjunto Residencial Altos de Salitre",
      direccion: "Cl. 24C # 68-45",
      ciudad: "Bogotá D.C.",
      deletedAt: null,
    },
    create: {
      nombre: "Conjunto Residencial Altos de Salitre",
      nit: NIT_DEMO,
      direccion: "Cl. 24C # 68-45",
      ciudad: "Bogotá D.C.",
    },
  });

  // ---------------------------------------------------------------------
  // 2. Administradores de la demo
  // ---------------------------------------------------------------------
  const administradores = [
    { email: EMAILS_ADMIN_DEMO[0], nombre: "Administración Altos de Salitre", telefono: "+57 601 555 0000" },
    { email: EMAILS_ADMIN_DEMO[1], nombre: "Julián Rivera", telefono: "+57 300 765 2849" },
    { email: EMAILS_ADMIN_DEMO[2], nombre: "Isaías Macía", telefono: null },
  ];

  const adminIds: string[] = [];
  for (const admin of administradores) {
    const usuario = await prisma.usuario.upsert({
      where: { email: admin.email },
      update: { nombre: admin.nombre, rol: RolUsuario.ADMINISTRADOR, deletedAt: null },
      create: {
        nombre: admin.nombre,
        email: admin.email,
        telefono: admin.telefono,
        rol: RolUsuario.ADMINISTRADOR,
        passwordHash: PASSWORD_DEMO,
      },
    });
    adminIds.push(usuario.id);

    const vinculo = await prisma.administradorCopropiedad.findFirst({
      where: { usuarioId: usuario.id, copropiedadId: copropiedad.id },
      select: { id: true },
    });
    if (vinculo) {
      await prisma.administradorCopropiedad.update({
        where: { id: vinculo.id },
        data: { deletedAt: null },
      });
    } else {
      await prisma.administradorCopropiedad.create({
        data: { usuarioId: usuario.id, copropiedadId: copropiedad.id },
      });
    }
  }

  // Rentu opera sobre UNA copropiedad (`getCopropiedadActiva` toma la primera
  // asignada). Si quedaron conjuntos de una versión anterior del seed,
  // se archivan con soft delete para que la demo no quede ambigua. No se
  // borra nada físicamente: los datos siguen ahí si hay que recuperarlos.
  const otrasAsignaciones = await prisma.administradorCopropiedad.findMany({
    where: {
      usuarioId: { in: adminIds },
      copropiedadId: { not: copropiedad.id },
      deletedAt: null,
    },
    select: { id: true, copropiedadId: true },
  });

  if (otrasAsignaciones.length > 0) {
    const ahora = new Date();
    await prisma.administradorCopropiedad.updateMany({
      where: { id: { in: otrasAsignaciones.map((item) => item.id) } },
      data: { deletedAt: ahora },
    });
    await prisma.copropiedad.updateMany({
      where: {
        id: { in: [...new Set(otrasAsignaciones.map((item) => item.copropiedadId))] },
        deletedAt: null,
      },
      data: { deletedAt: ahora },
    });
    console.log(
      `↷ ${otrasAsignaciones.length} asignación(es) a otras copropiedades archivadas (soft delete).`
    );
  }

  // Administradores que quedaron sin ninguna copropiedad activa (por ejemplo
  // porque solo administraban conjuntos de una versión anterior del seed, ya
  // archivados) se enganchan a la copropiedad demo: si no, al entrar verían un
  // dashboard vacío sin explicación. A los administradores que SÍ tienen su
  // propia copropiedad activa no se les toca nada.
  const adminsSinCopropiedad = await prisma.usuario.findMany({
    where: {
      rol: RolUsuario.ADMINISTRADOR,
      deletedAt: null,
      copropiedadesAdministradas: { none: { deletedAt: null } },
    },
    select: { id: true, email: true },
  });

  if (adminsSinCopropiedad.length > 0) {
    await prisma.administradorCopropiedad.createMany({
      data: adminsSinCopropiedad.map((admin) => ({
        usuarioId: admin.id,
        copropiedadId: copropiedad.id,
      })),
      skipDuplicates: true,
    });
    console.log(
      `↷ ${adminsSinCopropiedad.length} administrador(es) sin copropiedad activa enganchados a la demo: ${adminsSinCopropiedad
        .map((admin) => admin.email)
        .join(", ")}`
    );
  }

  // ---------------------------------------------------------------------
  // 3. Unidades (24)
  // ---------------------------------------------------------------------
  const unidadesPorIdentificador = new Map<string, { id: string }>();

  for (const definicion of UNIDADES) {
    const unidad = await prisma.inmueble.upsert({
      where: {
        copropiedadId_identificador: {
          copropiedadId: copropiedad.id,
          identificador: definicion.identificador,
        },
      },
      update: {
        torre: definicion.torre,
        coeficiente: definicion.coeficiente,
        areaM2: definicion.areaM2,
        estado: definicion.estado ?? EstadoInmueble.OCUPADO,
        etapaCobro: definicion.etapa,
        // El marketplace quedó fuera del producto: ninguna unidad se publica.
        disponibleArriendo: false,
        deletedAt: null,
      },
      create: {
        copropiedadId: copropiedad.id,
        identificador: definicion.identificador,
        torre: definicion.torre,
        coeficiente: definicion.coeficiente,
        areaM2: definicion.areaM2,
        estado: definicion.estado ?? EstadoInmueble.OCUPADO,
        etapaCobro: definicion.etapa,
        disponibleArriendo: false,
      },
      select: { id: true },
    });
    unidadesPorIdentificador.set(definicion.identificador, unidad);
  }

  // ---------------------------------------------------------------------
  // 4. Residentes y vínculos
  // ---------------------------------------------------------------------
  const residentesPorEmail = new Map<string, { id: string }>();

  for (const definicion of RESIDENTES) {
    const usuario = await prisma.usuario.upsert({
      where: { email: definicion.email },
      update: { nombre: definicion.nombre, telefono: definicion.telefono, deletedAt: null },
      create: {
        nombre: definicion.nombre,
        email: definicion.email,
        telefono: definicion.telefono,
        rol: definicion.rolUsuario,
        passwordHash: PASSWORD_DEMO,
      },
      select: { id: true },
    });
    residentesPorEmail.set(definicion.email, usuario);

    const unidad = unidadesPorIdentificador.get(definicion.unidad);
    if (!unidad) continue;

    const vinculoExistente = await prisma.usuarioInmueble.findFirst({
      where: { usuarioId: usuario.id, inmuebleId: unidad.id },
      select: { id: true },
    });

    if (!vinculoExistente) {
      await prisma.usuarioInmueble.create({
        data: {
          usuarioId: usuario.id,
          inmuebleId: unidad.id,
          rol: definicion.rolEnInmueble,
          activo: definicion.activo ?? true,
          fechaFin: definicion.fechaFin ?? null,
          fechaInicio: new Date(Date.now() - 400 * 86_400_000),
        },
      });
    }
  }

  // ---------------------------------------------------------------------
  // 5. Cartera: 6 periodos
  // ---------------------------------------------------------------------

  // `SEED_RESET=1 pnpm prisma db seed` borra los datos transaccionales de la
  // copropiedad demo (cartera, gestiones, avisos, reservas, PQRS y órdenes)
  // para volver a sembrarlos desde cero. Sin esta variable el seed NO borra
  // nada: solo completa lo que falte. Las unidades, los residentes y sus
  // vínculos se conservan siempre.
  if (process.env.SEED_RESET === "1") {
    console.log("⚠️  SEED_RESET=1 — borrando datos transaccionales de la demo…");
    const idsUnidades = await prisma.inmueble.findMany({
      where: { copropiedadId: copropiedad.id },
      select: { id: true },
    });
    const inmuebleIds = idsUnidades.map((unidad) => unidad.id);

    // El orden respeta las llaves foráneas: primero los hijos.
    await prisma.ordenServicio.deleteMany({ where: { copropiedadId: copropiedad.id } });
    await prisma.pqrs.deleteMany({ where: { inmuebleId: { in: inmuebleIds } } });
    await prisma.reserva.deleteMany({ where: { inmuebleId: { in: inmuebleIds } } });
    await prisma.notificacionCobro.deleteMany({ where: { inmuebleId: { in: inmuebleIds } } });
    await prisma.gestionCobro.deleteMany({ where: { inmuebleId: { in: inmuebleIds } } });
    await prisma.pago.deleteMany({
      where: { cuentaDeCobro: { inmuebleId: { in: inmuebleIds } } },
    });
    await prisma.recargoMora.deleteMany({
      where: { cuentaDeCobro: { inmuebleId: { in: inmuebleIds } } },
    });
    await prisma.comprobantePago.deleteMany({
      where: { cuentaDeCobro: { inmuebleId: { in: inmuebleIds } } },
    });
    await prisma.cuentaDeCobro.deleteMany({ where: { inmuebleId: { in: inmuebleIds } } });
  }

  const periodos = [5, 4, 3, 2, 1, 0].map(periodoRelativo); // del más antiguo al actual
  const adminPrincipalId = adminIds[0];
  let cuentasCreadas = 0;
  let unidadesOmitidas = 0;

  for (const definicion of UNIDADES) {
    const unidad = unidadesPorIdentificador.get(definicion.identificador);
    if (!unidad) continue;

    const yaTieneCartera = await prisma.cuentaDeCobro.findFirst({
      where: { inmuebleId: unidad.id },
      select: { id: true },
    });

    // Si la unidad ya tiene cartera, no se vuelve a sembrar: repetir pagos
    // sobre las mismas cuentas daría saldos negativos y un recaudo irreal.
    if (yaTieneCartera) {
      unidadesOmitidas += 1;
      continue;
    }

    // Cada cuota es independiente (no se arrastra el saldo anterior): la
    // cartera de la unidad es la suma de sus cuotas no pagadas. Ver la nota
    // en `generarCuentasDeCobroMensual` sobre por qué arrastrar el saldo
    // duplicaba la deuda en los agregados.
    for (const [indice, periodo] of periodos.entries()) {
      const cuota = CUOTA_BASE;
      const totalAPagar = cuota + EXPENSAS_BASE;
      const fechaLimite = fechaLimiteDe(periodo);
      const vencida = diasDesde(fechaLimite) > 0;

      const proporcion = porcentajePagado(definicion.perfil, indice, periodos.length);
      const montoPagado = Math.round(totalAPagar * proporcion);
      const saldoPendiente = totalAPagar - montoPagado;

      // Recargo de mora solo cuando la cuota lleva más de 30 días vencida y
      // sigue con saldo. En producción esto lo haría un job nocturno; acá se
      // siembra para que la cartera por antigüedad sea realista.
      const diasVencida = diasDesde(fechaLimite);
      const aplicaRecargo = saldoPendiente > 0 && diasVencida > 30;
      const montoRecargo = aplicaRecargo
        ? Math.round(saldoPendiente * 0.025 * Math.min(3, Math.floor(diasVencida / 30)))
        : 0;

      const estado: EstadoCuenta =
        saldoPendiente <= 0
          ? EstadoCuenta.PAGADA
          : diasVencida > 30
            ? EstadoCuenta.EN_MORA
            : vencida
              ? EstadoCuenta.VENCIDA
              : EstadoCuenta.PENDIENTE;

      const cuenta = await prisma.cuentaDeCobro.create({
        data: {
          inmuebleId: unidad.id,
          periodo,
          montoAdministracion: cuota.toFixed(2),
          montoExpensas: EXPENSAS_BASE.toFixed(2),
          saldoAnterior: "0",
          totalAPagar: totalAPagar.toFixed(2),
          montoPagado: montoPagado.toFixed(2),
          fechaEmision: fechaEnPeriodo(periodo, 1),
          fechaLimitePago: fechaLimite,
          estado,
        },
        select: { id: true },
      });
      cuentasCreadas += 1;

      if (montoPagado > 0) {
        await prisma.pago.create({
          data: {
            cuentaDeCobroId: cuenta.id,
            registradoPorId: adminPrincipalId,
            monto: montoPagado.toFixed(2),
            metodo: indice % 3 === 0 ? "Consignación" : "Transferencia",
            fechaPago: fechaEnPeriodo(periodo, Math.min(28, 8 + (indice % 5) * 3)),
            observaciones: proporcion < 1 ? "Abono parcial acordado con la administración" : null,
          },
        });
      }

      if (montoRecargo > 0) {
        await prisma.recargoMora.create({
          data: {
            cuentaDeCobroId: cuenta.id,
            monto: montoRecargo.toFixed(2),
            motivo: `Interés de mora — ${periodo}`,
          },
        });
      }
    }
  }

  // Un comprobante en revisión sobre la unidad en acuerdo de pago: activa el
  // caso borde de "recargo congelado" (no debe crecer mientras la
  // administración no apruebe o rechace el soporte).
  const unidadAcuerdo = unidadesPorIdentificador.get("Apto B301");
  const residenteAcuerdo = residentesPorEmail.get("ricardo.beltran@example.com");
  if (unidadAcuerdo && residenteAcuerdo) {
    const cuentaReciente = await prisma.cuentaDeCobro.findFirst({
      where: { inmuebleId: unidadAcuerdo.id, estado: { not: EstadoCuenta.PAGADA } },
      orderBy: { periodo: "desc" },
      select: { id: true, comprobantes: { select: { id: true } } },
    });

    if (cuentaReciente && cuentaReciente.comprobantes.length === 0) {
      await prisma.comprobantePago.create({
        data: {
          cuentaDeCobroId: cuentaReciente.id,
          cargadoPorId: residenteAcuerdo.id,
          urlArchivo: "https://example.com/comprobantes/demo-abono.pdf",
          estado: EstadoComprobante.PENDIENTE_REVISION,
        },
      });
      await prisma.recargoMora.updateMany({
        where: { cuentaDeCobroId: cuentaReciente.id },
        data: { congelado: true },
      });
    }
  }

  // ---------------------------------------------------------------------
  // 6. Bitácora de gestión y avisos simulados
  // ---------------------------------------------------------------------
  const gestiones: {
    unidad: string;
    tipo: TipoGestionCobro;
    nota: string;
    diasAtras: number;
    etapaAnterior?: EtapaCobro;
    etapaNueva?: EtapaCobro;
  }[] = [
    { unidad: "Apto C201", tipo: TipoGestionCobro.LLAMADA, nota: "Se llamó a la propietaria. Manifiesta dificultades por desempleo; se le explicó la opción de acuerdo de pago.", diasAtras: 40 },
    { unidad: "Apto C201", tipo: TipoGestionCobro.CAMBIO_ETAPA, nota: "Sin respuesta a dos comunicaciones escritas. Se pasa a seguimiento prejurídico para revisión del consejo.", diasAtras: 20, etapaAnterior: EtapaCobro.COBRO_PERSUASIVO, etapaNueva: EtapaCobro.PREJURIDICO },
    { unidad: "Apto C302", tipo: TipoGestionCobro.VISITA, nota: "Apartamento desocupado. Se dejó comunicación en portería y se notificó al propietario por correo certificado.", diasAtras: 60 },
    { unidad: "Apto C302", tipo: TipoGestionCobro.CAMBIO_ETAPA, nota: "El consejo autorizó entregar el caso al abogado externo. Rentu solo registra el seguimiento; el proceso lo lleva el abogado.", diasAtras: 15, etapaAnterior: EtapaCobro.PREJURIDICO, etapaNueva: EtapaCobro.JURIDICO },
    { unidad: "Apto B301", tipo: TipoGestionCobro.ACUERDO_PAGO, nota: "Acuerdo verbal: abona el 50% de cada cuota durante tres meses y normaliza en el cuarto. Queda pendiente firmar el documento.", diasAtras: 35, etapaAnterior: EtapaCobro.COBRO_PERSUASIVO, etapaNueva: EtapaCobro.ACUERDO_PAGO },
    { unidad: "Apto B201", tipo: TipoGestionCobro.LLAMADA, nota: "Contesta la propietaria; dice que el pago lo hace el inquilino. Se pidió el contacto directo del inquilino.", diasAtras: 12 },
    { unidad: "Apto A401", tipo: TipoGestionCobro.NOTA, nota: "Prometió pago para el día 25. Verificar en el extracto.", diasAtras: 6 },
    { unidad: "Apto C301", tipo: TipoGestionCobro.LLAMADA, nota: "Se deja mensaje de voz. No devuelve la llamada.", diasAtras: 9 },
  ];

  const tieneGestiones = await prisma.gestionCobro.findFirst({
    where: { inmueble: { copropiedadId: copropiedad.id } },
    select: { id: true },
  });

  if (!tieneGestiones) {
    for (const gestion of gestiones) {
      const unidad = unidadesPorIdentificador.get(gestion.unidad);
      if (!unidad) continue;
      await prisma.gestionCobro.create({
        data: {
          inmuebleId: unidad.id,
          registradoPorId: adminPrincipalId,
          tipo: gestion.tipo,
          nota: gestion.nota,
          etapaAnterior: gestion.etapaAnterior ?? null,
          etapaNueva: gestion.etapaNueva ?? null,
          createdAt: new Date(Date.now() - gestion.diasAtras * 86_400_000),
        },
      });
    }

    // Avisos: SIEMPRE `simulada: true`. No hay proveedor de correo conectado.
    const avisos = [
      { unidad: "Apto C201", canal: CanalNotificacion.CORREO, diasAtras: 30 },
      { unidad: "Apto B201", canal: CanalNotificacion.WHATSAPP, diasAtras: 14 },
      { unidad: "Apto C302", canal: CanalNotificacion.CARTA, diasAtras: 55 },
    ];

    for (const aviso of avisos) {
      const unidad = unidadesPorIdentificador.get(aviso.unidad);
      if (!unidad) continue;
      const residentes = await prisma.usuarioInmueble.findMany({
        where: { inmuebleId: unidad.id, activo: true, deletedAt: null },
        select: { usuario: { select: { email: true } } },
      });

      await prisma.notificacionCobro.create({
        data: {
          inmuebleId: unidad.id,
          creadoPorId: adminPrincipalId,
          canal: aviso.canal,
          asunto: `Saldo pendiente — ${aviso.unidad}`,
          cuerpo:
            "Buen día,\n\nLe escribimos desde la administración para recordarle que su unidad presenta un saldo pendiente. Si ya realizó el pago, por favor haga llegar el soporte para actualizar su estado de cuenta. Si necesita acordar una forma de pago, con gusto lo revisamos.\n\nCordialmente,\nAdministración",
          destinatarios:
            residentes.map((r) => r.usuario.email).join(", ") ||
            "(la unidad no tiene residentes con correo registrado)",
          simulada: true,
          createdAt: new Date(Date.now() - aviso.diasAtras * 86_400_000),
        },
      });
    }
  }

  // ---------------------------------------------------------------------
  // 7. Zonas comunes y reservas
  // ---------------------------------------------------------------------
  const zonasPorNombre = new Map<string, { id: string }>();
  for (const zona of ZONAS_COMUNES) {
    const existente = await prisma.zonaComun.findFirst({
      where: { copropiedadId: copropiedad.id, nombre: zona.nombre },
      select: { id: true },
    });

    const guardada = existente
      ? await prisma.zonaComun.update({
          where: { id: existente.id },
          data: {
            descripcion: zona.descripcion,
            aforo: zona.aforo,
            costo: zona.costo,
            activa: true,
            deletedAt: null,
          },
          select: { id: true },
        })
      : await prisma.zonaComun.create({
          data: {
            copropiedadId: copropiedad.id,
            nombre: zona.nombre,
            descripcion: zona.descripcion,
            aforo: zona.aforo,
            costo: zona.costo,
          },
          select: { id: true },
        });

    zonasPorNombre.set(zona.nombre, guardada);
  }

  const tieneReservas = await prisma.reserva.findFirst({
    where: { zonaComun: { copropiedadId: copropiedad.id } },
    select: { id: true },
  });

  if (!tieneReservas) {
    const reservas = [
      {
        zona: "Salón social",
        unidad: "Apto A101",
        email: "marcela.aguirre@example.com",
        enDias: 6,
        horaInicio: 15,
        duracion: 5,
        estado: EstadoReserva.PENDIENTE,
        observaciones: "Grado de mi hija, 35 personas.",
      },
      {
        zona: "Zona BBQ terraza",
        unidad: "Apto B101",
        email: "hector.lizarazo@example.com",
        enDias: 3,
        horaInicio: 12,
        duracion: 4,
        estado: EstadoReserva.CONFIRMADA,
        observaciones: "Almuerzo familiar, 10 personas.",
      },
      {
        zona: "Cancha múltiple",
        unidad: "Apto A102",
        email: "tomas.valderrama@example.com",
        enDias: -10,
        horaInicio: 9,
        duracion: 2,
        estado: EstadoReserva.CONFIRMADA,
        observaciones: null,
      },
    ];

    for (const reserva of reservas) {
      const zona = zonasPorNombre.get(reserva.zona);
      const unidad = unidadesPorIdentificador.get(reserva.unidad);
      const usuario = residentesPorEmail.get(reserva.email);
      if (!zona || !unidad || !usuario) continue;

      const base = new Date();
      base.setDate(base.getDate() + reserva.enDias);
      const inicio = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        reserva.horaInicio,
        0,
        0
      );
      const fin = new Date(inicio.getTime() + reserva.duracion * 3_600_000);

      await prisma.reserva.create({
        data: {
          zonaComunId: zona.id,
          inmuebleId: unidad.id,
          solicitadaPorId: usuario.id,
          fechaInicio: inicio,
          fechaFin: fin,
          estado: reserva.estado,
          observaciones: reserva.observaciones,
        },
      });
    }
  }

  // ---------------------------------------------------------------------
  // 8. PQRS
  // ---------------------------------------------------------------------
  const PQRS_DEMO = [
    {
      codigo: "PQRS-DEMO-0001",
      unidad: "Apto B201",
      email: "paula.cifuentes@example.com",
      tipo: TipoPQRS.FALLA,
      titulo: "Fuga en la tubería del parqueadero",
      descripcion:
        "Hay agua saliendo del techo del parqueadero, cerca del puesto 14. Lleva dos días y el charco va creciendo.",
      estado: EstadoPQRS.EN_PROCESO,
      diasAtras: 5,
    },
    {
      codigo: "PQRS-DEMO-0002",
      unidad: "Apto A202",
      email: "liliana.escobar@example.com",
      tipo: TipoPQRS.QUEJA,
      titulo: "Ruido después de las 11 p.m. los fines de semana",
      descripcion:
        "El apartamento de arriba pone música alta los sábados hasta pasada la medianoche. Ya se habló directamente sin resultado.",
      estado: EstadoPQRS.ABIERTO,
      diasAtras: 3,
    },
    {
      codigo: "PQRS-DEMO-0003",
      unidad: "Apto C101",
      email: "javier.salgado@example.com",
      tipo: TipoPQRS.PETICION,
      titulo: "Solicitud de copia del acta de la última asamblea",
      descripcion:
        "Agradezco enviar el acta de la asamblea ordinaria para revisar el presupuesto aprobado.",
      estado: EstadoPQRS.CERRADO,
      respuesta:
        "El acta quedó publicada en la cartelera y se envió copia al correo registrado. Queda a disposición en la oficina de administración.",
      diasAtras: 18,
    },
    {
      codigo: "PQRS-DEMO-0004",
      unidad: "Apto B301",
      email: "ricardo.beltran@example.com",
      tipo: TipoPQRS.SUGERENCIA,
      titulo: "Señalizar los parqueaderos de visitantes",
      descripcion:
        "Sugiero pintar la demarcación de los cupos de visitantes; no se distinguen y los ocupan residentes.",
      estado: EstadoPQRS.ABIERTO,
      diasAtras: 9,
    },
    {
      codigo: "PQRS-DEMO-0005",
      unidad: "Apto C301",
      email: "camilo.pardo@example.com",
      tipo: TipoPQRS.RECLAMO,
      titulo: "Cobro de expensa no reconocido",
      descripcion:
        "En la cuenta de este mes aparece un cargo que no reconozco. Solicito la discriminación del valor.",
      estado: EstadoPQRS.EN_PROCESO,
      diasAtras: 7,
    },
  ];

  for (const pqrs of PQRS_DEMO) {
    const unidad = unidadesPorIdentificador.get(pqrs.unidad);
    const usuario = residentesPorEmail.get(pqrs.email);
    if (!unidad || !usuario) continue;

    await prisma.pqrs.upsert({
      where: { codigoRadicado: pqrs.codigo },
      update: {},
      create: {
        codigoRadicado: pqrs.codigo,
        inmuebleId: unidad.id,
        radicadoPorId: usuario.id,
        asignadoAId: adminPrincipalId,
        tipo: pqrs.tipo,
        titulo: pqrs.titulo,
        descripcion: pqrs.descripcion,
        estado: pqrs.estado,
        respuestaAdmin: pqrs.respuesta ?? null,
        respondidoPorId: pqrs.respuesta ? adminPrincipalId : null,
        respondidoEn: pqrs.respuesta
          ? new Date(Date.now() - (pqrs.diasAtras - 2) * 86_400_000)
          : null,
        fechaCierre:
          pqrs.estado === EstadoPQRS.CERRADO
            ? new Date(Date.now() - (pqrs.diasAtras - 2) * 86_400_000)
            : null,
        createdAt: new Date(Date.now() - pqrs.diasAtras * 86_400_000),
      },
    });
  }

  // ---------------------------------------------------------------------
  // 9. Prestadores y órdenes de servicio
  // ---------------------------------------------------------------------
  const prestadoresPorNombre = new Map<string, { id: string }>();
  for (const prestador of PRESTADORES) {
    const guardado = await prisma.prestador.upsert({
      where: {
        copropiedadId_nombre: { copropiedadId: copropiedad.id, nombre: prestador.nombre },
      },
      update: {
        tipo: prestador.tipo,
        contacto: prestador.contacto,
        telefono: prestador.telefono,
        email: prestador.email,
        notas: prestador.notas,
        activo: true,
        deletedAt: null,
      },
      create: {
        copropiedadId: copropiedad.id,
        nombre: prestador.nombre,
        tipo: prestador.tipo,
        contacto: prestador.contacto,
        telefono: prestador.telefono,
        email: prestador.email,
        notas: prestador.notas,
      },
      select: { id: true },
    });
    prestadoresPorNombre.set(prestador.nombre, guardado);
  }

  const tieneOrdenes = await prisma.ordenServicio.findFirst({
    where: { copropiedadId: copropiedad.id },
    select: { id: true },
  });

  if (!tieneOrdenes) {
    const pqrsFuga = await prisma.pqrs.findUnique({
      where: { codigoRadicado: "PQRS-DEMO-0001" },
      select: { id: true },
    });
    const hidro = prestadoresPorNombre.get("Hidro Servicios Técnicos");
    const jardines = prestadoresPorNombre.get("Jardines Verdes");

    if (hidro) {
      await prisma.ordenServicio.create({
        data: {
          copropiedadId: copropiedad.id,
          prestadorId: hidro.id,
          creadoPorId: adminPrincipalId,
          pqrsId: pqrsFuga?.id ?? null,
          titulo: "Reparar fuga en tubería del parqueadero",
          descripcion:
            "Revisar el ramal sobre el puesto 14, ubicar la fuga y reparar. Requiere coordinar corte de agua con portería.",
          estado: EstadoOrdenServicio.EN_PROCESO,
          fechaProgramada: new Date(Date.now() + 2 * 86_400_000),
          costoEstimado: "850000",
          createdAt: new Date(Date.now() - 3 * 86_400_000),
        },
      });
    }

    if (jardines) {
      await prisma.ordenServicio.create({
        data: {
          copropiedadId: copropiedad.id,
          prestadorId: jardines.id,
          creadoPorId: adminPrincipalId,
          titulo: "Poda de setos del acceso principal",
          descripcion: "Poda y retiro de material vegetal antes de la asamblea.",
          estado: EstadoOrdenServicio.CERRADA,
          fechaProgramada: new Date(Date.now() - 12 * 86_400_000),
          costoEstimado: "320000",
          createdAt: new Date(Date.now() - 20 * 86_400_000),
        },
      });
    }
  }

  console.log("✅ Demo sembrada:");
  console.log(`   Copropiedad: ${copropiedad.nombre} (${UNIDADES.length} unidades, 3 torres)`);
  console.log(`   Cuentas de cobro creadas: ${cuentasCreadas} (${periodos[0]} → ${periodos.at(-1)})`);
  if (unidadesOmitidas > 0) {
    console.log(`   Unidades con cartera previa (no re-sembradas): ${unidadesOmitidas}`);
  }
  console.log(`   Administradores: ${EMAILS_ADMIN_DEMO.join(", ")}`);
  console.log("   Contraseña demo (Prisma y Supabase Auth): Rentu2026*");
  console.log("   Siguiente paso sugerido: pnpm provision:auth (crea los logins en Supabase Auth).");
}

main()
  .catch((error) => {
    console.error("❌ Error ejecutando el seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
