import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Check, Copy, ImageIcon, Ticket, Upload } from "lucide-react";
import { fetchBankInfo, DEFAULT_BANK, type BankInfo } from "@/lib/settings";
import { EVENT } from "@/lib/tiers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import rotaryWheel from "@/assets/rotary-wheel.png";

export const Route = createFileRoute("/raffle")({
  component: RafflePage,
  head: () => ({
    meta: [
      { title: "Buy a Raffle Ticket — Rotary Club of Choba-Uniport" },
      {
        name: "description",
        content:
          "Support Service Above Self projects. Buy a single raffle ticket for ₦500 or a pack of 20 for ₦5,000.",
      },
    ],
  }),
});

const PACKS = {
  single: { label: "Single ticket", price: 500, qty: 1 },
  pack20: { label: "Pack of 20", price: 5000, qty: 20 },
} as const;

type PackKey = keyof typeof PACKS;

const Schema = z.object({
  buyer_name: z.string().min(2, "Enter your full name").max(120),
  buyer_phone: z.string().min(6, "Enter a valid phone").max(30),
  buyer_email: z.string().email("Invalid email").max(200).optional().or(z.literal("")),
  pack: z.enum(["single", "pack20"]),
  reference: z.string().max(120).optional().or(z.literal("")),
});

type PaymentChoice = "pay_now" | "pay_at_venue";

