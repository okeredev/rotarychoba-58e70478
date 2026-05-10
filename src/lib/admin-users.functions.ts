import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Verify caller is admin (uses RLS-respecting client from middleware).
async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) {
    throw new Response("Forbidden: admin only", { status: 403 });
  }
}

export type AdminUser = {
  user_id: string;
  email: string | null;
  created_at: string | null;
  is_self: boolean;
};

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ admins: AdminUser[] }> => {
    await assertAdmin(context.supabase, context.userId);

    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin");
    if (error) throw new Response(error.message, { status: 500 });

    const admins: AdminUser[] = [];
    for (const r of roles ?? []) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
      admins.push({
        user_id: r.user_id,
        email: u?.user?.email ?? null,
        created_at: r.created_at,
        is_self: r.user_id === context.userId,
      });
    }
    admins.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    return { admins };
  });

export const inviteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; redirectTo?: string }) =>
    z
      .object({
        email: z.string().email().max(200),
        redirectTo: z.string().url().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    let userId: string | null = null;
    // Try to find existing auth user by email
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const existing = list?.users.find(
      (u) => u.email?.toLowerCase() === data.email.toLowerCase(),
    );

    if (existing) {
      userId = existing.id;
    } else {
      const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        data.email,
        data.redirectTo ? { redirectTo: data.redirectTo } : undefined,
      );
      if (error || !invited?.user) {
        throw new Response(error?.message ?? "Could not invite user", { status: 500 });
      }
      userId = invited.user.id;
    }

    // Grant admin role (idempotent via unique constraint)
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId!, role: "admin" });
    if (roleErr && !roleErr.message.toLowerCase().includes("duplicate")) {
      throw new Response(roleErr.message, { status: 500 });
    }

    return { ok: true, user_id: userId, invited: !existing };
  });

export const revokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string }) =>
    z.object({ user_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId) {
      throw new Response("You cannot revoke your own admin role", { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", "admin");
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });
