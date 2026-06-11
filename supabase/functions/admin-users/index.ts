// Edge Function: admin-users
// Gestión de usuarios del portal WX180. Solo los emails del secreto
// ADMIN_EMAILS pueden usarla. La clave service_role NUNCA sale del servidor.
//
// Despliegue (una vez):
//   supabase functions deploy admin-users
//   supabase secrets set ADMIN_EMAILS="tu@email.com"
//
// Acciones: list | create {email,password} | invite {email,redirectTo}
//           | recover {email,redirectTo} | delete {user_id,email}

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admins = (Deno.env.get("ADMIN_EMAILS") || "")
      .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!admins.length) return json({ error: "ADMIN_EMAILS no configurado en los secretos de la función" }, 500);

    // 1) Identificar a quien llama con su propio JWT
    const authHeader = req.headers.get("Authorization") || "";
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uerr } = await caller.auth.getUser();
    if (uerr || !user) return json({ error: "No autenticado" }, 401);

    // 2) Solo el super admin pasa de aquí
    const callerEmail = String(user.email || "").toLowerCase();
    if (!admins.includes(callerEmail)) return json({ error: "Solo el super admin puede gestionar usuarios" }, 403);

    const admin = createClient(url, serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (error) return json({ error: error.message }, 400);
      const users = data.users
        .map((u) => ({ id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at }))
        .sort((a, b) => String(a.email).localeCompare(String(b.email)));
      return json({ users });
    }

    if (action === "create") {
      if (!body.email || !body.password || String(body.password).length < 8) {
        return json({ error: "Hacen falta email y contraseña de mínimo 8 caracteres" }, 400);
      }
      const { data, error } = await admin.auth.admin.createUser({
        email: body.email, password: body.password, email_confirm: true,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, id: data.user?.id });
    }

    if (action === "invite") {
      if (!body.email) return json({ error: "Falta el email" }, 400);
      const { error } = await admin.auth.admin.inviteUserByEmail(body.email, { redirectTo: body.redirectTo });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "recover") {
      if (!body.email) return json({ error: "Falta el email" }, 400);
      const pub = createClient(url, anonKey);
      const { error } = await pub.auth.resetPasswordForEmail(body.email, { redirectTo: body.redirectTo });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "delete") {
      if (!body.user_id) return json({ error: "Falta user_id" }, 400);
      if (String(body.email || "").toLowerCase() === callerEmail) {
        return json({ error: "No puedes borrar tu propia cuenta de super admin" }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(body.user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Acción desconocida" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