function RafflePage() {
  const [bank, setBank] = useState<BankInfo>(DEFAULT_BANK);
  const [pack, setPack] = useState<PackKey>("single");
  const [qty, setQty] = useState(1);
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("pay_now");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string; amount: number; qty: number; payment_method: PaymentChoice; buyer_phone: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchBankInfo().then(setBank).catch(() => {});
  }, []);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      const parsed = Schema.safeParse({
        buyer_name: String(fd.get("buyer_name") ?? "").trim(),
        buyer_phone: String(fd.get("buyer_phone") ?? "").trim(),
        buyer_email: String(fd.get("buyer_email") ?? "").trim(),
        pack,
        reference: String(fd.get("reference") ?? "").trim(),
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Check your details");
        return;
      }
      const p = PACKS[parsed.data.pack];
      const { data, error } = await supabase
        .from("raffle_sales")
        .insert({
          buyer_name: parsed.data.buyer_name,
          buyer_phone: parsed.data.buyer_phone,
          buyer_email: parsed.data.buyer_email || null,
          pack: parsed.data.pack,
          qty: qty,
          amount: p.price * qty,
          reference: parsed.data.reference || null,
          payment_method: paymentChoice,
        })
        .select("id, amount, qty, payment_method")
        .single();
      if (error) throw error;
      setDone({ id: data.id, amount: data.amount, qty: data.qty, payment_method: paymentChoice, buyer_phone: parsed.data.buyer_phone });
      toast.success(
        paymentChoice === "pay_now"
          ? "Reserved! Pay via bank transfer and upload your proof below."
          : "Reserved! Pay at the venue on the day with this reference.",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not submit";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const refShort = done ? done.id.slice(0, 8).toUpperCase() : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={rotaryWheel} alt="" className="size-8" width={32} height={32} />
            <span className="font-display text-lg text-primary">{EVENT.club}</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="mr-2 size-4" /> Home</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-3xl">
        <div className="text-center mb-8">
          <Ticket className="mx-auto size-10 text-gold" />
          <h1 className="font-display text-4xl font-bold text-primary mt-3">Raffle Tickets</h1>
          <p className="text-foreground/70 mt-2">
            Buy a ticket and stand a chance to win at the Installation Ceremony. Proceeds support our service projects.
          </p>
        </div>

        {done ? (
          <Card className="p-6 space-y-5">
            <div className="text-center">
              <Check className="mx-auto size-10 text-emerald-600" />
              <h2 className="font-display text-2xl font-bold text-primary mt-2">Ticket reserved</h2>
              <p className="text-foreground/70 mt-1">
                Your reference is below. Send it with your payment so we can confirm your tickets.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-foreground/60">Reference</div>
                <div className="font-mono text-lg font-semibold">{refShort}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => copy(refShort, "ref")}>
                {copied === "ref" ? <Check className="size-4" /> : <Copy className="size-4" />}
                <span className="ml-2">{copied === "ref" ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-foreground/60">Tickets</span><span className="font-semibold">{done.qty}</span></div>
              <div className="flex justify-between"><span className="text-foreground/60">Amount</span><span className="font-semibold">₦{done.amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-foreground/60">Payment</span><span className="font-semibold">{done.payment_method === "pay_now" ? "Pay now (transfer)" : "Pay at venue"}</span></div>
            </div>

            {done.payment_method === "pay_now" ? (
              <>
                <BankBox bank={bank} copy={copy} copied={copied} />
                <RaffleProofUpload saleId={done.id} buyerPhone={done.buyer_phone} />
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-primary/40 bg-secondary/30 p-4 text-sm">
                Bring this reference to the venue on the day of the event to pay and collect your tickets.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={() => setDone(null)} variant="outline" className="flex-1">Buy more tickets</Button>
              <Button asChild className="flex-1 bg-primary text-primary-foreground"><Link to="/">Back to home</Link></Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <Label className="mb-2 block">Choose a pack</Label>
                <RadioGroup value={pack} onValueChange={(v) => setPack(v as PackKey)} className="grid gap-3 sm:grid-cols-2">
                  {(Object.keys(PACKS) as PackKey[]).map((k) => {
                    const p = PACKS[k];
                    const active = pack === k;
                    return (
                      <label
                        key={k}
                        htmlFor={`pack-${k}`}
                        className={`cursor-pointer rounded-lg border p-4 transition ${active ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:border-primary/40"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{p.label}</div>
                            <div className="text-sm text-foreground/60">{p.qty} ticket{p.qty > 1 ? "s" : ""}</div>
                          </div>
                          <RadioGroupItem id={`pack-${k}`} value={k} />
                        </div>
                        <div className="mt-3 font-display text-2xl text-primary">₦{p.price.toLocaleString()}</div>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="qty" className="mb-2 block">How many?</Label>
                <Input
                  id="qty"
                  type="number"
                  min={1}
                  max={100}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full sm:max-w-[200px]"
                />
              </div>

              <div>
                <Label className="mb-2 block">How would you like to pay?</Label>
                <RadioGroup
                  value={paymentChoice}
                  onValueChange={(v) => setPaymentChoice(v as PaymentChoice)}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {([
                    { key: "pay_now", title: "Pay now (transfer)", desc: "Transfer to the bank account and upload your proof on the next screen." },
                    { key: "pay_at_venue", title: "Book — pay at venue", desc: "Reserve now, pay cash or transfer at the event with your reference." },
                  ] as Array<{ key: PaymentChoice; title: string; desc: string }>).map(({ key, title, desc }) => {
                    const active = paymentChoice === key;
                    return (
                      <label
                        key={key}
                        htmlFor={`pay-${key}`}
                        className={`cursor-pointer rounded-lg border p-4 transition ${active ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:border-primary/40"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{title}</div>
                            <div className="text-xs text-foreground/60 mt-1">{desc}</div>
                          </div>
                          <RadioGroupItem id={`pay-${key}`} value={key} />
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="buyer_name">Full name *</Label>
                  <Input id="buyer_name" name="buyer_name" required maxLength={120} />
                </div>
                <div>
                  <Label htmlFor="buyer_phone">Phone *</Label>
                  <Input id="buyer_phone" name="buyer_phone" required maxLength={30} placeholder="e.g. 080..." />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="buyer_email">Email (optional)</Label>
                  <Input id="buyer_email" name="buyer_email" type="email" maxLength={200} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="reference">Payment reference (optional)</Label>
                  <Input id="reference" name="reference" maxLength={120} placeholder="Bank transfer reference if you've already paid" />
                </div>
              </div>

              {paymentChoice === "pay_now" ? (
                <BankBox bank={bank} copy={copy} copied={copied} />
              ) : (
                <div className="rounded-lg border border-dashed border-primary/40 bg-secondary/30 p-4 text-sm">
                  No payment now — bring your reference to the venue to pay and collect tickets.
                </div>
              )}
              <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground">
                {submitting ? "Reserving…" : `Reserve ${qty} ${PACKS[pack].label} — ₦${(PACKS[pack].price * qty).toLocaleString()}`}
              </Button>
              <p className="text-xs text-foreground/60 text-center">
                Your reference will appear on the next screen — keep it safe and present it on collection day.
              </p>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}

function BankBox({ bank, copy, copied }: { bank: BankInfo; copy: (t: string, k: string) => void; copied: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
      <div className="font-semibold text-foreground/80 mb-1">Pay to</div>
      <Row label="Bank" value={bank.bank_name} k="bank" copy={copy} copied={copied} />
      <Row label="Account name" value={bank.account_name} k="acc" copy={copy} copied={copied} />
      <Row label="Account number" value={bank.account_number} k="num" copy={copy} copied={copied} mono />
    </div>
  );
}

function Row({ label, value, k, copy, copied, mono }: { label: string; value: string; k: string; copy: (t: string, k: string) => void; copied: string | null; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-xs uppercase tracking-wider text-foreground/60">{label}</div>
        <div className={`${mono ? "font-mono" : ""} font-medium`}>{value}</div>
      </div>
      <Button size="sm" variant="ghost" onClick={() => copy(value, k)}>
        {copied === k ? <Check className="size-4" /> : <Copy className="size-4" />}
      </Button>
    </div>
  );
}

function RaffleProofUpload({ saleId }: { saleId: string }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image (PNG/JPG)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `raffle/${saleId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("payment-proofs").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: rpcErr } = await supabase.rpc("attach_raffle_payment_proof", {
      sale_id: saleId,
      proof_url: url,
    });
    setUploading(false);
    if (rpcErr) {
      toast.error(rpcErr.message);
      return;
    }
    setUploadedUrl(url);
    toast.success("Payment proof uploaded");
  }

  if (uploadedUrl) {
    return (
      <div className="rounded-lg border-2 border-primary/30 bg-secondary/40 p-4">
        <p className="font-semibold text-primary flex items-center gap-2">
          <Check className="size-4" /> Payment proof received
        </p>
        <p className="mt-1 text-xs text-foreground/60">
          The secretariat will verify and confirm your tickets.
        </p>
        <a href={uploadedUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs text-primary hover:underline">
          <ImageIcon className="size-3.5" /> View uploaded screenshot
        </a>
      </div>
    );
  }

  return (
    <label className="block rounded-lg border-2 border-dashed border-primary/40 bg-card hover:bg-secondary/50 transition cursor-pointer p-5 text-center">
      <Upload className="size-6 mx-auto text-primary" />
      <p className="mt-2 font-semibold text-primary">
        {uploading ? "Uploading…" : "Upload payment proof"}
      </p>
      <p className="text-xs text-foreground/60 mt-1">PNG or JPG, up to 5 MB</p>
      <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={uploading} />
    </label>
  );
}
