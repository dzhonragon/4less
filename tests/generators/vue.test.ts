import { describe, it, expect } from 'vitest';
import { VueGenerator } from '../../src/generators/vue.js';
import type { ElementNode } from '../../src/core/types.js';

const el = (tag: string, overrides: Partial<ElementNode> = {}): ElementNode => ({
  type: 'element', tag, id: null, classes: [], attributes: {}, text: null, children: [],
  ...overrides,
});

describe('VueGenerator', () => {
  const gen = new VueGenerator();

  it('renders non-void element with closing tag', () => {
    expect(gen.generate([el('div')])).toBe('<div></div>');
  });

  it('renders void element as self-closing', () => {
    expect(gen.generate([el('meta', { attributes: { charset: 'UTF-8' } })])).toBe('<meta charset="UTF-8"/>');
  });

  it('renders text content', () => {
    expect(gen.generate([el('h1', { text: 'Hello' })])).toBe('<h1>Hello</h1>');
  });

  it('renders id and class attributes', () => {
    expect(gen.generate([el('div', { id: 'app', classes: ['container'] })])).toBe(
      '<div id="app" class="container"></div>'
    );
  });

  it('renders nested children', () => {
    const ast = [el('div', { children: [el('p', { text: 'World' })] })];
    expect(gen.generate(ast)).toBe('<div><p>World</p></div>');
  });

  it('renders multiple root elements (for v-html or slot wrapping)', () => {
    const ast = [el('h1', { text: 'A' }), el('p', { text: 'B' })];
    expect(gen.generate(ast)).toBe('<h1>A</h1><p>B</p>');
  });

  it('escapes HTML in text content', () => {
    expect(gen.generate([el('p', { text: '<script>xss</script>' })])).toBe(
      '<p>&lt;script&gt;xss&lt;/script&gt;</p>'
    );
  });

  it('output is valid as Vue SFC template content', () => {
    const ast = [el('div', { id: 'app', children: [el('h1', { text: 'Hello' })] })];
    const template = `<template>\n${gen.generate(ast)}\n</template>`;
    expect(template).toContain('<template>');
    expect(template).toContain('<div id="app">');
    expect(template).toContain('<h1>Hello</h1>');
    expect(template).toContain('</template>');
  });
});
