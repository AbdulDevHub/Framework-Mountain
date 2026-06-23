"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { resetPostHogUser } from "@/lib/posthog-client";

type Props = {
  children: ReactNode;
  className: string;
};

export function PostHogLogoutLink({ children, className }: Props) {
  return (
    <Link
      href="/api/auth/logout"
      prefetch={false}
      className={className}
      onClick={() => {
        resetPostHogUser();
      }}
    >
      {children}
    </Link>
  );
}
