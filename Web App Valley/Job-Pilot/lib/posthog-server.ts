import { PostHog } from "posthog-node";

type PostHogEventInput =
  | {
      event: "job_search_started";
      properties: {
        userId: string;
        jobTitle: string;
        location: string;
      };
    }
  | {
      event: "job_found";
      properties: {
        userId: string;
        source: string;
        matchScore: number;
      };
    }
  | {
      event: "job_url_submitted";
      properties: {
        userId: string;
      };
    }
  | {
      event: "cover_letter_generated";
      properties: {
        userId: string;
        jobId: string;
      };
    }
  | {
      event: "resume_tailored";
      properties: {
        userId: string;
        jobId: string;
        scoreBefore: number;
        scoreAfter: number;
      };
    }
  | {
      event: "profile_completed";
      properties: {
        userId: string;
      };
    }
  | {
      event: "company_researched";
      properties: {
        userId: string;
        jobId: string;
        company: string;
      };
    }
  | {
      event: "linkedin_connected";
      properties: {
        userId: string;
      };
    };

export function createPostHogServer(): PostHog | null {
  const key =
    process.env.NEXT_PUBLIC_POSTHOG_KEY ??
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  if (!key) {
    return null;
  }

  return new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
  });
}

export async function trackPostHogEvent(
  input: PostHogEventInput,
): Promise<void> {
  const posthog = createPostHogServer();

  if (!posthog) {
    return;
  }

  try {
    posthog.capture({
      distinctId: input.properties.userId,
      event: input.event,
      properties: input.properties,
    });
  } catch (error) {
    console.error("[posthog-server]", error);
  } finally {
    await posthog.shutdown();
  }
}
