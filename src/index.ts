import { tokenize } from './core/lexer.js';
import { buildAst } from './core/parser.js';
import { HtmlGenerator } from './generators/html.js';
import { BaseGenerator } from './generators/base.js';
import type { ElementNode } from './core/types.js';

export { ParseError } from './errors.js';
export type { ErrorLocation } from './errors.js';
export { BaseGenerator } from './generators/base.js';
export { HtmlGenerator } from './generators/html.js';
export { JsonGenerator } from './generators/json.js';
export { ReactGenerator } from './generators/react.js';
export { VueGenerator } from './generators/vue.js';
export { AstroGenerator } from './generators/astro.js';
export type { AstroGeneratorOptions } from './generators/astro.js';
export type { Token, ElementNode } from './core/types.js';

export function parse(input: string): ElementNode[] {
  return buildAst(tokenize(input));
}

export function generate(ast: ElementNode[], generator: BaseGenerator): string {
  return generator.generate(ast);
}

export function compile(input: string): string {
  return generate(parse(input), new HtmlGenerator());
}
