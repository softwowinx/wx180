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
- Datos en `localStorage` del navegador (clave `wx180_crm_brief_online_v1`).
  Implicación: cada persona ve solo sus datos. No hay cartera compartida todavía.
- Fase actual: **validación en GitHub Pages** con el equipo (cada uno por su lado)
  antes de montar persistencia compartida.

## Siguiente paso pactado: Supabase

Cuando termine la validación, añadir **Supabase** para:
- login del equipo,
- cartera de oportunidades compartida (sustituir localStorage por base de datos),
- dejar de exportar CSV a mano.

Restricción técnica: GitHub Pages sirve solo estáticos, así que la conexión a
Supabase va **desde el navegador** (supabase-js + clave pública anon) con políticas
RLS bien definidas. La misma URL de Pages sigue sirviendo; solo se añade la capa de
datos. NO empezar Supabase hasta que la validación confirme qué campos sobran/faltan.

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
- `saveState()` / `loadState()` — persistencia en localStorage.

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
