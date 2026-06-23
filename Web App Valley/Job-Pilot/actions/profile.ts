"use server";

import { revalidatePath } from "next/cache";
import { getOpenAIClient, getAIModelName } from "@/lib/openai";
// Import from lib directly to avoid pdf-parse's index.js debug mode, which reads
// a test file on every require() call and crashes when module.parent is null
// (always the case under Next.js/Turbopack).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  buf: Buffer,
) => Promise<{ text: string }>;

import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { trackPostHogEvent } from "@/lib/posthog-server";
import { calculateCompletion } from "@/lib/profile-utils";
import type { Education, WorkExperience } from "@/types";

type WorkExperienceEntry = {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  responsibilities: string;
};

type ProfileFormData = {
  fullName: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  workAuth: string;
  currentTitle: string;
  experienceLevel: string;
  yearsExperience: string;
  skills: string[];
  industries: string[];
  workEntries: WorkExperienceEntry[];
  degree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: string;
  jobTitlesSeeking: string[];
  remotePreference: string;
  salaryExpectation: string;
  preferredLocations: string[];
  coverLetterTone: string;
};

export async function saveProfile(
  data: ProfileFormData,
): Promise<{ success: boolean; error?: string }> {
  // requireUser must be outside try/catch — redirect() throws NEXT_REDIRECT
  // which would otherwise be caught and swallowed as a generic error.
  const user = await requireUser();

  try {
    const insforge = await createInsforgeServer();

    const education: Education = {
      degree: data.degree || null,
      field: data.fieldOfStudy || null,
      institution: data.institution || null,
      graduation_year: data.graduationYear || null,
    };

    const parsed = parseInt(data.yearsExperience, 10);
    const yearsExperience =
      data.yearsExperience && !isNaN(parsed) ? parsed : null;

    const workExperience: WorkExperience[] = data.workEntries.map((e) => ({
      company: e.company,
      title: e.title,
      start_date: e.start_date,
      end_date: e.is_current ? null : e.end_date || null,
      is_current: e.is_current,
      responsibilities: e.responsibilities,
    }));

    const { data: existing } = await insforge.database
      .from("profiles")
      .select("is_complete")
      .eq("id", user.id)
      .maybeSingle<{ is_complete: boolean }>();

    const { isComplete } = calculateCompletion({
      full_name: data.fullName || null,
      phone: data.phone || null,
      location: data.location || null,
      current_title: data.currentTitle || null,
      experience_level: data.experienceLevel || null,
      years_experience: yearsExperience,
      skills: data.skills,
      work_experience: workExperience,
      education,
    });

    const { data: updated, error } = await insforge.database
      .from("profiles")
      .update({
        full_name: data.fullName || null,
        phone: data.phone || null,
        location: data.location || null,
        linkedin_url: data.linkedinUrl || null,
        portfolio_url: data.portfolioUrl || null,
        work_authorization: data.workAuth || null,
        current_title: data.currentTitle || null,
        experience_level: data.experienceLevel || null,
        years_experience: yearsExperience,
        skills: data.skills,
        industries: data.industries,
        work_experience: workExperience,
        education,
        job_titles_seeking: data.jobTitlesSeeking,
        remote_preference: data.remotePreference || null,
        salary_expectation: data.salaryExpectation || null,
        preferred_locations: data.preferredLocations,
        cover_letter_tone: data.coverLetterTone || null,
        is_complete: isComplete,
      })
      .eq("id", user.id)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      console.error("[actions/profile] saveProfile", error);
      return { success: false, error: "Failed to save profile" };
    }

    if (!updated) {
      console.error("[actions/profile] saveProfile no row matched for user", user.id);
      return { success: false, error: "Profile not found. Please sign out and sign in again." };
    }

    if (isComplete && !existing?.is_complete) {
      await trackPostHogEvent({
        event: "profile_completed",
        properties: { userId: user.id },
      });
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[actions/profile] saveProfile", error);
    return { success: false, error: "Failed to save profile" };
  }
}

