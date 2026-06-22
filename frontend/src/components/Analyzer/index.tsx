"use client";

import React, { useState, useRef, useEffect } from "react";
import type { AnalysisResult, ReviewResult } from "@/types";
import * as api from "@/services/api";
import InputStep from "./InputStep";
import SuggestionsStep from "./SuggestionsStep";
import ExportStep from "./ExportStep";

interface AnalyzerProps {
  onLoading: (loading: boolean, text?: string) => void;
  onNavigateDashboard: () => void;
  /** Allow the dashboard to pre-load a session into step 2 or 3 */
  initialAnalysis?: AnalysisResult | null;
  initialReviewResult?: ReviewResult | null;
  initialStep?: 1 | 2 | 3;
}

export default function Analyzer({
  onLoading,
  onNavigateDashboard,
  initialAnalysis = null,
  initialReviewResult = null,
  initialStep = 1,
}: AnalyzerProps) {
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(initialAnalysis ? initialStep : 1);

  // Master Profile states
  const [useMasterProfile, setUseMasterProfile] = useState(false);
  const [profileStats, setProfileStats] = useState<{experiences: number; projects: number; skills: number; education: number} | null>(null);

  useEffect(() => {
    api.getProfile("varshit").then(p => {
      const stats = {
        experiences: p.experiences.length,
        projects: p.projects.length,
        skills: p.skills.length,
        education: p.education.length
      };
      setProfileStats(stats);
      if (stats.experiences + stats.projects + stats.skills + stats.education > 0) {
        setUseMasterProfile(true);
      }
    }).catch(() => {});
  }, []);

  // Input states
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [activeStyle, setActiveStyle] = useState("Formal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow results
  const [currentSession, setCurrentSession] = useState<string | null>(
    initialAnalysis?.session_id || null
  );
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(initialAnalysis);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(
    initialAnalysis ? new Set(initialAnalysis.suggestions) : new Set()
  );
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(initialReviewResult);

  // ── Handlers ──

  const handleFetchUrl = async () => {
    if (!jobUrl.trim()) {
      alert("Please paste a job link URL first.");
      return;
    }
    onLoading(true, "Crawling job posting details using Jina Reader...");
    try {
      const text = await api.fetchJobUrl(jobUrl);
      setJobDescription(text);
      setJobUrl("");
    } catch (err: any) {
      alert(err.message || "Failed to reach Jina Reader.");
    } finally {
      onLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      alert("Please paste the job description or crawl it using a job URL.");
      return;
    }
    if (!useMasterProfile && !selectedFile && !resumeText.trim()) {
      alert("Please upload a resume file, paste your resume text, or use your Master Profile.");
      return;
    }

    onLoading(true, "Running AI-powered compatibility parsing & ATS evaluation...");
    try {
      const formData = new FormData();
      formData.append("user_id", "varshit");
      formData.append("job_description", jobDescription);
      if (useMasterProfile) {
        formData.append("use_master_profile", "true");
      } else if (selectedFile) {
        formData.append("resume_file", selectedFile);
      } else {
        formData.append("resume_text", resumeText);
      }

      const data = await api.analyzeJob(formData);
      setLastAnalysis(data);
      setCurrentSession(data.session_id);
      setSelectedSuggestions(new Set(data.suggestions));
      setWizardStep(2);
    } catch (err: any) {
      alert(err.message);
    } finally {
      onLoading(false);
    }
  };

  const toggleSuggestion = (sugg: string) => {
    const next = new Set(selectedSuggestions);
    if (next.has(sugg)) {
      next.delete(sugg);
    } else {
      next.add(sugg);
    }
    setSelectedSuggestions(next);
  };

  const handleGenerate = async () => {
    if (!currentSession || !lastAnalysis) return;

    const accepted = Array.from(selectedSuggestions);
    const rejected = lastAnalysis.suggestions.filter((s) => !selectedSuggestions.has(s));

    onLoading(true, "Optimizing resume structures, validating contents, and generating application documents...");
    try {
      const data = await api.reviewAndGenerate({
        session_id: currentSession,
        user_id: "varshit",
        accepted_suggestions: accepted,
        rejected_suggestions: rejected,
        style_preference: activeStyle,
        custom_instructions: customInstructions,
      });
      setReviewResult(data);
      setWizardStep(3);
    } catch (err: any) {
      alert(err.message);
    } finally {
      onLoading(false);
    }
  };

  const handleSaveApplication = async () => {
    if (!reviewResult || !lastAnalysis) return;
    try {
      await api.saveApplication({
        user_id: "varshit",
        job_title: lastAnalysis.job_title,
        company: lastAnalysis.company,
        ats_score: reviewResult.current_ats_score,
        verdict: reviewResult.verdict,
        resume_version: reviewResult.resume_version,
        status: "Applied",
        session_id: currentSession || lastAnalysis.session_id || undefined,
      });
      alert("✓ Application saved to your analytics history!");
      resetInputs();
      onNavigateDashboard();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResumeSession = async (sid: string) => {
    if (!sid.trim()) {
      alert("Please provide a valid session ID.");
      return;
    }
    onLoading(true, "Retrieving historical analysis session...");
    try {
      const resp = await api.getSession(sid);
      const data = resp.session;
      setCurrentSession(data.session_id);
      setLastAnalysis({
        session_id: data.session_id,
        ats_score: data.ats_results.final_score,
        missing_skills: data.ats_results.missing_skills,
        matched_skills: data.ats_results.matched_skills,
        scores: data.ats_results.scores,
        suggestions: data.suggestions,
        job_title: data.job_analysis.role_information || data.job_analysis.role || "Software Engineer",
        company: data.job_analysis.company || "Target Company",
      });
      setSelectedSuggestions(new Set(data.suggestions));

      // Check if the session has generated assets (step 3)
      if (data.current_step === 3 && data.review_result) {
        const rr = data.review_result;
        setReviewResult({
          session_id: rr.session_id || data.session_id,
          resume_version: rr.resume_version || 1,
          optimized_resume: data.optimized_resume || rr.optimized_resume || "",
          validation: rr.validation || { valid: true, errors: [] },
          previous_ats_score: rr.previous_ats_score || 0,
          current_ats_score: rr.current_ats_score || 0,
          ats_gain: rr.ats_gain || 0,
          cover_letter: data.cover_letter || rr.cover_letter || "",
          recruiter_email: data.recruiter_email || rr.recruiter_email || { subject: "", body: "" },
          matched_skills: rr.matched_skills || [],
          missing_skills: rr.missing_skills || [],
          verdict: rr.verdict || "Apply",
          verdict_explanation: rr.verdict_explanation || "",
          interview_probability: rr.interview_probability || 0,
          interview_probability_explanation: rr.interview_probability_explanation || "",
        });
        setWizardStep(3);
      } else {
        setWizardStep(2);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      onLoading(false);
    }
  };

  const resetInputs = () => {
    setWizardStep(1);
    setJobDescription("");
    setResumeText("");
    setSelectedFile(null);
    setCustomInstructions("");
    setCurrentSession(null);
    setLastAnalysis(null);
    setReviewResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="animate-[fadeIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
      {wizardStep === 1 && (
        <InputStep
          jobUrl={jobUrl}
          setJobUrl={setJobUrl}
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          resumeText={resumeText}
          setResumeText={setResumeText}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          fileInputRef={fileInputRef}
          onFetchUrl={handleFetchUrl}
          onAnalyze={handleAnalyze}
          onResumeSession={handleResumeSession}
          profileStats={profileStats}
          useMasterProfile={useMasterProfile}
          setUseMasterProfile={setUseMasterProfile}
        />
      )}

      {wizardStep === 2 && lastAnalysis && (
        <SuggestionsStep
          analysis={lastAnalysis}
          selectedSuggestions={selectedSuggestions}
          toggleSuggestion={toggleSuggestion}
          activeStyle={activeStyle}
          setActiveStyle={setActiveStyle}
          customInstructions={customInstructions}
          setCustomInstructions={setCustomInstructions}
          onBack={() => setWizardStep(1)}
          onGenerate={handleGenerate}
        />
      )}

      {wizardStep === 3 && reviewResult && lastAnalysis && (
        <ExportStep
          reviewResult={reviewResult}
          analysis={lastAnalysis}
          activeStyle={activeStyle}
          sessionId={currentSession || ""}
          onSaveApplication={handleSaveApplication}
          onStartNew={resetInputs}
        />
      )}
    </div>
  );
}
