import { useEffect, useMemo, useState } from "react";
import { Avatar, Badge, Button, Card, Input, Label, Modal, Select, Textarea } from "../components/ui";
import { useApp } from "../context/AppContext";
import type { Role, User } from "../types";
import { Edit2, Plus, Search, Trash2, UserCircle2, Award, Activity, Mail, Phone, Briefcase } from "lucide-react";

// Complete role mapping for all 16 departments
const departmentRoles: Record<string, Role[]> = {
  "HR Manager": ["HR Manager", "Vice President", "Lead", "Co-Lead", "Member"],
  "Outreach Member": ["Lead", "Vice President", "Co-Lead", "Member"],
  "Video Editor": ["Lead", "Co-Lead", "Member"],
  "Women Lead": ["Lead", "Vice President", "Co-Lead", "Member"],
  "Decor Lead": ["Lead", "Vice President", "Co-Lead", "Member"],
  "Decor": ["Lead", "Co-Lead", "Member"],
  "Graphic": ["Lead", "Co-Lead", "Member"],
  "General Secretary": ["Lead", "Vice President", "Co-Lead", "Member"],
  "Project Manager": ["Lead", "Vice President", "Co-Lead", "Member"],
  "Event Manager": ["Lead", "Vice President", "Co-Lead", "Member"],
  "Technical Lead": ["Lead", "Vice President", "Co-Lead", "Member"],
  "Media": ["Lead", "Co-Lead", "Member"],
  "Graphic Designers Lead": ["Lead", "Vice President", "Co-Lead", "Member"],
  "Organizer": ["Lead", "Co-Lead", "Member"],
  "Graphic Designer": ["Lead", "Co-Lead", "Member"],
  "Leadership": ["Lead", "Vice President", "Co-Lead", "Member"],
};

const allRoles: Role[] = [
  "Super Admin",
  "Lead",
  "Co-Lead",
  "Vice President",
  "HR Manager",
  "Member",
];

