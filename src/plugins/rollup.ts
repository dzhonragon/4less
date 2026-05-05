import { readFileSync } from 'fs';
import { compile, ParseError } from '../index.js';
import type { Plugin } from 'rollup';

/**
 * Rollup plugin to import 4less files as compiled HTML strings.
 *
 * Usage in rollup.config.js:
 * ```js
 * import rollup4less from '4less/rollup';
 *
 * export default {
 *   plugins: [rollup4less()],
 * };
 * ```
 *
 * Usage in code:
 * ```ts
 * import html from './template.4l';
 * // html is a string containing compiled HTML
 * ```
 */
export default function rollup4lessPlugin(): Plugin {
  return {
    name: '4less',
    load(id) {
      if (!id.endsWith('.4l')) return null;
      try {
        const source = readFileSync(id, 'utf-8');
        const html = compile(source);
        return { code: `export default ${JSON.stringify(html)};` };
      } catch (err) {
        if (err instanceof ParseError) {
          this.error(`4less compile error in ${id}:\n${err.message}`);
        }
        throw err;
      }
    },
  };
}
