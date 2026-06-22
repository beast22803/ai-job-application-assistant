"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ReviewResult, AnalysisResult } from "@/types";
import { downloadHtmlDocument, copyToClipboard } from "@/lib/constants";
import VerdictBadge from "@/components/ui/VerdictBadge";
import RefinementChat from "./RefinementChat";
import * as api from "@/services/api";
import { diffLines } from "@/lib/diff";

interface ExportStepProps {
  reviewResult: ReviewResult;
  analysis: AnalysisResult;
  activeStyle: string;
  sessionId: string;
  onSaveApplication: () => void;
  onStartNew: () => void;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

const stripHtml = (html: string): string => {
  if (typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const styles = doc.querySelectorAll("style");
  styles.forEach((s) => s.remove());
  return doc.body.textContent || "";
};

export default function ExportStep({
  reviewResult,
  analysis,
  activeStyle,
  sessionId,
  onSaveApplication,
  onStartNew,
}: ExportStepProps) {
  const [showRefinement, setShowRefinement] = useState(false);
  const [activeAsset, setActiveAsset] = useState<"resume" | "cover_letter" | "email">("resume");

  // Mutable refined copies
  const [refinedResume, setRefinedResume] = useState(reviewResult.optimized_resume || "");
  const [refinedCoverLetter, setRefinedCoverLetter] = useState(reviewResult.cover_letter || "");
  const [refinedEmailSubject, setRefinedEmailSubject] = useState(reviewResult.recruiter_email?.subject || "");
  const [refinedEmailBody, setRefinedEmailBody] = useState(reviewResult.recruiter_email?.body || "");

  // PDF Export and Diff States
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [originalText, setOriginalText] = useState<string | null>(null);

  // Interactive Editor states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editorTab, setEditorTab] = useState<"visual" | "html">("visual");
  const [isScoring, setIsScoring] = useState(false);
  const [liveAtsScore, setLiveAtsScore] = useState(reviewResult.current_ats_score || 0);
  const [liveMatchedSkills, setLiveMatchedSkills] = useState<string[]>(reviewResult.matched_skills || []);
  const [liveMissingSkills, setLiveMissingSkills] = useState<string[]>(reviewResult.missing_skills || []);

  // Version History states
  const [showVersionsDrawer, setShowVersionsDrawer] = useState(false);
  const [versionsList, setVersionsList] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [currentVersionNum, setCurrentVersionNum] = useState(reviewResult.resume_version);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Debounced live ATS scoring call
  useEffect(() => {
    if (!isEditMode) return;

    const timer = setTimeout(async () => {
      setIsScoring(true);
      try {
        const data = await api.scoreResumeHtml(sessionId, refinedResume);
        setLiveAtsScore(data.ats_score);
        setLiveMatchedSkills(data.matched_skills);
        setLiveMissingSkills(data.missing_skills);
      } catch (err) {
        console.error("Failed to run live scoring:", err);
      } finally {
        setIsScoring(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [refinedResume, isEditMode, sessionId]);

  // Make iframe contentEditable when in visual edit mode
  useEffect(() => {
    if (!isEditMode || editorTab !== "visual") return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(refinedResume);
    doc.close();

    if (doc.body) {
      doc.body.contentEditable = "true";
      const styleEl = doc.createElement("style");
      styleEl.innerHTML = `
        body:focus { outline: none; }
        [contenteditable="true"] { min-height: 100vh; }
      `;
      doc.head.appendChild(styleEl);

      const handleInput = () => {
        const currentHtml = "<!DOCTYPE html>\n<html>" + doc.documentElement.innerHTML + "</html>";
        setRefinedResume(currentHtml);
      };

      doc.body.addEventListener("input", handleInput);
      return () => {
        doc.body.removeEventListener("input", handleInput);
      };
    }
  }, [isEditMode, editorTab]);

  const loadVersions = async () => {
    setLoadingVersions(true);
    try {
      const data = await api.getResumeVersions(sessionId);
      setVersionsList(data.versions);
    } catch (err: any) {
      alert("Failed to load versions: " + err.message);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleSaveVersion = async () => {
    setIsSavingVersion(true);
    try {
      const data = await api.saveResumeVersion(sessionId, refinedResume);
      setCurrentVersionNum(data.resume_version);
      
      // Update reviewResult object's score and version
      reviewResult.resume_version = data.resume_version;
      reviewResult.current_ats_score = data.ats_score;
      reviewResult.optimized_resume = refinedResume;
      reviewResult.validation = data.validation || reviewResult.validation;
      
      alert(`✓ Version ${data.resume_version} saved successfully!`);
      loadVersions();
    } catch (err: any) {
      alert("Failed to save version snapshot: " + err.message);
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleRestoreVersion = async (versionNum: number) => {
    if (
      !confirm(
        `Are you sure you want to restore Version ${versionNum}? This will copy its contents to a new version.`
      )
    ) {
      return;
    }
    setIsRestoring(true);
    try {
      const data = await api.restoreResumeVersion(sessionId, versionNum);
      setRefinedResume(data.resume_html);
      setLiveAtsScore(data.ats_score);
      setLiveMatchedSkills(data.validation?.matched_skills || []);
      setLiveMissingSkills(data.validation?.missing_skills || []);
      setCurrentVersionNum(data.resume_version);
      
      // Update reviewResult object's score and version
      reviewResult.resume_version = data.resume_version;
      reviewResult.current_ats_score = data.ats_score;
      reviewResult.optimized_resume = data.resume_html;
      reviewResult.validation = data.validation || reviewResult.validation;
      
      await loadVersions();
      setShowVersionsDrawer(false);
      setIsEditMode(false);
      alert(`✓ Restored to new Version ${data.resume_version}!`);
    } catch (err: any) {
      alert("Failed to restore version: " + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const toggleEditMode = () => {
    if (!isEditMode) {
      setIsEditMode(true);
      setLiveAtsScore(reviewResult.current_ats_score);
      setLiveMatchedSkills(reviewResult.matched_skills);
      setLiveMissingSkills(reviewResult.missing_skills);
    } else {
      setIsEditMode(false);
    }
  };

  const openVersionsDrawer = () => {
    setShowVersionsDrawer(true);
    loadVersions();
  };

  const handleCopyEmail = async () => {
    const text = `Subject: ${refinedEmailSubject}\n\n${refinedEmailBody}`;
    const ok = await copyToClipboard(text);
    alert(ok ? "✓ Recruiter email copied to clipboard!" : "Failed to copy. Please select text manually.");
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    const filename = `Resume_v${currentVersionNum}.pdf`;
    
    try {
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      container.innerHTML = refinedResume;
      
      const pageEl = container.querySelector(".page");
      const targetElement = pageEl || container;

      const styleEl = document.createElement("style");
      styleEl.innerHTML = `
        @media print {
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .page { 
            box-shadow: none !important; 
            border-radius: 0 !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            max-width: 100% !important; 
          }
        }
        .section { page-break-inside: avoid; }
        .exp-item { page-break-inside: avoid; margin-bottom: 1rem; }
        .project-item { page-break-inside: avoid; margin-bottom: 0.75rem; }
        .edu-item { page-break-inside: avoid; }
      `;
      targetElement.appendChild(styleEl);
      document.body.appendChild(container);

      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
      
      const opt = {
        margin: [15, 15, 15, 15],
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };

      // @ts-ignore
      await window.html2pdf().from(targetElement).set(opt).save();
      document.body.removeChild(container);
    } catch (err: any) {
      console.error("html2pdf failed. Falling back to native browser print:", err);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(refinedResume);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      } else {
        alert("Failed to export PDF automatically. Please check your pop-up permissions.");
      }
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleToggleDiff = async () => {
    if (showDiff) {
      setShowDiff(false);
      return;
    }

    if (!originalText) {
      setLoadingDiff(true);
      try {
        const data = await api.getSession(sessionId);
        setOriginalText(data.resume_text);
        setShowDiff(true);
      } catch (err: any) {
        alert("Failed to retrieve original resume: " + err.message);
      } finally {
        setLoadingDiff(false);
      }
    } else {
      setShowDiff(true);
    }
  };

  return (
    <div className="animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-1">Application Assets Export</h2>
          <p className="text-[#8E8E93] text-sm">
            Download tailored documents and track submissions in your history logs.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openVersionsDrawer}
            className="border border-[#222222] text-[#F5F5F5] hover:border-[#FF4500] hover:text-[#FF4500] px-5 py-2.5 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap"
          >
            🕒 Version History
          </button>
          <button
            onClick={toggleEditMode}
            className={`border px-5 py-2.5 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
              isEditMode
                ? "bg-[#FF4500]/10 border-[#FF4500] text-[#FF4500]"
                : "border-[#222222] text-[#F5F5F5] hover:border-[#FF4500] hover:text-[#FF4500]"
            }`}
          >
            {isEditMode ? "✕ Close Editor" : "✎ Interactive Editor"}
          </button>
          <button
            onClick={() => setShowRefinement(!showRefinement)}
            className={`border px-5 py-2.5 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
              showRefinement
                ? "bg-[#FF4500]/10 border-[#FF4500] text-[#FF4500]"
                : "border-[#222222] text-[#F5F5F5] hover:border-[#FF4500] hover:text-[#FF4500]"
            }`}
          >
            {showRefinement ? "✕ Close Studio" : "💬 Refine Chat"}
          </button>
          <button
            onClick={onSaveApplication}
            className="bg-[#FF4500] text-[#F5F5F5] hover:bg-[#FF4500]/90 px-5 py-2.5 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap"
          >
            ✓ Save to Dashboard
          </button>
        </div>
      </div>

      {/* Refinement Chat Panel — slides in when toggled */}
      {showRefinement && (
        <div className="mb-8">
          <RefinementChat
            sessionId={sessionId}
            activeAsset={activeAsset}
            setActiveAsset={setActiveAsset}
            currentResumeHtml={refinedResume}
            currentCoverLetterHtml={refinedCoverLetter}
            currentEmailSubject={refinedEmailSubject}
            currentEmailBody={refinedEmailBody}
            onResumeRefined={setRefinedResume}
            onCoverLetterRefined={setRefinedCoverLetter}
            onEmailRefined={(d) => {
              setRefinedEmailSubject(d.subject);
              setRefinedEmailBody(d.body);
            }}
            initialMessages={reviewResult.chat_history}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assets previews (Left Columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Tailored Resume */}
          <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-8">
            <div className="flex justify-between items-center border-b border-[#222222] pb-4 mb-6">
              <span className="text-[#F5F5F5] font-semibold text-sm">
                Tailored Resume (Version {currentVersionNum})
              </span>
              <div className="flex gap-2">
                {!isEditMode && (
                  <button
                    onClick={handleToggleDiff}
                    className={`border px-3 py-1.5 rounded-sm font-mono text-[9px] tracking-wider uppercase transition-all ${
                      showDiff
                        ? "bg-[#FF4500]/10 border-[#FF4500] text-[#FF4500]"
                        : "border-[#222222] text-[#F5F5F5] hover:border-[#FF4500] hover:text-[#FF4500]"
                    }`}
                  >
                    {showDiff ? "👁 Show Preview" : "☍ Compare Diff"}
                  </button>
                )}
                <button
                  onClick={() => downloadHtmlDocument(refinedResume, `Resume_v${currentVersionNum}.html`)}
                  className="border border-[#222222] text-[#F5F5F5] hover:bg-white/5 hover:border-white px-3 py-1.5 rounded-sm font-mono text-[9px] tracking-wider uppercase transition-all"
                >
                  Download HTML
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="bg-[#F5F5F5] text-[#050505] hover:bg-[#FF4500] hover:text-[#F5F5F5] disabled:opacity-50 px-3 py-1.5 rounded-sm font-mono text-[9px] font-bold tracking-wider uppercase transition-all"
                >
                  {downloadingPdf ? "Exporting..." : "Download PDF"}
                </button>
              </div>
            </div>

            {isEditMode ? (
              <div className="flex flex-col gap-4">
                {/* Editor Tabs & Controls */}
                <div className="flex justify-between items-center bg-[#111111] border border-[#222222] rounded-lg p-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditorTab("visual")}
                      className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${
                        editorTab === "visual"
                          ? "bg-[#FF4500] text-white"
                          : "text-[#8E8E93] hover:text-[#F5F5F5]"
                      }`}
                    >
                      👁 Visual Editor
                    </button>
                    <button
                      onClick={() => setEditorTab("html")}
                      className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${
                        editorTab === "html"
                          ? "bg-[#FF4500] text-white"
                          : "text-[#8E8E93] hover:text-[#F5F5F5]"
                      }`}
                    >
                      &lt;/&gt; HTML Source
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isScoring && (
                      <span className="text-[10px] font-mono text-[#8E8E93] flex items-center gap-1.5 mr-2">
                        <span className="w-2.5 h-2.5 border-2 border-white/10 border-t-[#FF4500] rounded-full animate-spin" />
                        Scoring...
                      </span>
                    )}
                    <button
                      onClick={handleSaveVersion}
                      disabled={isSavingVersion}
                      className="bg-white/5 border border-[#222222] hover:border-[#FF4500] hover:text-[#FF4500] text-[#F5F5F5] disabled:opacity-50 px-3 py-1.5 rounded text-[10px] font-mono tracking-wider uppercase transition-all"
                    >
                      {isSavingVersion ? "Saving..." : "💾 Save Snapshot"}
                    </button>
                  </div>
                </div>

                {/* Main editor window */}
                {editorTab === "visual" ? (
                  <div className="relative border border-[#222222] rounded-lg overflow-hidden bg-white min-h-[600px]">
                    <iframe
                      ref={iframeRef}
                      className="w-full min-h-[600px] border-none bg-white"
                      title="Optimized Resume Visual Editor"
                    />
                  </div>
                ) : (
                  <textarea
                    value={refinedResume}
                    onChange={(e) => setRefinedResume(e.target.value)}
                    className="w-full min-h-[600px] font-mono text-[11px] leading-relaxed bg-[#111111] text-[#F5F5F5] border border-[#222222] rounded-lg p-6 focus:outline-none focus:border-[#FF4500] resize-none"
                    placeholder="Edit raw HTML code..."
                  />
                )}
              </div>
            ) : showDiff ? (
              <div className="w-full min-h-[600px] max-h-[600px] overflow-y-auto rounded-lg border border-[#222222] bg-[#111111] p-6 font-sans text-xs scrollbar-thin">
                <div className="flex justify-between items-center mb-4 border-b border-[#222222] pb-3">
                  <span className="font-mono text-[10px] text-[#8E8E93] uppercase tracking-wider">
                    Resume Version Comparison (Original vs Optimized)
                  </span>
                  <div className="flex gap-4 font-mono text-[9px] text-[#8E8E93]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#FF453A]/10 border border-[#FF453A]/30 rounded-sm" /> Removed
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#30D158]/10 border border-[#30D158]/30 rounded-sm" /> Added
                    </span>
                  </div>
                </div>
                {loadingDiff ? (
                  <div className="flex flex-col items-center justify-center h-[450px] gap-2 text-[#8E8E93]">
                    <div className="w-6.5 h-6.5 border-2 border-[#222222] border-t-[#FF4500] rounded-full animate-spin" />
                    Calculating differences...
                  </div>
                ) : (
                  <pre className="font-sans text-[11px] leading-relaxed whitespace-pre-wrap select-text">
                    {diffLines(originalText || "", stripHtml(refinedResume)).map((token, index) => {
                      if (token.type === "added") {
                        return (
                          <div
                            key={index}
                            className="bg-[#30D158]/10 border-l-2 border-l-[#30D158] text-[#30D158] px-2 py-0.5 my-0.5 rounded-r-sm"
                          >
                            + {token.value}
                          </div>
                        );
                      }
                      if (token.type === "removed") {
                        return (
                          <div
                            key={index}
                            className="bg-[#FF453A]/10 border-l-2 border-l-[#FF453A] text-[#FF453A] line-through px-2 py-0.5 my-0.5 rounded-r-sm"
                          >
                            - {token.value}
                          </div>
                        );
                      }
                      return (
                        <div key={index} className="text-[#8E8E93]/85 px-2 py-0.5">
                          {token.value || " "}
                        </div>
                      );
                    })}
                  </pre>
                )}
              </div>
            ) : (
              <iframe
                srcDoc={refinedResume}
                className="w-full min-h-[600px] rounded-lg border border-[#222222] bg-white shadow-inner"
                title="Optimized Resume Preview"
              />
            )}

            {/* Validation */}
            <div className="border border-[#222222] rounded-lg p-4 mt-6">
              <div className={`flex items-center gap-2 font-bold text-xs mb-3 ${reviewResult.validation.valid ? "text-[#30D158]" : "text-[#FF453A]"}`}>
                ● Resume Content Validation
              </div>
              <ul className="text-[11px] text-[#8E8E93] list-square pl-5 flex flex-col gap-1.5">
                {reviewResult.validation.valid ? (
                  <>
                    <li>✓ All required sections verified (Summary, Skills, Experience, Education).</li>
                    <li>✓ No generic placeholders detected.</li>
                    <li>✓ Structure formatting is parser-compatible.</li>
                  </>
                ) : (
                  reviewResult.validation.errors.map((err, i) => (
                    <li key={i}>⚠ {err}</li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* Tailored Cover Letter */}
          <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-8">
            <div className="flex justify-between items-center border-b border-[#222222] pb-4 mb-6">
              <span className="text-[#F5F5F5] font-semibold text-sm">
                Tailored Cover Letter ({activeStyle} Style)
              </span>
              <button
                onClick={() => downloadHtmlDocument(refinedCoverLetter, `CoverLetter_${activeStyle}.html`)}
                className="border border-[#222222] text-[#F5F5F5] hover:bg-white/5 hover:border-white px-3 py-1.5 rounded-sm font-mono text-[9px] tracking-wider uppercase transition-all"
              >
                Download HTML
              </button>
            </div>
            <div
              className="bg-[#1A1A1E] text-white/95 p-8 rounded-lg min-h-[200px] text-xs leading-relaxed border border-[#222222]"
              dangerouslySetInnerHTML={{ __html: refinedCoverLetter }}
            />
          </div>
        </div>

        {/* Sidebar Outputs (Right Column) */}
        <div className="flex flex-col gap-6">

          {isEditMode ? (
            <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-6 flex flex-col gap-5 border-t-[3px] border-t-[#FF4500]">
              <div>
                <span className="font-mono text-[9px] text-[#8E8E93] tracking-widest uppercase block mb-1">Live ATS Optimizer</span>
                <h3 className="text-sm font-bold text-[#F5F5F5]">Real-time Tailoring Panel</h3>
              </div>
              
              {/* ATS Score Wheel */}
              <div className="flex items-center gap-4 bg-[#111111] border border-[#222222] rounded-lg p-4">
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-black border-2 border-[#FF4500]/25">
                  <span className="text-lg font-black font-mono text-[#FF4500]">{liveAtsScore}%</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#F5F5F5]">Optimization Score</div>
                  <div className="text-[10px] text-[#30D158] font-mono mt-0.5">
                    {liveAtsScore >= (reviewResult?.current_ats_score || 0) 
                      ? `+${liveAtsScore - (reviewResult?.current_ats_score || 0)}% improvement`
                      : `${liveAtsScore - (reviewResult?.current_ats_score || 0)}% decrease`}
                  </div>
                </div>
              </div>

              {/* Skills lists */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-bold text-[#F5F5F5]">Target Keywords Match</div>
                
                {/* Missing Skills (red/orange) */}
                <div>
                  <div className="text-[10px] font-mono text-[#FF453A] uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Missing Skills ({liveMissingSkills.length})</span>
                    <span className="text-[8px] bg-[#FF453A]/10 border border-[#FF453A]/25 px-1.5 py-0.5 rounded-sm">Add these to resume</span>
                  </div>
                  {liveMissingSkills.length === 0 ? (
                    <div className="text-[10px] text-[#8E8E93] italic bg-[#111111] p-3 rounded-lg border border-[#222222] text-center">
                      🎉 All skills matched! Incredible job!
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {liveMissingSkills.map((skill, index) => (
                        <span 
                          key={index}
                          className="text-[10px] bg-[#FF453A]/5 border border-[#FF453A]/20 text-[#FF453A]/90 px-2 py-1 rounded-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Matched Skills (green) */}
                <div className="mt-2">
                  <div className="text-[10px] font-mono text-[#30D158] uppercase tracking-wider mb-2">
                    Matched Skills ({liveMatchedSkills.length})
                  </div>
                  {liveMatchedSkills.length === 0 ? (
                    <div className="text-[10px] text-[#8E8E93] italic">No skills matched yet.</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {liveMatchedSkills.map((skill, index) => (
                        <span 
                          key={index}
                          className="text-[10px] bg-[#30D158]/5 border border-[#30D158]/20 text-[#30D158]/90 px-2 py-1 rounded-sm font-medium"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Verdict Card */}
              <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-8 border-l-[3px] border-l-[#FF4500]">
                <span className="font-mono text-[9px] text-[#8E8E93] tracking-widest uppercase block mb-3">Decision Support</span>
                <div className="flex items-center justify-between mb-4">
                  <VerdictBadge verdict={reviewResult.verdict} />
                  <span className="font-mono text-sm font-bold text-[#30D158]">
                    {reviewResult.interview_probability}% Prob.
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#8E8E93]">
                  {reviewResult.verdict_explanation} {reviewResult.interview_probability_explanation}
                </p>
              </div>

              {/* Optimization Gains */}
              <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-8">
                <span className="font-mono text-[9px] text-[#8E8E93] tracking-widest uppercase block mb-3">Optimization Results</span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-black">{liveAtsScore}%</span>
                  {(() => {
                    const gain = liveAtsScore - reviewResult.previous_ats_score;
                    return (
                      <span className={`${gain >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'} font-mono text-xs font-semibold`}>
                        {gain >= 0 ? `+${gain}%` : `${gain}%`} {gain >= 0 ? 'Improvement' : 'Decrease'}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-[10px] text-[#8E8E93] mt-2">
                  Calculated based on matched suggestion keywords and validation alignment.
                </p>
              </div>
            </>
          )}

          {/* Recruiter Email */}
          <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-8">
            <div className="flex justify-between items-center border-b border-[#222222] pb-4 mb-4">
              <span className="text-[#F5F5F5] font-semibold text-sm">Recruiter Email Draft</span>
              <button
                onClick={handleCopyEmail}
                className="border border-[#222222] text-[#F5F5F5] hover:bg-white/5 hover:border-white px-3 py-1.5 rounded-sm font-mono text-[9px] tracking-wider uppercase transition-all"
              >
                Copy Text
              </button>
            </div>
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-4">
              <div className="border-b border-[#222222] pb-3 mb-3 font-mono text-[10px] text-[#8E8E93]">
                Subject: <strong className="text-[#F5F5F5] font-sans font-normal">{refinedEmailSubject}</strong>
              </div>
              <div className="text-[11px] leading-relaxed text-[#F5F5F5]/90 whitespace-pre-wrap">
                {refinedEmailBody}
              </div>
            </div>
          </div>

          {/* Reset wizard */}
          <button
            onClick={onStartNew}
            className="border border-[#222222] hover:border-[#8E8E93] text-[#F5F5F5] px-6 py-3 rounded-lg font-mono text-xs font-semibold tracking-wider uppercase transition-all w-full mb-10"
          >
            ← Analyze Another Job
          </button>
        </div>
      </div>

      {/* Version History Drawer overlay */}
      {showVersionsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
          
          {/* Click outside to close */}
          <div className="flex-1" onClick={() => setShowVersionsDrawer(false)} />
          
          {/* Drawer Panel */}
          <div className="w-full max-w-md bg-[#0C0C0C] border-l border-[#222222] p-8 h-full overflow-y-auto flex flex-col gap-6 shadow-2xl animate-[slideInRight_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex justify-between items-center border-b border-[#222222] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#F5F5F5]">Resume Version History</h3>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">Restore any previously saved draft or snapshot.</p>
              </div>
              <button 
                onClick={() => setShowVersionsDrawer(false)}
                className="text-[#8E8E93] hover:text-white p-2 rounded-lg transition-colors font-mono text-xs"
              >
                ✕ Close
              </button>
            </div>

            {loadingVersions ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#8E8E93] text-xs font-mono">
                <div className="w-8 h-8 border-2 border-[#222222] border-t-[#FF4500] rounded-full animate-spin" />
                Loading version history...
              </div>
            ) : versionsList.length === 0 ? (
              <div className="text-center py-20 text-xs text-[#8E8E93] italic">
                No saved versions found for this session.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {versionsList.map((ver) => {
                  const isCurrent = ver.version_num === currentVersionNum;
                  const dateStr = new Date(ver.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <div 
                      key={ver.version_num}
                      className={`border rounded-lg p-5 flex flex-col gap-3 transition-all ${
                        isCurrent 
                          ? "bg-[#FF4500]/5 border-[#FF4500]" 
                          : "bg-[#111111] border-[#222222] hover:border-[#8E8E93]"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#F5F5F5]">Version {ver.version_num}</span>
                            {isCurrent && (
                              <span className="text-[8px] bg-[#FF4500]/15 text-[#FF4500] border border-[#FF4500]/30 px-1.5 py-0.5 rounded-sm font-mono uppercase tracking-wider">
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#8E8E93] font-mono mt-1 block">{dateStr}</span>
                        </div>
                        <div className="bg-black border border-[#222222] px-2.5 py-1 rounded text-right">
                          <div className="text-xs font-black text-[#30D158] font-mono">{ver.ats_score}%</div>
                          <div className="text-[7px] text-[#8E8E93] font-mono uppercase tracking-widest mt-0.5">ATS Score</div>
                        </div>
                      </div>

                      {/* Display validation issues count */}
                      <div className="text-[10px] text-[#8E8E93] flex flex-wrap gap-2">
                        <span>
                          {ver.validation?.valid ? "✓ Valid Structure" : `⚠ ${ver.validation?.errors?.length || 0} validation errors`}
                        </span>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => handleRestoreVersion(ver.version_num)}
                          disabled={isRestoring}
                          className="w-full bg-[#F5F5F5] hover:bg-[#FF4500] text-black hover:text-white font-mono text-[9px] font-bold py-2 rounded-sm uppercase tracking-wider transition-all mt-1 disabled:opacity-50"
                        >
                          {isRestoring ? "Restoring..." : `Restore Version ${ver.version_num}`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
