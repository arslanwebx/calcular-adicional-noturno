import { siteUrl } from "../../site.config.mjs";

export const siteConfig = {
  name: "Adicional Noturno",
  url: siteUrl,
  contactEmail: "contato@calculoadicionalnoturno.com",
  description:
    "Calculadora informativa para estimar o adicional noturno com regras configuráveis.",
  contentModified: "2026-07-17"
} as const;

export const mainNavigation = [
  { href: "/", label: "Início" },
  { href: "/blog/", label: "Blog" },
  { href: "/sobre/", label: "Sobre" },
  { href: "/contato/", label: "Contato" }
] as const;

export const policyNavigation = [
  { href: "/politica-de-privacidade/", label: "Política de Privacidade" },
  { href: "/termos-de-uso/", label: "Termos de Uso" },
  { href: "/aviso-legal/", label: "Aviso Legal" },
  { href: "/politica-de-cookies/", label: "Política de Cookies" },
  { href: "/politica-editorial/", label: "Política Editorial" }
] as const;
