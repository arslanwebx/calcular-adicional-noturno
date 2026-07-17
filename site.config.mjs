export const siteUrl = (process.env.PUBLIC_SITE_URL || "https://example.com").replace(
  /\/$/,
  ""
);
