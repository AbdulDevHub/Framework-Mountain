"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";

import { Logo } from "@/components/layout/Logo";
import { PostHogLogoutLink } from "@/components/analytics/PostHogLogoutLink";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/find-jobs", label: "Find Jobs" },
  { href: "/profile", label: "Profile" },
];

type Props = {
  isAuthenticated?: boolean;
};

export function Navbar({ isAuthenticated = false }: Props) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo priority />

        <nav className="hidden items-center gap-8 md:flex">
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/find-jobs"
                ? pathname.startsWith("/find-jobs")
                : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "text-sm font-medium transition-colors",
                  isActive
                    ? "text-accent"
                    : "text-text-dark hover:text-text-primary",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isAuthenticated ? (
          <div className="flex items-center gap-6">
            <UserCircle className="hidden h-6 w-6 text-info-muted sm:block" />
            <PostHogLogoutLink className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </PostHogLogoutLink>
          </div>
        ) : (
          <Link href="/login" className="landing-button-primary min-h-10 px-4">
            Start for free
          </Link>
        )}
      </div>
    </header>
  );
}
