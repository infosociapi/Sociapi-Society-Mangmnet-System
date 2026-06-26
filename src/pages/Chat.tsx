import { useMemo, useState } from "react";
import { Avatar, Badge, Button, Card, Input, Select } from "../components/ui";
import { useApp } from "../context/AppContext";
import { MessageCircle, Send } from "lucide-react";

export default function Chat() {
  const { currentUser, users, chats, sendChat } = useApp();
  const [mode, setMode] = useState<"team" | "direct">("team");
  const [team, setTeam] = useState(currentUser?.department || "General");
  const [toId, setToId] = useState(users.find((u) => u.id !== currentUser?.id)?.id || "");
  const [body, setBody] = useState("");

  const visible = useMemo(() => {
    if (!currentUser) return [];
    return chats.filter((m) => {
      if (mode === "team") return m.team === team;
      return (m.fromId === currentUser.id && m.toId === toId) || (m.fromId === toId && m.toId === currentUser.id);
    });
  }, [chats, currentUser, mode, team, toId]);
  const departments = Array.from(new Set(users.map((u) => u.department)));

  const send = () => {
    if (!body.trim()) return;
    if (mode === "team") sendChat(body, undefined, team);
    else sendChat(body, toId);
    setBody("");
  };

  if (!currentUser) return null;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Member Chat</h1>
        <p className="text-sm text-slate-500">Simple chat, team chat and direct messages for members.</p>
      </div>
      <Card className="p-4 flex flex-col md:flex-row gap-3">
        <div className="flex gap-2">
          <Button variant={mode === "team" ? "primary" : "outline"} onClick={() => setMode("team")}>Team Chat</Button>
          <Button variant={mode === "direct" ? "primary" : "outline"} onClick={() => setMode("direct")}>Direct</Button>
        </div>
        {mode === "team" ? (
          <Select value={team} onChange={(e) => setTeam(e.target.value)} className="md:w-64">
            {departments.map((d) => <option key={d}>{d}</option>)}
          </Select>
        ) : (
          <Select value={toId} onChange={(e) => setToId(e.target.value)} className="md:w-80">
            {users.filter((u) => u.id !== currentUser.id).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        )}
      </Card>
      <Card className="p-4 min-h-[520px] flex flex-col">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-white/10">
          <MessageCircle className="h-4 w-4 text-blue-600" />
          <p className="font-semibold">{mode === "team" ? `${team} Team` : `Direct Message`}</p>
          <Badge tone="indigo">{visible.length}</Badge>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {visible.length === 0 && <p className="text-sm text-slate-500 text-center py-16">No messages yet. Start the conversation.</p>}
          {visible.map((m) => {
            const sender = users.find((u) => u.id === m.fromId);
            const mine = m.fromId === currentUser.id;
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && sender && <Avatar name={sender.name} gradient={sender.avatar} size={32} />}
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-white/5"}`}>
                  <p className="text-sm">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-blue-100" : "text-slate-500"}`}>{sender?.name || "Member"} · {new Date(m.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
          <Input value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Type a message..." />
          <Button icon={<Send className="h-4 w-4" />} onClick={send}>Send</Button>
        </div>
      </Card>
    </div>
  );
}