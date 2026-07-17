import type { APIRoute } from "astro";
import { siteConfig } from "../config/site";

const indexableRoutes = ["/", "/sobre/", "/contato/"];

export const GET: APIRoute = () => {
  const urls = indexableRoutes
    .map(
      (path) =>
        `<url><loc>${siteConfig.url}${path}</loc><lastmod>${siteConfig.contentModified}</lastmod></url>`
    )
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } }
  );
};
