 
 import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Forgot from "./pages/auth/Forgot";
import Reset from "./pages/auth/Reset";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Tasks from "./pages/Tasks";
import Attendance from "@/pages/Attendance";
import AttendanceReport from "@/pages/AttendanceReport";
import Events from "@/pages/Events";
import Finance from "./pages/Finance";
import HR from "./pages/HR";
import Outreach from "./pages/Outreach";
import Leaderboard from "./pages/Leaderboard";
import AI from "./pages/AI";
import Communications from "./pages/Communications";
import Settings from "./pages/Settings";
import MyDashboard from "./pages/MyDashboard";
import IDCard from "./pages/IDCard";
import ActivityLogs from "./pages/ActivityLogs";
import Departments from "./pages/Departments";
import Chat from "./pages/Chat";
import Architecture from "./pages/Architecture";
import AccountManagement from "./pages/AccountManagement";
import PasswordVault from "./pages/PasswordVault";
import type { ReactNode } from "react";
import { canAccess, type Section } from "./lib/access";

function Protected({ children }: { children: ReactNode }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { currentUser } = useApp();
  if (currentUser) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

function RequireAccess({ section, children }: { section: Section; children: ReactNode }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  return canAccess(currentUser, section) ? <>{children}</> : <Navigate to="/app/me" replace />;
}

// Use HashRouter for the static build (dist/index.html) so refresh works without a server
const Router: typeof BrowserRouter = HashRouter as any;

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route element={<PublicOnly><AuthLayout /></PublicOnly>}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<Forgot />} />
            <Route path="/reset" element={<Reset />} />
          </Route>

          <Route path="/app" element={<Protected><DashboardLayout /></Protected>}>
            <Route index element={<Navigate to="/app/me" replace />} />
            <Route path="me" element={<RequireAccess section="me"><MyDashboard /></RequireAccess>} />
            <Route path="id-card" element={<RequireAccess section="id-card"><IDCard /></RequireAccess>} />
            <Route path="accounts" element={<RequireAccess section="accounts"><AccountManagement /></RequireAccess>} />
            <Route path="passwords" element={<RequireAccess section="passwords"><PasswordVault /></RequireAccess>} />
            <Route path="logs" element={<RequireAccess section="logs"><ActivityLogs /></RequireAccess>} />
            <Route path="architecture" element={<RequireAccess section="architecture"><Architecture /></RequireAccess>} />
            <Route path="dashboard" element={<RequireAccess section="dashboard"><Dashboard /></RequireAccess>} />
            <Route path="members" element={<RequireAccess section="members"><Members /></RequireAccess>} />
            <Route path="departments" element={<RequireAccess section="departments"><Departments /></RequireAccess>} />
            <Route path="tasks" element={<RequireAccess section="tasks"><Tasks /></RequireAccess>} />
            <Route path="attendance" element={<RequireAccess section="attendance"><Attendance /></RequireAccess>} />
            <Route path="attendance-report" element={<RequireAccess section="attendance"><AttendanceReport /></RequireAccess>} />
            <Route path="events" element={<RequireAccess section="events"><Events /></RequireAccess>} />
            <Route path="finance" element={<RequireAccess section="finance"><Finance /></RequireAccess>} />
            <Route path="hr" element={<RequireAccess section="hr"><HR /></RequireAccess>} />
            <Route path="outreach" element={<RequireAccess section="outreach"><Outreach /></RequireAccess>} />
            <Route path="leaderboard" element={<RequireAccess section="leaderboard"><Leaderboard /></RequireAccess>} />
            <Route path="ai" element={<RequireAccess section="ai"><AI /></RequireAccess>} />
            <Route path="communications" element={<RequireAccess section="communications"><Communications /></RequireAccess>} />
            <Route path="chat" element={<RequireAccess section="chat"><Chat /></RequireAccess>} />
            <Route path="settings" element={<RequireAccess section="settings"><Settings /></RequireAccess>} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}
