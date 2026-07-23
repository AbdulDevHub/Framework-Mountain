import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string;
  priority?: boolean;
};

export function Logo({ href = "/", priority = false }: Props) {
  return (
    <Link href={href} aria-label="JobPilot home" className="inline-flex items-center">
      <Image
        src="/logo.png"
        alt="JobPilot"
        width={112}
        height={38}
        priority={priority}
        className="h-9 w-auto"
      />
    </Link>
  );
}
