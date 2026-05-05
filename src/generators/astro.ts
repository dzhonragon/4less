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

  private renderNode(node: AstNode): string {
    if (node.type === 'loop') return `{${this.renderLoopExpr(node)}}`;
    if (node.type === 'cond') return `{${this.renderCondExpr(node)}}`;
    if (node.type === 'element') return this.renderElement(node);
    throw new Error(`component node '${node.type}' must be expanded before generation`);
  }

  private renderLoopExpr(node: LoopNode): string {
    return `${node.iterable}.map((${node.variable}) => ${this.renderElement(node.body)})`;
  }

  private renderCondExpr(node: CondNode): string {
    const condExpr = node.negate ? `!${node.condition}` : node.condition;
    const bodyExpr = this.renderNodeExpr(node.body);
    if (node.elseBody != null) {
      const elseExpr = this.renderNodeExpr(node.elseBody);
      return `${condExpr} ? ${bodyExpr} : ${elseExpr}`;
    }
    return `${condExpr} && ${bodyExpr}`;
  }

  private renderNodeExpr(node: AstNode): string {
    if (node.type === 'loop') return this.renderLoopExpr(node);
    if (node.type === 'cond') return `(${this.renderCondExpr(node)})`;
    if (node.type === 'element') return this.renderElement(node);
    throw new Error(`component node '${node.type}' must be expanded before generation`);
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

    // Fix: non-void empty elements must use explicit closing tag, not self-close
    return isVoid ? `<${node.tag}${attrsStr} />` : `<${node.tag}${attrsStr}></${node.tag}>`;
  }

  private renderText(segments: TextSegment[]): string {
    return segments.map(seg =>
      seg.kind === 'literal' ? this.escapeHtml(seg.value) : `{${seg.name}}`
    ).join('');
  }

  /** Renders attribute TextSegment[] as static attr or JSX expression. */
  private renderAttrPart(key: string, segments: TextSegment[]): string {
    const allLiteral = segments.every(s => s.kind === 'literal');
    if (allLiteral) {
      const value = segments.map(s => this.escapeAttr((s as { kind: 'literal'; value: string }).value)).join('');
      return `${key}="${value}"`;
    }
    const expr = segments.map(seg =>
      seg.kind === 'literal'
        ? seg.value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
        : `\${${seg.name}}`
    ).join('');
    return `${key}={\`${expr}\`}`;
  }

  private buildAttrs(node: ElementNode): string {
    const parts: string[] = [];
    if (node.id) parts.push(`id="${this.escapeAttr(node.id)}"`);
    if (node.classes.length > 0) {
      parts.push(`class="${node.classes.map(c => this.escapeAttr(c)).join(' ')}"`);
    }
    for (const [key, segs] of Object.entries(node.attributes)) {
      parts.push(this.renderAttrPart(key, segs));
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
