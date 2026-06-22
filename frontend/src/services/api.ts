// ── API service layer — all backend fetch calls ──

import { API_BASE } from "@/lib/constants";
import type {
  DashboardData,
  ActiveSession,
  AnalysisResult,
  ReviewResult,
  ReviewRequest,
  ApplicationRequest,
  RefineRequest,
  MasterProfile,
} from "@/types";

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboardMetrics(
  userId = "varshit"
): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/api/dashboard?user_id=${userId}`);
  if (!res.ok) throw new Error("Failed to load dashboard metrics.");
  return res.json();
}

export async function fetchActiveSessions(): Promise<ActiveSession[]> {
  const res = await fetch(`${API_BASE}/api/sessions`);
  if (!res.ok) throw new Error("Failed to load sessions.");
  return res.json();
}

// ── Analyzer ─────────────────────────────────────────────────────────────────

export async function fetchJobUrl(url: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/fetch-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: url.trim() }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "URL crawling failed.");
  }
  const data = await res.json();
  return data.text;
}

export async function analyzeJob(formData: FormData): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "AI Analysis failed.");
  }
  return res.json();
}

export async function reviewAndGenerate(
  request: ReviewRequest
): Promise<ReviewResult> {
  const res = await fetch(`${API_BASE}/api/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Asset tailoring failed.");
  }
  return res.json();
}

export async function getSession(sessionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/session/${sessionId.trim()}`);
  if (!res.ok) throw new Error("Session not found. Verify the ID.");
  return res.json();
}

// ── Application Tracking ─────────────────────────────────────────────────────

export async function saveApplication(
  request: ApplicationRequest
): Promise<{ status: string; application_id: string }> {
  const res = await fetch(`${API_BASE}/api/application`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Failed to save application.");
  return res.json();
}

// ── Refinement ───────────────────────────────────────────────────────────────

export async function refineAsset(request: RefineRequest): Promise<{ refined_content: string }> {
  const res = await fetch(`${API_BASE}/api/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Refinement failed.");
  }
  return res.json();
}

// ── Versioning & Live Scoring ────────────────────────────────────────────────

export async function scoreResumeHtml(
  sessionId: string,
  html: string
): Promise<{
  ats_score: number;
  ats_gain: number;
  missing_skills: string[];
  matched_skills: string[];
  scores: any;
}> {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_html: html }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Scoring calculation failed.");
  }
  return res.json();
}

export async function saveResumeVersion(
  sessionId: string,
  html: string
): Promise<{
  status: string;
  resume_version: number;
  ats_score: number;
  validation: any;
}> {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/version`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_html: html }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to save version snapshot.");
  }
  return res.json();
}

export async function getResumeVersions(
  sessionId: string
): Promise<{
  versions: Array<{
    version_num: number;
    resume_text: string;
    resume_html: string;
    validation: any;
    ats_score: number;
    timestamp: string;
  }>;
}> {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/versions`);
  if (!res.ok) throw new Error("Failed to load resume versions.");
  return res.json();
}

export async function restoreResumeVersion(
  sessionId: string,
  versionNum: number
): Promise<{
  status: string;
  resume_version: number;
  resume_html: string;
  ats_score: number;
  validation: any;
}> {
  const res = await fetch(
    `${API_BASE}/api/session/${sessionId}/version/${versionNum}/restore`,
    {
      method: "POST",
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to restore version.");
  }
  return res.json();
}

// ── Master Profile ───────────────────────────────────────────────────────────

export async function getProfile(userId = "varshit"): Promise<MasterProfile> {
  const res = await fetch(`${API_BASE}/api/profile/${userId}`);
  if (!res.ok) throw new Error("Failed to load profile.");
  return res.json();
}

export async function saveProfileItem(
  userId: string,
  section: "experience" | "project" | "skill" | "education",
  data: Record<string, any>
): Promise<{ status: string; id: string }> {
  const res = await fetch(`${API_BASE}/api/profile/${userId}/${section}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || `Failed to save ${section}.`);
  }
  return res.json();
}

export async function deleteProfileItem(
  userId: string,
  section: "experience" | "project" | "skill" | "education",
  itemId: string
): Promise<{ status: string }> {
  const res = await fetch(
    `${API_BASE}/api/profile/${userId}/${section}/${itemId}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || `Failed to delete ${section}.`);
  }
  return res.json();
}

export async function deleteSession(sessionId: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to delete session.");
  }
  return res.json();
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string
): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/application/${applicationId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update application status.");
  }
  return res.json();
}

export async function abandonSession(sessionId: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/abandon`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to abandon session.");
  }
  return res.json();
}
