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
    // When the body is a plain element, add v-if directly to it
    if (node.body.type === 'element') {
      const el = node.body;
      const attrs = this.buildAttrs(el);
      const vIf = `v-if="${node.condition}"`;
      const attrsStr = attrs ? ` ${attrs} ${vIf}` : ` ${vIf}`;
      const isVoid = VOID_ELEMENTS.has(el.tag);
      const content = this.renderBodyContent(el);
      if (!content && isVoid) return `<${el.tag}${attrsStr}/>`;
      return `<${el.tag}${attrsStr}>${content}</${el.tag}>`;
    }
    // For loop/cond body: wrap in <template v-if>
    return `<template v-if="${node.condition}">${this.renderNode(node.body)}</template>`;
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
