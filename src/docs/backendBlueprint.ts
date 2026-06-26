export const databaseSchema = `
-- Sociapi Society ERP PostgreSQL schema
CREATE TABLE roles (id uuid PRIMARY KEY, name text UNIQUE NOT NULL);
CREATE TABLE departments (id uuid PRIMARY KEY, name text UNIQUE NOT NULL, lead_id uuid, description text, created_at timestamptz DEFAULT now());
CREATE TABLE users (id uuid PRIMARY KEY, username text UNIQUE NOT NULL, password_hash text NOT NULL, member_id text UNIQUE NOT NULL, special_number text UNIQUE NOT NULL, name text NOT NULL, email text UNIQUE NOT NULL, phone text, role_id uuid REFERENCES roles(id), department_id uuid REFERENCES departments(id), position text, photo_url text, join_date date, attendance numeric DEFAULT 0, points int DEFAULT 0, performance_score numeric DEFAULT 0, status text DEFAULT 'Active');
CREATE TABLE audit_logs (id uuid PRIMARY KEY, actor_id uuid REFERENCES users(id), action text NOT NULL, category text NOT NULL, target text, created_at timestamptz DEFAULT now());
CREATE TABLE events (id uuid PRIMARY KEY, name text, date timestamptz, venue text, description text, status text, budget numeric DEFAULT 0, income numeric DEFAULT 0, sponsorship numeric DEFAULT 0, actual_expense numeric DEFAULT 0);
CREATE TABLE attendance (id uuid PRIMARY KEY, user_id uuid REFERENCES users(id), event_id uuid REFERENCES events(id), method text, status text, scanned_by uuid REFERENCES users(id), created_at timestamptz DEFAULT now(), UNIQUE(user_id, event_id, created_at::date));
CREATE TABLE tasks (id uuid PRIMARY KEY, title text, description text, priority text, deadline timestamptz, status text, created_by uuid REFERENCES users(id), remarks text, approved_by uuid REFERENCES users(id), created_at timestamptz DEFAULT now());
CREATE TABLE task_assignees (task_id uuid REFERENCES tasks(id), user_id uuid REFERENCES users(id), PRIMARY KEY(task_id, user_id));
CREATE TABLE task_submissions (id uuid PRIMARY KEY, task_id uuid REFERENCES tasks(id), user_id uuid REFERENCES users(id), file_url text, comments text, submitted_at timestamptz, reviewed_at timestamptz, review_notes text);
CREATE TABLE finance_entries (id uuid PRIMARY KEY, type text, amount numeric, category text, event_id uuid REFERENCES events(id), description text, created_by uuid REFERENCES users(id), created_at timestamptz DEFAULT now());
CREATE TABLE applications (id uuid PRIMARY KEY, name text, email text, phone text, position text, stage text, interview_at timestamptz, notes text, evaluation_score numeric, decision text);
CREATE TABLE outreach_contacts (id uuid PRIMARY KEY, organization text, contact_name text, type text, email text, phone text, stage text, notes text, last_contact timestamptz);
CREATE TABLE notifications (id uuid PRIMARY KEY, user_id uuid REFERENCES users(id), title text, body text, channel text, read boolean DEFAULT false, created_at timestamptz DEFAULT now());
CREATE TABLE messages (id uuid PRIMARY KEY, from_id uuid REFERENCES users(id), to_id uuid REFERENCES users(id), team text, body text, read boolean DEFAULT false, created_at timestamptz DEFAULT now());
CREATE TABLE email_jobs (id uuid PRIMARY KEY, template text, recipient text, payload_json jsonb, status text, scheduled_for timestamptz, provider_message_id text);
`;

export const apiEndpoints = [
  "POST /api/auth/login", "POST /api/auth/logout", "POST /api/auth/register", "POST /api/auth/reset-password",
  "GET /api/users", "POST /api/users", "PATCH /api/users/:id", "DELETE /api/users/:id", "POST /api/users/:id/suspend", "POST /api/users/:id/role",
  "GET /api/departments", "POST /api/departments", "PATCH /api/departments/:id", "DELETE /api/departments/:id",
  "POST /api/attendance/scan", "GET /api/attendance/daily", "GET /api/attendance/weekly", "GET /api/attendance/monthly", "GET /api/attendance/departments",
  "POST /api/tasks", "POST /api/tasks/:id/submit", "POST /api/tasks/:id/review", "POST /api/tasks/:id/approve", "POST /api/tasks/reminders/run",
  "GET /api/events", "POST /api/events", "PATCH /api/events/:id", "DELETE /api/events/:id", "GET /api/events/:id/report",
  "GET /api/finance/monthly", "GET /api/finance/annual", "GET /api/finance/events/:id",
  "GET /api/hr/dashboard", "POST /api/hr/applications", "PATCH /api/hr/applications/:id",
  "GET /api/outreach", "POST /api/outreach", "PATCH /api/outreach/:id/stage",
  "POST /api/email/resend", "POST /api/email/schedule", "GET /api/audit-logs",
];