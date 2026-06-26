import type {
  ActivityLog,
  Application,
  AttendanceRecord,
  ChatMessage,
  Department,
  Event,
  FinanceEntry,
  MessageTemplate,
  NotificationItem,
  OutreachContact,
  Task,
  User,
} from "../types";
import { isSupabaseConfigured, supabase, SUPABASE_STORAGE_BUCKET } from "./supabase";

export interface ErpStateSnapshot {
  users: User[];
  tasks: Task[];
  events: Event[];
  finance: FinanceEntry[];
  outreach: OutreachContact[];
  applications: Application[];
  templates: MessageTemplate[];
  notifications: NotificationItem[];
  attendance: AttendanceRecord[];
  activityLogs: ActivityLog[];
  departments: Department[];
  chats: ChatMessage[];
}

const STATE_ID = "sociapi-society-erp";

export async function loadErpState(): Promise<ErpStateSnapshot | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("erp_state")
    .select("data")
    .eq("id", STATE_ID)
    .maybeSingle();

  if (error) throw error;
  return (data?.data as ErpStateSnapshot | undefined) || null;
}

export async function saveErpState(data: ErpStateSnapshot): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from("erp_state")
    .upsert({ id: STATE_ID, data, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function uploadToSupabaseStorage(path: string, file: File) {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
  const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function callSupabaseAdmin(action: string, payload: Record<string, unknown>) {
  const response = await fetch("/api/supabase/admin-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(json.error || "Supabase admin function failed");
  return json;
}