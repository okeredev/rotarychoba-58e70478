import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { TIERS, formatNGN, VIP_BANK, type TierKey } from "@/lib/tiers";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy } from "lucide-react";

const TITLES = ["Mr.", "Mrs.", "Miss", "Ms.", "Dr.", "Prof.", "Engr.", "Chief", "Hon.", "Rtn.", "PP", "PE", "DGN", "PDG"] as const;

const tierSchema = z.enum(["standard", "premium", "vip"]).catch("standard");

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>) => ({
    tier: tierSchema.parse(s.tier),
  }),
  component: Register,
});

const formSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z.string().trim().min(6, "Enter a valid phone").max(30),
  occupation: z.string().trim().max(120).optional().or(z.literal("")),
  organization: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

function Register() {
  const { tier } = Route.useSearch();
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<TierKey>(tier);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<null | { id: string; tier: TierKey }>(null);

  const tierData = TIERS.find((t) => t.key === selectedTier)!;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = formSchema.safeParse({
      full_name: fd.get("full_name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      occupation: fd.get("occupation"),
      organization: fd.get("organization"),
      notes: fd.get("notes"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    setSubmitting(true);
    const payload = {
      ...parsed.data,
      occupation: parsed.data.occupation || null,
      organization: parsed.data.organization || null,
      notes: parsed.data.notes || null,
      tier: selectedTier,
      amount: tierData.amount,
      payment_status: (selectedTier === "vip" ? "pending" : "pay_at_venue") as
        | "pending"
        | "pay_at_venue",
    };

    const { data, error } = await supabase.from("registrations").insert(payload).select("id").single();
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Registration submitted!");
    setSuccess({ id: data.id, tier: selectedTier });
  }

  if (success) {
    const isVip = success.tier === "vip";
    return (
      <div className="min-h-screen bg-background py-12 px-6">
        <div className="container mx-auto max-w-2xl">
          <Card className="p-8 md:p-12 text-center">
            <div className="size-16 rounded-full mx-auto flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
              <Check className="size-8 text-gold-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold text-primary mt-6">You're registered</h1>
            <p className="mt-2 text-muted-foreground">
              Confirmation reference: <span className="font-mono text-foreground">{success.id.slice(0, 8).toUpperCase()}</span>
            </p>

            {isVip ? (
              <div className="mt-8 text-left bg-secondary/60 rounded-lg p-6 border border-border">
                <p className="font-semibold text-primary">Complete your VIP payment</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please transfer {formatNGN(50000)} to the account below and forward proof to the secretariat.
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <BankRow label="Bank" value={VIP_BANK.bankName} />
                  <BankRow label="Account name" value={VIP_BANK.accountName} />
                  <BankRow label="Account number" value={VIP_BANK.accountNumber} />
                  <BankRow label="Amount" value={formatNGN(50000)} />
                </div>
              </div>
            ) : (
              <div className="mt-8 text-left bg-secondary/60 rounded-lg p-6 border border-border">
                <p className="font-semibold text-primary">Payment at the venue</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bring {formatNGN(tierData.amount)} on the day of the event. Present this reference at the registration desk.
                </p>
              </div>
            )}

            <Button asChild className="mt-8" variant="outline">
              <Link to="/">Return home</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
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
                {t.payAtVenue ? "Pay at venue" : "Bank transfer required"}
              </p>
            </button>
          ))}
        </div>

        <Card className="mt-6 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="grid gap-5">
            <Field id="full_name" label="Full name *" required />
            <div className="grid gap-5 md:grid-cols-2">
              <Field id="email" type="email" label="Email *" required />
              <Field id="phone" type="tel" label="Phone *" required />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Field id="occupation" label="Occupation" />
              <Field id="organization" label="Organization / Club" />
            </div>
            <div>
              <Label htmlFor="notes">Notes (dietary, accessibility, etc.)</Label>
              <Textarea id="notes" name="notes" maxLength={500} className="mt-2" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-border">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">You're paying</p>
                <p className="font-display text-2xl font-bold text-primary">{formatNGN(tierData.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {tierData.payAtVenue ? "Payable at the venue" : "Bank transfer details shown after submission"}
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

function Field({
  id,
  label,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} required={required} className="mt-2" />
    </div>
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
          className="text-muted-foreground hover:text-primary"
          aria-label="Copy"
        >
          <Copy className="size-3.5" />
        </button>
      </span>
    </div>
  );
}
