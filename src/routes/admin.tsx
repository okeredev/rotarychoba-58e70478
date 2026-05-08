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
import { toast } from "sonner";
import { LogOut, Search, Users, Wallet, Crown, RefreshCw, Plus, Trash2, Pencil, Upload } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

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
        <Tabs defaultValue="registrations" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="members">Leadership & Board</TabsTrigger>
          </TabsList>
          <TabsContent value="registrations">
            <RegistrationsPanel />
          </TabsContent>
          <TabsContent value="members">
            <MembersPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function RegistrationsPanel() {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");

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
    return r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q);
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
                    <div className="font-medium">{r.full_name}</div>
                    {r.organization && <div className="text-xs text-muted-foreground">{r.organization}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{r.email}</div>
                    <div className="text-xs text-muted-foreground">{r.phone}</div>
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
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell className="text-right">
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
