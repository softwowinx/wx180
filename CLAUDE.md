# CLAUDE.md — WX180 · Ventas y costes

> Documento de contexto para Claude Code. Léelo al inicio de cada sesión.

## Qué es esto

Portal interno de WX180 Immersive Productions: un único `index.html`
autónomo (sin build, GitHub Pages) que gestiona **venta + presupuesto por
partidas** de cada oportunidad. El CRM del grupo es **wowinX**; este portal
exporta contactos a wowinX por CSV.

Versión simplificada (jun 2026): se eliminaron las capas Catálogo y
Producción y el embudo de 11 etapas. Quedan **dos pestañas**: Venta y
Presupuesto.

## Arquitectura del archivo

- **Venta** (`view-venta`) — métricas (etapa, paquete, coste, PVP, margen),
  pipeline de chips (`STAGES`), datos del cliente (`datosFields`),
  seguimiento (`seguimientoFields`) y resumen copiable (`renderSummary`).
- **Presupuesto** (`view-presupuesto`) — `PARTIDAS[]` (26 partidas con coste
  estándar/premium), `PAQUETES{}` (Cápsula/Essential/Signature/Flagship/
  A medida, cada uno con cantidades tipo, tarifa, markup y PVP de
  referencia), `computeBudget()` y `applyPaquete()`.
- Estado en `state`: `etapa_actual`, `paquete`, `tarifa`
  ('estandar'|'premium'), `qty_<id>` por partida, `markup_pct`,
  `pvp_propuesto`, campos de venta. El `pvp_propuesto` es el `importe`
  que se muestra en la cartera.

## Capa de datos (sin cambios respecto a la versión anterior)

- Supabase si hay `SUPABASE_URL` + `SUPABASE_ANON_KEY` + sesión; si no,
  modo local (`wx180_cartera_v2` en localStorage, migra la ficha antigua).
- Tabla `opportunities` solo-JSONB (`id, created_at, updated_at,
  created_by, data`) con RLS. `supabase_schema.sql` idempotente.
- Funciones: `boot`, `startApp`, `fetchCartera`, `openOpportunity`,
  `createOpportunity`, `deleteOpportunity`, `schedulePersist`/`persistNow`/
  `flushPersist` (rebote ~700 ms), `doLogin`/`doLogout`.
- Compatibilidad: las oportunidades del modelo anterior abren sin error
  (los campos antiguos persisten en `data`; la UI nueva simplemente no los
  pinta y `importe` ahora se deriva de `pvp_propuesto`).

## Autenticación y gestión de usuarios

- Login con contraseña + **enlace mágico** por email (`signInWithOtp`,
  `shouldCreateUser:false`) + **recuperación** (`resetPasswordForEmail`).
- Los enlaces de email redirigen a `SITE_URL` (origin+pathname). El tipo de
  enlace se lee del hash ANTES de que supabase-js lo limpie
  (`AUTH_LINK_TYPE`); recovery/invite abren el modal de fijar contraseña.
- `onAuthStateChange` gestiona PASSWORD_RECOVERY y SIGNED_IN (guard
  `appStarted` para no arrancar dos veces).
- **Cambiar contraseña** dentro del portal: `auth.updateUser({password})`
  (modal `#pwdModal`).
- **Gestor de usuarios** (modal `#adminModal`): visible solo si el email de
  la sesión está en `ADMIN_EMAILS` (const en index.html, solo controla la
  UI). Las acciones reales van a la Edge Function
  `supabase/functions/admin-users/index.ts`, que verifica el JWT del
  llamante contra el secreto `ADMIN_EMAILS` y usa la service_role SOLO en
  el servidor. Acciones: list / create / invite / recover / delete (no
  permite auto-borrado del admin).
- Config necesaria en Supabase: Authentication → URL Configuration →
  Site URL + Redirect URLs con la URL de GitHub Pages; función desplegada
  (`supabase functions deploy admin-users`) y secreto
  (`supabase secrets set ADMIN_EMAILS="..."`).
- NUNCA poner la service_role key en index.html.

## Reglas de diseño (NO romper)

- Paleta: rojo principal `--accent:#ff2e43`, azul de apoyo `--blue:#3d7bff`,
  base oscura (guiño 3D anaglífico).
- Fuentes: Bricolage Grotesque (display) + Hanken Grotesk (texto) + Spline
  Sans Mono (datos).
- Logo WX-180 como data URI; no depende de archivo externo.
- En la tabla de partidas: los importes son **coste, no PVP**. No mezclar.

## Integración wowinX (contactos)

El botón "Contacto → wowinX" genera CSV con BOM UTF-8 y estas 12 columnas
exactas (validadas contra la plantilla del importador; NO cambiar nombres ni
orden): `Nombre, Tipo de contacto, Empresa cliente, Cargo, Email, Teléfono,
Notas, Empresas, Propietario, Próxima acción, Fecha próxima acción, Marca de
carga`. `Empresas` va vacío a propósito; `Marca de carga` =
`wx180-<cliente-slug>`. El pipeline NO se vuelca a wowinX (solo contactos).

## Lógica de negocio

Ver `NOTAS_PRODUCTO.md`: 4 paquetes + a medida, 2 tarifas de coste,
markup→PVP, desplazamientos aparte (+10%), regla de oro (sin contrato y
anticipo no hay producción), mínimos de producción.

## Convenciones

- Mantener HTML único autónomo.
- Validar el JS (`node --check`) antes de dar por buena una edición.
- Los costes/PVP tipo de los paquetes deben cuadrar con el Excel
  `WX180_Calculadora_Costes.xlsx` (hoja "Escenarios precio"): Cápsula 2.850,
  Essential 5.550, Signature 20.000, Flagship 36.550.
