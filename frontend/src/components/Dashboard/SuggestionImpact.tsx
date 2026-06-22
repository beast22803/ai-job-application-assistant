"use client";

import type { SuggestionImpact as SuggestionImpactType } from "@/types";

interface SuggestionImpactProps {
  items: SuggestionImpactType[];
}

export default function SuggestionImpact({ items }: SuggestionImpactProps) {
  return (
    <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-8 h-fit">
      <h2 className="text-lg font-bold border-b border-[#222222] pb-4 mb-5">Suggestion Impact</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr>
              <th className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase pb-3">Actionable Suggestion</th>
              <th className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase pb-3">ATS Gain</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, idx) => (
                <tr key={idx} className="border-b border-white/3">
                  <td className="py-4 pr-3 leading-relaxed">{item.suggestion}</td>
                  <td className="py-4 font-mono font-semibold text-[#30D158] whitespace-nowrap">+{item.ats_gain}%</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="text-center text-[#8E8E93] py-10">
                  No feedback loop recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
