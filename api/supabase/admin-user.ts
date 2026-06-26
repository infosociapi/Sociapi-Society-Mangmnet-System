import { createClient } from "@supabase/supabase-js";

interface RequestLike {
  method?: string;
  body?: any;
}

interface ResponseLike {
  status: (code: number) => ResponseLike;
  json: (data: unknown) => void;
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return res.status(500).json({ error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required on Vercel" });
  }

  const supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { action, email, password, userId, metadata } = req.body || {};

  async function resolveUserId() {
    if (userId) return userId;
    if (!email) return null;
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    return data.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase())?.id || null;
  }

  try {
    if (action === "create") {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata || {},
      });
      if (error) throw error;
      return res.status(200).json({ ok: true, user: data.user });
    }

    if (action === "reset-password") {
      const id = await resolveUserId();
      if (!id) return res.status(404).json({ error: "Supabase Auth user not found" });
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
      if (error) throw error;
      return res.status(200).json({ ok: true, user: data.user });
    }

    if (action === "delete") {
      const id = await resolveUserId();
      if (!id) return res.status(404).json({ error: "Supabase Auth user not found" });
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Supabase admin action failed" });
  }
}