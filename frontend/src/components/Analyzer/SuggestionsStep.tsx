"use client";

import type { AnalysisResult } from "@/types";
import { STYLE_OPTIONS } from "@/lib/constants";
import ATSRing from "@/components/ui/ATSRing";

interface SuggestionsStepProps {
  analysis: AnalysisResult;
  selectedSuggestions: Set<string>;
  toggleSuggestion: (s: string) => void;
  activeStyle: string;
  setActiveStyle: (s: string) => void;
  customInstructions: string;
  setCustomInstructions: (s: string) => void;
  onBack: () => void;
  onGenerate: () => void;
}

export default function SuggestionsStep({
  analysis,
  selectedSuggestions,
  toggleSuggestion,
  activeStyle,
  setActiveStyle,
  customInstructions,
  setCustomInstructions,
  onBack,
  onGenerate,
}: SuggestionsStepProps) {
  return (
    <div className="animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
      <h2 className="text-2xl font-bold mb-2">Analysis Results & Suggestions</h2>
      <p className="text-[#8E8E93] text-sm mb-8">
        Review keyword matching and select optimization tasks to build your tailored resume version.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Dial and tags */}
        <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-8 text-center flex flex-col items-center justify-start h-fit">
          <div className="mb-6">
            <ATSRing score={analysis.ats_score} />
          </div>

          <div className="w-full mt-2 flex flex-col gap-2">
            <div className="flex justify-between text-xs pb-2 border-b border-white/2">
              <span className="text-[#8E8E93]">Skill Match</span>
              <span className="font-mono font-bold">{analysis.scores.skill_match}%</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-white/2">
              <span className="text-[#8E8E93]">Experience Match</span>
              <span className="font-mono font-bold">{analysis.scores.experience_match}%</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-white/2">
              <span className="text-[#8E8E93]">Semantic Alignment</span>
              <span className="font-mono font-bold">{analysis.scores.semantic_match}%</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-white/2">
              <span className="text-[#8E8E93]">Formatting Quality</span>
              <span className="font-mono font-bold">{analysis.scores.formatting_score}%</span>
            </div>
          </div>

          <div className="w-full text-left mt-8">
            <h4 className="font-mono text-[9px] text-[#8E8E93] tracking-wider uppercase mb-3">Keyword Coverage</h4>
            <div className="flex flex-wrap gap-1.5">
              {analysis.matched_skills.map((s) => (
                <span key={s} className="font-mono text-[9px] px-2 py-1 rounded bg-green-500/2 border border-green-500/30 text-[#30D158]">
                  {s}
                </span>
              ))}
              {analysis.missing_skills.map((s) => (
                <span key={s} className="font-mono text-[9px] px-2 py-1 rounded bg-red-500/2 border border-red-500/30 text-[#FF453A]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main Checklist Column */}
        <div className="lg:col-span-2 bg-[#0C0C0C] border border-[#222222] rounded-xl p-8">
          <h3 className="text-lg font-bold border-b border-[#222222] pb-4 mb-5">Optimization Suggestion Log</h3>

          <p className="text-xs text-[#8E8E93] mb-6">
            Our engine compiled these recommendations to close keyword and structure gaps. Select the improvements you wish to apply.
          </p>

          <div className="flex flex-col gap-3 mb-8">
            {analysis.suggestions.map((sugg, i) => {
              const isSelected = selectedSuggestions.has(sugg);
              return (
                <div
                  key={i}
                  onClick={() => toggleSuggestion(sugg)}
                  className={`flex items-start gap-4 bg-[#111111] border p-4 rounded-lg cursor-pointer transition-all ${
                    isSelected ? "border-[#FF4500] bg-[#FF4500]/2" : "border-[#222222] hover:border-[#8E8E93]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1 w-4 h-4 accent-[#FF4500]"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs leading-relaxed">{sugg}</span>
                </div>
              );
            })}
          </div>

          <h3 className="text-lg font-bold border-b border-[#222222] pb-4 mb-5">Tailoring Options</h3>

          {/* Style selector */}
          <div className="flex flex-col gap-2 mb-6">
            <label className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase">Cover Letter Tone</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveStyle(s)}
                  className={`font-mono text-[9px] tracking-wider uppercase p-2.5 rounded border text-center transition-all ${
                    activeStyle === s
                      ? "bg-[#F5F5F5] text-[#050505] border-[#F5F5F5]"
                      : "bg-[#111111] border-[#222222] text-[#8E8E93] hover:text-[#F5F5F5] hover:border-[#8E8E93]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Custom constraints */}
          <div className="flex flex-col gap-2 mb-8">
            <label className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase">Custom Formatting / Target Constraints</label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Keep resume within 1 page, emphasize team leadership experience..."
              className="px-4 py-3 bg-[#111111] border border-[#222222] focus:border-[#FF4500] text-sm rounded-lg outline-none transition-all"
            />
          </div>

          <div className="flex justify-between border-t border-[#222222] pt-6">
            <button
              onClick={onBack}
              className="border border-[#222222] text-[#F5F5F5] hover:bg-white/5 px-6 py-2.5 rounded-lg font-mono text-xs font-semibold tracking-wider uppercase transition-all"
            >
              &larr; Back
            </button>
            <button
              onClick={onGenerate}
              className="bg-[#F5F5F5] text-[#050505] hover:bg-[#FF4500] hover:text-[#F5F5F5] px-6 py-2.5 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all"
            >
              Optimize & Generate Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
