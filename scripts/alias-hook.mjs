import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL, URL } from 'node:url';

// lets the build scripts import app modules ('@/data/sections') the same way
// vite resolves them. node strips the TS types on its own since 22.18.
const SRC = pathToFileURL(fileURLToPath(new URL('../src/', import.meta.url)));

registerHooks({
  resolve(spec, ctx, next) {
    if (!spec.startsWith('@/')) return next(spec, ctx);
    const file = spec.slice(2).endsWith('.ts') ? spec.slice(2) : `${spec.slice(2)}.ts`;
    return next(new URL(file, SRC).href, ctx);
  },
});
