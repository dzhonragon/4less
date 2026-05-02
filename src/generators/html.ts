import { BaseGenerator } from './base.js';
import type { AstNode, ElementNode, LoopNode, TextSegment, VarsMap } from '../core/types.js';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

export interface HtmlGeneratorOptions {
  /** Variable values to substitute. Strings used in text; arrays iterated in loops. */
  vars?: VarsMap;
}

export class HtmlGenerator extends BaseGenerator {
  private vars: VarsMap;
  private localVars: Record<string, string> = {};

  constructor(options: HtmlGeneratorOptions = {}) {
    super();
    this.vars = options.vars ?? {};
  }

  generate(nodes: AstNode[]): string {
    return nodes.map(n => this.renderNode(n)).join('');
  }

  private renderNode(node: AstNode): string {
    return node.type === 'loop' ? this.renderLoop(node) : this.renderElement(node);
  }

  private renderLoop(node: LoopNode): string {
    const items = this.vars[node.iterable];
    if (!Array.isArray(items)) {
      return `{{for ${node.variable} in ${node.iterable}}}`;
    }
    return items.map(item => {
      this.localVars[node.variable] = item;
      const result = this.renderElement(node.body);
      delete this.localVars[node.variable];
      return result;
    }).join('');
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
      const content = this.renderText(node.text);
      return `<${node.tag}${attrsStr}>${content}</${node.tag}>`;
    }

    if (isVoid) return `<${node.tag}${attrsStr}/>`;
    return `<${node.tag}${attrsStr}></${node.tag}>`;
  }

  private renderText(segments: TextSegment[]): string {
    return segments.map(seg => {
      if (seg.kind === 'literal') return this.escapeHtml(seg.value);
      const val = this.localVars[seg.name] ?? this.vars[seg.name];
      if (val === undefined) return `{{${seg.name}}}`;
      if (Array.isArray(val)) return `{{${seg.name}}}`;
      return this.escapeHtml(val);
    }).join('');
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
