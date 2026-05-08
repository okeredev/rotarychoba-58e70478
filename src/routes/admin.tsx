import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TIERS, formatNGN } from "@/lib/tiers";
import { toast } from "sonner";
import { LogOut, Search, Users, Wallet, Crown, RefreshCw } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Registration = Database["public"]["Tables"]["registrations"]["Row"];

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/admin/login" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin");

      if (!active) return;
      if (!roles || roles.length === 0) {
        toast.error("This account does not have admin access.");
        await supabase.auth.signOut();
        navigate({ to: "/admin/login" });
        return;
      }
      setIsAdmin(true);
      setAuthChecked(true);
      void loadRows();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/admin/login" });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRows() {
    setLoading(true);
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows(data ?? []);
  }

  async function updateStatus(id: string, status: Registration["payment_status"]) {
    const { error } = await supabase.from("registrations").update({ payment_status: status }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, payment_status: status } : x)));
    toast.success("Updated");
  }

  async function deleteRow(id: string) {
    if (!confirm("Delete this registration? This cannot be undone.")) return;
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Deleted");
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tierFilter !== "all" && r.tier !== tierFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
      );
    });
  }, [rows, search, tierFilter]);

  const stats = useMemo(() => {
    const paid = rows.filter((r) => r.payment_status === "paid");
    const vip = rows.filter((r) => r.tier === "vip");
    const collected = paid.reduce((s, r) => s + r.amount, 0);
    return { total: rows.length, paid: paid.length, vip: vip.length, collected };
  }, [rows]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">Checking access…</div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-display text-xl font-bold">Admin Dashboard</p>
            <p className="text-xs text-sidebar-foreground/70">Rotary Choba-Uniport · 16th Installation</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-sidebar-foreground hover:bg-sidebar-accent">
              <Link to="/">View site</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/admin/login" });
              }}
            >
              <LogOut className="size-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users />} label="Total registrations" value={String(stats.total)} />
          <StatCard icon={<Wallet />} label="Confirmed paid" value={String(stats.paid)} />
          <StatCard icon={<Crown />} label="VIP attendees" value={String(stats.vip)} />
          <StatCard icon={<Wallet />} label="Collected" value={formatNGN(stats.collected)} />
        </div>

        {/* Controls */}
        <Card className="mt-6 p-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              {TIERS.map((t) => (
                <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadRows} disabled={loading}>
            <RefreshCw className={`size-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </Card>

        {/* Table */}
        <Card className="mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      {loading ? "Loading…" : "No registrations yet."}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.full_name}</div>
                      {r.organization && <div className="text-xs text-muted-foreground">{r.organization}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{r.email}</div>
                      <div className="text-xs text-muted-foreground">{r.phone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={r.tier === "vip" ? "default" : "secondary"}
                        className={r.tier === "vip" ? "bg-gold text-gold-foreground" : ""}
                      >
                        {r.tier.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatNGN(r.amount)}</TableCell>
                    <TableCell>
                      <Select
                        value={r.payment_status}
                        onValueChange={(v) => updateStatus(r.id, v as Registration["payment_status"])}
                      >
                        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="pay_at_venue">Pay at venue</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-NG", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteRow(r.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="size-8 rounded-md bg-secondary text-primary flex items-center justify-center [&>svg]:size-4">
          {icon}
        </div>
      </div>
      <p className="font-display text-3xl font-bold text-primary mt-2">{value}</p>
    </Card>
  );
}
