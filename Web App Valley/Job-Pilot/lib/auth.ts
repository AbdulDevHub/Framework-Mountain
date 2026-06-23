import { redirect } from "next/navigation";

import { createInsforgeServer } from "@/lib/insforge-server";

type ProfileCompletionRow = {
  is_complete: boolean | null;
};

export async function getCurrentUser() {
  const insforge = await createInsforgeServer();
  const { data, error } = await insforge.auth.getCurrentUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getPostLoginRedirectPath(userId: string): Promise<string> {
  const insforge = await createInsforgeServer();
  const { data, error } = await insforge.database
    .from("profiles")
    .select("is_complete")
    .eq("id", userId)
    .maybeSingle<ProfileCompletionRow>();

  if (error || !data?.is_complete) {
    return "/profile";
  }

  return "/dashboard";
}
