import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, Copy, Heart, Mail, Phone, Upload, ImageIcon, FileText } from "lucide-react";
import { fetchBankInfo, DEFAULT_BANK, type BankInfo } from "@/lib/settings";
import { EVENT } from "@/lib/tiers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import rotaryWheel from "@/assets/rotary-wheel.png";

export const Route = createFileRoute("/sponsor")({
  component: SponsorPage,
  head: () => ({
    meta: [
      { title: "Become a Sponsor — Rotary Club of Choba-Uniport" },
      {
        name: "description",
        content:
          "Partner with the Rotary Club of Choba-Uniport. Sponsor the 16th Installation Ceremony and help fund Service Above Self projects.",
      },
    ],
  }),
});

// Cumulative packages — each tier inherits everything below it.
const PACKAGES: Array<{
  name: string;
  amount: string;
  amountValue: number;
  highlighted?: boolean;
  perks: string[];
}> = [
  {
    name: "Friend of Rotary",
    amount: "₦100,000",
    amountValue: 100000,
    perks: [
      "Acknowledgement in event brochure",
      "Reserved seat at the ceremony",
      "Certificate of appreciation",
    ],
  },
  {
    name: "Bronze Partner",
    amount: "₦250,000",
    amountValue: 250000,
    perks: [
      "Logo placement in event brochure",
      "2 reserved VIP seats",
      "Mention during opening remarks",
    ],
  },
  {
    name: "Silver Partner",
    amount: "₦500,000",
    amountValue: 500000,
    perks: [
      "Half-page brochure feature",
      "4 reserved VIP seats",
      "Banner display at venue",
      "Social media recognition",
    ],
  },
  {
    name: "Gold Partner",
    amount: "₦1,000,000+",
    amountValue: 1000000,
    highlighted: true,
    perks: [
      "Full-page brochure feature",
      "Dedicated sponsor table (8 seats)",
      "Stage banner & roll-up display",
      "Speaking slot at the ceremony",
      "Year-long partner recognition",
    ],
  },
];

const enquirySchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(120),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  amount: z.coerce.number().int().min(0).max(100000000).optional(),
  contact_email: z.string().trim().email("Enter a valid email").max(200).optional().or(z.literal("")),
  contact_phone: z.string().trim().min(6, "Enter a valid phone").max(30),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

const PRESIDENT_WA = "2347037093388";
const NOMINEE_WA = "2348033577433";

