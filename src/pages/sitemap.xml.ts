import type { APIRoute } from "astro";
import { siteConfig } from "../config/site";

const indexableRoutes = [
  "/",
  "/sitemap/",
  "/blog/",
  "/blog/percentual-do-adicional-noturno/",
  "/blog/quem-tem-direito-ao-adicional-noturno/",
  "/blog/adicional-noturno-clt/",
  "/blog/como-calcular-adicional-noturno/",
  "/autor/lucas-almeida/",
  "/sobre/",
  "/contato/",
  "/politica-de-privacidade/",
  "/termos-de-uso/",
  "/aviso-legal/",
  "/politica-de-cookies/",
  "/politica-editorial/"
];

const routeLastModified: Record<string, string> = {
  "/blog/percentual-do-adicional-noturno/": "2026-07-28",
  "/blog/quem-tem-direito-ao-adicional-noturno/": "2026-07-27",
  "/blog/adicional-noturno-clt/": "2026-07-24"
};

export const GET: APIRoute = () => {
  const urls = indexableRoutes
    .map(
      (path) =>
        `<url><loc>${siteConfig.url}${path}</loc><lastmod>${routeLastModified[path] || siteConfig.contentModified}</lastmod></url>`
    )
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } }
  );
};
