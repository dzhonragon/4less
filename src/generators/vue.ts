import { BaseGenerator } from './base.js';
import type { AstNode, CondNode, ElementNode, LoopNode, TextSegment } from '../core/types.js';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

export class VueGenerator extends BaseGenerator {
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
    const attrs = this.buildAttrs(node.body);
    const vFor = `v-for="${node.variable} in ${node.iterable}"`;
    const key = `:key="${node.variable}"`;
    const attrsStr = attrs ? ` ${attrs} ${vFor} ${key}` : ` ${vFor} ${key}`;
    const content = this.renderBodyContent(node.body);
    return `<${node.body.tag}${attrsStr}>${content}</${node.body.tag}>`;
  }

  private renderCond(node: CondNode): string {
    const vCond = node.negate ? `!${node.condition}` : node.condition;

    if (!node.elseBody) {
      // No else: put v-if directly on element when possible, template otherwise
      if (node.body.type === 'element') {
        const el = node.body;
        const attrs = this.buildAttrs(el);
        const vIf = `v-if="${vCond}"`;
        const attrsStr = attrs ? ` ${attrs} ${vIf}` : ` ${vIf}`;
        const isVoid = VOID_ELEMENTS.has(el.tag);
        const content = this.renderBodyContent(el);
        if (!content && isVoid) return `<${el.tag}${attrsStr}/>`;
        return `<${el.tag}${attrsStr}>${content}</${el.tag}>`;
      }
      return `<template v-if="${vCond}">${this.renderNode(node.body)}</template>`;
    }

    // Has else/else-if: use <template v-if> + siblings
    const ifPart = `<template v-if="${vCond}">${this.renderNode(node.body)}</template>`;
    return ifPart + this.renderElseBranch(node.elseBody);
  }

  /** Renders the else/else-if branch using v-else-if or v-else. */
  private renderElseBranch(node: AstNode): string {
    if (node.type === 'cond') {
      const vCond = node.negate ? `!${node.condition}` : node.condition;
      const content = this.renderNode(node.body);
      const part = `<template v-else-if="${vCond}">${content}</template>`;
      if (node.elseBody) return part + this.renderElseBranch(node.elseBody);
      return part;
    }
    return `<template v-else>${this.renderNode(node)}</template>`;
  }

  private renderBodyContent(node: ElementNode): string {
    if (node.children.length > 0) {
      return node.children.map(c => this.renderNode(c)).join('');
    }
    if (node.text !== null) return this.renderText(node.text);
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

    return isVoid ? `<${node.tag}${attrsStr}/>` : `<${node.tag}${attrsStr}></${node.tag}>`;
  }

  private renderText(segments: TextSegment[]): string {
    return segments.map(seg =>
      seg.kind === 'literal' ? this.escapeHtml(seg.value) : `{{ ${seg.name} }}`
    ).join('');
  }

  /** Renders attribute TextSegment[] as static or dynamic (:attr) Vue binding. */
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
    return `:${key}="\`${expr}\`"`;
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
