import { readFileSync } from 'fs';
import { compile } from '../index.js';
import type { Plugin } from 'vite';

/**
 * Vite plugin to import 4less files as compiled HTML strings
 *
 * Usage in vite.config.ts:
 * ```ts
 * import plugin4less from '4less/vite';
 *
 * export default {
 *   plugins: [plugin4less()]
 * }
 * ```
 *
 * Usage in code:
 * ```ts
 * import html from './template.4l';
 * // html is now a string containing compiled HTML
 * ```
 */
export default function vite4lessPlugin(): Plugin {
  return {
    name: '4less',
    resolveId(id) {
      if (id.endsWith('.4l')) {
        return id;
      }
    },
    load(id) {
      if (!id.endsWith('.4l')) {
        return null;
      }

      try {
        const source = readFileSync(id, 'utf-8');
        const html = compile(source);
        const code = `export default ${JSON.stringify(html)};`;
        return code;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to compile ${id}: ${message}`);
      }
    },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.4l')) {
        server.ws.send({
          type: 'custom',
          event: '4less:update',
          data: { file },
        });
        return [];
      }
    },
  };
}
