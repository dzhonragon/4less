import { BaseGenerator } from './base.js';
import type { ElementNode } from '../core/types.js';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

export interface AstroGeneratorOptions {
  /** Frontmatter content to inject between --- delimiters. Default: empty. */
  frontmatter?: string;
  /** Wrap output in a fragment (<></>) when multiple root elements exist. Default: true. */
  fragment?: boolean;
}

/**
 * Generates Astro component (.astro) markup.
 *
 * Usage:
 * ```ts
 * import { parse, generate, AstroGenerator } from '4less';
 *
 * const ast = parse('div.container { h1 "Hello" }');
 *
 * // Template only (for embedding in .astro files)
 * generate(ast, new AstroGenerator());
 * // <div class="container"><h1>Hello</h1></div>
 *
 * // Full .astro component with frontmatter
 * generate(ast, new AstroGenerator({ frontmatter: 'const title = "Hello";' }));
 * // ---
 * // const title = "Hello";
 * // ---
 * // <div class="container"><h1>Hello</h1></div>
 * ```
 */
export class AstroGenerator extends BaseGenerator {
  private options: Required<AstroGeneratorOptions>;

  constructor(options: AstroGeneratorOptions = {}) {
    super();
    this.options = {
      frontmatter: options.frontmatter ?? '',
      fragment: options.fragment ?? true,
    };
  }

  generate(nodes: ElementNode[]): string {
    const template = this.renderTemplate(nodes);
    const { frontmatter } = this.options;

    if (!frontmatter) return template;
    return `---\n${frontmatter}\n---\n${template}`;
  }

  private renderTemplate(nodes: ElementNode[]): string {
    const rendered = nodes.map(n => this.renderElement(n)).join('');
    if (nodes.length > 1 && this.options.fragment) {
      return `<>${rendered}</>`;
    }
    return rendered;
  }

  private renderElement(node: ElementNode): string {
    const attrs = this.buildAttrs(node);
    const attrsStr = attrs ? ' ' + attrs : '';
    const isVoid = VOID_ELEMENTS.has(node.tag);

    if (node.children.length > 0) {
      const children = node.children.map(c => this.renderElement(c)).join('');
      return `<${node.tag}${attrsStr}>${children}</${node.tag}>`;
    }

    if (node.text !== null) {
      return `<${node.tag}${attrsStr}>${this.escapeHtml(node.text)}</${node.tag}>`;
    }

    return isVoid
      ? `<${node.tag}${attrsStr} />`
      : `<${node.tag}${attrsStr} />`;
  }

  private buildAttrs(node: ElementNode): string {
    const parts: string[] = [];
    if (node.id) parts.push(`id="${this.escapeAttr(node.id)}"`);
    if (node.classes.length > 0) {
      parts.push(`class="${node.classes.map(c => this.escapeAttr(c)).join(' ')}"`);
    }
    for (const [key, value] of Object.entries(node.attributes)) {
      parts.push(`${key}="${this.escapeAttr(value)}"`);
    }
    return parts.join(' ');
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private escapeAttr(attr: string): string {
    return this.escapeHtml(attr).replace(/"/g, '&quot;');
  }
}
