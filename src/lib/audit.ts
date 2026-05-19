import { supabase } from "@/integrations/supabase/client";

export async function logAudit(
  action: string,
  entity_type: string,
  entity_id: string | null,
  details: Record<string, unknown> = {},
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      action,
      entity_type,
      entity_id,
      details,
    });
  } catch (err) {
    console.warn("audit log failed", err);
  }
}
