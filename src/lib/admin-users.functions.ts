import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Verify caller is admin or super_admin.
async function assertAdmin(supabase: any, userId: string, claims: any, requireSuper: boolean = false) {
  const { data } = await supabase
    .from("user_roles")
    .select("role, status")
    .eq("user_id", userId)
    .maybeSingle();

  const hasRole = data && data.status === "approved";
  
  if (!data || !hasRole) {
    throw new Response("Forbidden: approved admin only", { status: 403 });
  }

  const role = data?.role;

  if (requireSuper && role !== "super_admin") {
    throw new Response("Forbidden: super_admin only", { status: 403 });
  }
}

export type AdminUser = {
  user_id: string;
  email: string | null;
  created_at: string | null;
  role: "super_admin" | "admin" | "user";
  status: "pending" | "approved" | "rejected";
  is_self: boolean;
};

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ admins: AdminUser[] }> => {
    await assertAdmin(context.supabase, context.userId, context.claims);

    // Use supabaseAdmin if available to bypass RLS and see all users.
    // Otherwise fall back to context.supabase.
    let client = context.supabase;
    try {
      if (supabaseAdmin) client = supabaseAdmin;
    } catch (e) {
       console.log("Using user client as fallback");
    }

    const { data: roles, error } = await client
      .from("user_roles")
      .select("user_id, role, status, created_at, email")
      .in("role", ["admin", "super_admin"]);
    
    if (error) throw new Response(error.message, { status: 500 });

    const admins: AdminUser[] = [];
    for (const r of roles ?? []) {
      let email = r.email;

      // If email is missing in the roles table, try to get it from Auth (requires service role)
      if (!email) {
        try {
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
          email = u?.user?.email ?? null;
        } catch (e) {
          console.error("Auth lookup failed:", e);
        }
      }

      admins.push({
        user_id: r.user_id,
        email: email || "Unknown User",
        created_at: r.created_at,
        role: r.role,
        status: r.status as any,
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
    // Only super_admin can invite directly (auto-approved)
    await assertAdmin(context.supabase, context.userId, context.claims, true);

    let userId: string | null = null;
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());

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

    // Grant admin role (auto-approved since invited by super-admin)
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId!, role: "admin", status: "approved" });
    
    if (roleErr && !roleErr.message.toLowerCase().includes("duplicate")) {
      throw new Response(roleErr.message, { status: 500 });
    }

    return { ok: true, user_id: userId, invited: !existing };
  });

export const updateAdminStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string; status: "approved" | "rejected" }) =>
    z.object({ user_id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId, context.claims, true);
    
    const { error } = await supabaseAdmin
      .from("user_roles")
      .update({ status: data.status })
      .eq("user_id", data.user_id);
      
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

export const updateAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string; role: "admin" | "super_admin" }) =>
    z.object({ user_id: z.string().uuid(), role: z.enum(["admin", "super_admin"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId, context.claims, true);
    
    const { error } = await supabaseAdmin
      .from("user_roles")
      .update({ role: data.role })
      .eq("user_id", data.user_id);
      
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

export const revokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string }) =>
    z.object({ user_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId, context.claims, true);
    if (data.user_id === context.userId) {
      throw new Response("You cannot revoke your own role", { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id);
      
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });
