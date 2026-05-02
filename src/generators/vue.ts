import { BaseGenerator } from './base.js';
import type { ElementNode } from '../core/types.js';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/**
 * Generates Vue 3 template-compatible HTML.
 *
 * Output is valid inside a Vue SFC <template> block or for use with v-html.
 *
 * Usage:
 * ```ts
 * import { parse, generate, VueGenerator } from '4less';
 *
 * const ast = parse('div.container { h1 "Hello" }');
 * const template = generate(ast, new VueGenerator());
 * // <div class="container"><h1>Hello</h1></div>
 * ```
 *
 * Wrap in a template block:
 * ```ts
 * const sfc = `<template>\n${template}\n</template>`;
 * ```
 */
export class VueGenerator extends BaseGenerator {
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
      return `<${node.tag}${attrsStr}>${this.escapeHtml(node.text)}</${node.tag}>`;
    }

    return isVoid
      ? `<${node.tag}${attrsStr}/>`
      : `<${node.tag}${attrsStr}></${node.tag}>`;
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
