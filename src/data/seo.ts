import { SECTIONS, type SectionMeta } from '@/data/sections';

/**
 * One source of truth for every meta tag. The runtime hook, index.html and the
 * build scripts (sitemap, per-route prerender, OG card) all read from here.
 */

export const SITE = {
  url: 'https://vram-lab.houseofky.xyz',
  name: 'VRAM LAB',
  title: 'VRAM LAB - PS1 graphics and asset optimisation, hands on',
  description:
    'An interactive playground for how PlayStation 1 games stored graphics: 1 MB of VRAM, indexed colour, CLUTs, texture atlases, tilemaps and glyph fonts.',
  ogImage: '/og.png',
  ogImageAlt:
    'VRAM LAB - a 1024 x 512 PlayStation VRAM map packed with framebuffers, textures and CLUTs',
  locale: 'en_US',
  themeColor: '#07080b',
  keywords: [
    'PlayStation 1',
    'PS1 graphics',
    'VRAM',
    'CLUT',
    'indexed colour',
    'texture atlas',
    'tilemap',
    'sprite sheet',
    'bits per pixel',
    'retro game development',
    'texture memory',
  ],
} as const;

export interface PageSeo {
  path: string;
  title: string;
  description: string;
}

export const HOME_SEO: PageSeo = {
  path: '/',
  title: SITE.title,
  description: SITE.description,
};

export const sectionSeo = (meta: SectionMeta): PageSeo => ({
  path: meta.path,
  title: `${meta.title} - ${SITE.name}`,
  description: meta.lede,
});

/** Every indexable URL, in guided order. Drives the sitemap and the prerender. */
export const PAGES: PageSeo[] = [HOME_SEO, ...SECTIONS.map(sectionSeo)];

export const absolute = (path: string) => new URL(path, SITE.url).href;
