import { Stagehand } from "@browserbasehq/stagehand";
import { getOpenAIClient, getAIModelName } from "@/lib/openai";
import { z } from "zod";

import { bb } from "@/lib/browserbase";
import type {
  CompanyResearchDossier,
  Job,
  Profile,
  WorkExperience,
} from "@/types";

type ResearchLogLevel = "info" | "success" | "warning" | "error";

type ResearchLogger = (input: {
  message: string;
  level: ResearchLogLevel;
}) => Promise<void>;

type ResearchProfile = Pick<
  Profile,
  | "current_title"
  | "experience_level"
  | "years_experience"
  | "skills"
  | "work_experience"
>;

type ResearchJob = Pick<
  Job,
  | "id"
  | "title"
  | "company"
  | "source_url"
  | "external_apply_url"
  | "about_role"
  | "matched_skills"
  | "missing_skills"
>;

type ResearchInput = {
  job: ResearchJob;
  profile: ResearchProfile;
  log?: ResearchLogger;
};

type ResearchResult =
  | { success: true; dossier: CompanyResearchDossier }
  | { success: false; error: string };

type PageResearch = {
  url: string;
  keyPoints: string[];
  technologies: string[];
  valuesOrCulture: string[];
  notable: string[];
};

type BrowserResearch = {
  homepageUrl: string | null;
  oneLiner: string | null;
  productSummary: string | null;
  signals: string[];
  pages: PageResearch[];
  sources: string[];
};

const MAX_REDIRECTS = 5;
const MAX_SUB_PAGES = 3;

const jobBoardHosts = [
  "adzuna.com",
  "greenhouse.io",
  "lever.co",
  "workdayjobs.com",
  "myworkdayjobs.com",
  "ashbyhq.com",
  "workable.com",
  "smartrecruiters.com",
  "icims.com",
  "jobvite.com",
  "bamboohr.com",
];

const homepageSchema = z.object({
  oneLiner: z.string().optional().default(""),
  productSummary: z.string().optional().default(""),
  signals: z.array(z.string()).optional().default([]),
  pageLinks: z
    .array(
      z.object({
        url: z.string(),
        kind: z.enum([
          "about",
          "careers",
          "blog",
          "engineering",
          "product",
          "team",
          "other",
        ]),
      }),
    )
    .optional()
    .default([]),
});

const subPageSchema = z.object({
  keyPoints: z.array(z.string()).optional().default([]),
  technologies: z.array(z.string()).optional().default([]),
  valuesOrCulture: z.array(z.string()).optional().default([]),
  notable: z.array(z.string()).optional().default([]),
});

const dossierSchema = z.object({
  companyOverview: z.string().min(1),
  techStack: z.array(z.string()).default([]),
  culture: z.array(z.string()).default([]),
  whyThisRole: z.string().min(1),
  yourEdge: z.array(z.string()).default([]),
  gapsToAddress: z.array(z.string()).default([]),
  smartQuestions: z.array(z.string()).default([]),
  interviewPrep: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
});

function cleanCompanyName(companyName: string | null): string {
  return (companyName ?? "company")
    .replace(/\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Corporation|Company|Co\.?).*$/i, "")
    .replace(/\s*[-–—|].*$/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim();
}

function fallbackHomepageUrl(companyName: string | null): string {
  const cleanName = cleanCompanyName(companyName)
    .toLowerCase()
    .replace(/\s+/g, "");

  return `https://www.${cleanName || "company"}.com`;
}

function getRootDomain(hostname: string): string {
  const parts = hostname.replace(/^www\./, "").split(".").filter(Boolean);
  if (parts.length <= 2) {
    return parts.join(".");
  }

  const secondLevel = parts.at(-2);
  const topLevel = parts.at(-1);
  const commonCountrySecondLevels = ["ac", "co", "com", "gov", "net", "org"];

  if (
    secondLevel &&
    topLevel &&
    topLevel.length === 2 &&
    commonCountrySecondLevels.includes(secondLevel)
  ) {
    return parts.slice(-3).join(".");
  }

  return parts.slice(-2).join(".");
}

