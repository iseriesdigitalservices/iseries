"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_FAQS, DEFAULT_SERVICES, DEFAULT_SITE, docsFor, findService, priceMap, type Faq, type Service, type SiteConfig } from "@/shared/site";

export { logoSrc } from "@/shared/site";

export type PublicConfig = { site: SiteConfig; services: Service[]; faqs: Faq[] };

const Ctx = createContext<PublicConfig>({ site: DEFAULT_SITE, services: DEFAULT_SERVICES, faqs: DEFAULT_FAQS });

/** Fills the browser with the website settings the admin saved (name, logo, phones, services, FAQs). */
export function SiteProvider({ config, children }: { config: PublicConfig; children: ReactNode }) {
  return <Ctx.Provider value={config}>{children}</Ctx.Provider>;
}

export function useSite() {
  return useContext(Ctx).site;
}

export function useServices() {
  return useContext(Ctx).services;
}

export function useFaqs() {
  return useContext(Ctx).faqs;
}

export function useCatalog() {
  const { services } = useContext(Ctx);
  return useMemo(
    () => ({
      services,
      prices: priceMap(services),
      get: (slug: string) => findService(services, slug),
      docsFor: (slugs: string[]) => docsFor(services, slugs),
    }),
    [services],
  );
}
