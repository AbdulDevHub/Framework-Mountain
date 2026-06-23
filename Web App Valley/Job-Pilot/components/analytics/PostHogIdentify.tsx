"use client";

import { useEffect } from "react";

import { identifyPostHogUser } from "@/lib/posthog-client";

type Props = {
  userId: string;
};

export function PostHogIdentify({ userId }: Props) {
  useEffect(() => {
    identifyPostHogUser(userId);
  }, [userId]);

  return null;
}