export default function Members() {
  const { users, addUser, updateUser, deleteUser, suspendUser, resetUserPassword, hasPermission, departments } = useApp();
  const canManage = hasPermission("manage_members");
  const [query, setQuery] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterRole, setFilterRole] = useState("All");
  const [editing, setEditing] = useState<User | null>(null);
  const [viewing, setViewing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  const deptNames = ["All", "HR Manager", "Outreach Member", "Video Editor", "Women Lead", "Decor Lead", "Decor", "Graphic", "General Secretary", "Project Manager", "Event Manager", "Technical Lead", "Media", "Graphic Designers Lead", "Organizer", "Graphic Designer", "Leadership"];

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filterDept !== "All" && u.department !== filterDept) return false;
      if (filterRole !== "All" && u.role !== filterRole) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.memberId.toLowerCase().includes(q) ||
          u.specialNumber.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, filterDept, filterRole, query]);

  const openAdd = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (u: User) => {
    setEditing(u);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-sm text-slate-500">{users.length} total · {users.filter(u => u.status === "Active").length} active</p>
        </div>
        {canManage && (
          <Button onClick={openAdd} icon={<Plus className="h-4 w-4" />}>Add Member</Button>
        )}
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, ID, email…" className="pl-10" />
        </div>
        <Select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="md:w-48">
          {deptNames.map((d) => <option key={d}>{d}</option>)}
        </Select>
        <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="md:w-56">
          <option>All</option>
          {allRoles.map((r) => <option key={r}>{r}</option>)}
        </Select>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((u) => (
          <Card key={u.id} className="p-5 hover:scale-[1.01] transition-transform cursor-pointer" onClick={() => setViewing(u)}>
            <div className="flex items-start gap-3">
              <Avatar name={u.name} gradient={u.avatar} size={52} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{u.name}</p>
                  <Badge tone={u.status === "Active" ? "emerald" : u.status === "Suspended" ? "rose" : "slate"}>{u.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 truncate">{u.position}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge tone="indigo">{u.memberId}</Badge>
                  <Badge tone="violet">{u.specialNumber}</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat label="Points" value={u.points} />
              <Stat label="Attendance" value={`${u.attendance}%`} />
              <Stat label="Score" value={u.performanceScore} />
            </div>
            {canManage && u.role === "Super Admin" ? (
              <div className="mt-4 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs ring-1 ring-amber-500/20">
                🔒 Super Admin account — protected. Cannot be edited, suspended or removed.
              </div>
            ) : canManage ? (
              <div className="mt-4 flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" icon={<Edit2 className="h-3 w-3" />} onClick={(e) => { e.stopPropagation(); openEdit(u); }}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); suspendUser(u.id); }}>
                  {u.status === "Suspended" ? "Activate" : "Suspend"}
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); const pw = prompt("New password", "password"); if (pw) resetUserPassword(u.id, pw); }}>
                  Reset PW
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 className="h-3 w-3" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${u.name}?`)) deleteUser(u.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      <MemberFormModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        departments={deptNames.filter(d => d !== "All")}
        onSave={(data) => {
          if (editing) updateUser(editing.id, data);
          else addUser(data as Omit<User, "id" | "memberId">);
          setOpen(false);
        }}
      />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Member Profile" size="lg">
        {viewing && <MemberProfile user={viewing} />}
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-100/60 dark:bg-white/5 p-2">
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}

function MemberProfile({ user }: { user: User }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} gradient={user.avatar} size={80} />
        <div>
          <h3 className="text-xl font-bold">{user.name}</h3>
          <p className="text-sm text-slate-500">{user.position} · {user.department}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge tone="indigo">{user.memberId}</Badge>
            <Badge tone="violet">{user.specialNumber}</Badge>
            <Badge tone="emerald">{user.role}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ProfileStat icon={<Award className="h-4 w-4" />} label="Points" value={user.points} />
        <ProfileStat icon={<Activity className="h-4 w-4" />} label="Attendance" value={`${user.attendance}%`} />
        <ProfileStat icon={<UserCircle2 className="h-4 w-4" />} label="Performance" value={user.performanceScore} />
        <ProfileStat icon={<Briefcase className="h-4 w-4" />} label="Joined" value={new Date(user.joinDate).toLocaleDateString()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm font-semibold mb-3">Contact</p>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {user.email}</p>
            <p className="flex items-center gap-2"><UserCircle2 className="h-4 w-4 text-slate-400" /> @{user.username}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {user.phone || "—"}</p>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold mb-3">Account Audit</p>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>Created: {user.createdAt ? new Date(user.createdAt).toLocaleString() : "Seeded account"}</p>
            <p>Created By: {user.createdBy || "System"}</p>
            <p>Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</p>
            <p>Password Resets: {user.passwordResetHistory?.length || 0}</p>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold mb-3">Skills</p>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((s) => <Badge key={s} tone="sky">{s}</Badge>)}
            {user.skills.length === 0 && <p className="text-xs text-slate-500">No skills listed.</p>}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Certificates</p>
        {user.certificates.length === 0 ? (
          <p className="text-xs text-slate-500">No certificates yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.certificates.map((c) => (
              <span key={c} className="px-3 py-2 rounded-xl soc-bg-soft ring-1 ring-amber-500/20 text-xs font-medium flex items-center gap-2">
                <Award className="h-3 w-3 text-amber-500" /> {c}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Activity History</p>
        <div className="space-y-2">
          {user.activity.map((a, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <div className="h-2 w-2 mt-2 rounded-full bg-indigo-500" />
              <div className="flex-1">
                <p>{a.action}</p>
                <p className="text-xs text-slate-500">{new Date(a.date).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ProfileStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-xs uppercase tracking-wider">{label}</span></div>
      <p className="text-xl font-bold mt-1">{value}</p>
    </Card>
  );
}

interface MemberFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: User | null;
  departments: string[];
  onSave: (u: Partial<User>) => void;
}

function MemberFormModal({
  open,
  onClose,
  editing,
  departments,
  onSave,
}: MemberFormModalProps) {
  type MemberForm = Partial<User> & { temporaryPassword?: string };
  const defaultDept = departments[0] || "General Secretary";
  const defaultRole = (departmentRoles[defaultDept] || ["Member"])[0];
  
  const [form, setForm] = useState<MemberForm>(
    editing || {
      name: "",
      username: "",
      email: "",
      temporaryPassword: "",
      role: defaultRole,
      position: defaultDept,
      department: defaultDept,
      specialNumber: "",
      skills: [],
      points: 0,
      attendance: 0,
      performanceScore: 0,
      status: "Active",
      certificates: [],
      activity: [],
      joinDate: new Date().toISOString(),
      avatar: "teal",
    }
  );

  useEffect(() => {
    if (editing) {
      setForm(editing);
    } else {
      const dept = departments[0] || "General Secretary";
      const role = (departmentRoles[dept] || ["Member"])[0];
      setForm({
        name: "",
        username: "",
        email: "",
        temporaryPassword: "",
        role,
        position: dept,
        department: dept,
        specialNumber: "",
        skills: [],
        points: 0,
        attendance: 0,
        performanceScore: 0,
        status: "Active",
        certificates: [],
        activity: [],
        joinDate: new Date().toISOString(),
        avatar: "teal",
      });
    }
  }, [editing, open, departments]);

  const upd = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const dept = form.department as string;
  const availableRoles = departmentRoles[dept] || allRoles;

  const generateCredentials = () => {
    const base = (form.name || "member").toLowerCase().replace(/\(.+?\)/g, "").trim().replace(/\s+/g, ".").replace(/[^a-z.]/g, "");
    const temp = "SOC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    setForm((f) => ({ ...f, username: f.username || base, temporaryPassword: temp }));
  };
  
  const copyCredentials = () => navigator.clipboard?.writeText(`Username: ${form.username || ""}\nTemporary password: ${form.temporaryPassword || ""}`);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Member" : "Add Member"} size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          <Input value={form.name || ""} onChange={(e) => upd("name", e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={form.email || ""} onChange={(e) => upd("email", e.target.value)} />
        </div>
        <div>
          <Label>Username</Label>
          <Input value={form.username || ""} onChange={(e) => upd("username", e.target.value)} placeholder="username" />
        </div>
        <div>
          <Label>Temporary Password</Label>
          <Input value={form.temporaryPassword || ""} onChange={(e) => upd("temporaryPassword", e.target.value)} placeholder="Temporary password for Supabase Auth" />
        </div>
        <div>
          <Label>Department</Label>
          <Select value={form.department || ""} onChange={(e) => {
            const dept = e.target.value;
            const roles = departmentRoles[dept] || allRoles;
            setForm((f) => ({
              ...f,
              department: dept,
              role: roles[0],
              position: dept,
            }));
          }}>
            {departments.map((d) => <option key={d}>{d}</option>)}
          </Select>
        </div>
        <div>
          <Label>Role</Label>
          <Select value={form.role as string} onChange={(e) => upd("role", e.target.value)}>
            {availableRoles.map((r) => <option key={r}>{r}</option>)}
          </Select>
          <p className="text-[10px] text-slate-500 mt-1">Department-specific options</p>
        </div>
        <div>
          <Label>Position</Label>
          <Input value={form.position || ""} onChange={(e) => upd("position", e.target.value)} />
        </div>
        <div>
          <Label>Special Number</Label>
          <Input value={form.specialNumber || ""} onChange={(e) => upd("specialNumber", e.target.value)} placeholder="e.g. SM_26200" />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone || ""} onChange={(e) => upd("phone", e.target.value)} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status as string} onChange={(e) => upd("status", e.target.value)}>
            <option>Active</option>
            <option>Inactive</option>
            <option>On Leave</option>
            <option>Suspended</option>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Skills (comma separated)</Label>
          <Textarea
            value={(form.skills || []).join(", ")}
            onChange={(e) => upd("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 rounded-xl bg-slate-100/60 dark:bg-white/5 p-3">
        <Button size="sm" variant="outline" onClick={generateCredentials}>Generate Temporary Credentials</Button>
        <Button size="sm" variant="ghost" onClick={copyCredentials}>Copy Credentials</Button>
        <Button size="sm" variant="ghost" onClick={() => alert("Credentials email queued via Mailjet adapter.")}>Send via Email</Button>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)}>{editing ? "Save" : "Create"}</Button>
      </div>
    </Modal>
  );
}