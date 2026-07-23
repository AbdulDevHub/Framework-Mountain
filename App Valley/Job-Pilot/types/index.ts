export type MissingField =
  | "FULL NAME"
  | "PHONE"
  | "LOCATION"
  | "JOB TITLE"
  | "EXPERIENCE LEVEL"
  | "YEARS EXP"
  | "SKILLS"
  | "WORK EXPERIENCE"
  | "EDUCATION";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: string | null;
  years_experience: number | null;
  skills: string[];
  industries: string[];
  work_experience: WorkExperience[] | null;
  education: Education | null;
  job_titles_seeking: string[];
  remote_preference: string | null;
  preferred_locations: string[];
  salary_expectation: string | null;
  cover_letter_tone: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  work_authorization: string | null;
  resume_pdf_url: string | null;
  linkedin_context_id: string | null;
  linkedin_connected: boolean;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  responsibilities: string;
}

export interface Education {
  degree: string | null;
  field: string | null;
  institution: string | null;
  graduation_year: string | null;
}

export interface AgentRun {
  id: string;
  user_id: string;
  status: "running" | "completed" | "failed";
  job_title_searched: string | null;
  location_searched: string | null;
  jobs_found: number;
  started_at: string;
  completed_at: string | null;
}

export interface Job {
  id: string;
  run_id: string | null;
  user_id: string;
  source: "search" | "url";
  source_url: string | null;
  external_apply_url: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  salary: string | null;
  job_type: string | null;
  about_role: string | null;
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  benefits: string[];
  about_company: string | null;
  match_score: number | null;
  match_reason: string | null;
  matched_skills: string[];
  missing_skills: string[];
  cover_letter: string | null;
  tailored_resume_url: string | null;
  tailored_match_score: number | null;
  is_tailored: boolean;
  company_research: CompanyResearchDossier | null;
  found_at: string;
}

export interface CompanyResearchDossier {
  companyOverview: string;
  techStack: string[];
  culture: string[];
  whyThisRole: string;
  yourEdge: string[];
  gapsToAddress: string[];
  smartQuestions: string[];
  interviewPrep: string[];
  sources: string[];
}

export interface AgentLog {
  id: string;
  run_id: string | null;
  user_id: string;
  message: string;
  level: "info" | "success" | "warning" | "error";
  job_id: string | null;
  created_at: string;
}
