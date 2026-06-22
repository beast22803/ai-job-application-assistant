"use client";

import type { ActiveSession } from "@/types";
import { formatDate } from "@/lib/constants";

interface SessionsTableProps {
  sessions: ActiveSession[];
  onResume: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onAbandon: (sessionId: string) => void;
}

export default function SessionsTable({ sessions, onResume, onDelete, onAbandon }: SessionsTableProps) {
  return (
    <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-4 sm:p-8">
      <h2 className="text-lg font-bold border-b border-[#222222] pb-4 mb-5">Active Analysis Sessions</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr>
              <th className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase pb-3 whitespace-nowrap pr-6">Job Title / Company</th>
              <th className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase pb-3 whitespace-nowrap pr-6">Stage</th>
              <th className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase pb-3 whitespace-nowrap pr-6">Last Updated</th>
              <th className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase pb-3 whitespace-nowrap text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length > 0 ? (
              sessions.map((s) => {
                const isAtExport = s.current_step === 3;
                return (
                  <tr key={s.session_id} className="border-b border-white/3 hover:bg-white/1">
                    <td className="py-4 pr-6">
                      <div className="font-semibold text-[#F5F5F5]">{s.job_title}</div>
                      <div className="text-[11px] text-[#8E8E93]">{s.company}</div>
                      <div className="font-mono text-[9px] text-[#FF4500] mt-1">ID: {s.session_id}</div>
                    </td>
                    <td className="py-4 pr-6">
                      <span className={`inline-flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-sm border ${
                        isAtExport
                          ? "bg-[#30D158]/8 border-[#30D158]/25 text-[#30D158]"
                          : "bg-[#FF9500]/8 border-[#FF9500]/25 text-[#FF9500]"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isAtExport ? "bg-[#30D158]" : "bg-[#FF9500]"}`} />
                        {isAtExport ? "Export Ready" : "Suggestions"}
                      </span>
                    </td>
                    <td className="py-4 pr-6 text-[#8E8E93]">{formatDate(s.timestamp)}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onResume(s.session_id)}
                          className="border border-[#222222] text-[#F5F5F5] hover:bg-white/5 hover:border-white px-3 py-1.5 rounded-sm font-mono text-[10px] tracking-wider uppercase transition-all"
                        >
                          Resume &rarr;
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to archive this session? It will be hidden from the active list but data is preserved.")) {
                              onAbandon(s.session_id);
                            }
                          }}
                          className="border border-[#332211] hover:border-[#FF9500] text-[#FF9500]/70 hover:text-[#FF9500] hover:bg-[#FF9500]/10 px-3 py-1.5 rounded-sm font-mono text-[10px] tracking-wider uppercase transition-all"
                        >
                          Archive
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this analysis session? This will permanently delete all associated resume versions.")) {
                              onDelete(s.session_id);
                            }
                          }}
                          className="border border-[#331111] hover:border-red-600 text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-sm font-mono text-[10px] tracking-wider uppercase transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="text-center text-[#8E8E93] py-8">
                  No active sessions found. Start a new analysis to see it here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
