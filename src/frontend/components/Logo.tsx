<<<<<<< HEAD
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
=======
import Link from "next/link";

/** Logo image. `dark` = always the white logo (for permanently dark backgrounds). Otherwise it follows the theme. */
export function LogoMark({ dark = false, className = "h-12 w-auto" }: { dark?: boolean; className?: string }) {
  if (dark) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/logo-white.png" alt="I Series Digital Services" width={900} height={543} className={className} />;
>>>>>>> origin/main
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
<<<<<<< HEAD
      <img src={light} alt={site.name} className={`${className} dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={white} alt="" aria-hidden className={`${className} hidden dark:block`} />
=======
      <img src="/logo.png" alt="I Series Digital Services" width={900} height={543} className={`${className} dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-white.png" alt="" aria-hidden width={900} height={543} className={`${className} hidden dark:block`} />
>>>>>>> origin/main
    </>
  );
}

export default function Logo({ dark = false, className = "h-11 w-auto" }: { dark?: boolean; className?: string }) {
<<<<<<< HEAD
  const site = useSite();
  return (
    <Link href="/" aria-label={`${site.name} — Home`} className="flex shrink-0 items-center">
=======
  return (
    <Link href="/" aria-label="I Series Digital Services — Home" className="flex shrink-0 items-center">
>>>>>>> origin/main
      <LogoMark dark={dark} className={className} />
    </Link>
  );
}
