import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TIERS, formatNGN, EVENT, type TierKey } from "@/lib/tiers";
import { fetchBankInfo, DEFAULT_BANK, type BankInfo } from "@/lib/settings";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy, Printer, Calendar, MapPin, Upload, ImageIcon } from "lucide-react";
import rotaryWheel from "@/assets/rotary-wheel.png";
import { ReceiptWatermark, ReceiptVerifyBlock, RECEIPT_LOCKED_CLASS } from "@/components/receipt-security";

const TITLES = ["Mr.", "Mrs.", "Miss", "Ms.", "Dr.", "Prof.", "Engr.", "Chief", "Hon.", "Rtn.", "PP", "PE", "DGN", "PDG"] as const;

const tierSchema = z.enum(["standard", "premium", "vip"]).catch("standard");

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>) => ({
    tier: tierSchema.parse(s.tier),
  }),
  component: Register,
});

const formSchema = z.object({
  title: z.string().trim().max(20).optional().or(z.literal("")),
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(200).optional().or(z.literal("")),
  phone: z.string().trim().min(6, "Enter a valid phone").max(30),
  occupation: z.string().trim().max(120).optional().or(z.literal("")),
  position: z.string().trim().max(120).optional().or(z.literal("")),
  organization: z.string().trim().max(120).optional().or(z.literal("")),
  rotary_club: z.string().trim().max(160).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  guests_count: z.coerce.number().int().min(0).max(20).default(0),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

type SuccessData = {
  id: string;
  tier: TierKey;
  full_name: string;
  email: string;
  phone: string;
  amount: number;
  guests_count: number;
  payment_method: "pay_now" | "pay_at_venue";
};

function Register() {
  const { tier } = Route.useSearch();
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<TierKey>(tier);
  const [title, setTitle] = useState<string>("");
  const [paymentChoice, setPaymentChoice] = useState<"pay_now" | "pay_at_venue">("pay_at_venue");
  const [bank, setBank] = useState<BankInfo>(DEFAULT_BANK);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const tierData = TIERS.find((t) => t.key === selectedTier)!;
  const isVip = selectedTier === "vip";
  const effectiveChoice: "pay_now" | "pay_at_venue" = isVip ? "pay_now" : paymentChoice;

  // Restore the last successful registration from localStorage so a page
  // refresh keeps the receipt visible instead of dumping the user back to the
  // empty form.
  useEffect(() => {
    void fetchBankInfo().then(setBank);
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("rcc:lastRegistration");
      if (raw) setSuccess(JSON.parse(raw) as SuccessData);
    } catch {
      /* ignore corrupted storage */
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = formSchema.safeParse({
      title,
      full_name: fd.get("full_name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      occupation: fd.get("occupation"),
      position: fd.get("position"),
      organization: fd.get("organization"),
      rotary_club: fd.get("rotary_club"),
      address: fd.get("address"),
      guests_count: fd.get("guests_count") || 0,
      notes: fd.get("notes"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    setSubmitting(true);
    const d = parsed.data;
    const payload = {
      title: d.title || null,
      full_name: d.full_name,
      email: d.email,
      phone: d.phone,
      occupation: d.occupation || null,
      position: d.position || null,
      organization: d.organization || null,
      rotary_club: d.rotary_club || null,
      address: d.address || null,
      guests_count: d.guests_count,
      notes: d.notes || null,
      tier: selectedTier,
      amount: tierData.amount,
      payment_method: effectiveChoice,
      payment_status: "pending" as const,
    };

    // Generate the id client-side so we don't need a SELECT-after-INSERT
    // (anonymous users have no SELECT policy on registrations, which would
    // surface as "new row violates row-level security policy" on the
    // returning step). The id is a uuid and is also used as the receipt ref.
    const newId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { error } = await supabase
      .from("registrations")
      .insert({ id: newId, ...payload });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Registration submitted!");
    const successData: SuccessData = {
      id: newId,
      tier: selectedTier,
      full_name: d.full_name,
      email: d.email,
      phone: d.phone,
      amount: tierData.amount,
      guests_count: d.guests_count,
      payment_method: effectiveChoice,
    };
    try {
      window.localStorage.setItem("rcc:lastRegistration", JSON.stringify(successData));
    } catch { /* ignore */ }
    setSuccess(successData);
  }

  if (success) {
    return <SuccessView data={success} bank={bank} onReset={() => {
      try { window.localStorage.removeItem("rcc:lastRegistration"); } catch { /* ignore */ }
      setSuccess(null);
    }} />;
  }

  return (
    <div className="min-h-screen bg-background py-10 px-6">
      <div className="container mx-auto max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="size-4" /> Back
        </Link>

        <h1 className="font-display text-4xl font-bold text-primary">Register to attend</h1>
        <p className="mt-2 text-muted-foreground">No account required. Fill in your details below.</p>

        {/* Tier selector */}
        <div className="grid gap-3 sm:grid-cols-3 mt-8">
          {TIERS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setSelectedTier(t.key);
                navigate({ to: "/register", search: { tier: t.key } });
              }}
              className={`text-left rounded-lg border-2 p-4 transition ${
                selectedTier === t.key
                  ? "border-primary bg-secondary"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{t.name}</p>
              <p className="mt-1 text-xl font-display font-bold text-primary">{formatNGN(t.amount)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.payAtVenue ? "Pay now or at venue" : "Bank transfer required"}
              </p>
            </button>
          ))}
        </div>

        <Card className="mt-6 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="grid gap-5">
            <SectionHeading>Personal details</SectionHeading>
            <div className="grid gap-5 md:grid-cols-[140px_1fr]">
              <div>
                <Label htmlFor="title">Title</Label>
                <Select value={title} onValueChange={setTitle}>
                  <SelectTrigger id="title" className="mt-2"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {TITLES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <Field id="full_name" label="Full name *" required placeholder="Enter your full name" />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Field id="email" type="email" label="Email *" required placeholder="you@example.com" />
              <Field id="phone" type="tel" label="Phone *" required placeholder="+234 800 000 0000" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" maxLength={300} rows={2} className="mt-2" placeholder="Street, city, state" />
            </div>

            <SectionHeading>Professional details</SectionHeading>
            <div className="grid gap-5 md:grid-cols-2">
              <Field id="occupation" label="Occupation" placeholder="e.g. Medical Doctor" />
              <Field id="position" label="Position / Job title" placeholder="e.g. Managing Director" />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Field id="organization" label="Organization / Company" placeholder="e.g. ABC Holdings Ltd." />
              <Field id="rotary_club" label="Rotary/Rotract club (if applicable)" placeholder="e.g. Rotary Club of Port Harcourt" />
            </div>

            <SectionHeading>Attendance</SectionHeading>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="guests_count">Number of additional guests</Label>
                <Input id="guests_count" name="guests_count" type="number" min={0} max={20} defaultValue={0} className="mt-2" />
                <p className="mt-1 text-xs text-muted-foreground">Each guest pays the same tier fee at the venue.</p>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (dietary, accessibility, special requests)</Label>
              <Textarea id="notes" name="notes" maxLength={500} className="mt-2" placeholder="Anything we should know?" />
            </div>

            {/* Payment choice */}
            <SectionHeading>Payment</SectionHeading>
            {isVip ? (
              <div className="rounded-lg border-2 border-gold bg-gold/10 p-4 text-sm">
                The Platinum tier requires advance bank transfer to the official account below.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <PaymentOption
                  selected={paymentChoice === "pay_now"}
                  onClick={() => setPaymentChoice("pay_now")}
                  title="Pay now (bank transfer)"
                  description="Get a confirmed receipt to skip the queue."
                />
                <PaymentOption
                  selected={paymentChoice === "pay_at_venue"}
                  onClick={() => setPaymentChoice("pay_at_venue")}
                  title="Pay at the venue"
                  description={`Bring ${formatNGN(tierData.amount)} on the day.`}
                />
              </div>
            )}

            {effectiveChoice === "pay_now" && (
              <div className="rounded-lg border-2 border-gold bg-gold/5 p-4">
                <p className="font-semibold text-primary">Official bank transfer details</p>
                <div className="mt-3 grid gap-1 text-sm">
                  <BankRow label="Bank" value={bank.bank_name} />
                  <BankRow label="Account name" value={bank.account_name} />
                  <BankRow label="Account number" value={bank.account_number} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  After completing your registration, upload your payment screenshot on the next screen for verification.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-border">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">You're paying</p>
                <p className="font-display text-2xl font-bold text-primary">{formatNGN(tierData.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {effectiveChoice === "pay_now" ? "Bank details shown after submission" : "Payable at the venue"}
                </p>
              </div>
              <Button type="submit" disabled={submitting} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {submitting ? "Submitting…" : "Complete registration"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function PaymentOption({ selected, onClick, title, description }: {
  selected: boolean; onClick: () => void; title: string; description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border-2 p-4 transition ${
        selected ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <p className="font-semibold text-primary">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </button>
  );
}

function SuccessView({ data, bank, onReset }: { data: SuccessData; bank: BankInfo; onReset: () => void }) {
  const reference = data.id.slice(0, 8).toUpperCase();
  const tierName = TIERS.find((t) => t.key === data.tier)?.name ?? data.tier;
  const totalSeats = 1 + data.guests_count;
  const totalAmount = data.amount * totalSeats;
  const isPayNow = data.payment_method === "pay_now";

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Confirmation banner — hidden when printing */}
        <div className="text-center mb-6 print:hidden">
          <div className="size-14 rounded-full mx-auto flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
            <Check className="size-7 text-gold-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary mt-4">You're registered</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save or print your receipt below — present it at the registration desk.
          </p>
        </div>

        {/* Receipt — also the printable area */}
        <Card id="receipt" className={`relative p-0 overflow-hidden border-2 border-primary/20 print:border-0 print:shadow-none ${RECEIPT_LOCKED_CLASS}`} onContextMenu={(e) => e.preventDefault()}>
          <ReceiptWatermark label={`Provisional · ${reference}`} />
          <div className="p-6 md:p-8" style={{ background: "var(--gradient-royal)" }}>
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <img src={rotaryWheel} alt="" className="size-12 bg-white/10 rounded-full p-1" />
                <div>
                  <p className="font-display text-lg font-bold leading-tight">Rotary Club of Choba-Uniport</p>
                  <p className="text-xs text-white/70 uppercase tracking-widest">District 9141</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-white/70">Receipt</p>
                <p className="font-mono text-lg font-bold">#{reference}</p>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-white/20 text-white">
              <p className="font-display text-2xl font-bold">{EVENT.name}</p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/80">
                <span className="inline-flex items-center gap-1.5"><Calendar className="size-4 text-gold" />{EVENT.date}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-gold" />{EVENT.venue}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 p-6 md:p-8 grid gap-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail label="Attendee" value={data.full_name} />
              <Detail label="Tier" value={tierName} />
              <Detail label="Email" value={data.email} />
              <Detail label="Phone" value={data.phone} />
              <Detail label="Seats" value={`${totalSeats} (you${data.guests_count ? ` + ${data.guests_count} guest${data.guests_count > 1 ? "s" : ""}` : ""})`} />
              <Detail label="Status" value={isPayNow ? "Awaiting transfer" : "Pay at venue"} />
            </div>

            <div className="rounded-lg bg-secondary/60 border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Total due</p>
                <p className="font-display text-3xl font-bold text-primary">{formatNGN(totalAmount)}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {formatNGN(data.amount)} × {totalSeats}
              </div>
            </div>

            {isPayNow ? (
              <>
                <div className="rounded-lg border-2 border-gold bg-gold/5 p-4">
                  <p className="font-semibold text-primary">Bank transfer details</p>
                  <div className="mt-3 grid gap-1 text-sm">
                    <BankRow label="Bank" value={bank.bank_name} />
                    <BankRow label="Account name" value={bank.account_name} />
                    <BankRow label="Account number" value={bank.account_number} />
                    <BankRow label="Amount" value={formatNGN(totalAmount)} />
                    <BankRow label="Reference" value={reference} />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    After transfer, upload your payment screenshot below. The secretariat will verify and mark your status as <strong>Paid</strong>.
                  </p>
                </div>
                <ProofUpload registrationId={data.id} />
              </>
            ) : (
              <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
                <p className="font-semibold text-primary">Pay at the venue</p>
                <p className="mt-1 text-muted-foreground">
                  Bring <strong>{formatNGN(totalAmount)}</strong> on the day of the event. Present this receipt at the registration desk for entry.
                </p>
              </div>
            )}

            <ReceiptVerifyBlock
              reference={reference}
              email={data.email}
              issuedAt={new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              status="PROVISIONAL"
            />

            <div className="border-t border-dashed border-border pt-4 text-[11px] text-muted-foreground text-center">
              This receipt is your entry pass. Please present it (printed or on-screen) at the door.
              <br /> Service Above Self · {EVENT.club}
            </div>
          </div>
        </Card>

        <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
          <Button onClick={() => window.print()} className="bg-primary text-primary-foreground">
            <Printer className="size-4 mr-2" /> Print / Save as PDF
          </Button>
          <Button asChild variant="outline">
            <Link to="/receipt">Download approved slip later</Link>
          </Button>
          <Button variant="ghost" onClick={onReset}>
            Start a new registration
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Return home</Link>
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground print:hidden">
          Your reference is <strong className="font-mono">{reference}</strong>. Save it — you'll
          need it (with your email) to download your final slip once payment is approved.
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium text-foreground break-words">{value}</p>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  required,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} required={required} placeholder={placeholder} className="mt-2" />
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold border-b border-border pb-2">
      {children}
    </p>
  );
}

function ProofUpload({ registrationId }: { registrationId: string }) {
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
    const path = `${registrationId}/${Date.now()}.${ext}`;
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
    const { error: rpcErr } = await supabase.rpc("attach_payment_proof", {
      reg_id: registrationId,
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
      <div className="rounded-lg border-2 border-primary/30 bg-secondary/40 p-4 print:hidden">
        <p className="font-semibold text-primary flex items-center gap-2">
          <Check className="size-4" /> Payment proof received
        </p>
        <p className="mt-1 text-xs text-muted-foreground">The secretariat will verify and confirm your payment.</p>
        <a href={uploadedUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs text-primary hover:underline">
          <ImageIcon className="size-3.5" /> View uploaded screenshot
        </a>
      </div>
    );
  }

  return (
    <label className="block rounded-lg border-2 border-dashed border-primary/40 bg-card hover:bg-secondary/50 transition cursor-pointer p-5 text-center print:hidden">
      <Upload className="size-6 mx-auto text-primary" />
      <p className="mt-2 font-semibold text-primary">
        {uploading ? "Uploading…" : "Upload payment screenshot"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">PNG or JPG, up to 5 MB</p>
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
    </label>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 font-medium text-foreground">
        {value}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success("Copied");
          }}
          className="text-muted-foreground hover:text-primary print:hidden"
          aria-label="Copy"
        >
          <Copy className="size-3.5" />
        </button>
      </span>
    </div>
  );
}
