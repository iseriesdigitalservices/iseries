"use client";

import Link from "next/link";
import { logoSrc, useSite } from "@/frontend/SiteProvider";

/** Logo image. `dark` = always the white version (for permanently dark backgrounds). */
export function LogoMark({ dark = false, className = "h-12 w-auto" }: { dark?: boolean; className?: string }) {
  const site = useSite();
  const light = logoSrc(site, false);
  const white = logoSrc(site, true);
  if (dark) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={white} alt={site.name} className={className} />;
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={light} alt={site.name} className={`${className} dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={white} alt="" aria-hidden className={`${className} hidden dark:block`} />
    </>
  );
}

export default function Logo({ dark = false, className = "h-11 w-auto" }: { dark?: boolean; className?: string }) {
  const site = useSite();
  return (
    <Link href="/" aria-label={`${site.name} — Home`} className="flex shrink-0 items-center">
      <LogoMark dark={dark} className={className} />
    </Link>
  );
}
