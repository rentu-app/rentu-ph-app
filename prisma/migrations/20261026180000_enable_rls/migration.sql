-- Activa RLS en todas las tablas de public sin políticas para anon/authenticated.
-- La app accede solo vía Prisma (rol postgres, BYPASSRLS), no por PostgREST.
ALTER TABLE public."usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."copropiedades" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."administradores_copropiedad" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."inmuebles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."usuario_inmueble" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."vehiculos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."mascotas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cuentas_de_cobro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pagos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."recargos_mora" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."comprobantes_pago" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."mantenimientos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."comunicados" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."comunicado_lecturas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pqrs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."documentos_ph" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."documento_ph_chunks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."zonas_comunes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."reservas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."gestiones_cobro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."notificaciones_cobro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."prestadores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ordenes_servicio" ENABLE ROW LEVEL SECURITY;
