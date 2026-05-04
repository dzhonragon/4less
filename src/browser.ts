// Browser-safe entry point — excludes bundler plugins (which use Node.js APIs)
export {
  compile,
  parse,
  generate,
  expandComponents,
  ParseError,
  HtmlGenerator,
  JsonGenerator,
  ReactGenerator,
  VueGenerator,
  AstroGenerator,
} from './index.js';

export type {
  AstNode,
  ElementNode,
  LoopNode,
  CondNode,
  ComponentDefNode,
  ComponentCallNode,
  TextSegment,
  VarValue,
  VarsMap,
} from './core/types.js';

export type { HtmlGeneratorOptions } from './generators/html.js';
export type { AstroGeneratorOptions } from './generators/astro.js';
