import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, Copy, Heart, Mail, Phone } from "lucide-react";
import { fetchBankInfo, DEFAULT_BANK, type BankInfo } from "@/lib/settings";
import { EVENT } from "@/lib/tiers";
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
          "Partner with the Rotary Club of Choba-Uniport. Sponsor the 16th Installation Ceremony and help fund Service Above Self projects in our community.",
      },
    ],
  }),
});

const PACKAGES = [
  {
    name: "Friend of Rotary",
    amount: "₦100,000",
    perks: ["Acknowledgement in event brochure", "Reserved seat at the ceremony", "Certificate of appreciation"],
  },
  {
    name: "Bronze Partner",
    amount: "₦250,000",
    perks: [
      "Logo placement in event brochure",
      "2 reserved VIP seats",
      "Mention during opening remarks",
      "Certificate of appreciation",
    ],
  },
  {
    name: "Silver Partner",
    amount: "₦500,000",
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

function SponsorPage() {
  const [bank, setBank] = useState<BankInfo>(DEFAULT_BANK);

  useEffect(() => {
    void fetchBankInfo().then(setBank);
  }, []);

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

      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-royal)" }}
      >
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
            Every contribution — at any level — directly supports community projects and the {EVENT.name}.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((p) => (
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
              <ul className="mt-5 space-y-2.5">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm">
                    <Check className="size-4 text-gold mt-0.5 shrink-0" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
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
            <div className="mt-5 grid gap-1 text-sm">
              <BankRow label="Bank" value={bank.bank_name} />
              <BankRow label="Account name" value={bank.account_name} />
              <BankRow label="Account number" value={bank.account_number} />
            </div>
          </Card>

          <Card className="mt-6 p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold">Get in touch</p>
            <h3 className="font-display text-2xl font-bold text-primary mt-2">Talk to the secretariat</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              For tailored sponsorship, brand activation or to send your logo and brochure artwork, reach our team.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <a href="mailto:rotarychobauniport@gmail.com?subject=Sponsorship%20Enquiry%20—%2016th%20Installation">
                  <Mail className="size-4 mr-2" /> Email the secretariat
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="https://wa.me/2348000000000?text=Hello,%20I%27d%20like%20to%20sponsor%20the%2016th%20Installation%20Ceremony.">
                  <Phone className="size-4 mr-2" /> WhatsApp us
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto px-6 py-10 text-center text-sm">
          <p>{EVENT.club} · Service Above Self · © {new Date().getFullYear()}</p>
        </div>
      </footer>
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
