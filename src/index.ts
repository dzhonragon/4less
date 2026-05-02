import { tokenize } from './lexer.js';
import { buildAst } from './parser.js';
import { HtmlGenerator } from './generators/html.js';
import type { ElementNode } from './types.js';

export { ParseError } from './errors.js';
export type { ErrorLocation } from './errors.js';
export { BaseGenerator } from './generator.js';
export { HtmlGenerator } from './generators/html.js';
export { JsonGenerator } from './generators/json.js';
export type { Token, ElementNode } from './types.js';

export function parse(input: string): ElementNode[] {
  return buildAst(tokenize(input));
}

export function generate(ast: ElementNode[], generator: InstanceType<typeof HtmlGenerator>): string;
export function generate(ast: ElementNode[], generator: any): string;
export function generate(ast: ElementNode[], generator: any): string {
  return generator.generate(ast);
}

export function compile(input: string): string {
  return generate(parse(input), new HtmlGenerator());
}
