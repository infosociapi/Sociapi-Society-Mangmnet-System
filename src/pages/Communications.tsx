import { useState } from "react";
import { Avatar, Badge, Button, Card, Input, Label, Modal, Select, Textarea } from "../components/ui";
import { useApp } from "../context/AppContext";
import { Calendar, Mail, MessageCircle, Plus, Send, Sparkles } from "lucide-react";
import { sendMailjetEmail } from "../lib/mailjet";

type MessageTemplate = {
  id: string;
  name: string;
  channel: "Email" | "WhatsApp";
  subject?: string;
  body: string;
};

// Starter templates so the panel isn't empty out of the box.
// Create more anytime with the "New" button — they're saved for this session.
const STARTER_TEMPLATES: MessageTemplate[] = [
  {
    id: "starter-welcome",
    name: "Welcome New Member",
    channel: "Email",
    subject: "Welcome to Sociapi Society!",
    body: "Hi {{name}},\n\nWelcome aboard! We're thrilled to have you as part of Sociapi Society. Your member ID is {{memberId}}.\n\nSee you at the next event!\n\nBest,\nSociapi Team",
  },
  {
    id: "starter-event-reminder",
    name: "Event Reminder",
    channel: "WhatsApp",
    body: "Hi {{name}}! 👋 Quick reminder: {{event}} is coming up soon. We'd love to see you there. Reply to confirm your spot.",
  },
  {
    id: "starter-dues-reminder",
    name: "Membership Dues Reminder",
    channel: "Email",
    subject: "Friendly reminder: membership dues",
    body: "Hi {{name}},\n\nThis is a friendly reminder that your membership dues are due by {{deadline}}. Please clear your dues to keep enjoying full member benefits.\n\nThanks,\nSociapi Team",
  },
];

