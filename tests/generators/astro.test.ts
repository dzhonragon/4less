import { describe, it, expect } from 'vitest';
import { AstroGenerator } from '../../src/generators/astro.js';
import type { ElementNode, TextSegment } from '../../src/core/types.js';

const lit = (value: string): TextSegment[] => [{ kind: 'literal', value }];

const el = (tag: string, overrides: Partial<ElementNode> = {}): ElementNode => ({
  type: 'element', tag, id: null, classes: [], attributes: {}, text: null, children: [],
  ...overrides,
});

describe('AstroGenerator', () => {
  it('renders single element template', () => {
    const gen = new AstroGenerator();
    expect(gen.generate([el('div', { text: lit('Hello') })])).toBe('<div>Hello</div>');
  });

  it('wraps multiple root elements in fragment', () => {
    const gen = new AstroGenerator();
    const ast = [el('h1', { text: lit('A') }), el('p', { text: lit('B') })];
    expect(gen.generate(ast)).toBe('<><h1>A</h1><p>B</p></>');
  });

  it('does not wrap in fragment when disabled', () => {
    const gen = new AstroGenerator({ fragment: false });
    const ast = [el('h1', { text: lit('A') }), el('p', { text: lit('B') })];
    expect(gen.generate(ast)).toBe('<h1>A</h1><p>B</p>');
  });

  it('includes frontmatter when provided', () => {
    const gen = new AstroGenerator({ frontmatter: 'const title = "Hello";' });
    const result = gen.generate([el('h1', { text: lit('Hi') })]);
    expect(result).toBe('---\nconst title = "Hello";\n---\n<h1>Hi</h1>');
  });

  it('renders void elements with JSX-style self-closing', () => {
    const gen = new AstroGenerator();
    expect(gen.generate([el('br')])).toBe('<br />');
    expect(gen.generate([el('meta', { attributes: { charset: 'UTF-8' } })])).toBe('<meta charset="UTF-8" />');
  });

  it('renders non-void empty elements with JSX-style self-closing', () => {
    const gen = new AstroGenerator();
    expect(gen.generate([el('div')])).toBe('<div />');
  });

  it('renders id and class attributes', () => {
    const gen = new AstroGenerator();
    expect(gen.generate([el('div', { id: 'app', classes: ['container'] })])).toBe(
      '<div id="app" class="container" />'
    );
  });

  it('renders nested children', () => {
    const gen = new AstroGenerator();
    const ast = [el('div', { children: [el('p', { text: lit('Hello') })] })];
    expect(gen.generate(ast)).toBe('<div><p>Hello</p></div>');
  });

  it('generates a complete .astro component', () => {
    const gen = new AstroGenerator({
      frontmatter: "import Button from './Button.astro';",
    });
    const ast = [el('div', { id: 'app', children: [el('h1', { text: lit('Hello') })] })];
    const result = gen.generate(ast);
    expect(result).toContain('---');
    expect(result).toContain("import Button");
    expect(result).toContain('<div id="app">');
    expect(result).toContain('<h1>Hello</h1>');
  });

  it('renders variable as JSX expression {varName}', () => {
    const gen = new AstroGenerator();
    const ast = [el('h1', { text: [{ kind: 'var', name: 'title' }] })];
    expect(gen.generate(ast)).toBe('<h1>{title}</h1>');
  });

  it('renders mixed literal and variable', () => {
    const gen = new AstroGenerator();
    const ast = [el('p', { text: [{ kind: 'literal', value: 'Hello ' }, { kind: 'var', name: 'name' }] })];
    expect(gen.generate(ast)).toBe('<p>Hello {name}</p>');
  });

  it('renders loop as {iterable.map()} expression', () => {
    const gen = new AstroGenerator();
    const loop: import('../../src/core/types.js').LoopNode = {
      type: 'loop', variable: 'item', iterable: 'items',
      body: { type: 'element', tag: 'li', id: null, classes: [], attributes: {}, text: [{ kind: 'var', name: 'item' }], children: [] },
    };
    expect(gen.generate([loop])).toBe('{items.map((item) => <li>{item}</li>)}');
  });

  it('renders loop nested inside a parent element', () => {
    const gen = new AstroGenerator();
    const loop: import('../../src/core/types.js').LoopNode = {
      type: 'loop', variable: 'x', iterable: 'list',
      body: { type: 'element', tag: 'li', id: null, classes: [], attributes: {}, text: [{ kind: 'var', name: 'x' }], children: [] },
    };
    const ul = el('ul', { children: [loop] });
    expect(gen.generate([ul])).toBe('<ul>{list.map((x) => <li>{x}</li>)}</ul>');
  });

  it('renders conditional as && expression', () => {
    const gen = new AstroGenerator();
    const cond: import('../../src/core/types.js').CondNode = {
      type: 'cond', condition: 'isVisible',
      body: { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: lit('Hello'), children: [] },
    };
    expect(gen.generate([cond])).toBe('{isVisible && <p>Hello</p>}');
  });

  it('renders conditional wrapping a loop without double braces', () => {
    const gen = new AstroGenerator();
    const loop: import('../../src/core/types.js').LoopNode = {
      type: 'loop', variable: 'item', iterable: 'items',
      body: { type: 'element', tag: 'li', id: null, classes: [], attributes: {}, text: [{ kind: 'var', name: 'item' }], children: [] },
    };
    const cond: import('../../src/core/types.js').CondNode = {
      type: 'cond', condition: 'hasItems', body: loop,
    };
    expect(gen.generate([cond])).toBe('{hasItems && items.map((item) => <li>{item}</li>)}');
  });

  it('renders nested conditionals', () => {
    const gen = new AstroGenerator();
    const inner: import('../../src/core/types.js').CondNode = {
      type: 'cond', condition: 'b',
      body: { type: 'element', tag: 'span', id: null, classes: [], attributes: {}, text: lit('ok'), children: [] },
    };
    const outer: import('../../src/core/types.js').CondNode = {
      type: 'cond', condition: 'a', body: inner,
    };
    expect(gen.generate([outer])).toBe('{a && (b && <span>ok</span>)}');
  });
});
