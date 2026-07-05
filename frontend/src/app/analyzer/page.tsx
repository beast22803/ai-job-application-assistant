"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Analyzer from "@/components/Analyzer";
import LoadingOverlay from "@/components/LoadingOverlay";
import * as api from "@/services/api";
import type { AnalysisResult, ReviewResult } from "@/types";

function AnalyzerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [resumedAnalysis, setResumedAnalysis] = useState<AnalysisResult | null>(null);
  const [resumedReviewResult, setResumedReviewResult] = useState<ReviewResult | null>(null);
  const [initialStep, setInitialStep] = useState<1 | 2 | 3>(1);
  const [isInitializing, setIsInitializing] = useState(!!sessionId);

  useEffect(() => {
    if (sessionId) {
      setIsInitializing(true);
      api.getSession(sessionId)
        .then((resp) => {
          const data = resp.session;

          // Build the AnalysisResult from session data
          const analysis: AnalysisResult = {
            session_id: data.session_id,
            ats_score: data.ats_results?.final_score || 0,
            missing_skills: data.ats_results?.missing_skills || [],
            matched_skills: data.ats_results?.matched_skills || [],
            scores: data.ats_results?.scores || { skill_match: 0, experience_match: 0, semantic_match: 0, formatting_score: 0 },
            suggestions: data.suggestions || [],
            job_title: data.job_analysis?.role_information || data.job_analysis?.role || "Software Engineer",
            company: data.job_analysis?.company || "Target Company",
          };
          setResumedAnalysis(analysis);

          // Check if the session has generated assets (step 3)
          if (data.current_step === 3 && data.review_result) {
            const rr = data.review_result;
            const reviewResult: ReviewResult = {
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
            };
            setResumedReviewResult(reviewResult);
            setInitialStep(3);
          } else {
            setInitialStep(2);
          }
        })
        .catch(err => console.error("Failed to fetch session:", err))
        .finally(() => setIsInitializing(false));
    }
  }, [sessionId]);

  const handleNavigateDashboard = () => {
    router.push("/dashboard");
  };

  const handleLoading = (isLoading: boolean, text: string = "Analyzing...") => {
    setLoading(isLoading);
    setLoadingText(text);
  };

  if (isInitializing) {
    return <LoadingOverlay visible={true} text="Loading session..." />;
  }

  return (
    <div className="animate-[fadeIn_0.5s_ease-out_both] w-full max-w-[1300px] mx-auto px-4 sm:px-10 py-6 sm:py-10 relative">
      <Analyzer
        onLoading={handleLoading}
        onNavigateDashboard={handleNavigateDashboard}
        initialAnalysis={resumedAnalysis}
        initialReviewResult={resumedReviewResult}
        initialStep={initialStep}
      />
      <LoadingOverlay visible={loading} text={loadingText} />
    </div>
  );
}

export default function AnalyzerPage() {
  return (
    <Suspense fallback={<LoadingOverlay visible={true} text="Loading..." />}>
      <AnalyzerPageContent />
    </Suspense>
  );
}
