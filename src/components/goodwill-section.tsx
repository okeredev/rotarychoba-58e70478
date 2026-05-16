import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Quote } from "lucide-react";
import { toast } from "sonner";

type GoodwillRow = {
  id: string;
  sender_name: string;
  sender_role: string | null;
  message: string;
  photo_url: string | null;
};

export function GoodwillSection() {
  const [items, setItems] = useState<GoodwillRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ sender_name: "", sender_role: "", message: "" });

  const load = async () => {
    const { data } = await supabase
      .from("goodwill_messages")
      .select("id, sender_name, sender_role, message, photo_url")
      .eq("status", "approved")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setItems((data as GoodwillRow[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.sender_name.trim().length < 2 || form.message.trim().length < 5) {
      toast.error("Please enter your name and a short message");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("goodwill_messages").insert({
      sender_name: form.sender_name.trim(),
      sender_role: form.sender_role.trim() || null,
      message: form.message.trim(),
      status: "pending",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Thank you! Your message will appear after review.");
    setForm({ sender_name: "", sender_role: "", message: "" });
  };

  return (
    <section id="goodwill" className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 scroll-mt-20">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-gold text-xs uppercase tracking-widest font-semibold">
          <Heart className="size-4" /> Goodwill
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary mt-2">Messages of Goodwill</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Send your congratulations and well-wishes to the incoming officers and the club.
        </p>
      </div>

      {items.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {items.map((m) => (
            <Card key={m.id} className="p-5 border-2 border-border bg-card">
              <Quote className="size-5 text-gold mb-2" />
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{m.message}</p>
              <p className="mt-4 font-display font-bold text-primary text-sm">{m.sender_name}</p>
              {m.sender_role && (
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{m.sender_role}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card className="max-w-2xl mx-auto p-6 sm:p-8 border-2 border-gold/30">
        <h3 className="font-display text-xl font-bold text-primary mb-4">Share your goodwill message</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="gw-name">Your name *</Label>
              <Input
                id="gw-name"
                value={form.sender_name}
                onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
                maxLength={120}
                required
              />
            </div>
            <div>
              <Label htmlFor="gw-role">Title / role (optional)</Label>
              <Input
                id="gw-role"
                value={form.sender_role}
                onChange={(e) => setForm({ ...form, sender_role: e.target.value })}
                maxLength={120}
                placeholder="e.g. PDG, District 9141"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="gw-msg">Message *</Label>
            <Textarea
              id="gw-msg"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              maxLength={1500}
              rows={5}
              required
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Sending…" : "Send goodwill message"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Messages are reviewed by an admin before being published.
          </p>
        </form>
      </Card>
    </section>
  );
}
