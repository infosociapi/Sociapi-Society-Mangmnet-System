export type Role =
  | "Super Admin"
  | "Founder"
  | "Co-Founder"
  | "Executive"
  | "HR Manager"
  | "Department Lead"
  | "Finance Manager"
  | "Outreach Manager"
  | "Event Manager"
  | "General Member";

export interface User {
  id: string;
  username: string;
  memberId: string;
  specialNumber: string;
  name: string;
  email: string;
  photoUrl?: string;
  createdBy?: string;
  createdAt?: string;
  lastLogin?: string;
  passwordResetHistory?: { by: string; at: string }[];
  role: Role;
  position: string;
  department: string;
  skills: string[];
  joinDate: string;
  avatar?: string;
  points: number;
  attendance: number; // %
  performanceScore: number;
  status: "Active" | "Inactive" | "On Leave" | "Suspended";
  certificates: string[];
  activity: { date: string; action: string }[];
  phone?: string;
}

export type TaskStatus = "Assigned" | "In Progress" | "Submitted" | "Under Review" | "Approved" | "Completed" | "Overdue";

export interface Task {
  id: string;
  title: string;
  description: string;
  assignees: string[];
  createdBy: string;
  createdAt: string;
  deadline: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: TaskStatus;
  submission?: { fileName: string; submittedAt: string; notes: string; fileData?: string; fileType?: string };
  remarks?: string;
  reviewNotes?: string;
  approvedBy?: string;
  daysSinceAssign?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type?: "event" | "meeting";
  date: string;
  location: string;
  capacity: number;
  registered: number;
  attended: number;
  status: "Upcoming" | "Ongoing" | "Completed" | "Archived";
  feedback: { rating: number; comment: string }[];
  budget: number;
  expense: number;
  income: number;
  photos?: string[];
  documents?: { name: string; data: string; type: string }[];
}

export interface FinanceEntry {
  id: string;
  type: "Donation" | "Membership Fee" | "Sponsorship" | "Expense" | "Other Income";
  amount: number;
  description: string;
  date: string;
  category: string;
  eventId?: string;
  reference?: string; // bill / receipt / voucher number
}

export interface OutreachContact {
  id: string;
  name: string;
  organization: string;
  type: "Company" | "Sponsor" | "NGO" | "University";
  email: string;
  phone: string;
  stage: "Lead" | "Contacted" | "Meeting Scheduled" | "Proposal Sent" | "Partnership";
  notes: string;
  lastContact: string;
}

export interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  stage: "Applied" | "Screening" | "Interview" | "Evaluation" | "Onboarding" | "Rejected" | "Hired";
  appliedAt: string;
  notes: string;
  score?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  channel: "WhatsApp" | "Email" | "In-App";
  createdAt: string;
  read: boolean;
  type: "info" | "warning" | "success" | "alert";
  userId?: string; // when targeted
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: "WhatsApp" | "Email";
  subject?: string;
  body: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  method: "Manual" | "QR" | "Event";
  eventId?: string;
  status: "Present" | "Absent" | "Late" | "Excused";
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  target?: string;
  category: "auth" | "members" | "tasks" | "events" | "finance" | "outreach" | "attendance" | "settings" | "ai" | "comms";
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  leadId?: string;
  description: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  fromId: string;
  toId?: string;
  team?: string;
  body: string;
  createdAt: string;
  read: boolean;
}

// Add this to your existing types.ts - just update the Department interface

export interface Department {
  id: string;
  name: string;
  description: string;
  leadId?: string;      // Lead
  coLeadId?: string;    // Co-Lead (نیا فیلڈ)
  createdAt: string;
}

// Rest of your types remain the same
export interface User {
  id: string;
  username: string;
  memberId: string;
  specialNumber: string;
  name: string;
  email: string;
  photoUrl?: string;
  phone?: string;
  role: Role;
  position: string;
  department: string;
  skills: string[];
  joinDate: string;
  avatar: "teal" | "indigo" | "violet" | "rose" | "amber";
  points: number;
  attendance: number;
  performanceScore: number;
  status: "Active" | "Inactive" | "On Leave" | "Suspended";
  certificates: string[];
  activity: Array<{ date: string; action: string }>;
  createdBy?: string;
  createdAt: string;
  lastLogin?: string;
  passwordResetHistory?: Array<{ by: string; at: string }>;
}

export type Role =
  | "Super Admin"
  | "Founder"
  | "Co-Founder"
  | "Executive"
  | "HR Manager"
  | "Department Lead"
  | "Finance Manager"
  | "Outreach Manager"
  | "Event Manager"
  | "General Member";

export interface Task {
  id: string;
  title: string;
  description: string;
  assignees: string[];
  createdBy: string;
  createdAt: string;
  deadline: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: TaskStatus;
  remarks?: string;
  reviewNotes?: string;
  approvedBy?: string;
  submission?: {
    fileName: string;
    fileData: string;
    fileType: string;
    notes: string;
    submittedAt: string;
  };
}

export type TaskStatus = "Assigned" | "In Progress" | "Submitted" | "Under Review" | "Approved" | "Completed" | "Overdue";

export interface Event {
  id: string;
  title: string;
  description: string;
  type: "event" | "meeting";
  date: string;
  location: string;
  capacity: number;
  registered: number;
  attended: number;
  status: "Upcoming" | "Completed" | "Archived";
  feedback: Array<{ userId: string; rating: number; comment: string }>;
  budget: number;
  expense: number;
  income: number;
  photos?: string[];
  documents?: string[];
}

export interface FinanceEntry {
  id: string;
  type: "Expense" | "Donation" | "Sponsorship" | "Membership Fee" | "Other Income";
  amount: number;
  description: string;
  category: string;
  eventId?: string;
  date: string;
  reference?: string;
}

export interface OutreachContact {
  id: string;
  name: string;
  organization: string;
  type: "Company" | "Sponsor" | "NGO" | "University";
  email: string;
  phone: string;
  stage: "Lead" | "Contacted" | "Meeting Scheduled" | "Proposal Sent" | "Partnership";
  notes: string;
  lastContact: string;
}

export interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  stage: "Applied" | "Screening" | "Interview" | "Evaluation" | "Onboarding" | "Hired" | "Rejected";
  appliedAt: string;
  notes: string;
  score?: number;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  eventId?: string;
  method: "QR" | "Manual" | "Event";
  status: "Present" | "Absent" | "Late" | "Excused";
  date: string;
}

export interface ChatMessage {
  id: string;
  fromId: string;
  toId?: string;
  team?: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  body: string;
  channel: "Email" | "WhatsApp" | "In-App";
  type: "info" | "success" | "warning" | "alert";
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  category: "auth" | "members" | "tasks" | "events" | "finance" | "outreach" | "attendance" | "settings" | "ai" | "comms";
  target?: string;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: "Email" | "WhatsApp";
  subject?: string;
  body: string;
}