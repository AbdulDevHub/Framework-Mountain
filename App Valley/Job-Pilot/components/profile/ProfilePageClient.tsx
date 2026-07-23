"use client";

import { useRef } from "react";

import type { ExtractedProfile } from "@/actions/profile";
import type { Profile } from "@/types";

import { ProfileForm, ProfileFormHandle } from "./ProfileForm";
import { ResumeSection } from "./ResumeSection";

type Props = {
  profile: Profile | null;
};

export function ProfilePageClient({ profile }: Props) {
  const formRef = useRef<ProfileFormHandle>(null);

  function handleExtracted(data: ExtractedProfile) {
    formRef.current?.applyExtracted(data);
  }

  return (
    <>
      <ResumeSection
        existingResumeUrl={profile?.resume_pdf_url ?? null}
        onExtracted={handleExtracted}
      />
      <ProfileForm profile={profile} formRef={formRef} />
    </>
  );
}