function isKnownJobBoard(hostname: string): boolean {
  const host = hostname.replace(/^www\./, "");
  return jobBoardHosts.some((jobBoardHost) => host.endsWith(jobBoardHost));
}

function getHeaderValue(
  headers: Record<string, string>,
  headerName: string,
): string | null {
  const matchingKey = Object.keys(headers).find(
    (key) => key.toLowerCase() === headerName.toLowerCase(),
  );

  return matchingKey ? headers[matchingKey] : null;
}

async function log(
  logger: ResearchLogger | undefined,
  message: string,
  level: ResearchLogLevel,
): Promise<void> {
  if (!logger) return;

  try {
    await logger({ message, level });
  } catch (error) {
    console.error("[agent/research] log", error);
  }
}

async function resolveHomepageUrl(
  job: ResearchJob,
  logger: ResearchLogger | undefined,
): Promise<string> {
  const candidateUrl = job.external_apply_url ?? job.source_url;
  const fallbackUrl = fallbackHomepageUrl(job.company);

  if (!candidateUrl || !process.env.BROWSERBASE_API_KEY) {
    return fallbackUrl;
  }

  let currentUrl = candidateUrl;

  try {
    for (let i = 0; i < MAX_REDIRECTS; i += 1) {
      const response = await bb.fetchAPI.create({
        url: currentUrl,
        allowRedirects: false,
        proxies: false,
      });

      const location = getHeaderValue(response.headers, "location");
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        location
      ) {
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      break;
    }

    const finalUrl = new URL(currentUrl);
    if (isKnownJobBoard(finalUrl.hostname)) {
      return fallbackUrl;
    }

    return `https://${getRootDomain(finalUrl.hostname)}`;
  } catch (error) {
    await log(
      logger,
      "Could not resolve the employer site from the job redirect. Falling back to the company name.",
      "warning",
    );
    console.error("[agent/research] resolveHomepageUrl", error);
    return fallbackUrl;
  }
}

function normalizeInternalUrl(url: string, homepageUrl: string): string | null {
  try {
    const normalized = new URL(url, homepageUrl);
    const homepage = new URL(homepageUrl);
    if (getRootDomain(normalized.hostname) !== getRootDomain(homepage.hostname)) {
      return null;
    }

    return normalized.toString();
  } catch {
    return null;
  }
}

function rankPageKind(kind: string): number {
  const priority = ["about", "blog", "engineering", "product", "team", "careers"];
  const index = priority.indexOf(kind);
  return index === -1 ? priority.length : index;
}

