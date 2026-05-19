import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { listAdmins, inviteAdmin, revokeAdmin, updateAdminStatus, updateAdminRole, type AdminUser } from "@/lib/admin-users.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TIERS, formatNGN } from "@/lib/tiers";
import { fetchBankInfo, saveBankInfo, DEFAULT_BANK, type BankInfo } from "@/lib/settings";
import { toast } from "sonner";
import { LogOut, Search, Users, Wallet, Crown, RefreshCw, Plus, Trash2, Pencil, Upload, Download, LayoutDashboard, Handshake, Ticket, Award as AwardIcon, Settings as SettingsIcon, ExternalLink, Eye, Printer, Info, Heart, Check, X, FileText, ScrollText } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { logAudit } from "@/lib/audit";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, SidebarFooter,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Registration = Database["public"]["Tables"]["registrations"]["Row"];
type Member = {
  id: string;
  full_name: string;
  position: string;
  category: "incoming" | "board";
  bio: string | null;
  photo_url: string | null;
  sort_order: number;
};

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [section, setSection] = useState<string>("registrations");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/admin/login" });
        return;
      }
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role, status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!active) return;
      const hasAccess = roleData && roleData.status === "approved";

      if (!active) return;
      if (!hasAccess) {
        toast.error("Access pending or denied. Please contact a super admin.");
        await supabase.auth.signOut();
        navigate({ to: "/admin/login" });
        return;
      }
      setIsAdmin(true);
      setAuthChecked(true);
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

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">Checking access…</div>
    );
  }
  if (!isAdmin) return null;

  const navItems = [
    { key: "registrations", label: "Registrations", icon: Users },
    { key: "sponsorships", label: "Sponsorships", icon: Handshake },
    { key: "raffle", label: "Raffle", icon: Ticket },
    { key: "awards", label: "Awards", icon: AwardIcon },
    { key: "members", label: "Leadership & Board", icon: Crown },
    { key: "goodwill", label: "Goodwill messages", icon: Heart },
    { key: "audit", label: "Audit logs", icon: ScrollText },
    { key: "users", label: "Admin users", icon: Users },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <div className="px-4 py-4 border-b">
              <p className="font-display text-base font-bold text-primary">Admin</p>
              <p className="text-[10px] text-muted-foreground">Rotary Choba-Uniport</p>
            </div>
            <SidebarGroup>
              <SidebarGroupLabel>Manage</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={section === item.key}
                        onClick={() => setSection(item.key)}
                        tooltip={item.label}
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Quick links</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="View site">
                      <Link to="/"><ExternalLink className="size-4" /><span>View site</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Receipt lookup">
                      <Link to="/receipt"><LayoutDashboard className="size-4" /><span>Receipt lookup</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Sign out"
                  onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); }}
                >
                  <LogOut className="size-4" /><span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border bg-sidebar text-sidebar-foreground px-4">
            <SidebarTrigger className="text-sidebar-foreground" />
            <div className="flex-1">
              <p className="font-display text-lg font-bold capitalize">{navItems.find((n) => n.key === section)?.label ?? "Admin"}</p>
              <p className="text-[11px] text-sidebar-foreground/70">16th Installation Dashboard</p>
            </div>
          </header>
          <main className="flex-1 container mx-auto px-6 py-8">
            {section === "registrations" && <RegistrationsPanel />}
            {section === "sponsorships" && <SponsorshipsPanel />}
            {section === "raffle" && <RafflePanel />}
            {section === "awards" && <AwardsPanel />}
            {section === "members" && <MembersPanel />}
            {section === "goodwill" && <GoodwillPanel />}
            {section === "audit" && <AuditLogsPanel />}
            {section === "users" && <UsersPanel />}
            {section === "settings" && <SettingsPanel />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function RegistrationsPanel() {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const [detail, setDetail] = useState<Registration | null>(null);

  useEffect(() => { void loadRows(); }, []);

  async function loadRows() {
    setLoading(true);
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setRows(data ?? []);
  }

  async function updateStatus(id: string, status: Registration["payment_status"]) {
    const { error } = await supabase.from("registrations").update({ payment_status: status }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, payment_status: status } : x)));
    toast.success("Updated");
  }

  function buildExportRows() {
    const headers = [
      "Reference", "Registered", "Title", "Full Name", "Email", "Phone", "Position", "Organization",
      "Rotary Club", "Address", "Tier", "Amount (NGN)", "Guests", "Payment Method",
      "Payment Status", "Payment Reference", "Payment Proof URL", "Notes",
    ];
    const data = filtered.map((r) => [
      displayRef(r),
      new Date(r.created_at).toISOString(),
      r.title, r.full_name, r.email, r.phone, r.position, r.organization,
      r.rotary_club, r.address, r.tier?.toUpperCase(), r.amount, r.guests_count, r.payment_method,
      r.payment_status, r.payment_reference, r.payment_proof_url, r.notes,
    ]);
    return { headers, data };
  }

  function exportCsv() {
    if (filtered.length === 0) return toast.error("Nothing to export");
    const { headers, data } = buildExportRows();
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(","), ...data.map((row) => row.map(esc).join(","))];
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, `registrations-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`Exported ${filtered.length} row${filtered.length > 1 ? "s" : ""} as CSV`);
  }

  function exportXls() {
    if (filtered.length === 0) return toast.error("Nothing to export");
    const { headers, data } = buildExportRows();
    const esc = (v: unknown) =>
      String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const thead = `<tr>${headers.map((h) => `<th style="background:#0a1f44;color:#fff">${esc(h)}</th>`).join("")}</tr>`;
    const tbody = data
      .map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
      .join("");
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8"/></head>
<body><table border="1">${thead}${tbody}</table></body></html>`;
    const blob = new Blob(["\ufeff" + html], { type: "application/vnd.ms-excel" });
    triggerDownload(blob, `registrations-${new Date().toISOString().slice(0, 10)}.xls`);
    toast.success(`Exported ${filtered.length} row${filtered.length > 1 ? "s" : ""} as XLS`);
  }

  async function deleteRow(id: string) {
    if (!confirm("Delete this registration? This cannot be undone.")) return;
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Deleted");
  }

  const filtered = useMemo(() => rows.filter((r) => {
    if (tierFilter !== "all" && r.tier !== tierFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return r.full_name.toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q) || r.phone.toLowerCase().includes(q);
  }), [rows, search, tierFilter]);

  const stats = useMemo(() => {
    const paid = rows.filter((r) => r.payment_status === "paid");
    const vip = rows.filter((r) => r.tier === "vip");
    return { total: rows.length, paid: paid.length, vip: vip.length, collected: paid.reduce((s, r) => s + r.amount, 0) };
  }, [rows]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users />} label="Total registrations" value={String(stats.total)} />
        <StatCard icon={<Wallet />} label="Confirmed paid" value={String(stats.paid)} />
        <StatCard icon={<Crown />} label="VIP attendees" value={String(stats.vip)} />
        <StatCard icon={<Wallet />} label="Collected" value={formatNGN(stats.collected)} />
      </div>

      <Card className="mt-6 p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, email, phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            {TIERS.map((t) => (<SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadRows} disabled={loading}>
          <RefreshCw className={`size-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
        <Button onClick={exportCsv} disabled={loading || filtered.length === 0} variant="outline">
          <Download className="size-4 mr-1" /> CSV
        </Button>
        <Button onClick={exportXls} disabled={loading || filtered.length === 0} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Download className="size-4 mr-1" /> Excel (XLS)
        </Button>
      </Card>

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
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">{loading ? "Loading…" : "No registrations yet."}</TableCell></TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">
                      {r.title ? `${r.title} ` : ""}{r.full_name}
                    </div>
                    {(r.position || r.organization) && (
                      <div className="text-xs text-muted-foreground">
                        {[r.position, r.organization].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    {r.rotary_club && <div className="text-xs text-muted-foreground italic">{r.rotary_club}</div>}
                    {r.guests_count > 0 && <div className="text-xs text-gold font-medium mt-0.5">+{r.guests_count} guest{r.guests_count > 1 ? "s" : ""}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{r.email}</div>
                    <div className="text-xs text-muted-foreground">{r.phone}</div>
                    {r.address && <div className="text-xs text-muted-foreground mt-0.5 max-w-[220px] truncate" title={r.address}>{r.address}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.tier === "vip" ? "default" : "secondary"} className={r.tier === "vip" ? "bg-gold text-gold-foreground" : ""}>{r.tier.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{formatNGN(r.amount)}</TableCell>
                  <TableCell>
                    <Select value={r.payment_status} onValueChange={(v) => updateStatus(r.id, v as Registration["payment_status"])}>
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="pay_at_venue">Pay at venue</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    {r.payment_proof_url ? (
                      <button type="button" onClick={() => openProofInNewTab(r.payment_proof_url)} className="mt-1 inline-block text-xs text-primary hover:underline">
                        View proof
                      </button>
                    ) : (
                      r.payment_method === "pay_now" && <div className="mt-1 text-xs text-muted-foreground">No proof yet</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => setDetail(r)}><Eye className="size-4 mr-1" />View</Button>
                    <Button size="sm" variant="ghost" onClick={() => printSlip(r)} title="Print slip"><Printer className="size-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteRow(r.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <RegistrationDetailDialog
        registration={detail}
        open={!!detail}
        onOpenChange={(v) => { if (!v) setDetail(null); }}
        onPrint={(r) => printSlip(r)}
        onUpdated={(updated) => {
          setRows((rs) => rs.map((x) => (x.id === updated.id ? updated : x)));
          setDetail(updated);
        }}
      />
    </>
  );
}

function displayRef(r: Registration) {
  return r.payment_reference?.trim() || r.id.slice(0, 8).toUpperCase();
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const escHtml = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

async function openProofInNewTab(pathOrUrl: string | null) {
  if (!pathOrUrl) return;
  let url = pathOrUrl;
  if (!/^https?:\/\//i.test(pathOrUrl)) {
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(pathOrUrl, 3600);
    if (error || !data) { toast.error(error?.message || "Could not open proof"); return; }
    url = data.signedUrl;
  }
  window.open(url, "_blank", "noopener");
}

function printSlip(r: Registration) {
  const ref = escHtml(displayRef(r));
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Slip ${ref}</title>
    <style>
      body{font-family:system-ui,-apple-system,sans-serif;padding:32px;color:#0a1f44;max-width:640px;margin:auto}
      h1{color:#0a1f44;margin:0 0 4px;font-size:22px}
      .muted{color:#666;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      td{padding:8px 4px;border-bottom:1px solid #eee;font-size:14px;vertical-align:top}
      td:first-child{color:#666;width:40%}
      .ref{font-family:ui-monospace,monospace;font-size:18px;font-weight:700;letter-spacing:1px;background:#f5f0e0;padding:8px 12px;border-radius:6px;display:inline-block;margin-top:8px}
      .badge{display:inline-block;padding:2px 8px;border-radius:4px;background:#0a1f44;color:#fff;font-size:11px;text-transform:uppercase}
      @media print{button{display:none}}
    </style></head><body>
    <h1>Rotary Club of Choba-Uniport</h1>
    <p class="muted">16th Installation · Registration Slip</p>
    <div class="ref">REF: ${ref}</div>
    <table>
      <tr><td>Attendee</td><td>${escHtml([r.title, r.full_name].filter(Boolean).join(" "))}</td></tr>
      <tr><td>Email</td><td>${escHtml(r.email ?? "—")}</td></tr>
      <tr><td>Phone</td><td>${escHtml(r.phone)}</td></tr>
      <tr><td>Position / Org</td><td>${escHtml([r.position, r.organization].filter(Boolean).join(" · ") || "—")}</td></tr>
      <tr><td>Rotary Club</td><td>${escHtml(r.rotary_club ?? "—")}</td></tr>
      <tr><td>Address</td><td>${escHtml(r.address ?? "—")}</td></tr>
      <tr><td>Tier</td><td><span class="badge">${escHtml(r.tier.toUpperCase())}</span></td></tr>
      <tr><td>Amount</td><td><strong>₦${escHtml(r.amount.toLocaleString())}</strong></td></tr>
      <tr><td>Guests</td><td>${escHtml(String(r.guests_count))}</td></tr>
      <tr><td>Payment method</td><td>${escHtml(r.payment_method)}</td></tr>
      <tr><td>Payment status</td><td>${escHtml(r.payment_status)}</td></tr>
      <tr><td>Internal ID</td><td style="font-family:ui-monospace,monospace;font-size:11px">${escHtml(r.id)}</td></tr>
      <tr><td>Registered</td><td>${escHtml(new Date(r.created_at).toLocaleString())}</td></tr>
    </table>
    <p class="muted" style="margin-top:24px">Please present this slip at the venue.</p>
    <button onclick="window.print()" style="margin-top:16px;padding:8px 16px;background:#0a1f44;color:#fff;border:0;border-radius:6px;cursor:pointer">Print</button>
    </body></html>`;
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) { toast.error("Pop-up blocked"); return; }
  w.document.write(html);
  w.document.close();
}

