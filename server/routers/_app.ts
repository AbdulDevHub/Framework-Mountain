import { router } from "../trpc";
import { authRouter } from "./auth";
import { jobPostingRouter } from "./jobPosting";
import { resumeRouter } from "./resume";
import { applicationRouter } from "./application";
import { matchRouter } from "./match";
import { reminderRouter } from "./reminder";
import { demoRouter } from "./demo";

export const appRouter = router({
  auth: authRouter,
  jobPosting: jobPostingRouter,
  resume: resumeRouter,
  application: applicationRouter,
  match: matchRouter,
  reminder: reminderRouter,
  demo: demoRouter,
});

// Exported so the frontend's tRPC client can infer types end to end
// (Day 6) without importing any server code directly.
export type AppRouter = typeof appRouter;
