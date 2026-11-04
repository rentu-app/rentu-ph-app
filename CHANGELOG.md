# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
[versionado semántico](https://semver.org/lang/es/). La versión visible en la
app ("Rentu vX.Y.Z · commit") sale de `package.json`.

## [0.3.1] — 2026-11-03

### Cambiado
- El indicador de versión del pie se rediseñó: píldora discreta con la versión y el commit.
- Se documentó el flujo de versiones: etiqueta de git y entrada en este archivo en cada versión.

## [0.3.0] — 2026-11-03

Feedback de la validación con el cliente.

### Añadido
- **Cartera → "Tabla por meses":** vista tipo Excel (apartamentos en filas, Ene–Dic en columnas) con color por estado, navegación por año, recaudo por mes y deuda por unidad.
- **Cuota de administración propia por apartamento** (formulario y tabla de Unidades).
- **Generar cuentas** por la cuota de cada apartamento o repartiendo un total por coeficiente.
- **Cuenta de cobro de un solo apartamento**, desde su detalle.
- **Editar los valores de una cuenta ya generada** (no permite bajar del total pagado; queda en la bitácora).
- **Detalle por unidad** con total facturado, total pagado y saldo en deuda.
- **Rubros de cobro** editables (parqueadero, fondo de imprevistos…), sumados a las expensas al generar el periodo.
- **Zonas comunes:** periodicidad del costo (por uso, hora, día, semanal, mensual) y edición posterior.
- Indicador de versión en el pie de la app.
- Base de datos: columnas `inmuebles.cuotaAdministracion` y `zonas_comunes.periodicidadCosto`, tabla `rubros_cobro`.

### Cambiado
- Todo el dinero se escribe y se muestra con formato moneda (`$ 1.500.000`).
- Porcentaje y área usan coma decimal en toda la app (se aceptan coma o punto al escribir).
- Cartera ordenable por cualquier columna (el orden queda en la URL).
- "Primeros pasos" ya no repite botones del encabezado.

### Corregido
- Generar por cuota propia fallaba porque el total no se enviaba en ese modo.
- El modal de "Generar cuentas" del checklist no recibía cuotas ni rubros.
- Tras la primera cuenta desaparecía el botón "Generar cuentas" del encabezado.
- Eliminar cuenta: la confirmación ya no distingue mayúsculas en la pantalla.

## [0.2.0] — 2026-11-01

Onboarding del administrador nuevo.

### Añadido
- Selector de copropiedad estilo marketplace, con copropiedad activa validada en servidor.
- Alta manual de unidades y por CSV (coeficientes en porcentaje o fracción, suma validada a 100 %).
- Checklist "Primeros pasos", tour guiado y botón de ayuda flotante.
- Pestaña **Cuenta** con eliminación de cuenta (borrado lógico, aviso si Auth tarda en liberar el correo).

### Cambiado
- Correos normalizados (`trim` + minúsculas) en registro, login, residentes y prestadores.
- El registro recrea el usuario huérfano de Auth si no hay usuario activo.

## [0.1.0]

Versión base: cartera, PQRS, reservas, residentes, prestadores, documentos y Copiloto con IA.
