import { describe, it, expect } from 'vitest';
import { AstroGenerator } from '../../src/generators/astro.js';
import type { ElementNode } from '../../src/core/types.js';

const el = (tag: string, overrides: Partial<ElementNode> = {}): ElementNode => ({
  type: 'element', tag, id: null, classes: [], attributes: {}, text: null, children: [],
  ...overrides,
});

describe('AstroGenerator', () => {
  it('renders single element template', () => {
    const gen = new AstroGenerator();
    expect(gen.generate([el('div', { text: 'Hello' })])).toBe('<div>Hello</div>');
  });

  it('wraps multiple root elements in fragment', () => {
    const gen = new AstroGenerator();
    const ast = [el('h1', { text: 'A' }), el('p', { text: 'B' })];
    expect(gen.generate(ast)).toBe('<><h1>A</h1><p>B</p></>');
  });

  it('does not wrap in fragment when disabled', () => {
    const gen = new AstroGenerator({ fragment: false });
    const ast = [el('h1', { text: 'A' }), el('p', { text: 'B' })];
    expect(gen.generate(ast)).toBe('<h1>A</h1><p>B</p>');
  });

  it('includes frontmatter when provided', () => {
    const gen = new AstroGenerator({ frontmatter: 'const title = "Hello";' });
    const result = gen.generate([el('h1', { text: 'Hi' })]);
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
    const ast = [el('div', { children: [el('p', { text: 'Hello' })] })];
    expect(gen.generate(ast)).toBe('<div><p>Hello</p></div>');
  });

  it('generates a complete .astro component', () => {
    const gen = new AstroGenerator({
      frontmatter: "import Button from './Button.astro';",
    });
    const ast = [el('div', { id: 'app', children: [el('h1', { text: 'Hello' })] })];
    const result = gen.generate(ast);
    expect(result).toContain('---');
    expect(result).toContain("import Button");
    expect(result).toContain('<div id="app">');
    expect(result).toContain('<h1>Hello</h1>');
  });
});
