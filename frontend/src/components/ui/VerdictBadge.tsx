"use client";

import { getVerdictClass } from "@/lib/constants";

interface VerdictBadgeProps {
  verdict: string;
}

export default function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const vClass = getVerdictClass(verdict);
  return (
    <span className={`inline-block font-mono text-[9px] font-semibold uppercase px-2 py-0.5 rounded-sm border ${vClass}`}>
      {verdict}
    </span>
  );
}
