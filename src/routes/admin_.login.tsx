import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin_/login")({
  component: AdminLogin,
});



function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    if (mode === "signup" && !email.includes("@")) {
      toast.error("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data: up, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        if (up.user) {
          // Create the pending role. 
          // If it's the hardcoded super admin, it might already exist or should be approved.
          // But since the user ran the SQL, it's already there.
          // For new signups, we insert 'pending'.
          const { error: roleErr } = await supabase.from("user_roles").insert({
            user_id: up.user.id,
            role: "admin",
            status: "pending",
            email: email,
          });
          // We ignore duplicate errors if the user already has a role
          if (roleErr && !roleErr.message.includes("duplicate")) {
             console.error("Role creation error:", roleErr);
          }
        }
        toast.success("Account created! Access is pending admin approval.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="size-4" /> Back to event
        </Link>

        <Card className="p-8">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-royal)" }}>
              <ShieldCheck className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-primary">Admin Portal</h1>
              <p className="text-xs text-muted-foreground">Rotary Choba-Uniport</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue=""
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={8} className="mt-2" />
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters.</p>
              )}
            </div>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create admin account"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 text-sm text-muted-foreground hover:text-primary w-full text-center"
          >
            {mode === "signin" ? "First time? Create the admin account" : "Already have an account? Sign in"}
          </button>
        </Card>
      </div>
    </div>
  );
}
