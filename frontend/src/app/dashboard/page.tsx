"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/services/api";
import type { DashboardData, ActiveSession } from "@/types";
import DashboardComponent from "@/components/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useNotifications } from "@/contexts/NotificationContext";

export default function DashboardPage() {
  const router = useRouter();
  const { showError } = useNotifications();

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    total_analyzed: 0,
    average_ats: 0,
    average_interview_probability: 0,
    verdict_distribution: {},
    applications: [],
    suggestion_impact_report: [],
  });
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  const fetchDashboard = useCallback(async () => {
    try {
      const [metrics, sessions] = await Promise.all([
        api.fetchDashboardMetrics(),
        api.fetchActiveSessions(),
      ]);
      setDashboardData(metrics);
      setActiveSessions(sessions);
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleResumeSession = (sessionId: string) => {
    router.push(`/analyzer?sessionId=${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await api.deleteSession(sessionId);
      fetchDashboard();
    } catch (err: any) {
      showError(err.message || "Failed to delete session.");
    }
  };

  const handleAbandonSession = async (sessionId: string) => {
    try {
      await api.abandonSession(sessionId);
      fetchDashboard();
    } catch (err: any) {
      showError(err.message || "Failed to archive session.");
    }
  };

  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      await api.updateApplicationStatus(appId, status);
      fetchDashboard();
    } catch (err: any) {
      showError(err.message || "Failed to update application status.");
    }
  };

  return (
    <ProtectedRoute>
      <div className="animate-[fadeIn_0.5s_ease-out_both] w-full max-w-[1300px] mx-auto px-4 sm:px-10 py-6 sm:py-10">
        <DashboardComponent
          data={dashboardData}
          sessions={activeSessions}
          onResumeSession={handleResumeSession}
          onDeleteSession={handleDeleteSession}
          onAbandonSession={handleAbandonSession}
          onUpdateApplicationStatus={handleUpdateStatus}
        />
      </div>
    </ProtectedRoute>
  );
}
