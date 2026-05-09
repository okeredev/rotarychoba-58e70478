import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { TIERS, formatNGN, EVENT, type TierKey } from "@/lib/tiers";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Check, MapPin, Printer, Search, Clock } from "lucide-react";
import rotaryWheel from "@/assets/rotary-wheel.png";
import { ReceiptWatermark, ReceiptVerifyBlock, RECEIPT_LOCKED_CLASS } from "@/components/receipt-security";

export const Route = createFileRoute("/receipt")({
  component: ReceiptLookup,
});

type Reg = {
  id: string;
  full_name: string;
  title: string | null;
  email: string;
  phone: string;
  tier: string;
  amount: number;
  guests_count: number;
  payment_method: string;
  payment_status: string;
  payment_proof_url: string | null;
};

function ReceiptLookup() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [reg, setReg] = useState<Reg | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (reference.trim().length < 4 || !email.trim()) {
      toast.error("Enter your reference code and email");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("lookup_registration", {
      ref: reference.trim(),
      email_input: email.trim(),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const row = (data as Reg[] | null)?.[0];
    if (!row) {
      toast.error("No registration found. Check your reference and email.");
      setReg(null);
      return;
    }
    setReg(row);
  }

  if (reg) {
    const isPaid = reg.payment_status === "paid";
    if (!isPaid) {
      return <PendingView reg={reg} onBack={() => setReg(null)} />;
    }
    return <SlipView reg={reg} />;
  }

  return (
    <div className="min-h-screen bg-background py-10 px-6">
      <div className="container mx-auto max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <h1 className="font-display text-3xl font-bold text-primary">Download your entry slip</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Once your payment has been approved by the secretariat, retrieve and print your slip here.
        </p>

        <Card className="mt-6 p-6">
          <form onSubmit={handleLookup} className="grid gap-4">
            <div>
              <Label htmlFor="reference">Reference code</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. A1B2C3D4"
                className="mt-2 uppercase font-mono"
                maxLength={8}
              />
            </div>
            <div>
              <Label htmlFor="email">Email used at registration</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2"
              />
            </div>
            <Button type="submit" disabled={loading} size="lg" className="bg-primary text-primary-foreground">
              <Search className="size-4 mr-2" />
              {loading ? "Searching…" : "Find my slip"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function PendingView({ reg, onBack }: { reg: Reg; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background py-10 px-6">
      <div className="container mx-auto max-w-md text-center">
        <div className="size-14 rounded-full mx-auto flex items-center justify-center bg-secondary border-2 border-gold">
          <Clock className="size-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold text-primary mt-4">Payment not yet approved</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hello {reg.full_name}, your registration has been received but the secretariat
          has not confirmed your payment yet. Your entry slip will be available here as
          soon as it is approved.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Status: <strong className="uppercase">{reg.payment_status}</strong>
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={onBack}>Try again</Button>
          <Button asChild><Link to="/">Return home</Link></Button>
        </div>
      </div>
    </div>
  );
}

function SlipView({ reg }: { reg: Reg }) {
  const reference = reg.id.slice(0, 8).toUpperCase();
  const tierName = TIERS.find((t) => t.key === (reg.tier as TierKey))?.name ?? reg.tier;
  const totalSeats = 1 + (reg.guests_count ?? 0);
  const totalAmount = reg.amount * totalSeats;
  const fullName = reg.title ? `${reg.title} ${reg.full_name}` : reg.full_name;

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-6 print:hidden">
          <div className="size-14 rounded-full mx-auto flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
            <Check className="size-7 text-gold-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary mt-4">Payment approved</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Print or save your entry slip below — present it at the registration desk.
          </p>
        </div>

        <Card id="receipt" className={`relative p-0 overflow-hidden border-2 border-primary/20 print:border-0 print:shadow-none ${RECEIPT_LOCKED_CLASS}`} onContextMenu={(e) => e.preventDefault()}>
          <ReceiptWatermark label={`Official · ${reference}`} />
          <div className="relative z-10 p-6 md:p-8" style={{ background: "var(--gradient-royal)" }}>
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <img src={rotaryWheel} alt="" className="size-12 bg-white/10 rounded-full p-1" />
                <div>
                  <p className="font-display text-lg font-bold leading-tight">Rotary Club of Choba-Uniport</p>
                  <p className="text-xs text-white/70 uppercase tracking-widest">District 9141</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-white/70">Entry Slip</p>
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
              <Detail label="Attendee" value={fullName} />
              <Detail label="Tier" value={tierName} />
              <Detail label="Email" value={reg.email} />
              <Detail label="Phone" value={reg.phone} />
              <Detail label="Seats" value={`${totalSeats}`} />
              <Detail label="Status" value="PAID" />
            </div>

            <div className="rounded-lg bg-secondary/60 border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Amount paid</p>
                <p className="font-display text-3xl font-bold text-primary">{formatNGN(totalAmount)}</p>
              </div>
              <div className="rounded-md border-2 border-gold bg-gold/10 px-3 py-2 text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Verified</p>
                <p className="font-display text-sm font-bold text-primary">Approved</p>
              </div>
            </div>

            <div className="border-t border-dashed border-border pt-4 text-[11px] text-muted-foreground text-center">
              This slip is your entry pass. Please present it (printed or on-screen) at the door.
              <br /> Service Above Self · {EVENT.club}
            </div>
          </div>
        </Card>

        <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
          <Button onClick={() => window.print()} className="bg-primary text-primary-foreground">
            <Printer className="size-4 mr-2" /> Download / Print slip
          </Button>
          <Button asChild variant="outline"><Link to="/">Return home</Link></Button>
        </div>
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
