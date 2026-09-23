# Rentu PH

**Tablero operativo de una copropiedad.** El administrador entiende la cartera
por torre y apartamento, gestiona el cobro y aplica reglas claras a las
reservas de zonas comunes.

Rentu **ya no es un marketplace de arriendos**. La ruta `/propiedades`, los
componentes de catálogo y el lenguaje de canon/publicación se retiraron del
producto. Los campos de arriendo siguen en `prisma/schema.prisma` marcados como
deprecados para no hacer una migración destructiva, pero ninguna pantalla,
Server Action ni el seed los leen o escriben.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 6 +
PostgreSQL (`pgvector`) · Supabase Auth · Gemini + embeddings locales para el
Copiloto RAG · pnpm.

## Puesta en marcha

```bash
pnpm install
cp .env.example .env        # y completar credenciales
pnpm db:push                # aplica el schema (no hay migraciones versionadas)
pnpm db:seed                # siembra la demo (datos ficticios)
pnpm provision:auth         # crea los logins de la demo en Supabase Auth
pnpm dev
```

Para volver a sembrar la cartera desde cero (borra cuentas, pagos, gestiones,
avisos, reservas, PQRS y órdenes de la copropiedad demo; conserva unidades y
residentes):

```bash
SEED_RESET=1 pnpm db:seed
```

## Datos de la demo

Una sola copropiedad ficticia: **Conjunto Residencial Altos de Salitre**, 3
torres, 24 apartamentos, 6 periodos de cuentas de cobro con comportamiento de
pago variado, 14 residentes, 4 zonas comunes, 5 PQRS, 5 prestadores y órdenes de
servicio.

Contraseña de todas las cuentas demo: `Rentu2026*`

| Rol | Correo | Para ver |
| --- | --- | --- |
| Administrador | `admin.demo@example.com` | Todo el tablero |
| Residente con cuotas vencidas | `sandra.orozco@example.com` | Reserva bloqueada y explicada |
| Residente a paz y salvo | `marcela.aguirre@example.com` | Reserva habilitada |

Ningún dato del seed proviene de una copropiedad real: nombres, NIT,
direcciones, apartamentos y montos son inventados.

## Recorrido de la demo (menos de dos minutos)

1. `/dashboard` — cartera total, vencida, facturado y recaudo del mes, cartera
   por antigüedad y distribución por torre. La Torre C concentra ~64% de la
   cartera.
2. `/dashboard/cartera` — filtra por torre o situación y abre `Apto C201`:
   estado de cuenta cuota por cuota, residentes, bitácora de gestión y avisos.
3. Entra como `sandra.orozco@example.com` a `/portal/reservas`: el bloqueo por
   cartera vencida aparece explicado, con el camino de salida.
4. Como administrador, registra el pago del saldo de esa unidad en su detalle.
   Al recargar el portal, el residente ya puede radicar la reserva (si el
   horario está libre).
5. `/dashboard/pqrs` — responde una PQRS y, si es de mantenimiento, escálala a
   una orden de servicio para un prestador.

## Qué está simulado y qué no

El producto marca en la interfaz lo que no está integrado. No se afirma que algo
funcione si no funciona.

| Funcionalidad | Estado |
| --- | --- |
| Cartera, pagos, abonos, saldos, antigüedad | Real, calculado sobre la base |
| Bitácora de gestión y etapas de cobro | Real |
| Bloqueo de reservas por cartera vencida | Real, validado en el servidor al radicar y al confirmar |
| PQRS y órdenes de servicio | Real |
| Importación de unidades desde CSV | Real: valida fila por fila, muestra vista previa y solo escribe al confirmar |
| Copiloto sobre documentos | Real (embeddings locales + Gemini), requiere `GEMINI_API_KEY` |
| **Envío de avisos de cobro** | **Simulado.** Se redacta y se archiva en el historial; no sale por correo ni WhatsApp. La UI lo declara. |
| **Contraseña temporal de un residente invitado** | **Simulada.** No hay proveedor de correo: se muestra una vez y la comparte el administrador. |
| Recargos de mora | No hay job automático. En la demo los siembra el seed; en la app se crean a mano. |

