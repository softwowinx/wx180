# CLAUDE.md — WX180 · Portal operativo de vídeo inmersivo 180º

> Documento de contexto para Claude Code. Léelo al inicio de cada sesión.
> Resume qué es el proyecto, en qué estado está y qué decisiones ya están tomadas
> para no rehacerlas ni romperlas.

## Qué es esto

WX180 Immersive Productions es una productora de vídeo inmersivo 180º (cámara ya
comprada, equipo de producción montado). Esta herramienta es su **portal operativo
interno**: un único archivo `index.html` autónomo (sin build, sin dependencias) que
define qué se produce, guía la venta y ordena la producción.

No es un CRM general. El CRM del grupo es **wowinX** (gestiona contactos, cartera y
tareas). WX180 es el manual operativo específico del negocio inmersivo y se conecta
a wowinX por exportación de contactos (ver más abajo).

## Estado actual

- Archivo único `index.html`, estático, pensado para GitHub Pages (repo propio,
  público, archivo en la raíz como `index.html`).
- **Cartera multi-oportunidad**: ya no es una sola ficha. Hay un selector de cartera
  en la barra superior (`#oppSelect`) para cambiar de oportunidad, "Nueva oportunidad"
  crea sin borrar las demás, y "Borrar" elimina la abierta.
- **Persistencia en dos modos** (decididos en runtime, ver capa de datos abajo):
  - **Supabase** (cartera compartida con login) cuando hay `SUPABASE_URL` +
    `SUPABASE_ANON_KEY` y sesión activa. Fuente de verdad.
  - **Local** (este navegador, sin login) si falta configuración Supabase. Clave
    `wx180_cartera_v2` = `{items:[{id,cliente,...,data}], currentId}`. Migra
    automáticamente la ficha única antigua (`wx180_crm_brief_online_v1`).

## Supabase (IMPLEMENTADO — pendiente de configurar)

La integración ya está en el código. Para activarla en producción quedan **2 pasos
manuales** (no se pueden hacer desde el repo):

1. **Usuarios**: crear las cuentas del equipo en Authentication → Users → "Add user"
   (con "Auto Confirm User"). El registro abierto está desactivado (correcto).
2. **(Recomendado) Políticas**: ejecutar `supabase_schema.sql` una vez en el SQL
   Editor. Es idempotente y no borra datos; garantiza las políticas RLS de cartera
   compartida para usuarios autenticados y el trigger de `updated_at`.

La clave `anon` y la `SUPABASE_URL` ya están puestas en `index.html`. La tabla
`opportunities` existe con esquema **solo-JSONB** (`id, created_at, updated_at,
created_by, data`): todo el detalle del brief vive en `data` y el cliente deriva
nombre/etapa para el listado desde ahí. RLS verificado: el anónimo no lee ni escribe.

Restricción técnica: GitHub Pages sirve solo estáticos, así que la conexión va
**desde el navegador** (supabase-js por CDN + clave pública anon) con RLS. La anon key
es pública por diseño; la seguridad la dan las políticas.

Login: pantalla `#loginOverlay` (email + contraseña) que bloquea la app cuando hay
Supabase configurado y no hay sesión.

## Arquitectura del archivo

Una sola página con 3 capas conmutables por pestañas (`#layerTabs`):

1. **Catálogo** (`view-catalogo`) — define el producto. Selección de formato y nivel.
2. **Venta** (`view-venta`) — embudo comercial por etapas + presupuesto modular +
   semáforo + resumen para CRM. Es la vista por defecto.
3. **Producción** (`view-produccion`) — tablero de 7 etapas con 3 "puertas".

Todo el JS está inline al final del archivo. Funciones clave:
- `stages[]` — etapas del embudo de venta (datos).
- `generalFields[]` — campos comunes de la oportunidad.
- `computeBudget()` / `renderBudget()` — cálculo del presupuesto modular en vivo.
- `renderCatalog()` — capa 1; `renderProduction()` — capa 3.
- `switchLayer()` — conmuta vistas y persiste la capa activa.
- `renderGuide()` / `openHelp()` — guía de uso (botón "?").
- `toWowinxContacts()` — exporta el contacto al formato de wowinX.
- `saveState()` — actualiza UI y dispara `schedulePersist()` (guardado con rebote).

