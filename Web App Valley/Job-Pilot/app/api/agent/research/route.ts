import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { researchCompany } from "@/agent/research";
import { getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { trackPostHogEvent } from "@/lib/posthog-server";
import type { AgentLog, CompanyResearchDossier, Job, Profile } from "@/types";

type RequestBody = {
  jobId?: unknown;
};

type ResearchJobRow = Pick<
  Job,
  | "id"
  | "user_id"
  | "title"
  | "company"
  | "source_url"
  | "external_apply_url"
  | "about_role"
  | "matched_skills"
  | "missing_skills"
  | "company_research"
>;

type ResearchProfileRow = Pick<
  Profile,
  | "id"
  | "current_title"
  | "experience_level"
  | "years_experience"
  | "skills"
  | "work_experience"
>;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const userId = user.id;

    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId || !isUuid(jobId)) {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 },
      );
    }

    const insforge = await createInsforgeServer();

    async function logAgentMessage(input: {
      message: string;
      level: AgentLog["level"];
    }): Promise<void> {
      const { error } = await insforge.database.from("agent_logs").insert([
        {
          run_id: null,
          user_id: userId,
          job_id: jobId,
          message: input.message,
          level: input.level,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("[api/agent/research] logAgentMessage", error);
      }
    }

    const { data: job, error: jobError } = await insforge.database
      .from("jobs")
      .select(
        "id,user_id,title,company,source_url,external_apply_url,about_role,matched_skills,missing_skills,company_research",
      )
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle<ResearchJobRow>();

    if (jobError) {
      console.error("[api/agent/research] fetch job", jobError);
      return NextResponse.json(
        { success: false, error: "Failed to load job" },
        { status: 500 },
      );
    }

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 },
      );
    }

    if (job.company_research) {
      return NextResponse.json({
        success: true,
        data: { dossier: job.company_research },
      });
    }

    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select(
        "id,current_title,experience_level,years_experience,skills,work_experience",
      )
      .eq("id", userId)
      .maybeSingle<ResearchProfileRow>();

    if (profileError) {
      console.error("[api/agent/research] fetch profile", profileError);
      return NextResponse.json(
        { success: false, error: "Failed to load profile" },
        { status: 500 },
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 },
      );
    }

    await logAgentMessage({
      message: `Starting company research for ${job.company ?? "this company"}.`,
      level: "info",
    });

    const result = await researchCompany({
      job,
      profile,
      log: logAgentMessage,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Company research failed" },
        { status: 500 },
      );
    }

    const { data: updatedJob, error: updateError } = await insforge.database
      .from("jobs")
      .update({ company_research: result.dossier })
      .eq("id", jobId)
      .eq("user_id", userId)
      .select("company_research")
      .maybeSingle<{ company_research: CompanyResearchDossier | null }>();

    if (updateError || !updatedJob?.company_research) {
      console.error("[api/agent/research] update job", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to save company research" },
        { status: 500 },
      );
    }

    await trackPostHogEvent({
      event: "company_researched",
      properties: {
        userId,
        jobId,
        company: job.company ?? "Unknown company",
      },
    });

    revalidatePath(`/find-jobs/${jobId}`);

    return NextResponse.json({
      success: true,
      data: { dossier: updatedJob.company_research },
    });
  } catch (error) {
    console.error("[api/agent/research]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
