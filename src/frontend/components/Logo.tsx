import Link from "next/link";

/** Logo image. `dark` = always the white logo (for permanently dark backgrounds). Otherwise it follows the theme. */
export function LogoMark({ dark = false, className = "h-12 w-auto" }: { dark?: boolean; className?: string }) {
  if (dark) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/logo-white.png" alt="I Series Digital Services" width={900} height={543} className={className} />;
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="I Series Digital Services" width={900} height={543} className={`${className} dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-white.png" alt="" aria-hidden width={900} height={543} className={`${className} hidden dark:block`} />
    </>
  );
}

export default function Logo({ dark = false, className = "h-11 w-auto" }: { dark?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="I Series Digital Services — Home" className="flex shrink-0 items-center">
      <LogoMark dark={dark} className={className} />
    </Link>
  );
}
