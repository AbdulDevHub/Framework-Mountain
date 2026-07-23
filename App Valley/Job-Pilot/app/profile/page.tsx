export const dynamic = "force-dynamic";

import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileAttentionBanner } from "@/components/profile/ProfileAttentionBanner";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { calculateCompletion } from "@/lib/profile-utils";
import type { Profile } from "@/types";

export default async function ProfilePage() {
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const { data: profile } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const { completionPercent, missingFields } = calculateCompletion({
    full_name: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    location: profile?.location ?? null,
    current_title: profile?.current_title ?? null,
    experience_level: profile?.experience_level ?? null,
    years_experience: profile?.years_experience ?? null,
    skills: profile?.skills ?? [],
    work_experience: profile?.work_experience ?? null,
    education: profile?.education ?? null,
  });

  return (
    <>
      <PostHogIdentify userId={user.id} />
      <Navbar isAuthenticated />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <ProfileAttentionBanner
          completionPercent={completionPercent}
          missingFields={missingFields}
        />
        <ProfilePageClient profile={profile ?? null} />
      </main>
    </>
  );
}