async function collectBrowserResearch(
  job: ResearchJob,
  logger: ResearchLogger | undefined,
): Promise<BrowserResearch> {
  const homepageUrl = await resolveHomepageUrl(job, logger);
  const emptyResearch: BrowserResearch = {
    homepageUrl,
    oneLiner: null,
    productSummary: null,
    signals: [],
    pages: [],
    sources: [],
  };

  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  const aiKey = process.env.OPENAI_API_KEY || process.env.OPEN_ROUTER_API_KEY;

  if (!apiKey || !projectId || !aiKey) {
    await log(
      logger,
      "Browser research skipped because Browserbase or AI provider credentials are not configured.",
      "warning",
    );
    return emptyResearch;
  }

  let stagehand: Stagehand | null = null;

  try {
    const session = await bb.sessions.create({
      projectId,
      timeout: 120,
    });

    const isOpenAI = !!process.env.OPENAI_API_KEY;
    const innerModelName = getAIModelName();

    stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey,
      projectId,
      browserbaseSessionID: session.id,
      model: {
        modelName: `openai/${innerModelName}`,
        apiKey: aiKey,
        ...(isOpenAI ? {} : { baseURL: "https://openrouter.ai/api/v1" }),
      },
      disablePino: true,
    });

    await stagehand.init();
    const page = stagehand.context.activePage();
    if (!page) {
      await log(logger, "Stagehand opened without an active page.", "warning");
      return emptyResearch;
    }

    await page.goto(homepageUrl, {
      waitUntil: "networkidle",
      timeoutMs: 30000,
    });
    await page.waitForTimeout(2000);

    const homepage = await stagehand.extract(
      "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer.",
      homepageSchema,
    );

    if (!homepage.oneLiner && !homepage.productSummary) {
      await log(
        logger,
        "Homepage extraction did not find meaningful company content. Using job and profile context only.",
        "warning",
      );
      return emptyResearch;
    }

    const research: BrowserResearch = {
      homepageUrl,
      oneLiner: homepage.oneLiner || null,
      productSummary: homepage.productSummary || null,
      signals: homepage.signals,
      pages: [],
      sources: [homepageUrl],
    };

    const subPageUrls = homepage.pageLinks
      .flatMap((pageLink) => {
        const url = normalizeInternalUrl(pageLink.url, homepageUrl);
        return url ? [{ kind: pageLink.kind, url }] : [];
      })
      .sort((a, b) => rankPageKind(a.kind) - rankPageKind(b.kind))
      .filter(
        (pageLink, index, allLinks) =>
          allLinks.findIndex((candidate) => candidate.url === pageLink.url) ===
          index,
      )
      .slice(0, MAX_SUB_PAGES);

    for (const subPage of subPageUrls) {
      try {
        await page.goto(subPage.url, {
          waitUntil: "networkidle",
          timeoutMs: 30000,
        });
        await page.waitForTimeout(2000);

        const pageResearch = await stagehand.extract(
          "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.",
          subPageSchema,
        );

        const hasContent =
          pageResearch.keyPoints.length > 0 ||
          pageResearch.technologies.length > 0 ||
          pageResearch.valuesOrCulture.length > 0 ||
          pageResearch.notable.length > 0;

        if (hasContent) {
          research.pages.push({
            url: subPage.url,
            keyPoints: pageResearch.keyPoints,
            technologies: pageResearch.technologies,
            valuesOrCulture: pageResearch.valuesOrCulture,
            notable: pageResearch.notable,
          });
          research.sources.push(subPage.url);
        }
      } catch (error) {
        await log(
          logger,
          `Skipped a company sub-page that could not be extracted: ${subPage.url}`,
          "warning",
        );
        console.error("[agent/research] subPage", error);
      }
    }

    return research;
  } catch (error) {
    await log(
      logger,
      "Browser research failed. Falling back to job and profile synthesis.",
      "warning",
    );
    console.error("[agent/research] collectBrowserResearch", error);
    return emptyResearch;
  } finally {
    if (stagehand) {
      try {
        await stagehand.close();
      } catch (error) {
        console.error("[agent/research] close", error);
      }
    }
  }
}

function getWorkHistory(workExperience: WorkExperience[] | null): string {
  if (!workExperience || workExperience.length === 0) {
    return "No work history saved.";
  }

  return JSON.stringify(workExperience);
}

function buildFallbackDossier(
  job: ResearchJob,
  profile: ResearchProfile,
): CompanyResearchDossier {
  const company = job.company ?? "this company";
  const title = job.title ?? "this role";
  const skills = profile.skills.slice(0, 5);

  return {
    companyOverview: `Research was limited, so this briefing is based on the saved job posting for ${company}.`,
    techStack: [...job.matched_skills, ...job.missing_skills].slice(0, 8),
    culture: [
      "Use the job posting language to infer how the team collaborates and what outcomes they value.",
    ],
    whyThisRole: `${company} is hiring for ${title}, likely to add capacity around the responsibilities described in the job posting.`,
    yourEdge:
      skills.length > 0
        ? [`Lead with your experience in ${skills.join(", ")}.`]
        : ["Lead with the strongest examples from your recent work."],
    gapsToAddress:
      job.missing_skills.length > 0
        ? job.missing_skills.map(
            (skill) =>
              `Prepare an honest story for ${skill}, connecting it to adjacent experience you already have.`,
          )
        : ["Prepare a clear story about how your background maps to the role."],
    smartQuestions: [
      `What would success look like for the ${title} role in the first 90 days?`,
      "Which parts of the product or platform would this role influence most directly?",
    ],
    interviewPrep: [
      "Review the saved job description and prepare examples for each major responsibility.",
      "Prepare concise stories that connect your strongest skills to the role requirements.",
    ],
    sources: [],
  };
}

