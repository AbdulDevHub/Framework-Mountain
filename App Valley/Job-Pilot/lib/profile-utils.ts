import type { MissingField } from "@/types";

type CompletionInput = {
  full_name: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: string | null;
  years_experience: number | null;
  skills: string[];
  work_experience: { company: string }[] | null;
  education: { degree: string | null } | null;
};

type CompletionResult = {
  isComplete: boolean;
  completionPercent: number;
  missingFields: MissingField[];
};

export function calculateCompletion(data: CompletionInput): CompletionResult {
  const checks: Array<{ field: MissingField; filled: boolean }> = [
    { field: "FULL NAME", filled: !!data.full_name?.trim() },
    { field: "PHONE", filled: !!data.phone?.trim() },
    { field: "LOCATION", filled: !!data.location?.trim() },
    { field: "JOB TITLE", filled: !!data.current_title?.trim() },
    { field: "EXPERIENCE LEVEL", filled: !!data.experience_level },
    { field: "YEARS EXP", filled: data.years_experience !== null },
    { field: "SKILLS", filled: (data.skills ?? []).length > 0 },
    { field: "WORK EXPERIENCE", filled: (data.work_experience ?? []).length > 0 },
    { field: "EDUCATION", filled: !!data.education?.degree },
  ];

  const missingFields = checks.filter((c) => !c.filled).map((c) => c.field);
  const completionPercent = Math.round(
    ((checks.length - missingFields.length) / checks.length) * 100,
  );

  return {
    isComplete: missingFields.length === 0,
    completionPercent,
    missingFields,
  };
}
