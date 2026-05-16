import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Quote, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

type GoodwillRow = {
  id: string;
  sender_name: string;
  sender_role: string | null;
  message: string;
  photo_url: string | null;
};

const BUCKET = "goodwill-photos";

function publicPhotoUrl(pathOrUrl: string | null): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(pathOrUrl);
  return data.publicUrl;
}

export function GoodwillSection() {
  const [items, setItems] = useState<GoodwillRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ sender_name: "", sender_role: "", message: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const onPickPhoto = (file: File | null) => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    if (!file) { setPhoto(null); setPhotoPreview(null); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.sender_name.trim().length < 2 || form.message.trim().length < 5) {
      toast.error("Please enter your name and a short message");
      return;
    }
    setSubmitting(true);
    try {
      let photo_path: string | null = null;
      if (photo) {
        const ext = photo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, photo, {
          contentType: photo.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        photo_path = path;
      }
      const { error } = await supabase.from("goodwill_messages").insert({
        sender_name: form.sender_name.trim(),
        sender_role: form.sender_role.trim() || null,
        message: form.message.trim(),
        photo_url: photo_path,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Thank you! Your message will appear after review.");
      setForm({ sender_name: "", sender_role: "", message: "" });
      onPickPhoto(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
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
          {items.map((m) => {
            const url = publicPhotoUrl(m.photo_url);
            return (
              <Card key={m.id} className="p-5 border-2 border-border bg-card flex flex-col">
                {url && (
                  <img
                    src={url}
                    alt={`Goodwill from ${m.sender_name}`}
                    loading="lazy"
                    className="mb-4 w-full aspect-[4/3] object-cover rounded-md border"
                  />
                )}
                <Quote className="size-5 text-gold mb-2" />
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{m.message}</p>
                <p className="mt-4 font-display font-bold text-primary text-sm">{m.sender_name}</p>
                {m.sender_role && (
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{m.sender_role}</p>
                )}
              </Card>
            );
          })}
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
                placeholder="Your Full Name or Organization."
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
          <div>
            <Label htmlFor="gw-photo">Photo (optional, max 5MB)</Label>
            <div className="flex items-center gap-3 mt-1">
              <Input
                id="gw-photo"
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
                className="cursor-pointer"
              />
              {photoPreview && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { onPickPhoto(null); if (fileRef.current) fileRef.current.value = ""; }}>
                  <X className="size-4" />
                </Button>
              )}
            </div>
            {photoPreview && (
              <img src={photoPreview} alt="Preview" className="mt-3 w-32 h-32 object-cover rounded-md border" />
            )}
            {!photoPreview && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ImagePlus className="size-3" /> A clear portrait works best.
              </p>
            )}
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
