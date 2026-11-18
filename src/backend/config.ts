import "server-only"; // backend only — never bundled into the browser
import { cols } from "@/backend/mongo";
import {
  DEFAULT_FAQS,
  DEFAULT_SERVICES,
  DEFAULT_SITE,
  type Faq,
  type Service,
  type SiteConfig,
} from "@/shared/site";

/**
 * Website content lives in the database so the admin can change everything
 * (name, logo, phones, services, prices, FAQs) without touching the code.
 * A short in-memory cache keeps pages fast; every save clears it.
 */
type Cache = { site?: SiteConfig; services?: Service[]; faqs?: Faq[]; at: number };
const g = globalThis as typeof globalThis & { __siteCache?: Cache };
const cache = (g.__siteCache ??= { at: 0 });
const TTL = 15_000;

function fresh() {
  return Date.now() - cache.at < TTL;
}

export function clearConfigCache() {
  cache.site = undefined;
  cache.services = undefined;
  cache.faqs = undefined;
  cache.at = 0;
}

const CONFIG_ID = "site";

export async function getSite(): Promise<SiteConfig> {
  if (cache.site && fresh()) return cache.site;
  try {
    const { siteConfig } = await cols();
    const doc = await siteConfig.findOne({ _id: CONFIG_ID });
    const site: SiteConfig = { ...DEFAULT_SITE, ...(doc?.value ?? {}) };
    // keep the numbers sane whatever is in the database
    site.referralRate = Math.min(0.9, Math.max(0, Number(site.referralRate) || 0));
    site.phones = (site.phones ?? []).filter((p) => p && p.display && p.intl).slice(0, 6);
    cache.site = site;
    cache.at = Date.now();
    return site;
  } catch {
    return DEFAULT_SITE;
  }
}

export async function saveSite(patch: Partial<SiteConfig>) {
  const { siteConfig } = await cols();
  const current = await getSite();
  const value: SiteConfig = { ...current, ...patch };
  await siteConfig.updateOne({ _id: CONFIG_ID }, { $set: { value, updatedAt: new Date() } }, { upsert: true });
  clearConfigCache();
  return value;
}

/** All services, including hidden ones (admin view). Seeds the defaults on first run. */
export async function getAllServices(): Promise<Service[]> {
  if (cache.services && fresh()) return cache.services;
  try {
    const { services } = await cols();
    let rows = await services.find().sort({ order: 1 }).toArray();
    if (rows.length === 0) {
      await services.insertMany(
        DEFAULT_SERVICES.map((s, i) => ({ ...s, _id: s.slug, active: true, order: i })) as never,
      );
      rows = await services.find().sort({ order: 1 }).toArray();
    }
    const list = rows.map((r) => {
      const { _id, ...rest } = r as unknown as Service & { _id: string };
      void _id;
      return { ...rest, active: rest.active !== false } as Service;
    });
    cache.services = list;
    cache.at = Date.now();
    return list;
  } catch {
    return DEFAULT_SERVICES.map((s, i) => ({ ...s, active: true, order: i }));
  }
}

/** Only the services customers can see and order. */
export async function getServices(): Promise<Service[]> {
  return (await getAllServices()).filter((s) => s.active !== false);
}

export async function saveService(slug: string, data: Service) {
  const { services } = await cols();
  const existing = await services.findOne({ _id: slug } as never);
  const order = data.order ?? (existing as unknown as Service | null)?.order ?? (await services.countDocuments());
  await services.updateOne(
    { _id: data.slug } as never,
    { $set: { ...data, order, active: data.active !== false } },
    { upsert: true },
  );
  // slug changed → remove the old document
  if (slug && slug !== data.slug) await services.deleteOne({ _id: slug } as never);
  clearConfigCache();
}

export async function deleteService(slug: string) {
  const { services } = await cols();
  await services.deleteOne({ _id: slug } as never);
  clearConfigCache();
}

export async function moveService(slug: string, direction: "up" | "down") {
  const list = await getAllServices();
  const i = list.findIndex((s) => s.slug === slug);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  const { services } = await cols();
  await services.updateOne({ _id: list[i].slug } as never, { $set: { order: j } });
  await services.updateOne({ _id: list[j].slug } as never, { $set: { order: i } });
  clearConfigCache();
}

export async function resetServices() {
  const { services } = await cols();
  await services.deleteMany({});
  clearConfigCache();
  return getAllServices();
}

export async function getFaqs(): Promise<Faq[]> {
  if (cache.faqs && fresh()) return cache.faqs;
  try {
    const { siteConfig } = await cols();
    const doc = await siteConfig.findOne({ _id: "faqs" });
    const list = (doc?.value as unknown as Faq[] | undefined) ?? DEFAULT_FAQS;
    cache.faqs = Array.isArray(list) && list.length ? list : DEFAULT_FAQS;
    cache.at = Date.now();
    return cache.faqs;
  } catch {
    return DEFAULT_FAQS;
  }
}

export async function saveFaqs(list: Faq[]) {
  const { siteConfig } = await cols();
  await siteConfig.updateOne({ _id: "faqs" }, { $set: { value: list as never, updatedAt: new Date() } }, { upsert: true });
  clearConfigCache();
}

/** Everything the browser needs, in one object. */
export async function getPublicConfig() {
  const [site, services, faqs] = await Promise.all([getSite(), getServices(), getFaqs()]);
  return { site, services, faqs };
}
