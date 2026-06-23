import Link from "next/link";

import { Logo } from "@/components/layout/Logo";

const footerLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms & Condition" },
];

export function Footer() {
  return (
    <footer className="border-x border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-10 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
        <Logo />

        <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-text-secondary">
          {footerLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
