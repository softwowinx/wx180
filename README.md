# WX180 · Portal operativo de vídeo inmersivo 180º

Herramienta interna de **WX180 Immersive Productions**, una productora de vídeo
inmersivo 180º. Es un **único archivo `index.html` autónomo** (sin build ni
dependencias) que define qué se produce, guía la venta y ordena la producción.

No es un CRM general: el CRM del grupo es **wowinX**. WX180 es el manual
operativo específico del negocio inmersivo y se conecta a wowinX exportando
contactos en CSV.

## Las tres capas

1. **Catálogo** — define el producto (formato y nivel).
2. **Venta** — embudo comercial por etapas + presupuesto modular + semáforo +
   resumen para CRM. Es la vista por defecto.
3. **Producción** — tablero de 7 etapas con 3 puertas de calidad.

## Cómo se usa

Abrir `index.html` en el navegador (o la URL de GitHub Pages). Hay una **cartera
multi-oportunidad**: el selector de la barra superior cambia de oportunidad,
"Nueva oportunidad" crea una más y "Borrar" elimina la abierta.

Funciona en dos modos según la configuración:

- **Cartera compartida (Supabase)**: con login del equipo; todos ven y editan la
  misma cartera. Es el modo de producción.
- **Local** (si no hay Supabase configurado): la cartera se guarda solo en este
  navegador, sin login. Útil para probar.

## Estado

Integración con **Supabase** ya implementada en el código (login del equipo +
cartera compartida vía `supabase-js` desde el navegador con políticas RLS). Para
activarla quedan dos pasos manuales: ejecutar [`supabase_schema.sql`](supabase_schema.sql)
en el proyecto y pegar la clave `anon` en `SUPABASE_ANON_KEY` de `index.html`
(ver [`CLAUDE.md`](CLAUDE.md)). Sin esa configuración, el portal usa el modo local.

## Documentación

- [`CLAUDE.md`](CLAUDE.md) — contexto técnico, arquitectura y reglas de diseño.
- [`NOTAS_PRODUCTO.md`](NOTAS_PRODUCTO.md) — lógica de negocio (producto, formatos,
  mínimos no negociables, presupuesto).
