import { BaseGenerator } from './base.js';
import type { AstNode, CondNode, ElementNode, LoopNode, TextSegment } from '../core/types.js';

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

export class AstroGenerator extends BaseGenerator {
  private options: Required<AstroGeneratorOptions>;

  constructor(options: AstroGeneratorOptions = {}) {
    super();
    this.options = {
      frontmatter: options.frontmatter ?? '',
      fragment: options.fragment ?? true,
    };
  }

  generate(nodes: AstNode[]): string {
    const template = this.renderTemplate(nodes);
    const { frontmatter } = this.options;
    if (!frontmatter) return template;
    return `---\n${frontmatter}\n---\n${template}`;
  }

  private renderTemplate(nodes: AstNode[]): string {
    const rendered = nodes.map(n => this.renderNode(n)).join('');
    if (nodes.length > 1 && this.options.fragment) return `<>${rendered}</>`;
    return rendered;
  }

  // Renders a node as a template string (elements as JSX tags, loops/conds in {})
  private renderNode(node: AstNode): string {
    if (node.type === 'loop') return `{${this.renderLoopExpr(node)}}`;
    if (node.type === 'cond') return `{${this.renderCondExpr(node)}}`;
    return this.renderElement(node);
  }

  // Returns the raw expression for a loop — without surrounding {}
  private renderLoopExpr(node: LoopNode): string {
    return `${node.iterable}.map((${node.variable}) => ${this.renderElement(node.body)})`;
  }

  // Returns the raw expression for a cond — without surrounding {}
  private renderCondExpr(node: CondNode): string {
    const bodyExpr = this.renderNodeExpr(node.body);
    return `${node.condition} && ${bodyExpr}`;
  }

  // Renders a node as an expression (no outer {} wrapping for loops/conds)
  private renderNodeExpr(node: AstNode): string {
    if (node.type === 'loop') return this.renderLoopExpr(node);
    if (node.type === 'cond') return `(${this.renderCondExpr(node)})`;
    return this.renderElement(node);
  }

  private renderElement(node: ElementNode): string {
    const attrs = this.buildAttrs(node);
    const attrsStr = attrs ? ' ' + attrs : '';
    const isVoid = VOID_ELEMENTS.has(node.tag);

    if (node.children.length > 0) {
      const children = node.children.map(c => this.renderNode(c)).join('');
      return `<${node.tag}${attrsStr}>${children}</${node.tag}>`;
    }

    if (node.text !== null) {
      return `<${node.tag}${attrsStr}>${this.renderText(node.text)}</${node.tag}>`;
    }

    return isVoid ? `<${node.tag}${attrsStr} />` : `<${node.tag}${attrsStr} />`;
  }

  private renderText(segments: TextSegment[]): string {
    return segments.map(seg =>
      seg.kind === 'literal' ? this.escapeHtml(seg.value) : `{${seg.name}}`
    ).join('');
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
