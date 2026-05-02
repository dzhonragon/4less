import { describe, it, expect } from 'vitest';
import { ReactGenerator } from '../../src/generators/react.js';
import type { ElementNode, TextSegment } from '../../src/core/types.js';

const lit = (value: string): TextSegment[] => [{ kind: 'literal', value }];

const el = (tag: string, overrides: Partial<ElementNode> = {}): ElementNode => ({
  type: 'element',
  tag,
  id: null,
  classes: [],
  attributes: {},
  text: null,
  children: [],
  ...overrides,
});

describe('ReactGenerator', () => {
  const gen = new ReactGenerator();

  it('renders empty element', () => {
    expect(gen.generate([el('div')])).toBe(
      `React.createElement('div', null)`
    );
  });

  it('renders element with text', () => {
    expect(gen.generate([el('h1', { text: lit('Hello') })])).toBe(
      `React.createElement('h1', null, "Hello")`
    );
  });

  it('renders element with id', () => {
    expect(gen.generate([el('div', { id: 'app' })])).toBe(
      `React.createElement('div', { id: "app" })`
    );
  });

  it('converts class to className', () => {
    expect(gen.generate([el('div', { classes: ['container', 'active'] })])).toBe(
      `React.createElement('div', { className: "container active" })`
    );
  });

  it('renders attributes', () => {
    expect(gen.generate([el('a', { attributes: { href: '/' }, text: lit('Home') })])).toBe(
      `React.createElement('a', { href: "/" }, "Home")`
    );
  });

  it('converts html attribute names to React prop names', () => {
    expect(gen.generate([el('label', { attributes: { for: 'email' } })])).toBe(
      `React.createElement('label', { htmlFor: "email" })`
    );
  });

  it('renders nested children', () => {
    const ast: ElementNode[] = [
      el('div', { children: [el('p', { text: lit('Hello') })] }),
    ];
    expect(gen.generate(ast)).toBe(
      `React.createElement('div', null, React.createElement('p', null, "Hello"))`
    );
  });

  it('wraps multiple root nodes in Fragment', () => {
    const ast = [el('h1', { text: lit('Title') }), el('p', { text: lit('Body') })];
    expect(gen.generate(ast)).toBe(
      `React.createElement(React.Fragment, null, React.createElement('h1', null, "Title"), React.createElement('p', null, "Body"))`
    );
  });

  it('combines id, className and attributes', () => {
    const ast = [el('div', { id: 'app', classes: ['box'], attributes: { role: 'main' } })];
    expect(gen.generate(ast)).toBe(
      `React.createElement('div', { id: "app", className: "box", role: "main" })`
    );
  });

  it('renders variable as bare JS identifier', () => {
    const ast = [el('p', { text: [{ kind: 'var', name: 'title' }] })];
    expect(gen.generate(ast)).toBe(`React.createElement('p', null, title)`);
  });

  it('renders mixed literal and variable', () => {
    const ast = [el('p', { text: [{ kind: 'literal', value: 'Hello ' }, { kind: 'var', name: 'name' }] })];
    expect(gen.generate(ast)).toBe(`React.createElement('p', null, "Hello ", name)`);
  });

  it('renders loop as .map() expression', () => {
    const loop: import('../../src/core/types.js').LoopNode = {
      type: 'loop', variable: 'item', iterable: 'items',
      body: { type: 'element', tag: 'li', id: null, classes: [], attributes: {}, text: [{ kind: 'var', name: 'item' }], children: [] },
    };
    expect(gen.generate([loop])).toBe(
      `items.map((item) => React.createElement('li', null, item))`
    );
  });

  it('renders loop nested inside a parent element', () => {
    const loop: import('../../src/core/types.js').LoopNode = {
      type: 'loop', variable: 'x', iterable: 'list',
      body: { type: 'element', tag: 'span', id: null, classes: [], attributes: {}, text: [{ kind: 'var', name: 'x' }], children: [] },
    };
    const ul = el('ul', { children: [loop] });
    expect(gen.generate([ul])).toBe(
      `React.createElement('ul', null, list.map((x) => React.createElement('span', null, x)))`
    );
  });

  it('renders conditional as ternary expression', () => {
    const cond: import('../../src/core/types.js').CondNode = {
      type: 'cond', condition: 'isVisible',
      body: { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: lit('Hello'), children: [] },
    };
    expect(gen.generate([cond])).toBe(
      `isVisible ? React.createElement('p', null, "Hello") : null`
    );
  });

  it('renders conditional wrapping a loop', () => {
    const loop: import('../../src/core/types.js').LoopNode = {
      type: 'loop', variable: 'item', iterable: 'items',
      body: { type: 'element', tag: 'li', id: null, classes: [], attributes: {}, text: [{ kind: 'var', name: 'item' }], children: [] },
    };
    const cond: import('../../src/core/types.js').CondNode = {
      type: 'cond', condition: 'hasItems', body: loop,
    };
    expect(gen.generate([cond])).toBe(
      `hasItems ? items.map((item) => React.createElement('li', null, item)) : null`
    );
  });
});
