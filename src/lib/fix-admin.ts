import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const fixSuperAdmin = createServerFn({ method: "POST" })
  .handler(async () => {
    const email = "cryptobountiesupdates@gmail.com";
    const { data: user } = await supabaseAdmin.auth.admin.listUsers();
    const target = user?.users.find(u => u.email === email);
    
    if (!target) return { error: "User not found" };
    
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ 
        user_id: target.id, 
        role: "super_admin", 
        status: "approved" 
      }, { onConflict: "user_id" });
      
    if (error) return { error: error.message };
    return { ok: true, message: `User ${email} promoted to approved super_admin` };
  });
