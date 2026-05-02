import { describe, it, expect } from 'vitest';
import { VueGenerator } from '../../src/generators/vue.js';
import type { ElementNode, TextSegment } from '../../src/core/types.js';

const lit = (value: string): TextSegment[] => [{ kind: 'literal', value }];

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
    expect(gen.generate([el('h1', { text: lit('Hello') })])).toBe('<h1>Hello</h1>');
  });

  it('renders id and class attributes', () => {
    expect(gen.generate([el('div', { id: 'app', classes: ['container'] })])).toBe(
      '<div id="app" class="container"></div>'
    );
  });

  it('renders nested children', () => {
    const ast = [el('div', { children: [el('p', { text: lit('World') })] })];
    expect(gen.generate(ast)).toBe('<div><p>World</p></div>');
  });

  it('renders multiple root elements (for v-html or slot wrapping)', () => {
    const ast = [el('h1', { text: lit('A') }), el('p', { text: lit('B') })];
    expect(gen.generate(ast)).toBe('<h1>A</h1><p>B</p>');
  });

  it('escapes HTML in text content', () => {
    expect(gen.generate([el('p', { text: lit('<script>xss</script>') })])).toBe(
      '<p>&lt;script&gt;xss&lt;/script&gt;</p>'
    );
  });

  it('output is valid as Vue SFC template content', () => {
    const ast = [el('div', { id: 'app', children: [el('h1', { text: lit('Hello') })] })];
    const template = `<template>\n${gen.generate(ast)}\n</template>`;
    expect(template).toContain('<template>');
    expect(template).toContain('<div id="app">');
    expect(template).toContain('<h1>Hello</h1>');
    expect(template).toContain('</template>');
  });

  it('renders variable as Vue interpolation {{ varName }}', () => {
    const ast = [el('p', { text: [{ kind: 'var', name: 'title' }] })];
    expect(gen.generate(ast)).toBe('<p>{{ title }}</p>');
  });

  it('renders mixed literal and variable', () => {
    const ast = [el('p', { text: [{ kind: 'literal', value: 'Hello ' }, { kind: 'var', name: 'name' }] })];
    expect(gen.generate(ast)).toBe('<p>Hello {{ name }}</p>');
  });

  it('renders loop as v-for directive', () => {
    const loop: import('../../src/core/types.js').LoopNode = {
      type: 'loop', variable: 'item', iterable: 'items',
      body: { type: 'element', tag: 'li', id: null, classes: [], attributes: {}, text: [{ kind: 'var', name: 'item' }], children: [] },
    };
    expect(gen.generate([loop])).toBe('<li v-for="item in items">{{ item }}</li>');
  });

  it('renders loop nested inside a parent element', () => {
    const loop: import('../../src/core/types.js').LoopNode = {
      type: 'loop', variable: 'x', iterable: 'list',
      body: { type: 'element', tag: 'li', id: null, classes: [], attributes: {}, text: [{ kind: 'var', name: 'x' }], children: [] },
    };
    const ul = el('ul', { children: [loop] });
    expect(gen.generate([ul])).toBe('<ul><li v-for="x in list">{{ x }}</li></ul>');
  });

  it('renders conditional as v-if on element', () => {
    const cond: import('../../src/core/types.js').CondNode = {
      type: 'cond', condition: 'isVisible',
      body: { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: lit('Hello'), children: [] },
    };
    expect(gen.generate([cond])).toBe('<p v-if="isVisible">Hello</p>');
  });

  it('renders conditional wrapping a loop in template tag', () => {
    const loop: import('../../src/core/types.js').LoopNode = {
      type: 'loop', variable: 'item', iterable: 'items',
      body: { type: 'element', tag: 'li', id: null, classes: [], attributes: {}, text: [{ kind: 'var', name: 'item' }], children: [] },
    };
    const cond: import('../../src/core/types.js').CondNode = {
      type: 'cond', condition: 'hasItems', body: loop,
    };
    expect(gen.generate([cond])).toBe(
      '<template v-if="hasItems"><li v-for="item in items">{{ item }}</li></template>'
    );
  });

  it('renders conditional with existing element attributes', () => {
    const cond: import('../../src/core/types.js').CondNode = {
      type: 'cond', condition: 'show',
      body: { type: 'element', tag: 'div', id: 'app', classes: ['box'], attributes: {}, text: null, children: [] },
    };
    expect(gen.generate([cond])).toBe('<div id="app" class="box" v-if="show"></div>');
  });
});
