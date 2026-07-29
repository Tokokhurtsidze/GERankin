import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const PUBLIC_PATHS = ["", "/faq", "/pricing", "/leaderboard", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      changeFrequency: "daily" as const,
      priority: path === "" ? 1 : 0.7,
    }))
  );
}
