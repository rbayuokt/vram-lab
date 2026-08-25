import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { absolute, PAGES, SITE } from '@/data/seo';

/**
 * Social scrapers never run the SPA, so every route gets its own static HTML
 * with its own head. Static hosts serve /clut/index.html for /clut, which also
 * fixes deep links without a rewrite rule.
 */

const dist = (p = '') => fileURLToPath(new URL(`../dist/${p}`, import.meta.url));
const esc = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const shell = readFileSync(dist('index.html'), 'utf8');

const setContent = (html, marker, value) =>
  html.replace(
    new RegExp(`(<meta[^>]*${marker}[^>]*content=")[^"]*(")`),
    `$1${esc(value)}$2`,
  );

function pageHtml({ path, title, description }) {
  const url = absolute(path);
  let html = shell.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url)}$2`);
  for (const marker of [
    'name="description"',
    'property="og:title"',
    'property="og:description"',
  ]) {
    const value = marker.includes('description') ? description : title;
    html = setContent(html, marker, value);
  }
  html = setContent(html, 'property="og:url"', url);
  html = setContent(html, 'name="twitter:title"', title);
  html = setContent(html, 'name="twitter:description"', description);
  return html;
}

for (const page of PAGES) {
  const html = pageHtml(page);
  if (page.path === '/') {
    writeFileSync(dist('index.html'), html);
    continue;
  }
  mkdirSync(dist(page.path.slice(1)), { recursive: true });
  writeFileSync(dist(`${page.path.slice(1)}/index.html`), html);
}

// Pages has no rewrite rule, so an unknown path falls through to 404.html:
// the app boots and shows home, and the status stays honest for crawlers.
writeFileSync(dist('404.html'), pageHtml(PAGES[0]));

const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...PAGES.map(
    (p) =>
      `  <url><loc>${absolute(p.path)}</loc><lastmod>${lastmod}</lastmod>` +
      `<priority>${p.path === '/' ? '1.0' : '0.8'}</priority></url>`,
  ),
  '</urlset>',
].join('\n');
writeFileSync(dist('sitemap.xml'), sitemap);

console.log(`prerendered ${PAGES.length} routes + sitemap.xml for ${SITE.url}`);
