import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { LogOut, Search, Users, Wallet, Crown, RefreshCw, Plus, Trash2, Pencil, Upload, Download, LayoutDashboard, Handshake, Ticket, Award as AwardIcon, Settings as SettingsIcon, ExternalLink, Eye, Printer, Info } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
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

  const [section, setSection] = useState<string>("registrations");

  const navItems = [
    { key: "registrations", label: "Registrations", icon: Users },
    { key: "sponsorships", label: "Sponsorships", icon: Handshake },
    { key: "raffle", label: "Raffle", icon: Ticket },
    { key: "awards", label: "Awards", icon: AwardIcon },
    { key: "members", label: "Leadership & Board", icon: Crown },
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

  function exportCsv() {
    if (filtered.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const headers = [
      "Registered", "Title", "Full Name", "Email", "Phone", "Position", "Organization",
      "Rotary Club", "Address", "Tier", "Amount (NGN)", "Guests", "Payment Method",
      "Payment Status", "Payment Reference", "Payment Proof URL", "Notes",
    ];
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(",")];
    for (const r of filtered) {
      lines.push([
        new Date(r.created_at).toISOString(),
        r.title, r.full_name, r.email, r.phone, r.position, r.organization,
        r.rotary_club, r.address, r.tier, r.amount, r.guests_count, r.payment_method,
        r.payment_status, r.payment_reference, r.payment_proof_url, r.notes,
      ].map(esc).join(","));
    }
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} row${filtered.length > 1 ? "s" : ""}`);
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
        <Button onClick={exportCsv} disabled={loading || filtered.length === 0} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Download className="size-4 mr-1" /> Export CSV
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
                      <a href={r.payment_proof_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
                        View proof
                      </a>
                    ) : (
                      r.payment_method === "pay_now" && <div className="mt-1 text-xs text-muted-foreground">No proof yet</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button asChild size="sm" variant="ghost"><Link to="/receipt">View</Link></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteRow(r.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
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
              <Label>Display order</Label>
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
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">{loading ? "Loading…" : "No sales recorded yet."}</TableCell></TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell><div className="font-medium">{r.buyer_name}</div><div className="text-xs text-muted-foreground">{r.buyer_phone}</div></TableCell>
                  <TableCell>{r.pack === "pack20" ? "Pack of 20" : "Single"}</TableCell>
                  <TableCell>{r.qty}</TableCell>
                  <TableCell>{formatNGN(r.amount)}</TableCell>
                  <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                  <TableCell>
                    <Select value={r.payment_status} onValueChange={(v) => setStatus(r.id, v as RaffleSale["payment_status"])}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
