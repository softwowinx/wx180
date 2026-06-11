# WX180 · Ventas y costes

Herramienta interna de **WX180 Immersive Productions**. Un único `index.html`
autónomo (sin build) que gestiona **la venta y el presupuesto por partidas**
de cada oportunidad.

No es un CRM general: el CRM del grupo es **wowinX**. WX180 exporta el
contacto a wowinX en CSV.

## Las dos pestañas

1. **Venta** — datos mínimos del cliente, etapa de venta en un clic
   (Lead → Diagnóstico → Propuesta → Negociación → Ganado/Perdido),
   seguimiento y resumen copiable. Regla de oro: no pasa a producción sin
   contrato firmado y anticipo cobrado.
2. **Presupuesto** — costes por partidas (pre / producción / post / extras)
   con dos tarifas de coste (Estándar / Premium) y **cuatro paquetes** como
   presets: Cápsula 180º, Essential, Signature y Flagship Territorio, más
   «A medida». Cada paquete precarga cantidades, tarifa y markup; el PVP
   propuesto es el importe oficial de la oportunidad.

## Cómo se usa

Abrir `index.html` (o la URL de GitHub Pages). Cartera multi-oportunidad con
selector en la barra superior. Dos modos:

- **Cartera compartida (Supabase)** con login del equipo (modo producción).
- **Local** si no hay Supabase configurado (datos solo en este navegador).

## Estado

Integración Supabase implementada (igual que la versión anterior: tabla
`opportunities` solo-JSONB + RLS). Misma configuración y mismo esquema:
ver `supabase_schema.sql` y `CLAUDE.md`. Las oportunidades antiguas se abren
sin error: los campos del modelo anterior se conservan en `data` aunque la
interfaz ya no los muestre.

## Acceso y usuarios

Login con contraseña, **enlace de acceso por email (sin contraseña)** y
**recuperación de contraseña** desde la propia pantalla de login. Dentro del
portal: cambio de contraseña, y para el super admin un **gestor de usuarios**
(alta con contraseña inicial, invitación por email, recuperación y baja),
respaldado por la Edge Function `admin-users` (la clave privilegiada vive
solo en el servidor).

## Documentación

- `CLAUDE.md` — contexto técnico y reglas de diseño.
- `NOTAS_PRODUCTO.md` — lógica de negocio (paquetes, tarifas, márgenes).
