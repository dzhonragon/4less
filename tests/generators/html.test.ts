import { describe, it, expect } from 'vitest';
import { HtmlGenerator } from '../../src/generators/html.js';
import type { ElementNode } from '../../src/types.js';

describe('HtmlGenerator', () => {
  const gen = new HtmlGenerator();

  it('generates empty div', () => {
    const ast: ElementNode[] = [
      { type: 'element', tag: 'div', id: null, classes: [], attributes: {}, text: null, children: [] },
    ];
    expect(gen.generate(ast)).toBe('<div></div>');
  });

  it('generates div with text', () => {
    const ast: ElementNode[] = [
      { type: 'element', tag: 'div', id: null, classes: [], attributes: {}, text: 'hello', children: [] },
    ];
    expect(gen.generate(ast)).toBe('<div>hello</div>');
  });

  it('generates void elements self-closing', () => {
    const ast: ElementNode[] = [
      { type: 'element', tag: 'meta', id: null, classes: [], attributes: { charset: 'UTF-8' }, text: null, children: [] },
    ];
    expect(gen.generate(ast)).toBe('<meta charset="UTF-8"/>');
  });

  it('generates non-void elements with closing tag', () => {
    const ast: ElementNode[] = [
      { type: 'element', tag: 'div', id: null, classes: [], attributes: {}, text: null, children: [] },
    ];
    expect(gen.generate(ast)).toBe('<div></div>');
  });

  it('escapes HTML in text', () => {
    const ast: ElementNode[] = [
      { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: '<script>alert(1)</script>', children: [] },
    ];
    expect(gen.generate(ast)).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('escapes HTML in attributes', () => {
    const ast: ElementNode[] = [
      { type: 'element', tag: 'a', id: null, classes: [], attributes: { onclick: 'alert("xss")' }, text: 'click', children: [] },
    ];
    expect(gen.generate(ast)).toContain('&quot;');
  });

  it('applies id and class attributes', () => {
    const ast: ElementNode[] = [
      { type: 'element', tag: 'div', id: 'app', classes: ['container', 'active'], attributes: {}, text: null, children: [] },
    ];
    expect(gen.generate(ast)).toBe('<div id="app" class="container active"></div>');
  });

  it('generates nested elements', () => {
    const ast: ElementNode[] = [
      {
        type: 'element',
        tag: 'div',
        id: null,
        classes: [],
        attributes: {},
        text: null,
        children: [
          { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: 'hello', children: [] },
        ],
      },
    ];
    expect(gen.generate(ast)).toBe('<div><p>hello</p></div>');
  });
});
