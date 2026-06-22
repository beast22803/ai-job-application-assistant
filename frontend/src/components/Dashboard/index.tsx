"use client";

import type { DashboardData, ActiveSession } from "@/types";
import MetricGrid from "./MetricGrid";
import SessionsTable from "./SessionsTable";
import HistoryTable from "./HistoryTable";

interface DashboardProps {
  data: DashboardData;
  sessions: ActiveSession[];
  onResumeSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onAbandonSession: (sessionId: string) => void;
  onUpdateApplicationStatus: (appId: string, status: string) => void;
}

export default function Dashboard({
  data,
  sessions,
  onResumeSession,
  onDeleteSession,
  onAbandonSession,
  onUpdateApplicationStatus,
}: DashboardProps) {
  return (
    <div className="animate-[fadeIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
      <MetricGrid data={data} />
      <div className="flex flex-col gap-8 mt-8">
        <SessionsTable
          sessions={sessions}
          onResume={onResumeSession}
          onDelete={onDeleteSession}
          onAbandon={onAbandonSession}
        />
        <HistoryTable
          applications={data.applications}
          onUpdateStatus={onUpdateApplicationStatus}
          onResumeSession={onResumeSession}
        />
      </div>
    </div>
  );
}
