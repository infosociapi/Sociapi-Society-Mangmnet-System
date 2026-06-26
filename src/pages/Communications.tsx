import { useState } from "react";
import { Avatar, Badge, Button, Card, Input, Label, Select, Textarea } from "../components/ui";
import { useApp } from "../context/AppContext";
import { Calendar, Mail, MessageCircle, Plus, Send, Sparkles } from "lucide-react";
import { sendResendEmail } from "../lib/resend";

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

  const useTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (t) {
      setChannel(t.channel);
      setSubject(t.subject || "");
      setBody(t.body);
    }
  };

  const send = async () => {
    if (!body) return;
    const recipients = mode === "bulk" ? users.length : 1;
    let emailStatus = "";
    if (channel === "Email") {
      try {
        const selected = users.find((u) => u.id === recipientId);
        const to = mode === "bulk" ? users.map((u) => u.email) : selected?.email || "sociapisociety@gmail.com";
        await sendResendEmail({
          to,
          subject: subject || "Sociapi Society ERP Notice",
          html: body.replace(/\n/g, "<br />"),
          scheduledAt: schedule || undefined,
        });
        emailStatus = " Email sent through Resend.";
      } catch (error) {
        emailStatus = ` Resend failed: ${error instanceof Error ? error.message : "server endpoint not configured"}. If using onboarding@resend.dev, send only to the verified Resend account email or verify your own domain.`;
      }
    }
    addNotification({
      title: `${channel} ${mode === "bulk" ? "Broadcast" : "Message"} Sent`,
      body: `Sent to ${recipients} recipient${recipients > 1 ? "s" : ""}.${schedule ? ` Scheduled for ${schedule}.` : ""}${emailStatus}`,
      channel,
      type: "success",
    });
    setSent(`${channel} sent to ${recipients} recipient${recipients > 1 ? "s" : ""}.${schedule ? ` Scheduled for ${schedule}.` : ""}${emailStatus}`);
    setTimeout(() => setSent(null), 3000);
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
          <span className="font-mono">Resend</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-1" />
          <span className="text-emerald-600 dark:text-emerald-400">Connected</span>
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
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
              </Select>
            </div>
          )}
          {mode === "bulk" && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20 text-sm text-indigo-700 dark:text-indigo-300">
              Broadcasting to <strong>{users.length}</strong> members.
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
            <Button size="sm" variant="ghost" icon={<Plus className="h-3 w-3" />}>New</Button>
          </div>
          <div className="space-y-2">
            {templates.map((t) => (
              <button key={t.id} onClick={() => useTemplate(t.id)} className="w-full text-left p-3 rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/5 border border-slate-200/60 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <Badge tone={t.channel === "Email" ? "indigo" : "emerald"}>{t.channel}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.body}</p>
              </button>
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
    </div>
  );
}
