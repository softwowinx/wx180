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

Abrir `index.html` en el navegador (o la URL de GitHub Pages). Los datos se
guardan en `localStorage` del propio navegador, así que **cada persona ve solo
sus datos**; todavía no hay cartera compartida.

## Estado

Fase de **validación en GitHub Pages** con el equipo. El siguiente paso pactado
es añadir **Supabase** (login del equipo + cartera compartida) sustituyendo el
`localStorage`, con conexión desde el navegador y políticas RLS.

## Documentación

- [`CLAUDE.md`](CLAUDE.md) — contexto técnico, arquitectura y reglas de diseño.
- [`NOTAS_PRODUCTO.md`](NOTAS_PRODUCTO.md) — lógica de negocio (producto, formatos,
  mínimos no negociables, presupuesto).
