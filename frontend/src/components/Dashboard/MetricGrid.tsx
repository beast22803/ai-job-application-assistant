"use client";

import type { DashboardData } from "@/types";

interface MetricGridProps {
  data: DashboardData;
}

export default function MetricGrid({ data }: MetricGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
      <div className="bg-[#0C0C0C] border border-[#222222] p-6 rounded-xl relative overflow-hidden">
        <span className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase block mb-3">Jobs Analyzed</span>
        <div className="text-4xl font-black tracking-tight leading-none">{data.total_analyzed}</div>
        <p className="text-[11px] text-[#8E8E93] mt-2">Total applications evaluated</p>
      </div>
      <div className="bg-[#0C0C0C] border border-[#222222] p-6 rounded-xl relative overflow-hidden">
        <span className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase block mb-3">Average ATS Score</span>
        <div className="text-4xl font-black tracking-tight leading-none">{data.average_ats}%</div>
        <p className="text-[11px] text-[#8E8E93] mt-2">Targeting 80%+ match rate</p>
      </div>
      <div className="bg-[#0C0C0C] border border-[#222222] p-6 rounded-xl relative overflow-hidden">
        <span className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase block mb-3">Interview Prob.</span>
        <div className="text-4xl font-black tracking-tight leading-none">{data.average_interview_probability}%</div>
        <p className="text-[11px] text-[#8E8E93] mt-2">Average calculated probability</p>
      </div>
      <div className="bg-[#0C0C0C] border border-[#222222] p-6 rounded-xl relative overflow-hidden">
        <span className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase block mb-3">Strong Apply</span>
        <div className="text-4xl font-black tracking-tight leading-none">
          {data.verdict_distribution["Strong Apply"] || 0}
        </div>
        <p className="text-[11px] text-[#8E8E93] mt-2">Matches grading &ge; 85%</p>
      </div>
    </div>
  );
}