export async function uploadResume(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  // requireUser must be outside try/catch — redirect() throws NEXT_REDIRECT
  // which would otherwise be caught and swallowed as a generic error.
  const user = await requireUser();

  try {
    const insforge = await createInsforgeServer();

    const file = formData.get("resume");
    if (!(file instanceof File)) {
      return { success: false, error: "No file provided" };
    }
    if (file.type !== "application/pdf") {
      return { success: false, error: "File must be a PDF" };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: "File must be under 2MB" };
    }

    const path = `${user.id}/resume.pdf`;

    // SDK has no upsert option — remove existing file first, then upload fresh
    await insforge.storage.from("resumes").remove(path);

    const { error: uploadError } = await insforge.storage
      .from("resumes")
      .upload(path, file);

    if (uploadError) {
      console.error("[actions/profile] uploadResume storage", uploadError);
      return { success: false, error: "Failed to upload resume" };
    }

    // Store the storage path, not a public URL — bucket is private.
    // Download happens via /api/resume/download which authenticates server-side.
    const { error: dbError } = await insforge.database
      .from("profiles")
      .update({ resume_pdf_url: path })
      .eq("id", user.id);

    if (dbError) {
      console.error("[actions/profile] uploadResume db", dbError);
      return { success: false, error: "Failed to save resume URL" };
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[actions/profile] uploadResume", error);
    return { success: false, error: "Failed to upload resume" };
  }
}

export type ExtractedProfile = {
  full_name: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: string | null;
  years_experience: number | null;
  skills: string[];
  industries: string[];
  work_experience: WorkExperience[];
  education: Education;
  job_titles_seeking: string[];
  linkedin_url: string | null;
  portfolio_url: string | null;
};

export async function extractProfile(): Promise<{
  success: boolean;
  data?: ExtractedProfile;
  error?: string;
}> {
  const user = await requireUser();

  try {
    const insforge = await createInsforgeServer();

    const { data: fileData, error: downloadError } = await insforge.storage
      .from("resumes")
      .download(`${user.id}/resume.pdf`);

    if (downloadError || !fileData) {
      return {
        success: false,
        error: "No resume found. Please upload your resume first.",
      };
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length < 50) {
      return {
        success: false,
        error:
          "Could not extract text from this PDF. Please try a different file.",
      };
    }

    const openai = getOpenAIClient();
    const model = getAIModelName();

    const response = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content:
            "You are a resume parser. Extract structured profile data from the resume text and return only valid JSON matching the exact schema provided. Use null for missing fields. Arrays must always be arrays (never null). experience_level must be one of: Junior, Mid-Level, Senior, Lead, Manager, Director, Executive — pick the closest match or null.",
        },
        {
          role: "user",
          content: `Extract profile data from this resume and return JSON with this exact shape:
{
  "full_name": string | null,
  "phone": string | null,
  "location": string | null,
  "current_title": string | null,
  "experience_level": "Junior"|"Mid-Level"|"Senior"|"Lead"|"Manager"|"Director"|"Executive"|null,
  "years_experience": number | null,
  "skills": string[],
  "industries": string[],
  "work_experience": [{ "company": string, "title": string, "start_date": string, "end_date": string|null, "is_current": boolean, "responsibilities": string }],
  "education": { "degree": string|null, "field": string|null, "institution": string|null, "graduation_year": string|null },
  "job_titles_seeking": string[],
  "linkedin_url": string|null,
  "portfolio_url": string|null
}

Resume text:
${extractedText.slice(0, 6000)}`,
        },
      ],
    });

    const raw = response.choices[0].message.content;
    if (!raw) {
      return { success: false, error: "AI returned an empty response." };
    }

    const extracted = JSON.parse(raw) as ExtractedProfile;

    return { success: true, data: extracted };
  } catch (error) {
    console.error("[actions/profile] extractProfile", error);
    return { success: false, error: "Failed to extract profile from resume." };
  }
}
