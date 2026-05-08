import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TIERS, formatNGN, EVENT } from "@/lib/tiers";
import { Calendar, MapPin, Sparkles, Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full" style={{ background: "var(--gradient-royal)" }} />
            <div className="leading-tight">
              <p className="font-display text-lg font-bold text-primary">Rotary Choba-Uniport</p>
              <p className="text-xs text-muted-foreground">District 9141</p>
            </div>
          </div>
          <Link to="/admin/login" className="text-sm text-muted-foreground hover:text-primary transition">
            Admin
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--gold) 0px, transparent 50%), radial-gradient(circle at 80% 60%, var(--primary) 0px, transparent 50%)",
          }}
        />
        <div className="container mx-auto px-6 py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-gold-foreground"
              style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
            >
              <Sparkles className="size-3.5" />
              Service Above Self
            </span>

            <h1 className="font-display mt-6 text-5xl md:text-7xl font-bold text-primary leading-[1.05]">
              The 16th Installation Ceremony
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground">
              You are cordially invited to celebrate the investiture of the new President & Board of the{" "}
              <span className="text-primary font-semibold">Rotary Club of Choba-Uniport</span>.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <Calendar className="size-5 text-gold" />
                <span className="font-medium">{EVENT.date}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <MapPin className="size-5 text-gold" />
                <span className="font-medium">{EVENT.venue}</span>
              </div>
            </div>

            <div className="mt-10">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8 h-12">
                <Link to="/register">
                  Reserve your seat <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">No account needed — register in under a minute.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-4xl font-bold text-primary">Participation Tiers</h2>
          <p className="mt-3 text-muted-foreground">
            Standard and Premium tiers may be paid at the venue. The VIP tier requires advance payment by transfer.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((tier, i) => (
            <Card
              key={tier.key}
              className={`relative p-8 border-2 ${
                i === 2 ? "border-gold" : "border-border"
              } bg-card transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]`}
            >
              {i === 2 && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: "var(--gradient-gold)", color: "var(--gold-foreground)" }}
                >
                  Most Distinguished
                </span>
              )}
              <p className="text-sm uppercase tracking-widest text-muted-foreground">{tier.name}</p>
              <p className="mt-2 text-4xl font-display font-bold text-primary">{formatNGN(tier.amount)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>

              <ul className="mt-6 space-y-2.5">
                {tier.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm">
                    <Check className="size-4 text-gold mt-0.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {tier.payAtVenue ? "✓ Pay at venue accepted" : "Advance bank transfer required"}
                </p>
              </div>

              <Button asChild className="mt-6 w-full" variant={i === 2 ? "default" : "outline"}>
                <Link to="/register" search={{ tier: tier.key }}>
                  Choose {tier.name}
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto px-6 py-10 text-center text-sm">
          <p className="font-display text-lg">{EVENT.club}</p>
          <p className="mt-2 text-sidebar-foreground/70">
            For enquiries, contact the secretariat. © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
