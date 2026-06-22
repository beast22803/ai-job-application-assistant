"use client";

interface ATSRingProps {
  score: number;
  size?: number;
}

export default function ATSRing({ score, size = 160 }: ATSRingProps) {
  const half = size / 2;
  const radius = half - 10;
  const circumference = 2 * Math.PI * radius;
  const validScore = typeof score === "number" && !isNaN(score) ? score : 0;
  const offset = circumference - (validScore / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full rotate-[-90deg]">
        <circle
          className="stroke-[#222222] fill-none"
          cx={half}
          cy={half}
          r={radius}
          strokeWidth={10}
        />
        <circle
          className="stroke-[#FF4500] fill-none transition-all duration-700 ease-out"
          cx={half}
          cy={half}
          r={radius}
          strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-5xl font-black tracking-tighter">{validScore}</span>
        <span className="font-mono text-[9px] text-[#8E8E93] tracking-widest uppercase mt-1">
          ATS Score
        </span>
      </div>
    </div>
  );
}