### Capa de datos (cartera + Supabase)
- `boot()` — arranque: configura cliente Supabase, comprueba sesión, decide
  online/local y llama a `startApp()` (o muestra login).
- `fetchCartera()` / `openOpportunity(id)` / `createOpportunity()` /
  `deleteOpportunity(id)` — API unificada (misma firma en local y online).
- `serializeCurrent()` — empaqueta `state` + metadatos para guardar una fila.
- `schedulePersist()` / `persistNow()` / `flushPersist()` — guardado con rebote
  (~700 ms); `flushPersist()` fuerza el guardado antes de cambiar de oportunidad.
- `doLogin()` / `doLogout()` / `updateUserUI()` — autenticación.
- `refreshCarteraUI()` / `setSyncState()` — selector de cartera e indicador de
  guardado.
- `currentId` = oportunidad abierta; `cartera` = metadatos del selector;
  `online`/`session`/`sb` = estado de Supabase.

## Reglas de diseño (NO romper)

- Paleta: **rojo principal** (`--accent:#ff2e43`), **azul de apoyo**
  (`--blue:#3d7bff`), base oscura. (Guiño al 3D anaglífico.)
- Fuentes: Bricolage Grotesque (display) + Hanken Grotesk (texto) + Spline Sans
  Mono (datos).
- Logo WX-180 incrustado como data URI (blanco sobre transparente). No depende de
  archivo externo.
- El semáforo de venta mantiene verde/ámbar/rojo con su significado (Listo/Revisar/
  Bloqueado); no confundir ese rojo con el rojo de marca.

## Integración con wowinX (contactos)

El botón "Contacto → wowinX" genera un CSV con BOM UTF-8 y **estas 12 columnas
exactas** (validadas contra la plantilla real del importador). NO cambiar nombres ni
orden sin reconfirmar con la plantilla:

`Nombre, Tipo de contacto, Empresa cliente, Cargo, Email, Teléfono, Notas, Empresas,
Propietario, Próxima acción, Fecha próxima acción, Marca de carga`

Mapeo desde el estado interno:
- Nombre ← `contacto`
- Tipo de contacto ← `tipo_cliente`
- Empresa cliente ← `cliente`
- Cargo ← `cargo`
- Email ← `email`
- Teléfono ← `telefono`
- Notas ← `notas_generales` + (si hay) "Objetivo: " + `objetivo_principal`
- Empresas ← "" (vacío a propósito; se asigna dentro de wowinX al grupo
  befootball/doublew/etc.)
- Propietario ← `owner`
- Próxima acción ← `proximo_paso`
- Fecha próxima acción ← `proximo_paso_fecha`
- Marca de carga ← `wx180-<cliente-slug>` (etiqueta de origen automática)

Nota: el pipeline de oportunidades NO se vuelca a wowinX por ahora (es un pipeline
distinto). Solo contactos. Volcado del pipeline = trabajo futuro.

## Decisiones de producto (lógica de negocio — ver NOTAS_PRODUCTO.md)

- Producto único: **módulo inmersivo 180º de hasta 3 min**, en dos formatos de venta
  (suelto / programa ensamblado con guion paraguas, modelo Apple–Real Madrid).
- Dos niveles: **Estándar** (repetible) y **Premium** (grado tipo Apple Immersive
  Video: 180º 8K, 3D, audio espacial, QA en Vision Pro) cotizado aparte.
- Cuatro **mínimos no negociables**: reunión de diseño antes de presupuestar; plan de
  rodaje por escrito; backup en set; QA en visor real antes de entregar.
- Prioridad cero del negocio: producir un **módulo demo propio** para enseñar en visor.

## Convenciones de trabajo

- Mantener el archivo como **HTML único autónomo** mientras siga en GitHub Pages.
  (Al introducir Supabase se podrá separar un JS, pero confirmar antes.)
- Validar siempre el JS antes de dar por buena una edición (sintaxis + arranque).
- No introducir `localStorage`/`sessionStorage` en contextos donde ya se migró a
  Supabase: usar la base de datos como fuente de verdad.
