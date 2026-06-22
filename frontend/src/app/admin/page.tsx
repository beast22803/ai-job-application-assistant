"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/services/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

type AdminTab = "users" | "sessions" | "applications";

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        const data = await api.adminFetchUsers();
        setUsers(data);
      } else if (activeTab === "sessions") {
        const data = await api.adminFetchSessions();
        setSessions(data);
      } else if (activeTab === "applications") {
        const data = await api.adminFetchApplications();
        setApplications(data);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert("Cannot delete your own admin account.");
      return;
    }
    if (!confirm("Are you sure you want to delete this user? This will remove all their sessions, applications, and profile data permanently!")) {
      return;
    }
    try {
      await api.adminDeleteUser(userId);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete user.");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to permanently delete this session?")) {
      return;
    }
    try {
      await api.adminDeleteSession(sessionId);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete session.");
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!confirm("Are you sure you want to permanently delete this tracked application?")) {
      return;
    }
    try {
      await api.adminDeleteApplication(appId);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete application.");
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="w-full max-w-[1300px] mx-auto px-4 sm:px-10 py-6 sm:py-10 animate-[fadeIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Administrative Control Panel</h2>
          <p className="text-[#8E8E93] text-sm">
            Manage system-wide user accounts, application sessions, and tracked data metrics.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-5 flex flex-col justify-between">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Users Database</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black">{activeTab === "users" ? users.length : "—"}</span>
              <span className="text-[#8E8E93] text-xs font-medium">registered</span>
            </div>
          </div>
          <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-5 flex flex-col justify-between">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Total Optimization Sessions</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black">{activeTab === "sessions" ? sessions.length : "—"}</span>
              <span className="text-[#8E8E93] text-xs font-medium">sessions</span>
            </div>
          </div>
          <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-5 flex flex-col justify-between">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Tracked Job Applications</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black">{activeTab === "applications" ? applications.length : "—"}</span>
              <span className="text-[#8E8E93] text-xs font-medium">applications</span>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-[#111111] p-1 rounded-md border border-[#222222] gap-1 mb-6 max-w-md">
          {(["users", "sessions", "applications"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 font-mono text-[10px] font-semibold tracking-wider uppercase px-4 py-2.5 rounded-sm transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-[#050505] text-[#FF4500] shadow-md"
                  : "text-[#8E8E93] hover:text-[#F5F5F5]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content list */}
        <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl overflow-hidden min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-[#8E8E93] font-mono">Loading data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              {activeTab === "users" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#222222] bg-[#111111]/50">
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">User Name</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Email Address</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Role</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Sessions</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Apps</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222]">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-[#8E8E93] font-mono">No users found.</td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-xs font-semibold">{u.name}</td>
                          <td className="p-4 text-xs font-mono text-[#8E8E93]">{u.email}</td>
                          <td className="p-4 text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] tracking-wide uppercase ${
                              u.is_admin ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}>
                              {u.is_admin ? "Admin" : "User"}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-mono">{u.sessions_count}</td>
                          <td className="p-4 text-xs font-mono">{u.applications_count}</td>
                          <td className="p-4 text-xs">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.id === currentUser?.id}
                              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-md font-mono text-[9px] tracking-wider uppercase transition-colors disabled:opacity-30 disabled:hover:bg-red-500/10 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === "sessions" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#222222] bg-[#111111]/50">
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Session ID</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Owner</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Target Role</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Company</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Step</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Status</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222]">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-xs text-[#8E8E93] font-mono">No sessions found.</td>
                      </tr>
                    ) : (
                      sessions.map((s) => (
                        <tr key={s.session_id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-xs font-mono text-[#8E8E93]">{s.session_id}</td>
                          <td className="p-4 text-xs font-semibold">{s.user_name}</td>
                          <td className="p-4 text-xs font-semibold">{s.job_title}</td>
                          <td className="p-4 text-xs font-semibold text-[#8E8E93]">{s.company}</td>
                          <td className="p-4 text-xs font-mono">Step {s.current_step}</td>
                          <td className="p-4 text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] tracking-wide uppercase ${
                              s.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : s.status === "abandoned"
                                ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs">
                            <button
                              onClick={() => handleDeleteSession(s.session_id)}
                              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-md font-mono text-[9px] tracking-wider uppercase transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === "applications" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#222222] bg-[#111111]/50">
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Application ID</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">User</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Role</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Company</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">ATS Score</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Verdict</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Status</th>
                      <th className="p-4 font-mono text-[10px] font-bold tracking-wider uppercase text-[#8E8E93]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222]">
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-xs text-[#8E8E93] font-mono">No applications found.</td>
                      </tr>
                    ) : (
                      applications.map((a) => (
                        <tr key={a.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-xs font-mono text-[#8E8E93]">{a.id}</td>
                          <td className="p-4 text-xs font-semibold">{a.user_name}</td>
                          <td className="p-4 text-xs font-semibold">{a.job_title}</td>
                          <td className="p-4 text-xs font-semibold text-[#8E8E93]">{a.company}</td>
                          <td className="p-4 text-xs font-mono font-bold text-emerald-400">{a.ats_score}%</td>
                          <td className="p-4 text-xs">
                            <span className="font-sans text-[11px] font-semibold">{a.verdict}</span>
                          </td>
                          <td className="p-4 text-xs">
                            <span className="px-2 py-0.5 rounded-full font-mono text-[9px] tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {a.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs">
                            <button
                              onClick={() => handleDeleteApplication(a.id)}
                              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-md font-mono text-[9px] tracking-wider uppercase transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
