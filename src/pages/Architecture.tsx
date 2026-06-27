import { Badge, Card } from "../components/ui";
import { Database, ServerCog, ShieldCheck } from "lucide-react";

const schema = `
users(id, username, password_hash, member_id, special_number, name, email, phone, role, department_id, position, photo_url, join_date, attendance, points, performance_score, status)
departments(id, name, lead_id, description, created_at)
attendance(id, user_id, event_id, method, status, scanned_by, created_at, unique(user_id,event_id,date))
tasks(id, title, description, priority, deadline, status, created_by, remarks, approved_by, created_at)
task_assignees(task_id, user_id)
task_submissions(id, task_id, user_id, file_url, comments, submitted_at, reviewed_at, review_notes)
events(id, name, date, venue, description, status, budget, income, sponsorship, actual_expense)
event_gallery(id, event_id, image_url, caption)
finance_entries(id, type, amount, category, event_id, description, created_by, created_at)
applications(id, name, email, phone, position, stage, interview_at, notes, evaluation_score, decision)
outreach_contacts(id, organization, contact_name, type, email, phone, stage, notes, last_contact)
notifications(id, user_id, title, body, channel, read, created_at)
messages(id, from_id, to_id, team, body, read, created_at)
audit_logs(id, actor_id, action, category, target, ip, user_agent, created_at)
email_jobs(id, template, recipient, payload_json, status, scheduled_for, provider_message_id)
`;

const endpoints = [
  "POST /api/auth/login", "POST /api/auth/register", "POST /api/auth/forgot-password", "POST /api/auth/reset-password", "POST /api/auth/change-password",
  "GET /api/users", "POST /api/users", "PATCH /api/users/:id", "DELETE /api/users/:id", "POST /api/users/:id/suspend", "POST /api/users/:id/reset-password", "POST /api/users/:id/role",
  "GET /api/departments", "POST /api/departments", "PATCH /api/departments/:id", "DELETE /api/departments/:id",
  "POST /api/attendance/scan", "GET /api/attendance/daily", "GET /api/attendance/weekly", "GET /api/attendance/monthly", "GET /api/attendance/departments",
  "GET /api/tasks", "POST /api/tasks", "POST /api/tasks/:id/submit", "POST /api/tasks/:id/review", "POST /api/tasks/:id/approve",
  "GET /api/events", "POST /api/events", "PATCH /api/events/:id", "DELETE /api/events/:id", "GET /api/events/:id/report",
  "GET /api/finance/reports/monthly", "GET /api/finance/reports/annual", "GET /api/finance/events/:id",
  "GET /api/hr/dashboard", "GET /api/outreach", "PATCH /api/outreach/:id/stage", "POST /api/email/mailjet", "POST /api/email/schedule", "GET /api/audit-logs",
];

export default function Architecture() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ServerCog className="h-6 w-6" /> System Blueprint</h1>
        <p className="text-sm text-slate-500">Deployment-ready database schema, API map and security architecture for Sociapi Society ERP.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5"><Database className="h-5 w-5 text-blue-600 mb-2" /><p className="font-semibold">Database</p><p className="text-sm text-slate-500 mt-1">PostgreSQL-ready relational schema with audit-safe ownership and event-linked finance.</p></Card>
        <Card className="p-5"><ShieldCheck className="h-5 w-5 text-emerald-600 mb-2" /><p className="font-semibold">Security</p><p className="text-sm text-slate-500 mt-1">JWT sessions, bcrypt passwords, RBAC guards, suspended-account lockout, complete audit logs.</p></Card>
        <Card className="p-5"><ServerCog className="h-5 w-5 text-cyan-600 mb-2" /><p className="font-semibold">Integrations</p><p className="text-sm text-slate-500 mt-1">Mailjet email adapter, QR attendance scanner, PDF/PNG ID card generator.</p></Card>
      </div>
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3"><Badge tone="indigo">SQL</Badge><h2 className="font-semibold">Database Schema</h2></div>
        <pre className="text-xs whitespace-pre-wrap font-mono p-4 rounded-xl bg-slate-950 text-slate-100 overflow-x-auto">{schema}</pre>
      </Card>
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3"><Badge tone="emerald">REST</Badge><h2 className="font-semibold">API Endpoints</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {endpoints.map((e) => <code key={e} className="text-xs rounded-lg bg-slate-100 dark:bg-white/5 px-3 py-2">{e}</code>)}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-semibold mb-2">Deployment Structure</h2>
        <p className="text-sm text-slate-500">Frontend: React + Vite + Tailwind v4. Backend target: Node/Express or serverless functions. Data: PostgreSQL. Storage: S3-compatible bucket for profiles, task files, event gallery. Email: Mailjet via environment variables <code>MAILJET_API_KEY</code>, <code>MAILJET_SECRET_KEY</code>, <code>MAILJET_FROM_EMAIL</code>. Deploy frontend to Vercel/Netlify and API to Vercel Functions.</p>
      </Card>
    </div>
  );
}