async function downloadPaymentProof(r: Registration) {
  if (!r.payment_proof_url) return;
  try {
    let url = r.payment_proof_url;
    if (!/^https?:\/\//i.test(url)) {
      const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(url, 3600);
      if (error || !data) throw new Error(error?.message || "Could not sign URL");
      url = data.signedUrl;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const ext = (url.split("?")[0].split(".").pop() || "jpg").toLowerCase();
    const ref = displayRef(r);
    const safeName = r.full_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = `payment-proof-${ref}-${safeName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objUrl);
    toast.success("Proof downloaded");
  } catch (e) {
    toast.error(`Could not download: ${(e as Error).message}`);
  }
}

function RegistrationDetailDialog({ registration, open, onOpenChange, onPrint, onUpdated }: {
  registration: Registration | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPrint: (r: Registration) => void;
  onUpdated: (r: Registration) => void;
}) {
  const [status, setStatus] = useState<Registration["payment_status"]>("pending");
  const [method, setMethod] = useState<string>("pay_at_venue");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (registration) {
      setStatus(registration.payment_status);
      setMethod(registration.payment_method);
    }
  }, [registration]);

  if (!registration) return null;
  const r = registration;
  const ref = displayRef(r);
  const dirty = status !== r.payment_status || method !== r.payment_method;

  async function save() {
    setSaving(true);
    const { data, error } = await supabase
      .from("registrations")
      .update({ payment_status: status, payment_method: method })
      .eq("id", r.id)
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    if (data) onUpdated(data as Registration);
    toast.success("Saved");
  }

  const rows: Array<[string, React.ReactNode]> = [
    ["Reference", <span className="font-mono font-semibold">{ref}</span>],
    ["Internal ID", <span className="font-mono text-xs break-all">{r.id}</span>],
    ["Title", r.title || "—"],
    ["Full name", r.full_name],
    ["Email", r.email || "—"],
    ["Phone", r.phone],
    ["Position", r.position || "—"],
    ["Organization", r.organization || "—"],
    ["Occupation", r.occupation || "—"],
    ["Rotary club", r.rotary_club || "—"],
    ["Address", r.address || "—"],
    ["Tier", r.tier.toUpperCase()],
    ["Amount", formatNGN(r.amount)],
    ["Guests", r.guests_count],
    ["Payment reference", r.payment_reference || "—"],
    ["Notes", r.notes || "—"],
    ["Created", new Date(r.created_at).toLocaleString()],
    ["Last updated", new Date(r.updated_at).toLocaleString()],
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registration details · {ref}</DialogTitle>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3 p-3 border rounded-md bg-muted/30">
          <div className="grid gap-1.5">
            <Label className="text-xs">Payment status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Registration["payment_status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pay_at_venue">Pay at venue</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Payment method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pay_now">Pay now (transfer)</SelectItem>
                <SelectItem value="pay_at_venue">Pay at venue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button onClick={save} disabled={!dirty || saving} size="sm" className="bg-primary text-primary-foreground">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        <div className="grid gap-px bg-border rounded-md overflow-hidden text-sm mt-3">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[160px_1fr] gap-2 bg-card p-3">
              <div className="text-muted-foreground">{k}</div>
              <div className="break-words">{v}</div>
            </div>
          ))}
        </div>
        {r.payment_proof_url && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Payment proof</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openProofInNewTab(r.payment_proof_url)}>
                  <Eye className="size-4 mr-1" /> Open
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadPaymentProof(r)}>
                  <Download className="size-4 mr-1" /> Download
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">Click Open to view in a new tab (signed URL, expires after 1 hour).</p>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => onPrint(r)} className="bg-primary text-primary-foreground">
            <Printer className="size-4 mr-1" /> Print slip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MembersPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Member | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("board_members").select("*").order("sort_order", { ascending: true });
    setLoading(false);
    if (error) return toast.error(error.message);
    setMembers((data as Member[]) ?? []);
  }

  async function remove(id: string) {
    if (!confirm("Remove this member?")) return;
    const { error } = await supabase.from("board_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setMembers((m) => m.filter((x) => x.id !== id));
    toast.success("Removed");
  }

  function openNew() { setEditing(null); setOpen(true); }
  function openEdit(m: Member) { setEditing(m); setOpen(true); }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary">Leadership & Board</h2>
          <p className="text-sm text-muted-foreground">Members shown here appear on the public homepage.</p>
        </div>
        <Button onClick={openNew} className="bg-primary text-primary-foreground"><Plus className="size-4 mr-1" /> Add member</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">{loading ? "Loading…" : "No members added yet."}</TableCell></TableRow>
              )}
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.photo_url
                      ? <img src={m.photo_url} alt="" className="size-10 rounded-full object-cover" />
                      : <div className="size-10 rounded-full bg-secondary" />}
                  </TableCell>
                  <TableCell className="font-medium">{m.full_name}</TableCell>
                  <TableCell>{m.position}</TableCell>
                  <TableCell>
                    <Badge variant={m.category === "incoming" ? "default" : "secondary"} className={m.category === "incoming" ? "bg-gold text-gold-foreground" : ""}>
                      {m.category === "incoming" ? "Incoming Officer" : "Board"}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.sort_order}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(m)}><Pencil className="size-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(m.id)}><Trash2 className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <MemberDialog
        open={open}
        onOpenChange={setOpen}
        member={editing}
        onSaved={() => { setOpen(false); void load(); }}
      />
    </>
  );
}

function MemberDialog({ open, onOpenChange, member, onSaved }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  member: Member | null;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [category, setCategory] = useState<"incoming" | "board">("board");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName(member?.full_name ?? "");
      setPosition(member?.position ?? "");
      setCategory(member?.category ?? "board");
      setBio(member?.bio ?? "");
      setPhotoUrl(member?.photo_url ?? "");
      setSortOrder(member?.sort_order ?? 0);
    }
  }, [open, member]);

  async function handleUpload(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("member-photos").upload(path, file, { upsert: false });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("member-photos").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
    setUploading(false);
    toast.success("Photo uploaded");
  }

  async function save() {
    if (!fullName.trim() || !position.trim()) return toast.error("Name and position are required");
    setSaving(true);
    const payload = {
      full_name: fullName.trim(),
      position: position.trim(),
      category,
      bio: bio.trim() || null,
      photo_url: photoUrl || null,
      sort_order: Number(sortOrder) || 0,
    };
    const { error } = member
      ? await supabase.from("board_members").update(payload).eq("id", member.id)
      : await supabase.from("board_members").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(member ? "Updated" : "Added");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? "Edit member" : "Add new member"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
              {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <Users className="size-8 text-muted-foreground" />}
            </div>
            <div>
              <Label htmlFor="photo" className="cursor-pointer inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent">
                <Upload className="size-4" /> {uploading ? "Uploading…" : "Upload photo"}
              </Label>
              <input id="photo" type="file" accept="image/*" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f); }}
              />
              <p className="text-xs text-muted-foreground mt-1">JPG/PNG, square works best</p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rtn. John Doe" />
          </div>
          <div className="grid gap-2">
            <Label>Position / Title</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Incoming President" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as "incoming" | "board")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming">Incoming Officer</SelectItem>
                  <SelectItem value="board">Board of Directors</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1">
                Display order
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Lower numbers appear first. Use 1, 2, 3… to reorder how members show on the homepage.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Short bio (optional)</Label>
            <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A brief description..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? "Saving…" : "Save member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="size-8 rounded-md bg-secondary text-primary flex items-center justify-center [&>svg]:size-4">{icon}</div>
      </div>
      <p className="font-display text-3xl font-bold text-primary mt-2">{value}</p>
    </Card>
  );
}

function SettingsPanel() {
  const [bank, setBank] = useState<BankInfo>(DEFAULT_BANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchBankInfo().then((b) => { setBank(b); setLoading(false); });
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await saveBankInfo(bank);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Bank details saved");
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl font-bold text-primary">Bank account for transfers</h2>
      <p className="text-sm text-muted-foreground mt-1">
        These details appear on every receipt and the pay-now flow. Changes take effect immediately.
      </p>

      <Card className="mt-5 p-6 grid gap-4">
        <div className="grid gap-2">
          <Label>Bank name</Label>
          <Input
            disabled={loading}
            value={bank.bank_name}
            onChange={(e) => setBank({ ...bank, bank_name: e.target.value })}
            placeholder="e.g. Zenith Bank"
          />
        </div>
        <div className="grid gap-2">
          <Label>Account name</Label>
          <Input
            disabled={loading}
            value={bank.account_name}
            onChange={(e) => setBank({ ...bank, account_name: e.target.value })}
            placeholder="e.g. Rotary Club of Choba-Uniport"
          />
        </div>
        <div className="grid gap-2">
          <Label>Account number</Label>
          <Input
            disabled={loading}
            value={bank.account_number}
            onChange={(e) => setBank({ ...bank, account_number: e.target.value })}
            placeholder="10-digit account number"
            inputMode="numeric"
          />
        </div>
        <div className="pt-2">
          <Button onClick={save} disabled={saving || loading} className="bg-primary text-primary-foreground">
            {saving ? "Saving…" : "Save bank details"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// SPONSORSHIPS PANEL
// ============================================================================
type Sponsorship = {
  id: string;
  full_name: string;
  company: string | null;
  amount: number | null;
  message: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  logo_path: string | null;
  brochure_path: string | null;
  status: "new" | "contacted" | "confirmed" | "declined";
  created_at: string;
};

function SponsorshipsPanel() {
  const [rows, setRows] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sponsorships")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data as Sponsorship[]) ?? []);
  }

  async function setStatus(id: string, status: Sponsorship["status"]) {
    const { error } = await supabase.from("sponsorships").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success("Updated");
  }

  async function openSigned(path: string) {
    const { data, error } = await supabase.storage.from("sponsor-files").createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) return toast.error(error?.message || "Could not generate link");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function remove(id: string) {
    if (!confirm("Delete this sponsorship enquiry?")) return;
    const { error } = await supabase.from("sponsorships").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Deleted");
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-primary mb-4">Sponsorship enquiries</h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Sponsor</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">{loading ? "Loading…" : "No enquiries yet."}</TableCell></TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="font-medium">{r.full_name}</div>
                    {r.company && <div className="text-xs text-muted-foreground">{r.company}</div>}
                    {r.message && <div className="text-xs text-muted-foreground italic mt-1 max-w-xs line-clamp-2" title={r.message}>{r.message}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{r.contact_phone}</div>
                    {r.contact_email && <div className="text-xs text-muted-foreground">{r.contact_email}</div>}
                  </TableCell>
                  <TableCell>{r.amount ? formatNGN(r.amount) : "—"}</TableCell>
                  <TableCell className="space-x-1">
                    {r.logo_path && <Button size="sm" variant="ghost" onClick={() => openSigned(r.logo_path!)}>Logo</Button>}
                    {r.brochure_path && <Button size="sm" variant="ghost" onClick={() => openSigned(r.brochure_path!)}>Brochure</Button>}
                    {!r.logo_path && !r.brochure_path && <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={(v) => setStatus(r.id, v as Sponsorship["status"])}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// RAFFLE PANEL
// ============================================================================
type RaffleSale = {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string | null;
  pack: "single" | "pack20";
  qty: number;
  amount: number;
  payment_status: "pending" | "paid" | "pay_at_venue" | "cancelled";
  payment_method: "pay_now" | "pay_at_venue";
  payment_proof_url: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
};

function RafflePanel() {
  const [rows, setRows] = useState<RaffleSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pack, setPack] = useState<"single" | "pack20">("single");
  const [qty, setQty] = useState(1);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("raffle_sales").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data as RaffleSale[]) ?? []);
  }

  const unitPrice = pack === "single" ? 500 : 5000;
  const amount = unitPrice * qty;

  async function add() {
    if (!name.trim() || !phone.trim()) return toast.error("Name and phone required");
    const ref = `RAF-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await supabase.from("raffle_sales").insert({
      buyer_name: name.trim(), buyer_phone: phone.trim(),
      pack, qty, amount, reference: ref, payment_status: "paid",
    });
    if (error) return toast.error(error.message);
    setName(""); setPhone(""); setQty(1);
    void load();
    toast.success(`Recorded · ${ref}`);
  }

  async function setStatus(id: string, status: RaffleSale["payment_status"]) {
    const { error } = await supabase.from("raffle_sales").update({ payment_status: status }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, payment_status: status } : x)));
  }

  async function remove(id: string) {
    if (!confirm("Delete this raffle sale?")) return;
    const { error } = await supabase.from("raffle_sales").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  const totals = useMemo(() => {
    const paid = rows.filter((r) => r.payment_status === "paid");
    return { tickets: paid.reduce((s, r) => s + r.qty * (r.pack === "pack20" ? 20 : 1), 0), revenue: paid.reduce((s, r) => s + r.amount, 0) };
  }, [rows]);

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-primary mb-1">Raffle ticket sales</h2>
      <p className="text-sm text-muted-foreground mb-4">Single ticket: ₦500 · Pack of 20: ₦5,000</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <StatCard icon={<Wallet />} label="Tickets sold (paid)" value={String(totals.tickets)} />
        <StatCard icon={<Wallet />} label="Revenue" value={formatNGN(totals.revenue)} />
      </div>

      <Card className="p-4 mb-4 grid gap-3 md:grid-cols-[1fr_1fr_140px_100px_auto]">
        <Input placeholder="Buyer name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Select value={pack} onValueChange={(v) => setPack(v as "single" | "pack20")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single (₦500)</SelectItem>
            <SelectItem value="pack20">Pack of 20 (₦5,000)</SelectItem>
          </SelectContent>
        </Select>
        <Input type="number" min={1} value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} />
        <Button onClick={add} className="bg-primary text-primary-foreground"><Plus className="size-4 mr-1" /> Add · {formatNGN(amount)}</Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Pack</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-12">{loading ? "Loading…" : "No sales recorded yet."}</TableCell></TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell><div className="font-medium">{r.buyer_name}</div><div className="text-xs text-muted-foreground">{r.buyer_phone}</div></TableCell>
                  <TableCell>{r.pack === "pack20" ? "Pack of 20" : "Single"}</TableCell>
                  <TableCell>
                    <div className="font-medium">{r.qty} {r.pack === "pack20" ? "pack(s)" : "ticket(s)"}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">
                      Total: {r.qty * (r.pack === "pack20" ? 20 : 1)} tickets
                    </div>
                  </TableCell>
                  <TableCell>{formatNGN(r.amount)}</TableCell>
                  <TableCell className="text-xs">{r.payment_method === "pay_now" ? "Transfer" : "At venue"}</TableCell>
                  <TableCell>
                    {r.payment_proof_url ? (
                      <a href={r.payment_proof_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs font-medium">
                        <Eye className="size-3.5" /> View proof
                        {r.payment_status === "pending" && (
                          <span className="size-2 rounded-full bg-amber-500 animate-pulse ml-1" title="New proof to verify" />
                        )}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                  <TableCell>
                    <Select value={r.payment_status} onValueChange={(v) => setStatus(r.id, v as RaffleSale["payment_status"])}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="pay_at_venue">At venue</SelectItem>
                        <SelectItem value="paid">Paid (Approved)</SelectItem>
                        <SelectItem value="cancelled">Cancelled (Rejected)</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// AWARDS PANEL
// ============================================================================
type Award = {
  id: string;
  full_name: string;
  citation: string | null;
  photo_url: string | null;
  year: number | null;
  sort_order: number;
};

function AwardsPanel() {
  const [rows, setRows] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [citation, setCitation] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [sortOrder, setSortOrder] = useState(0);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("awards").select("*").order("sort_order", { ascending: true });
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data as Award[]) ?? []);
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `awards/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("member-photos").upload(path, file, { upsert: false });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("member-photos").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
    setUploading(false);
    toast.success("Photo uploaded");
  }

  async function add() {
    if (!name.trim()) return toast.error("Name required");
    const { error } = await supabase.from("awards").insert({
      full_name: name.trim(),
      citation: citation.trim() || null,
      photo_url: photoUrl || null,
      year: year || null,
      sort_order: sortOrder || 0,
    });
    if (error) return toast.error(error.message);
    setName(""); setCitation(""); setPhotoUrl(""); setSortOrder(0);
    void load();
    toast.success("Awardee added");
  }

  async function remove(id: string) {
    if (!confirm("Remove this awardee?")) return;
    const { error } = await supabase.from("awards").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-primary mb-1">Awards &amp; Honourees</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Awardees appear on the homepage Awards section. Display order controls the order shown (lower = first).
      </p>

      <Card className="p-4 mb-4 grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Awardee full name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex items-center gap-2">
            {photoUrl && <img src={photoUrl} alt="" className="size-10 rounded-full object-cover" />}
            <Label htmlFor="awphoto" className="cursor-pointer inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent">
              <Upload className="size-4" /> {uploading ? "Uploading…" : photoUrl ? "Replace photo" : "Upload photo"}
            </Label>
            <input id="awphoto" type="file" accept="image/*" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadPhoto(f); }} />
          </div>
        </div>
        <Textarea rows={2} placeholder="Citation (why they're being honoured)" value={citation} onChange={(e) => setCitation(e.target.value)} />
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label className="text-xs">Year</Label>
            <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())} />
          </div>
          <div>
            <Label className="text-xs">Display order (lower = first)</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} />
          </div>
          <div className="flex items-end"><Button onClick={add} className="bg-primary text-primary-foreground w-full"><Plus className="size-4 mr-1" /> Add awardee</Button></div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Citation</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">{loading ? "Loading…" : "No awardees yet."}</TableCell></TableRow>
              )}
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.photo_url ? <img src={a.photo_url} alt="" className="size-10 rounded-full object-cover" /> : <div className="size-10 rounded-full bg-secondary" />}</TableCell>
                  <TableCell className="font-medium">{a.full_name}</TableCell>
                  <TableCell>{a.year ?? "—"}</TableCell>
                  <TableCell className="max-w-sm text-xs text-muted-foreground line-clamp-2">{a.citation ?? "—"}</TableCell>
                  <TableCell>{a.sort_order}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(a.id)}><Trash2 className="size-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// ADMIN USERS PANEL
// ============================================================================
function UsersPanel() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [myRole, setMyRole] = useState<string>("admin");

  const listFn = useServerFn(listAdmins);
  const inviteFn = useServerFn(inviteAdmin);
  const revokeFn = useServerFn(revokeAdmin);
  const statusFn = useServerFn(updateAdminStatus);
  const roleFn = useServerFn(updateAdminRole);

  useEffect(() => { 
    void load(); 
    // Get current user role
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle().then(({ data }) => {
          if (data) setMyRole(data.role);
        });
      }
    });
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await listFn();
      setAdmins(res?.admins || []);
    } catch (err) {
      console.error("List admins error:", err);
      toast.error("Failed to load admin users");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteFn({ data: { email: inviteEmail.trim(), redirectTo: `${window.location.origin}/admin` } });
      toast.success("Admin invited/approved");
      setInviteEmail("");
      void load();
    } catch (err) {
      toast.error("Failed to invite admin");
    } finally {
      setInviting(false);
    }
  }

  async function updateStatus(userId: string, status: "approved" | "rejected") {
    try {
      await statusFn({ data: { user_id: userId, status } });
      toast.success(`User ${status}`);
      void load();
    } catch (err) {
      toast.error("Action failed");
    }
  }

  async function updateRole(userId: string, role: "admin" | "super_admin") {
    try {
      await roleFn({ data: { user_id: userId, role } });
      toast.success(`Role updated to ${role}`);
      void load();
    } catch (err) {
      toast.error("Failed to update role");
    }
  }

  async function handleRevoke(userId: string) {
    if (!confirm("Revoke all admin access for this user?")) return;
    try {
      await revokeFn({ data: { user_id: userId } });
      toast.success("Access revoked");
      void load();
    } catch (err) {
      toast.error("Action failed");
    }
  }

  const isSuper = myRole === "super_admin";

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary">Admin Users</h2>
          <p className="text-sm text-muted-foreground">Manage who can access this dashboard and their roles.</p>
        </div>
      </div>

      {isSuper && (
        <Card className="p-4 mb-6 flex gap-3">
          <Input 
            placeholder="Invite by email (auto-approves)" 
            value={inviteEmail} 
            onChange={(e) => setInviteEmail(e.target.value)} 
          />
          <Button onClick={handleInvite} disabled={inviting} className="bg-primary text-primary-foreground">
            {inviting ? "Inviting..." : "Invite / Approve"}
          </Button>
        </Card>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              {isSuper && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Loading users...</TableCell></TableRow>
            ) : (admins?.length || 0) === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No admin users found.</TableCell></TableRow>
            ) : (
              (admins || []).map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell>
                    <div className="font-medium">{u.email}</div>
                    <div className="text-xs text-muted-foreground">Joined {new Date(u.created_at || "").toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === "approved" ? "default" : u.status === "pending" ? "secondary" : "destructive"}>
                      {u.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isSuper && !u.is_self ? (
                      <Select value={u.role} onValueChange={(v) => updateRole(u.user_id, v as "admin" | "super_admin")}>
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm capitalize">{u.role}</span>
                    )}
                  </TableCell>
                  {isSuper && (
                    <TableCell className="text-right space-x-2">
                      {!u.is_self && u.status === "pending" && (
                        <Button size="sm" onClick={() => updateStatus(u.user_id, "approved")} className="bg-emerald-600 hover:bg-emerald-700 text-white">Approve</Button>
                      )}
                      {!u.is_self && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRevoke(u.user_id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

type GoodwillMessage = Database["public"]["Tables"]["goodwill_messages"]["Row"];
type GoodwillStatusFilter = "all" | "pending" | "approved" | "rejected";

const GOODWILL_BUCKET = "goodwill-photos";
const GOODWILL_DOC_BUCKET = "goodwill-documents";

function goodwillPhotoUrl(pathOrUrl: string | null): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return supabase.storage.from(GOODWILL_BUCKET).getPublicUrl(pathOrUrl).data.publicUrl;
}

function goodwillDocUrl(pathOrUrl: string | null): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return supabase.storage.from(GOODWILL_DOC_BUCKET).getPublicUrl(pathOrUrl).data.publicUrl;
}

function GoodwillPanel() {
  const [items, setItems] = useState<GoodwillMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<GoodwillStatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("goodwill_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, statusFilter, dateFrom, dateTo, sortOrder, pageSize]);

  const setStatus = async (id: string, status: "approved" | "rejected" | "pending") => {
    const { error } = await supabase
      .from("goodwill_messages")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    await logAudit(`goodwill.${status}`, "goodwill_messages", id, { status });
    toast.success(`Message ${status}`);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const msg = items.find((i) => i.id === id);
    if (msg?.photo_url && !/^https?:\/\//i.test(msg.photo_url)) {
      await supabase.storage.from(GOODWILL_BUCKET).remove([msg.photo_url]);
    }
    if (msg?.document_url && !/^https?:\/\//i.test(msg.document_url)) {
      await supabase.storage.from(GOODWILL_DOC_BUCKET).remove([msg.document_url]);
    }
    const { error } = await supabase.from("goodwill_messages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await logAudit("goodwill.delete", "goodwill_messages", id, { sender_name: msg?.sender_name });
    toast.success("Deleted");
    load();
  };

  const removePhoto = async (m: GoodwillMessage) => {
    if (!m.photo_url) return;
    if (!confirm("Remove this photo from the submission?")) return;
    if (!/^https?:\/\//i.test(m.photo_url)) {
      await supabase.storage.from(GOODWILL_BUCKET).remove([m.photo_url]);
    }
    const { error } = await supabase
      .from("goodwill_messages")
      .update({ photo_url: null })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    await logAudit("goodwill.photo_remove", "goodwill_messages", m.id, {});
    toast.success("Photo removed");
    load();
  };

  const removeDocument = async (m: GoodwillMessage) => {
    if (!m.document_url) return;
    if (!confirm("Remove the attached document?")) return;
    if (!/^https?:\/\//i.test(m.document_url)) {
      await supabase.storage.from(GOODWILL_DOC_BUCKET).remove([m.document_url]);
    }
    const { error } = await supabase
      .from("goodwill_messages")
      .update({ document_url: null })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    await logAudit("goodwill.document_remove", "goodwill_messages", m.id, {});
    toast.success("Document removed");
    load();
  };

  const triggerReplace = (id: string) => {
    setReplaceTargetId(id);
    replaceInputRef.current?.click();
  };

  const onReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = replaceTargetId;
    e.target.value = "";
    setReplaceTargetId(null);
    if (!file || !id) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    const m = items.find((i) => i.id === id);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(GOODWILL_BUCKET).upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (upErr) throw upErr;
      if (m?.photo_url && !/^https?:\/\//i.test(m.photo_url)) {
        await supabase.storage.from(GOODWILL_BUCKET).remove([m.photo_url]);
      }
      const { error } = await supabase
        .from("goodwill_messages")
        .update({ photo_url: path })
        .eq("id", id);
      if (error) throw error;
      await logAudit("goodwill.photo_replace", "goodwill_messages", id, { path });
      toast.success("Photo replaced");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to replace photo");
    }
  };

  const q = search.trim().toLowerCase();
  const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
  const toTs = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
  const filtered = items.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (q) {
      const hay = `${m.sender_name} ${m.sender_role ?? ""} ${m.message}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    const ts = m.created_at ? new Date(m.created_at).getTime() : 0;
    if (fromTs !== null && ts < fromTs) return false;
    if (toTs !== null && ts > toTs) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return sortOrder === "newest" ? tb - ta : ta - tb;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const counts = {
    all: items.length,
    pending: items.filter((m) => m.status === "pending").length,
    approved: items.filter((m) => m.status === "approved").length,
    rejected: items.filter((m) => m.status === "rejected").length,
  };

  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setDateFrom(""); setDateTo(""); };

  const exportCsv = () => {
    const headers = ["Sender", "Role", "Status", "Submitted", "Event Year", "Photo URL", "Document URL", "Message"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = sorted.map((m) => [
      m.sender_name ?? "",
      m.sender_role ?? "",
      m.status ?? "",
      m.created_at ? new Date(m.created_at).toISOString() : "",
      m.event_year ? String(m.event_year) : "",
      goodwillPhotoUrl(m.photo_url) ?? "",
      goodwillDocUrl(m.document_url) ?? "",
      (m.message ?? "").replace(/\r?\n/g, " "),
    ].map(escape).join(","));
    const csv = [headers.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goodwill-messages-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${sorted.length} message${sorted.length === 1 ? "" : "s"}`);
  };

  return (
    <div className="space-y-4">
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onReplaceFile}
      />
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-semibold">Goodwill messages</h2>
        <div className="flex gap-2">
          <GoodwillBackfillDialog onCreated={load} />
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={sorted.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
              className="capitalize"
            >
              {s} <span className="ml-2 text-xs opacity-70">{counts[s]}</span>
            </Button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Label htmlFor="gw-search" className="text-xs">Search</Label>
            <Input
              id="gw-search"
              placeholder="Name, role or message…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="gw-from" className="text-xs">From</Label>
            <Input id="gw-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="gw-to" className="text-xs">To</Label>
            <Input id="gw-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Showing {paginated.length} of {sorted.length} (total {items.length})</span>
          <div className="flex items-center gap-2">
            <Label htmlFor="gw-sort" className="text-xs">Sort</Label>
            <select
              id="gw-sort"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <Label htmlFor="gw-size" className="text-xs ml-2">Per page</Label>
            <select
              id="gw-size"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            {(search || statusFilter !== "all" || dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No messages match your filters</TableCell></TableRow>
            ) : paginated.map((m) => {
              const url = goodwillPhotoUrl(m.photo_url);
              const docUrl = goodwillDocUrl(m.document_url);
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="" className="w-12 h-12 rounded object-cover border" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => triggerReplace(m.id)} title="Replace photo">
                          <Upload className="h-3 w-3" />
                        </Button>
                        {m.photo_url && (
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => removePhoto(m)} title="Remove photo">
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {m.sender_name}
                      {m.event_year && <span className="ml-1 text-[10px] text-muted-foreground">({m.event_year})</span>}
                    </div>
                    {m.sender_role && <div className="text-xs text-muted-foreground">{m.sender_role}</div>}
                    {docUrl && (
                      <div className="mt-1 flex items-center gap-1">
                        <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary inline-flex items-center gap-1 hover:underline">
                          <FileText className="h-3 w-3" /> Document
                        </a>
                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => removeDocument(m)} title="Remove document">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md whitespace-pre-wrap">{m.message}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.status === "approved" ? "default" : m.status === "rejected" ? "destructive" : "secondary"}>
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    {m.status !== "approved" && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(m.id, "approved")} title="Approve">
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {m.status !== "rejected" && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(m.id, "rejected")} title="Reject">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => remove(m.id)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {!loading && sorted.length > 0 && (
          <div className="flex items-center justify-between p-3 border-t text-xs">
            <span className="text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage(1)}>First</Button>
              <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Prev</Button>
              <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button>
              <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)}>Last</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