function SponsorPage() {
  const [bank, setBank] = useState<BankInfo>(DEFAULT_BANK);

  useEffect(() => {
    void fetchBankInfo().then(setBank);
  }, []);

  function copyText(value: string, label = "Copied") {
    navigator.clipboard.writeText(value);
    toast.success(label);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={rotaryWheel} alt="" className="size-10" width={40} height={40} />
            <div className="leading-tight">
              <p className="font-display text-base font-bold text-primary">Rotary Club of Choba-Uniport</p>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">District 9141 · Nigeria</p>
            </div>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="size-4" /> Home
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden" style={{ background: "var(--gradient-royal)" }}>
        <div className="container mx-auto px-6 py-20 text-center text-white">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ background: "var(--gradient-gold)", color: "var(--gold-foreground)" }}
          >
            <Heart className="size-3.5" /> Partner with us
          </span>
          <h1 className="font-display mt-6 text-4xl md:text-6xl font-bold leading-tight">
            Sponsor the 16<sup className="text-gold">th</sup> Installation Ceremony
          </h1>
          <p className="mt-5 text-base md:text-lg text-white/80 max-w-2xl mx-auto">
            Your sponsorship powers Service Above Self — funding clean water, health outreach, education and youth
            empowerment projects across Rivers State and beyond.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold">Sponsorship packages</p>
          <h2 className="font-display text-4xl font-bold text-primary mt-3">Choose how to give</h2>
          <p className="mt-3 text-muted-foreground">
            Every higher tier <strong>includes everything in the tier below</strong>, so you keep all benefits as you give more.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((p, i) => {
            const previous = i > 0 ? PACKAGES[i - 1] : null;
            return (
              <Card
                key={p.name}
                className={`relative p-6 border-2 ${p.highlighted ? "border-gold" : "border-border"} bg-card transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]`}
              >
                {p.highlighted && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: "var(--gradient-gold)", color: "var(--gold-foreground)" }}
                  >
                    Premier
                  </span>
                )}
                <p className="text-sm uppercase tracking-widest text-muted-foreground">{p.name}</p>
                <p className="mt-2 text-3xl font-display font-bold text-primary">{p.amount}</p>
                {previous && (
                  <p className="mt-2 text-xs uppercase tracking-widest text-gold font-semibold">
                    Everything in {previous.name} +
                  </p>
                )}
                <ul className="mt-3 space-y-2.5">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm">
                      <Check className="size-4 text-gold mt-0.5 shrink-0" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={p.highlighted ? "default" : "outline"}
                  onClick={() => {
                    document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Sponsor at this tier
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-secondary/40 border-y border-border">
        <div className="container mx-auto px-6 py-16 max-w-3xl">
          <Card className="p-6 md:p-8 border-2 border-gold/40">
            <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold">Bank transfer</p>
            <h3 className="font-display text-2xl font-bold text-primary mt-2">Official sponsorship account</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the reference <strong>SPONSOR — [Your name / company]</strong> when transferring.
            </p>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyText("SPONSOR — [Your name / company]", "Reference template copied")}
              >
                <Copy className="size-3.5 mr-1.5" /> Copy reference template
              </Button>
            </div>
            <div className="mt-5 grid gap-1 text-sm">
              <BankRow label="Bank" value={bank.bank_name} />
              <BankRow label="Account name" value={bank.account_name} />
              <BankRow label="Account number" value={bank.account_number} />
            </div>
          </Card>

          <Card id="enquiry" className="mt-6 p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold">Sponsorship enquiry</p>
            <h3 className="font-display text-2xl font-bold text-primary mt-2">Send us your details</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Submit your enquiry and optionally upload your logo and brochure. The secretariat will follow up.
            </p>
            <EnquiryForm />
          </Card>

          <Card className="mt-6 p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold">Get in touch</p>
            <h3 className="font-display text-2xl font-bold text-primary mt-2">Talk to the secretariat</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              For tailored sponsorship, brand activation or to discuss artwork, reach our team directly.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <a href="mailto:rotarychoba.uniport@gmail.com?subject=Sponsorship%20Enquiry%20—%2016th%20Installation">
                  <Mail className="size-4 mr-2" /> Email the secretariat
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`https://wa.me/${PRESIDENT_WA}?text=${encodeURIComponent("Hello, I'd like to sponsor the 16th Installation Ceremony.")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Phone className="size-4 mr-2" /> WhatsApp the President
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`https://wa.me/${NOMINEE_WA}?text=${encodeURIComponent("Hello, I'd like to sponsor the 16th Installation Ceremony.")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Phone className="size-4 mr-2" /> WhatsApp the President-Nominee
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto px-6 py-10 text-center text-sm">
          <p>{EVENT.club} · Service Above Self · © {new Date().getFullYear()}</p>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-sidebar-foreground/50">
            Website by <span className="text-gold font-semibold">webserve</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function EnquiryForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string; reference: string } | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);

  async function uploadIfPresent(file: File | null, sponsorshipId: string, kind: "logo" | "brochure") {
    if (!file) return null;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${kind} file must be under 10 MB`);
      return null;
    }
    const ext = file.name.split(".").pop() || "bin";
    const path = `${sponsorshipId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("sponsor-files")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) {
      toast.error(`Could not upload ${kind}: ${error.message}`);
      return null;
    }
    return path;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = enquirySchema.safeParse({
      full_name: fd.get("full_name"),
      company: fd.get("company"),
      amount: fd.get("amount") || undefined,
      contact_email: fd.get("contact_email"),
      contact_phone: fd.get("contact_phone"),
      message: fd.get("message"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    const newId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const logoPath = await uploadIfPresent(logoFile, newId, "logo");
    const brochurePath = await uploadIfPresent(brochureFile, newId, "brochure");

    const { error } = await supabase.from("sponsorships").insert({
      id: newId,
      full_name: parsed.data.full_name,
      company: parsed.data.company || null,
      amount: parsed.data.amount ?? null,
      message: parsed.data.message || null,
      contact_email: parsed.data.contact_email || null,
      contact_phone: parsed.data.contact_phone,
      logo_path: logoPath,
      brochure_path: brochurePath,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const reference = `SPN-${newId.slice(0, 8).toUpperCase()}`;
    setDone({ id: newId, reference });
    toast.success("Enquiry submitted");
  }

  if (done) {
    return (
      <div className="mt-5 rounded-lg border-2 border-gold bg-gold/5 p-5 text-sm">
        <p className="font-semibold text-primary flex items-center gap-2">
          <Check className="size-4" /> Thank you — your enquiry was received.
        </p>
        <p className="mt-2 text-muted-foreground">Use this reference when transferring or in any follow-up:</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="rounded bg-background border border-border px-3 py-1.5 font-mono text-base text-primary">
            {done.reference}
          </code>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(done.reference);
              toast.success("Reference copied");
            }}
          >
            <Copy className="size-3.5 mr-1.5" /> Copy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="full_name">Your name *</Label>
          <Input id="full_name" name="full_name" required maxLength={120} className="mt-2" placeholder="Full name" />
        </div>
        <div>
          <Label htmlFor="company">Company / Organization</Label>
          <Input id="company" name="company" maxLength={160} className="mt-2" placeholder="Optional" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="contact_phone">Phone *</Label>
          <Input id="contact_phone" name="contact_phone" type="tel" required className="mt-2" placeholder="+234 800 000 0000" />
        </div>
        <div>
          <Label htmlFor="contact_email">Email</Label>
          <Input id="contact_email" name="contact_email" type="email" className="mt-2" placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <Label htmlFor="amount">Sponsorship amount (NGN)</Label>
        <Input id="amount" name="amount" type="number" min={0} className="mt-2" placeholder="e.g. 250000" />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={3} maxLength={2000} className="mt-2" placeholder="Tell us about your sponsorship intent or any branding requests." />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <FilePicker
          label="Logo (PNG/JPG/SVG)"
          icon={<ImageIcon className="size-4" />}
          accept="image/*,.svg"
          file={logoFile}
          onChange={setLogoFile}
        />
        <FilePicker
          label="Brochure / Profile (PDF)"
          icon={<FileText className="size-4" />}
          accept=".pdf,application/pdf"
          file={brochureFile}
          onChange={setBrochureFile}
        />
      </div>

      <Button type="submit" disabled={submitting} size="lg" className="bg-primary text-primary-foreground">
        {submitting ? "Submitting…" : "Submit sponsorship enquiry"}
      </Button>
    </form>
  );
}

function FilePicker({
  label,
  icon,
  accept,
  file,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <label className="block rounded-lg border-2 border-dashed border-border bg-card hover:bg-secondary/40 transition cursor-pointer p-4 text-sm">
      <div className="flex items-center gap-2 text-primary font-semibold">
        <Upload className="size-4" /> {label}
      </div>
      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
        {icon}
        {file ? file.name : "Click to choose a file (max 10 MB)"}
      </p>
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
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
          className="text-muted-foreground hover:text-primary"
          aria-label="Copy"
        >
          <Copy className="size-3.5" />
        </button>
      </span>
    </div>
  );
}
