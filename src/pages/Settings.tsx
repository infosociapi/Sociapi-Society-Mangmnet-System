import { useRef, useState } from "react";
import { Avatar, Badge, Button, Card, Input, Label } from "../components/ui";
import { useApp } from "../context/AppContext";
import { Camera, KeyRound, LogOut, Moon, Palette, Save, Shield, Sun, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { uploadToSupabaseStorage } from "../lib/supabaseStore";

export default function Settings() {
  const { currentUser, changePassword, theme, setTheme, logout, updateUser } = useApp();
  const nav = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [profile, setProfile] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    department: currentUser?.department || "",
  });
  const [saving, setSaving] = useState(false);

  if (!currentUser) return null;

  const saveProfile = async () => {
    setSaving(true);
    await updateUser(currentUser.id, profile);
    setSaving(false);
    alert("Profile saved");
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadToSupabaseStorage(`avatars/${currentUser.id}`, file);
      await updateUser(currentUser.id, { photoUrl: url });
      alert("Photo updated");
    } catch (e) {
      alert("Upload failed");
    }
  };

  const onChange = async () => {
    setMsg(null);
    if (newPw !== confirmPw) return setMsg({ type: "err", text: "Passwords do not match" });
    if (newPw.length < 6) return setMsg({ type: "err", text: "Password must be at least 6 characters" });
    const r = await changePassword(oldPw, newPw);
    if (!r.ok) setMsg({ type: "err", text: r.error || "Error" });
    else {
      setMsg({ type: "ok", text: "Password updated successfully." });
      setOldPw(""); setNewPw(""); setConfirmPw("");
    }
  };

  const onLogout = () => { logout(); nav("/login"); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500">Profile · Security · Preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar name={currentUser.name} gradient={currentUser.avatar} size={96} src={currentUser.photoUrl} />
                <Button size="sm" variant="outline" className="absolute -bottom-2 -right-2 rounded-full h-8 w-8" icon={<Camera className="h-4 w-4" />} onClick={() => fileInputRef.current?.click()} />
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
              </div>
            </div>
            <h2 className="mt-4 font-bold text-lg">{currentUser.name}</h2>
            <p className="text-sm text-slate-500">{currentUser.position}</p>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              <Badge tone="indigo">{currentUser.memberId}</Badge>
              <Badge tone="violet">{currentUser.specialNumber}</Badge>
            </div>
            <Badge tone="emerald" className="mt-2"><Shield className="h-3 w-3" /> {currentUser.role}</Badge>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-100/60 dark:bg-white/5 p-2"><p className="font-bold">{currentUser.points}</p><p className="text-[10px] uppercase tracking-wider text-slate-500">Points</p></div>
            <div className="rounded-xl bg-slate-100/60 dark:bg-white/5 p-2"><p className="font-bold">{currentUser.attendance}%</p><p className="text-[10px] uppercase tracking-wider text-slate-500">Attendance</p></div>
            <div className="rounded-xl bg-slate-100/60 dark:bg-white/5 p-2"><p className="font-bold">{currentUser.certificates.length}</p><p className="text-[10px] uppercase tracking-wider text-slate-500">Certs</p></div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2 space-y-6">
          <div>
            <p className="font-semibold flex items-center gap-2 mb-3"><UserIcon className="h-4 w-4" /> Profile Info</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} /></div>
              <div><Label>Email</Label><Input value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} /></div>
              <div><Label>Phone</Label><Input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} /></div>
              <div><Label>Department</Label><Input value={profile.department} onChange={(e) => setProfile({...profile, department: e.target.value})} /></div>
            </div>
            <div className="mt-4"><Button icon={<Save className="h-4 w-4" />} onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button></div>
          </div>

          <hr className="border-slate-200 dark:border-white/10" />

          <div>
            <p className="font-semibold flex items-center gap-2 mb-3"><Palette className="h-4 w-4" /> Appearance</p>
            <div className="flex gap-2">
              <button onClick={() => setTheme("light")} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${theme === "light" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-white/5"}`}><Sun className="h-4 w-4" /> Light</button>
              <button onClick={() => setTheme("dark")} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${theme === "dark" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-white/5"}`}><Moon className="h-4 w-4" /> Dark</button>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-white/10" />

          <div>
            <p className="font-semibold flex items-center gap-2 mb-3"><KeyRound className="h-4 w-4" /> Change Password</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Current</Label><Input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} /></div>
              <div><Label>New</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
              <div><Label>Confirm</Label><Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} /></div>
            </div>
            {msg && (
              <p className={`mt-3 text-xs px-3 py-2 rounded-lg ${msg.type === "ok" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>{msg.text}</p>
            )}
            <div className="mt-3 flex gap-2">
              <Button onClick={onChange}>Update Password</Button>
              <Button variant="outline" icon={<LogOut className="h-4 w-4" />} onClick={onLogout}>Logout</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

