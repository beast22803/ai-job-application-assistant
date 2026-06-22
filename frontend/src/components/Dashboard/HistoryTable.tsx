"use client";

import type { Application } from "@/types";
import { formatDate } from "@/lib/constants";
import VerdictBadge from "@/components/ui/VerdictBadge";

interface HistoryTableProps {
  applications: Application[];
  onUpdateStatus: (appId: string, status: string) => void;
  onResumeSession: (sessionId: string) => void;
}

export default function HistoryTable({ applications, onUpdateStatus, onResumeSession }: HistoryTableProps) {
  return (
    <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-4 sm:p-8">
      <h2 className="text-lg font-bold border-b border-[#222222] pb-4 mb-5">Job Application History</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr>
              <th className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase pb-3 whitespace-nowrap pr-6">Job Title / Company</th>
              <th className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase pb-3 whitespace-nowrap pr-6">ATS Score</th>
              <th className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase pb-3 whitespace-nowrap pr-6">Verdict</th>
              <th className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase pb-3 whitespace-nowrap pr-6">Version</th>
              <th className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase pb-3 whitespace-nowrap pr-6">Status</th>
              <th className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase pb-3 whitespace-nowrap pr-6">Date</th>
              <th className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase pb-3 whitespace-nowrap text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.length > 0 ? (
              applications.map((app) => (
                <tr key={app.id} className="border-b border-white/3 hover:bg-white/1">
                  <td className="py-4 pr-6">
                    <div className="font-semibold text-[#F5F5F5]">{app.job_title}</div>
                    <div className="text-[11px] text-[#8E8E93]">{app.company}</div>
                  </td>
                  <td className="py-4 pr-6 font-mono font-semibold">{app.ats_score}%</td>
                  <td className="py-4 pr-6"><VerdictBadge verdict={app.verdict} /></td>
                  <td className="py-4 pr-6 font-mono text-[#8E8E93]">v{app.resume_version}</td>
                  <td className="py-4 pr-6">
                    <select
                      value={app.status}
                      onChange={(e) => onUpdateStatus(app.id, e.target.value)}
                      className="bg-[#111111] hover:bg-[#1C1C1E] border border-[#222222] hover:border-[#444444] text-[#F5F5F5] font-mono text-[10px] font-bold uppercase rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#FF4500] cursor-pointer transition-colors"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="py-4 pr-6 text-[#8E8E93] whitespace-nowrap">{formatDate(app.timestamp)}</td>
                  <td className="py-4 text-right">
                    {app.session_id ? (
                      <button
                        onClick={() => onResumeSession(app.session_id!)}
                        className="inline-flex items-center gap-1 border border-[#222222] text-[#8E8E93] hover:text-[#F5F5F5] hover:bg-white/5 hover:border-white px-2.5 py-1.5 rounded-sm font-mono text-[9px] tracking-wider uppercase transition-all"
                        title="Get back to decisions, tailored resume, cover letter, and recruiter email"
                      >
                        <span className="material-symbols-rounded text-[11px] text-[#FF4500]">auto_awesome</span>
                        Decisions
                      </button>
                    ) : (
                      <span className="text-[#444444] font-mono text-[9px] pr-4">—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center text-[#8E8E93] py-10">
                  No applications analyzed yet. Go to the "New Analysis" tab to evaluate your first job.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
