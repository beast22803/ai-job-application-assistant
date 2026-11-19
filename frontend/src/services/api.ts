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

/** Error carrying the HTTP status (0 = the server could not be reached at all). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const UNREACHABLE_MESSAGE =
  "Cannot reach the server. It may be starting up or offline — please try again in a minute.";

/** Fetch an auth endpoint and turn network/HTML/5xx failures into readable errors. */
async function authRequest<T>(path: string, init: RequestInit, fallback: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError(UNREACHABLE_MESSAGE, 0);
  }
  if (!res.ok) {
    let detail: unknown;
    try {
      detail = (await res.json())?.detail;
    } catch {
      // Non-JSON body (e.g. a gateway's HTML error page) — fall through.
    }
    if (typeof detail === "string" && detail) throw new ApiError(detail, res.status);
    throw new ApiError(
      res.status >= 500 ? "The server is temporarily unavailable. Please try again shortly." : fallback,
      res.status
    );
  }
  return res.json();
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export function loginUser(credentials: any): Promise<AuthResponse> {
  return authRequest<AuthResponse>(
    "/api/auth/login",
    { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(credentials) },
    "Authentication failed. Check credentials."
  );
}

export function registerUser(data: any): Promise<AuthResponse> {
  return authRequest<AuthResponse>(
    "/api/auth/register",
    { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(data) },
    "Registration failed."
  );
}

export function forgotPassword(email: string): Promise<any> {
  return authRequest<any>(
    "/api/auth/forgot-password",
    { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ email }) },
    "Failed to submit request."
  );
}

export function resetPassword(data: any): Promise<any> {
  return authRequest<any>(
    "/api/auth/reset-password",
    { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(data) },
    "Failed to reset password."
  );
}

export function getCurrentUser(): Promise<AuthUser> {
  return authRequest<AuthUser>(
    "/api/auth/me",
    { method: "GET", headers: { ...authHeaders() } },
    "Session expired or invalid."
  );
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


// ── LaTeX PDF rendering ───────────────────────────────────────────────────────

let latexUnavailable = false;

/**
 * Ask the backend to typeset the resume / cover letter with LaTeX and return the PDF.
 * Throws ApiError; status 503 means this server has no LaTeX installed (cached, so the
 * UI falls back to the HTML preview without retrying on every edit).
 */
export async function renderPdf(
  sessionId: string,
  docType: "resume" | "cover_letter",
  html: string
): Promise<Blob> {
  if (latexUnavailable) {
    throw new ApiError("LaTeX is not available on this server.", 503);
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ session_id: sessionId, doc_type: docType, html }),
    });
  } catch {
    throw new ApiError(UNREACHABLE_MESSAGE, 0);
  }
  if (!res.ok) {
    let detail = "PDF generation failed.";
    try {
      detail = (await res.json()).detail || detail;
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 503 && /latex/i.test(detail)) latexUnavailable = true;
    throw new ApiError(detail, res.status);
  }
  return res.blob();
}
