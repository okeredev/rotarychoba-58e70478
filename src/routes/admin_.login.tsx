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
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
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
            </div>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? "Please wait…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground text-center">
            Admin accounts are invite-only. Contact a super admin to be invited.
          </p>
        </Card>
      </div>
    </div>
  );
}
