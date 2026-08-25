import { useEffect } from 'react';
import { absolute, SITE, type PageSeo } from '@/data/seo';

/**
 * Keeps the head in step with client-side navigation. Crawlers that do not run
 * JS get the same values from the prerendered HTML the build script writes.
 */

function meta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function canonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

export function useDocumentMeta({ path, title, description }: PageSeo) {
  useEffect(() => {
    const url = absolute(path);
    document.title = title;
    meta('name', 'description', description);
    meta('property', 'og:title', title);
    meta('property', 'og:description', description);
    meta('property', 'og:url', url);
    meta('property', 'og:image', absolute(SITE.ogImage));
    meta('name', 'twitter:title', title);
    meta('name', 'twitter:description', description);
    meta('name', 'twitter:image', absolute(SITE.ogImage));
    canonical(url);
  }, [path, title, description]);
}
