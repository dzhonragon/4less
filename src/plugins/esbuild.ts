import { readFileSync } from 'fs';
import { compile, ParseError } from '../index.js';
import type { Plugin } from 'esbuild';

/**
 * esbuild plugin to import 4less files as compiled HTML strings.
 *
 * Usage in build script:
 * ```ts
 * import { build } from 'esbuild';
 * import esbuild4less from '4less/esbuild';
 *
 * await build({
 *   entryPoints: ['src/index.ts'],
 *   plugins: [esbuild4less()],
 * });
 * ```
 *
 * Usage in code:
 * ```ts
 * import html from './template.4l';
 * // html is a string containing compiled HTML
 * ```
 */
export default function esbuild4lessPlugin(): Plugin {
  return {
    name: '4less',
    setup(build) {
      build.onLoad({ filter: /\.4l$/ }, (args) => {
        try {
          const source = readFileSync(args.path, 'utf-8');
          const html = compile(source);
          const contents = `export default ${JSON.stringify(html)};`;
          return { contents, loader: 'js' };
        } catch (err) {
          if (err instanceof ParseError) {
            return {
              errors: [{
                text: `4less compile error in ${args.path}:\n${err.message}`,
                pluginName: '4less',
              }],
            };
          }
          const message = err instanceof Error ? err.message : String(err);
          return {
            errors: [{
              text: `Failed to compile ${args.path}: ${message}`,
              pluginName: '4less',
            }],
          };
        }
      });
    },
  };
}
