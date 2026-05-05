import { BaseGenerator } from './base.js';
import type { AstNode, CondNode, ElementNode, LoopNode, TextSegment, VarValue, VarsMap } from '../core/types.js';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

export interface HtmlGeneratorOptions {
  /** Variable values to substitute. Strings in text; arrays in loops; booleans in conditionals. */
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
    if (node.type === 'loop') return this.renderLoop(node);
    if (node.type === 'cond') return this.renderCond(node);
    if (node.type === 'element') return this.renderElement(node);
    throw new Error(`component node '${node.type}' must be expanded before generation`);
  }

  private renderLoop(node: LoopNode): string {
    const items = this.vars[node.iterable];
    if (!Array.isArray(items)) return `{{for ${node.variable} in ${node.iterable}}}`;
    return items.map(item => {
      this.localVars[node.variable] = item;
      const result = this.renderElement(node.body);
      delete this.localVars[node.variable];
      return result;
    }).join('');
  }

  private isTruthy(val: VarValue | undefined): boolean {
    if (val === undefined || val === null) return false;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val !== '' && val !== 'false' && val !== '0';
    if (Array.isArray(val)) return val.length > 0;
    return false;
  }

  private renderCond(node: CondNode): string {
    const val = this.localVars[node.condition] ?? this.vars[node.condition];
    const condMet = node.negate ? !this.isTruthy(val) : this.isTruthy(val);
    if (condMet) return this.renderNode(node.body);
    if (node.elseBody != null) return this.renderNode(node.elseBody);
    return '';
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

    if (isVoid) return `<${node.tag}${attrsStr}/>`;
    return `<${node.tag}${attrsStr}></${node.tag}>`;
  }

  private renderText(segments: TextSegment[]): string {
    return segments.map(seg => {
      if (seg.kind === 'literal') return this.escapeHtml(seg.value);
      const val = this.localVars[seg.name] ?? this.vars[seg.name];
      if (val === undefined || typeof val !== 'string') return `{{${seg.name}}}`;
      return this.escapeHtml(val);
    }).join('');
  }

  private renderAttrValue(segments: TextSegment[]): string {
    return segments.map(seg => {
      if (seg.kind === 'literal') return this.escapeAttr(seg.value);
      const val = this.localVars[seg.name] ?? this.vars[seg.name];
      if (val === undefined || typeof val !== 'string') return `{{${seg.name}}}`;
      return this.escapeAttr(val);
    }).join('');
  }

  private buildAttrs(node: ElementNode): string {
    const parts: string[] = [];
    if (node.id) parts.push(`id="${this.escapeAttr(node.id)}"`);
    if (node.classes.length > 0) {
      parts.push(`class="${node.classes.map(c => this.escapeAttr(c)).join(' ')}"`);
    }
    for (const [key, segs] of Object.entries(node.attributes)) {
      parts.push(`${key}="${this.renderAttrValue(segs)}"`);
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
