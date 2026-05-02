import { compile, ParseError } from '../index.js';

/**
 * Webpack loader to import 4less files as compiled HTML strings.
 *
 * Usage in webpack.config.js:
 * ```js
 * import loader4less from '4less/webpack';
 *
 * module.exports = {
 *   module: {
 *     rules: [{ test: /\.4l$/, use: loader4less }]
 *   }
 * };
 * ```
 *
 * Usage in code:
 * ```ts
 * import html from './template.4l';
 * // html is a string containing compiled HTML
 * ```
 */
export default function loader4less(this: { resourcePath: string }, source: string): string {
  try {
    const html = compile(source);
    return `export default ${JSON.stringify(html)};`;
  } catch (err) {
    if (err instanceof ParseError) {
      throw new Error(`4less compile error in ${this.resourcePath}:\n${err.message}`);
    }
    throw err;
  }
}