async function synthesizeDossier(
  job: ResearchJob,
  profile: ResearchProfile,
  browserResearch: BrowserResearch,
): Promise<CompanyResearchDossier> {
  const openai = getOpenAIClient();
  const model = getAIModelName();

  const systemPrompt = `You are a sharp career strategist preparing a candidate to apply for a specific role. You are given (a) research collected from the company's own website, (b) the job posting, and (c) the candidate's profile. Produce a concise, concrete briefing that gives this specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts. If research was thin, infer carefully from the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

Return ONLY valid JSON matching this shape:
{
  "companyOverview": string,
  "techStack": string[],
  "culture": string[],
  "whyThisRole": string,
  "yourEdge": string[],
  "gapsToAddress": string[],
  "smartQuestions": string[],
  "interviewPrep": string[],
  "sources": string[]
}`;

  const userPrompt = `COMPANY RESEARCH (from their website):
${JSON.stringify(browserResearch)}

JOB POSTING:
Title: ${job.title ?? "Unknown"}
Company: ${job.company ?? "Unknown"}
Description: ${job.about_role ?? "No saved description"}
Matched skills: ${job.matched_skills.join(", ") || "None recorded"}
Missing skills: ${job.missing_skills.join(", ") || "None recorded"}

CANDIDATE PROFILE:
Current title: ${profile.current_title ?? "Unknown"}
Experience: ${profile.years_experience ?? "Unknown"} years, level ${profile.experience_level ?? "Unknown"}
Skills: ${profile.skills.join(", ") || "None saved"}
Work history: ${getWorkHistory(profile.work_experience)}`;

  const response = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 1200,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = response.choices[0].message.content;
  if (!raw) {
    return buildFallbackDossier(job, profile);
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const result = dossierSchema.safeParse(parsed);

    if (!result.success) {
      console.error("[agent/research] dossier validation failed", result.error);
      return buildFallbackDossier(job, profile);
    }

    const fallback = buildFallbackDossier(job, profile);

    return {
      companyOverview: result.data.companyOverview,
      techStack:
        result.data.techStack.length > 0
          ? result.data.techStack
          : fallback.techStack,
      culture:
        result.data.culture.length > 0 ? result.data.culture : fallback.culture,
      whyThisRole: result.data.whyThisRole,
      yourEdge:
        result.data.yourEdge.length > 0
          ? result.data.yourEdge
          : fallback.yourEdge,
      gapsToAddress:
        result.data.gapsToAddress.length > 0
          ? result.data.gapsToAddress
          : fallback.gapsToAddress,
      smartQuestions:
        result.data.smartQuestions.length > 0
          ? result.data.smartQuestions
          : fallback.smartQuestions,
      interviewPrep:
        result.data.interviewPrep.length > 0
          ? result.data.interviewPrep
          : fallback.interviewPrep,
      sources:
        result.data.sources.length > 0
          ? result.data.sources
          : browserResearch.sources,
    };
  } catch (error) {
    console.error("[agent/research] dossier JSON parse failed", error);
    return buildFallbackDossier(job, profile);
  }
}

export async function researchCompany({
  job,
  profile,
  log: logger,
}: ResearchInput): Promise<ResearchResult> {
  try {
    if (!process.env.OPENAI_API_KEY && !process.env.OPEN_ROUTER_API_KEY) {
      return {
        success: false,
        error: "AI provider is not configured for company research.",
      };
    }

    const browserResearch = await collectBrowserResearch(job, logger);
    const dossier = await synthesizeDossier(job, profile, browserResearch);

    await log(logger, "Company research dossier generated.", "success");
    return { success: true, dossier };
  } catch (error) {
    console.error("[agent/research]", error);
    await log(logger, "Company research failed.", "error");
    return { success: false, error: "Failed to research company" };
  }
}
