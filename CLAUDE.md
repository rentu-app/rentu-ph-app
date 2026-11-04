@AGENTS.md

# Versión de Rentu (obligatorio, sin que nadie lo pida)

La versión visible en pantalla ("Rentu vX.Y.Z · commit", abajo al centro) sale de
`"version"` en `package.json`; el commit lo pone Vercel. **Cada vez que cualquier
integrante del equipo termine una versión nueva (un lote de cambios que se va a
commitear y subir), actualiza la versión tú mismo, sin esperar a que te lo pidan:**

1. Súbela en `package.json` dentro del mismo commit (o en uno propio justo antes del push):
   - **minor** (0.3.0 → 0.4.0): funcionalidad nueva, un lote de feedback del cliente, cambios de schema.
   - **patch** (0.3.0 → 0.3.1): solo correcciones, textos o ajustes visuales sin funcionalidad nueva.
   - **major**: solo si el equipo lo decide explícitamente.
2. Si dos ramas suben la versión a la vez, al fusionar queda la mayor; revisa que no se repita ni retroceda.
3. Menciónala en el mensaje del commit (p. ej. "v0.4.0: …") y en tu respuesta final.
4. No cambies la versión en commits que no son una versión nueva (solo notas, refactors internos o pruebas).
5. Verifica con `pnpm build` que el pie muestra la versión nueva antes de dar el trabajo por terminado.

No hagas merge a `main` por tu cuenta: la versión se sube en la rama de trabajo y se fusiona solo cuando el equipo lo pida.
