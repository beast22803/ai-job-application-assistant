"use client";

import React from "react";

interface InputStepProps {
  jobUrl: string;
  setJobUrl: (v: string) => void;
  jobDescription: string;
  setJobDescription: (v: string) => void;
  resumeText: string;
  setResumeText: (v: string) => void;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFetchUrl: () => void;
  onAnalyze: () => void;
  onResumeSession: (sid: string) => void;
  profileStats?: { experiences: number; projects: number; skills: number; education: number } | null;
  useMasterProfile: boolean;
  setUseMasterProfile: (v: boolean) => void;
}

export default function InputStep({
  jobUrl, setJobUrl,
  jobDescription, setJobDescription,
  resumeText, setResumeText,
  selectedFile, setSelectedFile,
  fileInputRef,
  onFetchUrl, onAnalyze, onResumeSession,
  profileStats,
  useMasterProfile,
  setUseMasterProfile,
}: InputStepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Job Compatibility Analysis</h2>
      <p className="text-[#8E8E93] text-sm mb-6">
        Evaluate how well your resume matches the target job description. Generate optimization suggestions before exporting assets.
      </p>

      {/* Session ID lookup bar */}
      <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-[#8E8E93]">
          Have a previous Session ID? Resume it directly to continue reviewing suggestions.
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <input
            type="text"
            id="search-sid-input"
            placeholder="Enter session_id..."
            className="px-3 py-1.5 text-xs bg-[#050505] border border-[#222222] text-[#F5F5F5] rounded-sm outline-none focus:border-[#FF4500] w-full sm:w-48"
          />
          <button
            onClick={() => {
              const el = document.getElementById("search-sid-input") as HTMLInputElement;
              onResumeSession(el?.value || "");
            }}
            className="bg-[#F5F5F5] text-[#050505] hover:bg-[#FF4500] hover:text-[#F5F5F5] px-4 py-2 rounded-sm font-mono text-[10px] font-semibold tracking-wider uppercase transition-all whitespace-nowrap"
          >
            Resume
          </button>
        </div>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Resume uploads / Master Profile toggle */}
        <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-4">
            <h3 className="text-sm font-semibold text-[#8E8E93] uppercase tracking-wider">01. Resume Details</h3>
            <div className="flex bg-[#111111] p-1 rounded-md border border-[#222222] gap-1">
              <button
                type="button"
                onClick={() => setUseMasterProfile(true)}
                className={`font-mono text-[9px] font-semibold tracking-wider uppercase px-3 py-1 rounded-sm transition-all ${
                  useMasterProfile
                    ? "bg-[#050505] text-[#FF4500] shadow-md"
                    : "text-[#8E8E93] hover:text-[#F5F5F5]"
                }`}
              >
                Master Profile
              </button>
              <button
                type="button"
                onClick={() => setUseMasterProfile(false)}
                className={`font-mono text-[9px] font-semibold tracking-wider uppercase px-3 py-1 rounded-sm transition-all ${
                  !useMasterProfile
                    ? "bg-[#050505] text-[#FF4500] shadow-md"
                    : "text-[#8E8E93] hover:text-[#F5F5F5]"
                }`}
              >
                Manual Upload
              </button>
            </div>
          </div>

          {useMasterProfile ? (
            <div className="flex flex-col gap-4">
              {profileStats && (profileStats.experiences + profileStats.projects + profileStats.skills + profileStats.education > 0) ? (
                <div className="bg-[#111111] border border-[#222222] rounded-lg p-6 flex flex-col gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF4500]/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FF4500]/10 border border-[#FF4500]/20 flex items-center justify-center text-[#FF4500]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#F5F5F5]">Master Profile Connected</h4>
                      <p className="text-[10px] text-[#8E8E93] font-mono uppercase tracking-wider">Ready for dynamic tailoring</p>
                    </div>
                  </div>
                  <div className="border-t border-[#222222] my-1" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#050505] border border-[#222222] p-2.5 rounded-md text-center">
                      <div className="text-lg font-bold text-[#F5F5F5]">{profileStats.experiences}</div>
                      <div className="text-[9px] text-[#8E8E93] font-mono uppercase tracking-wider">Experiences</div>
                    </div>
                    <div className="bg-[#050505] border border-[#222222] p-2.5 rounded-md text-center">
                      <div className="text-lg font-bold text-[#F5F5F5]">{profileStats.skills}</div>
                      <div className="text-[9px] text-[#8E8E93] font-mono uppercase tracking-wider">Skills</div>
                    </div>
                    <div className="bg-[#050505] border border-[#222222] p-2.5 rounded-md text-center">
                      <div className="text-lg font-bold text-[#F5F5F5]">{profileStats.projects}</div>
                      <div className="text-[9px] text-[#8E8E93] font-mono uppercase tracking-wider">Projects</div>
                    </div>
                    <div className="bg-[#050505] border border-[#222222] p-2.5 rounded-md text-center">
                      <div className="text-lg font-bold text-[#F5F5F5]">{profileStats.education}</div>
                      <div className="text-[9px] text-[#8E8E93] font-mono uppercase tracking-wider">Education</div>
                    </div>
                  </div>
                  <p className="text-xs text-[#8E8E93] leading-relaxed mt-2">
                    The matchmaker will automatically parse the job description, select the most relevant entries from your profile, and order them optimally.
                  </p>
                </div>
              ) : (
                <div className="border border-[#222222] border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
                  <div className="text-3xl mb-3">📂</div>
                  <h4 className="text-sm font-semibold text-[#F5F5F5] mb-2">Master Profile is Empty</h4>
                  <p className="text-xs text-[#8E8E93] max-w-[240px] mx-auto mb-5 leading-relaxed">
                    Fill out your career history, projects, and skills first to enable one-click tailoring.
                  </p>
                  <p className="text-[10px] text-[#8E8E93] font-mono uppercase tracking-wider">
                    Use "Manual Upload" mode or add profile details.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase">Upload PDF or DOCX Resume</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#222222] hover:border-[#FF4500] p-10 text-center rounded-lg bg-[#0C0C0C] cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                        setResumeText("");
                      }
                    }}
                    accept=".pdf,.docx"
                    className="hidden"
                  />
                  <div className="text-xs text-[#8E8E93]">
                    Drag and drop files here, or <strong className="text-[#F5F5F5]">browse local storage</strong>
                  </div>
                  {selectedFile && (
                    <div className="inline-flex items-center gap-2 bg-[#111111] border border-[#222222] px-3 py-1.5 rounded-full font-mono text-[10px] mt-4">
                      📄 {selectedFile.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center text-[#8E8E93] text-xs">— OR —</div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase">Paste Resume Plain Text</label>
                <textarea
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    setSelectedFile(null);
                  }}
                  placeholder="Paste full resume text content..."
                  rows={10}
                  className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] p-4 text-sm rounded-lg outline-none transition-all"
                />
              </div>
            </>
          )}
        </div>

        {/* Job Details inputs */}
        <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#8E8E93] uppercase tracking-wider mb-6">02. Job Description</h3>

            {/* URL Import */}
            <div className="flex flex-col gap-2 mb-6">
              <label className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase">Import via Job URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="Paste LinkedIn, Indeed, or company career link..."
                  className="flex-1 px-4 py-2 bg-[#111111] border border-[#222222] focus:border-[#FF4500] text-sm rounded-lg outline-none transition-all"
                />
                <button
                  onClick={onFetchUrl}
                  className="bg-[#111111] text-[#F5F5F5] border border-[#222222] hover:border-[#F5F5F5] px-4 py-2 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all whitespace-nowrap"
                >
                  Crawl Description
                </button>
              </div>
            </div>

            {/* Text Paste */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase">Paste Job Specifications</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste full job description requirements..."
                rows={14}
                className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] p-4 text-sm rounded-lg outline-none transition-all"
              />
            </div>
          </div>

          <div className="text-right mt-6">
            <button
              onClick={onAnalyze}
              className="bg-[#F5F5F5] text-[#050505] hover:bg-[#FF4500] hover:text-[#F5F5F5] px-6 py-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all"
            >
              Analyze Compatibility &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
