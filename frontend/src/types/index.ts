// ── TypeScript interfaces for the Job Application Assistant ──

export interface Application {
  id: string;
  job_title: string;
  company: string;
  ats_score: number;
  verdict: string;
  resume_version: number;
  status: string;
  session_id?: string;
  timestamp: string;
}

export interface ActiveSession {
  session_id: string;
  job_title: string;
  company: string;
  current_step: number;
  timestamp: string;
}

export interface SuggestionImpact {
  suggestion: string;
  ats_gain: number;
  weight: number;
}

export interface DashboardData {
  total_analyzed: number;
  average_ats: number;
  average_interview_probability: number;
  verdict_distribution: Record<string, number>;
  applications: Application[];
  suggestion_impact_report: SuggestionImpact[];
}

export interface ATSScores {
  skill_match: number;
  experience_match: number;
  semantic_match: number;
  formatting_score: number;
}

export interface AnalysisResult {
  session_id: string;
  ats_score: number;
  missing_skills: string[];
  matched_skills: string[];
  scores: ATSScores;
  suggestions: string[];
  job_title: string;
  company: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface RecruiterEmail {
  subject: string;
  body: string;
}

export interface ReviewResult {
  session_id: string;
  resume_version: number;
  optimized_resume: string;
  validation: ValidationResult;
  previous_ats_score: number;
  current_ats_score: number;
  ats_gain: number;
  cover_letter: string;
  recruiter_email: RecruiterEmail;
  matched_skills: string[];
  missing_skills: string[];
  verdict: string;
  verdict_explanation: string;
  interview_probability: number;
  interview_probability_explanation: string;
  chat_history?: any[];
}

export interface RefinementHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface RefinementMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  asset_type: "resume" | "cover_letter" | "email";
  timestamp: Date;
}

export interface RefineRequest {
  session_id: string;
  asset_type: "resume" | "cover_letter" | "email";
  instruction: string;
  current_content: string;
  history?: RefinementHistoryItem[];
}

export interface ReviewRequest {
  session_id: string;
  accepted_suggestions: string[];
  rejected_suggestions: string[];
  style_preference: string;
  custom_instructions: string;
}

export interface ApplicationRequest {
  job_title: string;
  company: string;
  ats_score: number;
  verdict: string;
  resume_version: number;
  status: string;
  session_id?: string;
}

// ── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  is_admin?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

// ── Master Profile Types ─────────────────────────────────────────────────────

export interface MasterExperience {
  id: string;
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  bullets: string[];
  technologies: string[];
  order_index: number;
}

export interface MasterProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url: string;
  highlights: string[];
  order_index: number;
}

export interface MasterSkill {
  id: string;
  category: string;
  name: string;
  proficiency: number;
  order_index: number;
}

export interface MasterEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
  gpa: string;
  highlights: string[];
  order_index: number;
}

export interface MasterProfile {
  experiences: MasterExperience[];
  projects: MasterProject[];
  skills: MasterSkill[];
  education: MasterEducation[];
}
