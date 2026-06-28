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
  AuthResponse,
  AuthUser,
} from "@/types";

// Helper to get auth headers with JWT token from localStorage
function authHeaders(): Record<string, string> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

// ── Authentication API ────────────────────────────────────────────────────────

export async function loginUser(credentials: any): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Authentication failed. Check credentials.");
  }
  return res.json();
}

export async function registerUser(data: any): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Registration failed.");
  }
  return res.json();
}

export async function forgotPassword(email: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to submit request.");
  }
  return res.json();
}

export async function resetPassword(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to reset password.");
  }
  return res.json();
}

export async function getCurrentUser(): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: "GET",
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    throw new Error("Session expired or invalid.");
  }
  return res.json();
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboardMetrics(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/api/dashboard`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to load dashboard metrics.");
  return res.json();
}

// ── Active Sessions ──

export async function fetchActiveSessions(): Promise<ActiveSession[]> {
  const res = await fetch(`${API_BASE}/api/sessions`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to load sessions.");
  return res.json();
}

// ── Analyzer ─────────────────────────────────────────────────────────────────

export async function fetchJobUrl(url: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/fetch-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
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
    headers: {
      ...authHeaders(),
    },
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
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Asset tailoring failed.");
  }
  return res.json();
}

export async function getSession(sessionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/session/${sessionId.trim()}`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) throw new Error("Session not found. Verify the ID.");
  return res.json();
}

// ── Application Tracking ─────────────────────────────────────────────────────

export async function saveApplication(
  request: ApplicationRequest
): Promise<{ status: string; application_id: string }> {
  const res = await fetch(`${API_BASE}/api/application`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Failed to save application.");
  return res.json();
}

// ── Refinement ───────────────────────────────────────────────────────────────

export async function refineAsset(request: RefineRequest): Promise<{ refined_content: string }> {
  const res = await fetch(`${API_BASE}/api/refine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
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
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
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
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
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
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/versions`, {
    headers: {
      ...authHeaders(),
    },
  });
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
      headers: {
        ...authHeaders(),
      },
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to restore version.");
  }
  return res.json();
}

// ── Master Profile ───────────────────────────────────────────────────────────

export async function getProfile(): Promise<MasterProfile> {
  const res = await fetch(`${API_BASE}/api/profile`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to load profile.");
  return res.json();
}

export async function saveProfileItem(
  section: "experience" | "project" | "skill" | "education",
  data: Record<string, any>
): Promise<{ status: string; id: string }> {
  const res = await fetch(`${API_BASE}/api/profile/${section}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || `Failed to save ${section}.`);
  }
  return res.json();
}

export async function deleteProfileItem(
  section: "experience" | "project" | "skill" | "education",
  itemId: string
): Promise<{ status: string }> {
  const res = await fetch(
    `${API_BASE}/api/profile/${section}/${itemId}`,
    {
      method: "DELETE",
      headers: {
        ...authHeaders(),
      },
    }
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
    headers: {
      ...authHeaders(),
    },
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
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
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
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to abandon session.");
  }
  return res.json();
}

// ── Admin Panel API ──────────────────────────────────────────────────────────

export async function adminFetchUsers(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch users.");
  return res.json();
}

export async function adminDeleteUser(userId: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/admin/user/${userId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to delete user.");
  }
  return res.json();
}

export async function adminFetchSessions(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/admin/sessions`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch sessions.");
  return res.json();
}

export async function adminDeleteSession(sessionId: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/admin/session/${sessionId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to delete session.");
  }
  return res.json();
}

export async function adminFetchApplications(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/admin/applications`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch applications.");
  return res.json();
}

export async function adminDeleteApplication(appId: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/admin/application/${appId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to delete application.");
  }
  return res.json();
}

// ── User AI Memory/Context ───────────────────────────────────────────────────

export async function fetchUserContext(): Promise<{ user_memory: string }> {
  const res = await fetch(`${API_BASE}/api/profile/context`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch user context.");
  return res.json();
}

export async function saveUserContext(userMemory: string): Promise<{ status: string; user_memory: string }> {
  const res = await fetch(`${API_BASE}/api/profile/context`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ user_memory: userMemory }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to save user context.");
  }
  return res.json();
}

// ── Chat History Persistence ─────────────────────────────────────────────────

export async function saveChatHistory(sessionId: string, history: any[]): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ history }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to save chat history.");
  }
  return res.json();
}
