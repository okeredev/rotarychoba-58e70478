import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TIERS, formatNGN, EVENT } from "@/lib/tiers";
import { Calendar, MapPin, Sparkles, Check, ArrowRight, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import rotaryWheel from "@/assets/rotary-wheel.png";
import ceremonyHero from "@/assets/ceremony-hero.jpg";

type Member = {
  id: string;
  full_name: string;
  position: string;
  category: "incoming" | "board";
  bio: string | null;
  photo_url: string | null;
  sort_order: number;
};

type Award = {
  id: string;
  full_name: string;
  citation: string | null;
  photo_url: string | null;
  year: number | null;
  sort_order: number;
};

const AWARD_RULES = [
  "Must not be of questionable character",
  "Must have contributed to humanitarian services",
  "Must be a part- or full sponsor to a club project",
];

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [members, setMembers] = useState<Member[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);

  useEffect(() => {
    supabase
      .from("board_members")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setMembers((data as Member[]) ?? []));
    supabase
      .from("awards")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setAwards((data as Award[]) ?? []));
  }, []);

  const incoming = members.filter((m) => m.category === "incoming");
  const board = members.filter((m) => m.category === "board");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/85 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={rotaryWheel} alt="Rotary International" className="size-11" width={44} height={44} />
            <div className="leading-tight">
              <p className="font-display text-base md:text-lg font-bold text-primary">Rotary Club of Choba-Uniport</p>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">District 9141 · Nigeria</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#tiers" className="text-foreground/80 hover:text-primary transition">Tiers</a>
            <a href="#president" className="text-foreground/80 hover:text-primary transition">President</a>
            <a href="#leadership" className="text-foreground/80 hover:text-primary transition">Leadership</a>
            <a href="#awards" className="text-foreground/80 hover:text-primary transition">Awards</a>
            <Link to="/sponsor" className="text-foreground/80 hover:text-primary transition">Sponsor</Link>
            <Link to="/raffle" className="text-foreground/80 hover:text-primary transition">Raffle</Link>
            <Link to="/receipt" className="text-foreground/80 hover:text-primary transition">My slip</Link>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/register" search={{ tier: "standard" }}>Register</Link>
            </Button>
          </nav>
          <Button asChild size="sm" className="md:hidden bg-primary text-primary-foreground">
            <Link to="/register" search={{ tier: "standard" }}>Register</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={ceremonyHero}
          alt="Installation ceremony venue"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.18 0.05 260 / 0.85) 0%, oklch(0.22 0.06 262 / 0.92) 100%)",
          }}
        />
        <div className="container mx-auto px-6 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center text-white">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ background: "var(--gradient-gold)", color: "var(--gold-foreground)", boxShadow: "var(--shadow-gold)" }}
            >
              <Sparkles className="size-3.5" />
              Service Above Self
            </span>

            <h1 className="font-display mt-6 text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.05] text-white">
              The 16<sup className="text-gold">th</sup> Installation Ceremony
            </h1>
            <p className="mt-5 text-base md:text-xl text-white/80 max-w-2xl mx-auto">
              Join us as we celebrate the investiture of the new President &amp; Board of Directors/Induction of new members and award presentation of the
              <span className="text-gold font-semibold"> Rotary Club of Choba-Uniport</span>.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-gold" />
                <span className="font-medium">{EVENT.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-5 text-gold" />
                <span className="font-medium">{EVENT.venue}</span>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 text-base px-8 h-12 font-semibold">
                <Link to="/register" search={{ tier: "standard" }}>
                  Reserve your seat <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white text-base px-8 h-12">
                <a href="#leadership">Meet the leadership</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-white/60">No account needed — register in under a minute.</p>
          </div>
        </div>
      </section>

      {/* Incoming President */}
      <section id="president" className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-6 py-20">
          {(() => {
            const president = incoming[0];
            return (
              <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_1.2fr] items-center max-w-5xl mx-auto">
                <div className="relative">
                  <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border-4 border-gold/40 shadow-[var(--shadow-elegant)] bg-secondary">
                    <img
                      src={president?.photo_url || "/president-precious.png"}
                      alt={president?.full_name || "Incoming President"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                    style={{ background: "var(--gradient-gold)", color: "var(--gold-foreground)", boxShadow: "var(--shadow-gold)" }}
                  >
                    Incoming · 2026 / 2027
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold">Meet our 16th President</p>
                  <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mt-3 leading-tight">
                    {president?.full_name || "Rtn. Ujons Precious Inemeawaji"}
                  </h2>
                  <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
                    {president?.position || "16th President 2026"} · Rotary Club of Choba-Uniport
                  </p>
                  <p className="mt-5 text-base text-muted-foreground leading-relaxed">
                    {president?.bio ||
                      "We are honoured to welcome our incoming President as she leads the Rotary Club of Choba-Uniport into its 16th Rotary year. Her vision is rooted in Service Above Self — strengthening our impact in education, health, and community development across Rivers State."}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Link to="/register" search={{ tier: "standard" }}>Attend the installation</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-gold text-primary hover:bg-gold/10">
                      <Link to="/sponsor">Become a sponsor</Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Tiers */}
      <section id="tiers" className="container mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold">Participation</p>
          <h2 className="font-display text-4xl font-bold text-primary mt-3">Choose your tier</h2>
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

      {/* Leadership */}
      <section id="leadership" className="bg-secondary/40 border-y border-border">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold">Leadership</p>
            <h2 className="font-display text-4xl font-bold text-primary mt-3">The Incoming Officers</h2>
            <p className="mt-3 text-muted-foreground">
              Honoring those stepping into service for the new Rotary year.
            </p>
          </div>

          {incoming.length === 0 ? (
            <p className="text-center text-muted-foreground italic">Incoming officers will be announced soon.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {incoming.map((m) => (
                <MemberCard key={m.id} member={m} accent />
              ))}
            </div>
          )}

          <div className="text-center max-w-2xl mx-auto mt-20 mb-12">
            <h3 className="font-display text-3xl font-bold text-primary">Board of Directors</h3>
            <p className="mt-3 text-muted-foreground">The trustees serving our club and community.</p>
          </div>

          {board.length === 0 ? (
            <p className="text-center text-muted-foreground italic">Board of Directors will be announced soon.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {board.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Awards & Recognition */}
      <section id="awards" className="container mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold">Recognition</p>
          <h2 className="font-display text-4xl font-bold text-primary mt-3">Awards &amp; Honourees</h2>
          <p className="mt-3 text-muted-foreground">
            Celebrating individuals whose service has uplifted our club and community.
          </p>
        </div>

        <Card className="max-w-3xl mx-auto p-6 md:p-8 border-2 border-gold/30 bg-secondary/30 mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold">Eligibility</p>
          <h3 className="font-display text-xl font-bold text-primary mt-2">Rules for the award</h3>
          <ul className="mt-4 grid gap-2 text-sm">
            {AWARD_RULES.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <Check className="size-4 text-gold mt-0.5 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>

        {awards.length === 0 ? (
          <p className="text-center text-muted-foreground italic">Awardees will be announced soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {awards.map((a) => (
              <Card key={a.id} className="group overflow-hidden p-0 border-2 border-gold/40 bg-card transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
                <div className="aspect-square w-full bg-secondary flex items-center justify-center overflow-hidden">
                  {a.photo_url ? (
                    <img src={a.photo_url} alt={a.full_name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                  ) : (
                    <User className="size-20 text-muted-foreground/40" />
                  )}
                </div>
                <div className="p-5">
                  <p className="font-display text-lg font-bold text-primary leading-tight">{a.full_name}</p>
                  {a.year && <p className="text-xs uppercase tracking-widest text-gold font-semibold mt-1">Honoured · {a.year}</p>}
                  {a.citation && <p className="mt-3 text-sm text-muted-foreground line-clamp-4">{a.citation}</p>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto px-6 py-10 text-center text-sm">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src={rotaryWheel} alt="" className="size-8" width={32} height={32} />
            <p className="font-display text-lg">{EVENT.club}</p>
          </div>
          <p className="text-sidebar-foreground/70">
            For enquiries, contact the secretariat at{" "}
            <a href="mailto:rotarychoba.uniport@gmail.com" className="text-gold hover:underline">
              rotarychoba.uniport@gmail.com
            </a>
            . © {new Date().getFullYear()}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <Link to="/" className="text-sidebar-foreground/70 hover:text-gold">Home</Link>
            <Link to="/register" search={{ tier: "standard" }} className="text-sidebar-foreground/70 hover:text-gold">Register</Link>
            <Link to="/sponsor" className="text-sidebar-foreground/70 hover:text-gold">Sponsor</Link>
            <Link to="/raffle" className="text-sidebar-foreground/70 hover:text-gold">Raffle</Link>
            <Link to="/receipt" className="text-sidebar-foreground/70 hover:text-gold">My slip</Link>
            <a href="#awards" className="text-sidebar-foreground/70 hover:text-gold">Awards</a>
            
          </div>
          <p className="mt-6 text-[11px] uppercase tracking-widest text-sidebar-foreground/50">
            Website by <span className="text-gold font-semibold">webserve integrated services (2348033577433)</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function MemberCard({ member, accent }: { member: Member; accent?: boolean }) {
  return (
    <Card className={`group overflow-hidden p-0 border-2 ${accent ? "border-gold/40" : "border-border"} bg-card transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]`}>
      <div className="aspect-square w-full bg-secondary flex items-center justify-center overflow-hidden">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.full_name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            loading="lazy"
          />
        ) : (
          <User className="size-20 text-muted-foreground/40" />
        )}
      </div>
      <div className="p-5">
        <p className="font-display text-lg font-bold text-primary leading-tight">{member.full_name}</p>
        <p className="text-xs uppercase tracking-widest text-gold font-semibold mt-1">{member.position}</p>
        {member.bio && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{member.bio}</p>}
      </div>
    </Card>
  );
}
