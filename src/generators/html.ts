import { BaseGenerator } from './base.js';
import type { ElementNode, TextSegment } from '../core/types.js';

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

export interface HtmlGeneratorOptions {
  /** Variable values to substitute in the output. Unresolved vars render as {{varName}}. */
  vars?: Record<string, string>;
}

export class HtmlGenerator extends BaseGenerator {
  private vars: Record<string, string>;

  constructor(options: HtmlGeneratorOptions = {}) {
    super();
    this.vars = options.vars ?? {};
  }

  generate(nodes: ElementNode[]): string {
    return nodes.map(n => this.renderElement(n)).join('');
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
      const content = this.renderText(node.text);
      return `<${node.tag}${attrsStr}>${content}</${node.tag}>`;
    }

    if (isVoid) {
      return `<${node.tag}${attrsStr}/>`;
    }

    return `<${node.tag}${attrsStr}></${node.tag}>`;
  }

  private renderText(segments: TextSegment[]): string {
    return segments.map(seg => {
      if (seg.kind === 'literal') return this.escapeHtml(seg.value);
      const val = this.vars[seg.name];
      return val !== undefined ? this.escapeHtml(val) : `{{${seg.name}}}`;
    }).join('');
  }

  private buildAttrs(node: ElementNode): string {
    const parts: string[] = [];

    if (node.id) {
      parts.push(`id="${this.escapeAttr(node.id)}"`);
    }

    if (node.classes.length > 0) {
      parts.push(`class="${node.classes.map(c => this.escapeAttr(c)).join(' ')}"`);
    }

    for (const [key, value] of Object.entries(node.attributes)) {
      parts.push(`${key}="${this.escapeAttr(value)}"`);
    }

    return parts.join(' ');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private escapeAttr(attr: string): string {
    return this.escapeHtml(attr).replace(/"/g, '&quot;');
  }
}