export default function Communications() {
  const { users, templates, addNotification, hasPermission } = useApp();
  const canBroadcast = hasPermission("send_broadcast");
  const [channel, setChannel] = useState<"Email" | "WhatsApp">("Email");
  const [mode, setMode] = useState<"bulk" | "individual">("bulk");
  const [recipientId, setRecipientId] = useState<string>(users[0]?.id || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [schedule, setSchedule] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  // Custom templates created in this session, merged with whatever the backend already provides.
  const [customTemplates, setCustomTemplates] = useState<MessageTemplate[]>(STARTER_TEMPLATES);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState<MessageTemplate>({ id: "", name: "", channel: "Email", subject: "", body: "" });

  const allTemplates: MessageTemplate[] = [...(templates as unknown as MessageTemplate[]), ...customTemplates];

  const useTemplate = (id: string) => {
    const t = allTemplates.find((x) => x.id === id);
    if (t) {
      setChannel(t.channel);
      setSubject(t.subject || "");
      setBody(t.body);
    }
  };

  const createTemplate = () => {
    if (!newTemplate.name || !newTemplate.body) return;
    setCustomTemplates((prev) => [...prev, { ...newTemplate, id: `tpl-${Date.now()}` }]);
    setNewTemplate({ id: "", name: "", channel: "Email", subject: "", body: "" });
    setTemplateModalOpen(false);
  };

  const removeCustomTemplate = (id: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const recipientsWithPhone = users.filter((u) => !!u.phone);

  const send = async () => {
    if (!body) return;
    const recipients = mode === "bulk" ? (channel === "WhatsApp" ? recipientsWithPhone.length : users.length) : 1;

    if (channel === "Email") {
      try {
        const selected = users.find((u) => u.id === recipientId);
        const to = mode === "bulk" ? users.map((u) => u.email) : selected?.email || "sociapisociety@gmail.com";
        await sendMailjetEmail({
          to,
          subject: subject || "Sociapi Society ERP Notice",
          html: body.replace(/\n/g, "<br />"),
          scheduledAt: schedule || undefined,
        });
        addNotification({ title: "Email Sent", body: `Email delivered via Mailjet to ${recipients} recipient(s).`, channel: "Email", type: "success" });
        setSent(`✅ Email sent via Mailjet to ${recipients} recipient(s).`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Email backend not available";
        addNotification({ title: "Email FAILED", body: msg, channel: "Email", type: "alert" });
        setSent(`❌ Email NOT sent: ${msg}`);
        setTimeout(() => setSent(null), 12000);
        return; // do not clear the form so the user can retry
      }
    } else {
      const selected = users.find((u) => u.id === recipientId);
      const target = mode === "bulk" ? `${recipients} number(s)` : selected?.phone || "no number on file";
      addNotification({ title: "WhatsApp Broadcast Queued", body: `Queued for ${target}.`, channel: "WhatsApp", type: "info" });
      setSent(`WhatsApp queued for ${target}.`);
    }

    setTimeout(() => setSent(null), 8000);
    setBody("");
    setSubject("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Communication Center</h1>
          <p className="text-sm text-slate-500">Send broadcasts, schedule messages, manage templates.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl soc-bg-soft-r ring-1 ring-indigo-500/20 text-xs">
          <Mail className="h-4 w-4 text-indigo-500" />
          <span className="font-semibold">Email Provider:</span>
          <span className="font-mono">Mailjet</span>
          <span className="text-slate-500">· works only on Vercel deploy</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setChannel("Email")} className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${channel === "Email" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-white/5"}`}>
              <Mail className="h-4 w-4" /> Email
            </button>
            <button onClick={() => setChannel("WhatsApp")} className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${channel === "WhatsApp" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-white/5"}`}>
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </button>
            <div className="flex-1" />
            <button onClick={() => setMode("bulk")} className={`px-4 py-2 rounded-xl text-sm font-semibold ${mode === "bulk" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 dark:bg-white/5"}`}>Bulk</button>
            <button onClick={() => setMode("individual")} className={`px-4 py-2 rounded-xl text-sm font-semibold ${mode === "individual" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 dark:bg-white/5"}`}>Individual</button>
          </div>

          {mode === "individual" && (
            <div className="mb-4">
              <Label>Recipient</Label>
              <Select value={recipientId} onChange={(e) => setRecipientId(e.target.value)}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {channel === "WhatsApp" ? (u.phone || "no number on file") : u.email}
                  </option>
                ))}
              </Select>
              {channel === "WhatsApp" && !users.find((u) => u.id === recipientId)?.phone && (
                <p className="text-xs text-amber-600 mt-1">This member has no phone number on file.</p>
              )}
            </div>
          )}
          {mode === "bulk" && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20 text-sm text-indigo-700 dark:text-indigo-300">
              {channel === "WhatsApp" ? (
                <>Broadcasting to <strong>{recipientsWithPhone.length}</strong> member(s) with a phone number on file.</>
              ) : (
                <>Broadcasting to <strong>{users.length}</strong> members.</>
              )}
            </div>
          )}

          {channel === "Email" && (
            <div className="mb-4">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
            </div>
          )}
          <div className="mb-4">
            <Label>Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Type your message…" />
            <p className="text-xs text-slate-500 mt-1">Variables: {"{{name}}, {{memberId}}, {{event}}, {{deadline}}"}</p>
          </div>
          <div className="mb-4">
            <Label>Schedule (optional)</Label>
            <Input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
          </div>

          {sent && <div className="mb-4 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm">{sent}</div>}

          <div className="flex gap-2">
            <Button icon={<Send className="h-4 w-4" />} disabled={!canBroadcast} onClick={send}>
              {schedule ? "Schedule" : "Send Now"}
            </Button>
            <Button variant="outline" icon={<Sparkles className="h-4 w-4" />} onClick={() => setBody(`Hi {{name}},\n\nThis is a friendly update from Sociapi Nexus. We appreciate your contribution and want to remind you of upcoming initiatives.\n\nBest,\nSociapi Team`)}>
              AI Draft
            </Button>
          </div>
          {!canBroadcast && <p className="text-xs text-amber-600 mt-2">Your role does not have broadcast permissions.</p>}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold">Message Templates</p>
            <Button size="sm" variant="ghost" icon={<Plus className="h-3 w-3" />} onClick={() => setTemplateModalOpen(true)}>New</Button>
          </div>
          <div className="space-y-2">
            {allTemplates.length === 0 && <p className="text-sm text-slate-500 text-center py-6">No templates yet. Create one with "New".</p>}
            {allTemplates.map((t) => (
              <div key={t.id} className="w-full p-3 rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/5 border border-slate-200/60 dark:border-white/10">
                <button onClick={() => useTemplate(t.id)} className="w-full text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <Badge tone={t.channel === "Email" ? "indigo" : "emerald"}>{t.channel}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.body}</p>
                </button>
                {customTemplates.some((c) => c.id === t.id) && (
                  <button onClick={() => removeCustomTemplate(t.id)} className="text-xs text-rose-500 hover:underline mt-2">Remove</button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="font-semibold mb-4 flex items-center gap-2"><Calendar className="h-4 w-4" /> Recent Recipients</p>
        <div className="flex flex-wrap gap-2">
          {users.slice(0, 16).map((u) => (
            <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/60 dark:bg-white/5">
              <Avatar name={u.name} gradient={u.avatar} size={24} />
              <span className="text-xs font-medium">{u.name.split("(")[0]}</span>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)} title="New Message Template">
        <div className="space-y-4">
          <div>
            <Label>Template Name</Label>
            <Input value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="e.g. Event Reminder" />
          </div>
          <div>
            <Label>Channel</Label>
            <Select value={newTemplate.channel} onChange={(e) => setNewTemplate({ ...newTemplate, channel: e.target.value as "Email" | "WhatsApp" })}>
              <option>Email</option>
              <option>WhatsApp</option>
            </Select>
          </div>
          {newTemplate.channel === "Email" && (
            <div>
              <Label>Subject</Label>
              <Input value={newTemplate.subject || ""} onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })} placeholder="Email subject" />
            </div>
          )}
          <div>
            <Label>Body</Label>
            <Textarea value={newTemplate.body} onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })} rows={6} placeholder="Type your template message…" />
            <p className="text-xs text-slate-500 mt-1">Variables: {"{{name}}, {{memberId}}, {{event}}, {{deadline}}"}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setTemplateModalOpen(false)}>Cancel</Button>
          <Button onClick={createTemplate}>Save Template</Button>
        </div>
      </Modal>
    </div>
  );
}