Fuera de alcance, por decisión: contabilidad NIIF/DIAN, facturación
electrónica, pagos bancarios, conciliación, nómina, firma de contratos y gestión
judicial. Las etapas **prejurídico** y **jurídico** son clasificaciones de
seguimiento que mueve el administrador; no inician ningún proceso ni son
asesoría legal. Una PQRS **nunca** se convierte automáticamente en orden de
servicio ni en multa.

## Verificación

```bash
pnpm lint
pnpm build
pnpm verify:demo        # agregados de cartera y reglas de negocio, contra la base
pnpm start              # en otra terminal
BASE=http://localhost:3000 pnpm verify:rutas   # cada página protegida con sesión real
```

`verify:rutas` deja 1 ruta "en rojo" a propósito: un residente que entra a
`/dashboard` debe ser redirigido a `/portal`.

## Notas de arquitectura

- **Una sola copropiedad.** `getCopropiedadActiva` resuelve sobre qué
  copropiedad se opera a partir de la sesión. Ninguna Server Action acepta un
  `copropiedadId` que venga del formulario.
- **Cuotas independientes.** Cada cuenta de cobro es solo la cuota de su mes;
  no se arrastra el saldo anterior. Arrastrarlo duplicaba la deuda en los
  agregados (la cuenta vieja seguía pendiente y la nueva la incluía otra vez).
  La cartera de una unidad es la suma de sus cuotas no pagadas.
- **Cartera en una consulta.** Toda la vista de cartera se arma desde un único
  `findMany` y se agrega en memoria: una PH pequeña o mediana son decenas de
  unidades, y evitar 4–5 round-trips por pantalla importa más en serverless.
- **Seis secciones, una ruta.** `/dashboard/[section]` agrupa cartera,
  reservas, PQRS, residentes, prestadores y documentos para no pasarse del
  límite de 12 funciones serverless del plan Hobby de Vercel.
- **Rendimiento del cliente.** Se eliminó `framer-motion` (el JS del cliente
  bajó de 407 KB a 373 KB gzip), junto con los `backdrop-blur` en headers
  `sticky`, los `blur-3xl` decorativos, los `transition-all` con `hover:scale` y
  las animaciones `animate-pulse` infinitas. Las animaciones que quedan son CSS
  sobre `opacity`/`transform` y respetan `prefers-reduced-motion`.
- **Latencia del servidor: de 2–3 s a ~0,5 s por navegación.** Las páginas son
  dinámicas (leen sesión y base de datos), y desde Colombia contra una base en
  `us-east-1` cada ida y vuelta a Postgres cuesta 85–180 ms. Tres causas y sus
  arreglos, todos medidos:
  1. **Pooler en modo transacción.** Con `pgbouncer=true` (puerto 6543) Prisma
     desactiva los prepared statements y envuelve cada consulta en
     `BEGIN / DEALLOCATE ALL / SELECT / COMMIT`: 4 viajes donde debería haber 1.
     `DATABASE_URL` pasó al puerto 5432 (modo sesión): una consulta simple pasó
     de 447 ms a 119 ms.
  2. **Una consulta por relación anidada.** La lectura de cartera (24 unidades →
     cuentas → recargos y pagos, más residentes) emitía 6 consultas. Con
     `relationLoadStrategy: "join"` (preview `relationJoins`) es una sola con
     LATERAL JOINs: **549 ms → 104 ms**, mediana de 5 corridas alternadas. Se
     aplicó a todas las lecturas con relaciones.
  3. **Consultas evitables.** `getCopropiedadActiva` hacía tres consultas
     (buscar + contar + agrupar por torre); ahora es una y los totales se
     calculan en memoria. El middleware ya no llama a `getUser()` (~170 ms de
     red) en rutas públicas.
- **Límites de carga (`loading.tsx`).** Sin ellos, al hacer clic en una sección
  el navegador se quedaba en la pantalla anterior hasta que el servidor
  terminaba: parecía que el clic no había hecho nada. Efecto secundario
  aceptado: una URL de sección inexistente responde 200 en vez de 404, porque
  las cabeceras ya salieron cuando la página llama a `notFound()` — la persona
  igual ve la página de "no encontrado".
- **Tema claro determinista.** El variant `dark:` se ató a la clase `.dark`
  (`@custom-variant` en `globals.css`) en vez de a `prefers-color-scheme`:
  el dashboard tenía variantes oscuras y el portal no, así que un visitante con
  el sistema en oscuro veía media app ilegible.
