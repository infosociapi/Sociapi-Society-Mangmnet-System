import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Label, Select } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import type { Role } from "../../types";
import { UserPlus } from "lucide-react";

const departmentRoles: Record<string, Role[]> = {
  "Founder & President": ["Founder", "President"],
  "President": ["President", "Co-Founder"],
  "HR Manager": ["HR Manager", "Executive"],
  "Outreach Member": ["Outreach Manager", "Executive"],
  "Video Editor": ["Video Editor", "Event Manager"],
  "Women Lead": ["Executive", "Department Lead"],
  "Decor Lead": ["Department Lead", "Event Manager"],
  "Decor": ["Event Manager", "General Member"],
  "Graphic": ["Event Manager", "General Member"],
  "Graphics": ["Event Manager", "General Member"],
  "General Secretary": ["Executive", "HR Manager"],
  "Project Manager": ["Department Lead", "Event Manager"],
  "Event Manager": ["Event Manager", "Department Lead"],
  "Technical Lead": ["Department Lead", "Event Manager"],
  "Media Graphic Designers": ["Event Manager", "General Member"],
  "Organizer": ["Event Manager", "General Member"],
  "Graphic Designer": ["Event Manager", "General Member"],
};

const departmentList = Object.keys(departmentRoles).sort();

export default function Register() {
  const { register } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    role: "General Member" as Role,
    department: departmentList[0] || "General",
  });
  const [error, setError] = useState("");
  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Get available roles for selected department
  const availableRoles = form.department ? (departmentRoles[form.department] || ["General Member"]) : ["General Member"];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.phone.trim()) return setError("Phone number is required.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    
    const r = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: form.role,
      department: form.department,
      position: form.role,
      skills: [],
    });
    if (!r.ok) setError(r.error || "Registration failed");
    else nav("/app/dashboard");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Join your organization on Sociapi Society ERP.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label>Full Name</Label>
          <Input value={form.name} onChange={(e) => upd("name", e.target.value)} required placeholder="Your full name" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} required />
        </div>
        <div>
          <Label>Phone Number</Label>
          <Input type="tel" value={form.phone} onChange={(e) => upd("phone", e.target.value)} required placeholder="03xx-xxxxxxx" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Department</Label>
            <Select value={form.department} onChange={(e) => {
              const dept = e.target.value;
              setForm((f) => ({
                ...f,
                department: dept,
                // Auto-select first available role for this department
                role: (departmentRoles[dept] || ["General Member"])[0] as Role,
              }));
            }}>
              {departmentList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Your Role in {form.department}</Label>
            <Select value={form.role} onChange={(e) => upd("role", e.target.value)}>
              {availableRoles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Password</Label>
            <Input type="password" value={form.password} onChange={(e) => upd("password", e.target.value)} required />
          </div>
          <div>
            <Label>Confirm</Label>
            <Input type="password" value={form.confirm} onChange={(e) => upd("confirm", e.target.value)} required />
          </div>
        </div>
        {error && <p className="text-xs text-rose-600 bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>}

        <Button type="submit" className="w-full" size="lg" icon={<UserPlus className="h-4 w-4" />}>
          Create account
        </Button>
      </form>

      <p className="text-sm text-center mt-6 text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Label, Select } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import type { Role } from "../../types";
import { UserPlus } from "lucide-react";

const departmentRoles: Record<string, Role[]> = {
  "Founder & President": ["Founder", "President"],
  "President": ["President", "Co-Founder"],
  "HR Manager": ["HR Manager", "Executive"],
  "Outreach Member": ["Outreach Manager", "Executive"],
  "Video Editor": ["Video Editor", "Event Manager"],
  "Women Lead": ["Executive", "Department Lead"],
  "Decor Lead": ["Department Lead", "Event Manager"],
  "Decor": ["Event Manager", "General Member"],
  "Graphic": ["Event Manager", "General Member"],
  "Graphics": ["Event Manager", "General Member"],
  "General Secretary": ["Executive", "HR Manager"],
  "Project Manager": ["Department Lead", "Event Manager"],
  "Event Manager": ["Event Manager", "Department Lead"],
  "Technical Lead": ["Department Lead", "Event Manager"],
  "Media Graphic Designers": ["Event Manager", "General Member"],
  "Organizer": ["Event Manager", "General Member"],
  "Graphic Designer": ["Event Manager", "General Member"],
};

const departmentList = Object.keys(departmentRoles).sort();

export default function Register() {
  const { register } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    role: "General Member" as Role,
    department: departmentList[0] || "General",
  });
  const [error, setError] = useState("");
  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Get available roles for selected department
  const availableRoles = form.department ? (departmentRoles[form.department] || ["General Member"]) : ["General Member"];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.phone.trim()) return setError("Phone number is required.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    
    const r = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: form.role,
      department: form.department,
      position: form.role,
      skills: [],
    });
    if (!r.ok) setError(r.error || "Registration failed");
    else nav("/app/dashboard");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Join your organization on Sociapi Society ERP.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label>Full Name</Label>
          <Input value={form.name} onChange={(e) => upd("name", e.target.value)} required placeholder="Your full name" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} required />
        </div>
        <div>
          <Label>Phone Number</Label>
          <Input type="tel" value={form.phone} onChange={(e) => upd("phone", e.target.value)} required placeholder="03xx-xxxxxxx" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Department</Label>
            <Select value={form.department} onChange={(e) => {
              const dept = e.target.value;
              setForm((f) => ({
                ...f,
                department: dept,
                // Auto-select first available role for this department
                role: (departmentRoles[dept] || ["General Member"])[0] as Role,
              }));
            }}>
              {departmentList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Your Role in {form.department}</Label>
            <Select value={form.role} onChange={(e) => upd("role", e.target.value)}>
              {availableRoles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Password</Label>
            <Input type="password" value={form.password} onChange={(e) => upd("password", e.target.value)} required />
          </div>
          <div>
            <Label>Confirm</Label>
            <Input type="password" value={form.confirm} onChange={(e) => upd("confirm", e.target.value)} required />
          </div>
        </div>
        {error && <p className="text-xs text-rose-600 bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>}

        <Button type="submit" className="w-full" size="lg" icon={<UserPlus className="h-4 w-4" />}>
          Create account
        </Button>
      </form>

      <p className="text-sm text-center mt-6 text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}