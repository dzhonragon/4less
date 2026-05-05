import { describe, it, expect } from 'vitest';
import { HtmlGenerator } from '../../src/generators/html.js';
import type { ElementNode, TextSegment } from '../../src/core/types.js';

const lit = (value: string): TextSegment[] => [{ kind: 'literal', value }];
const varSeg = (name: string): TextSegment[] => [{ kind: 'var', name }];
/** Wraps a plain string as a single-literal TextSegment[] for use in attributes. */
const attr = (value: string): TextSegment[] => [{ kind: 'literal', value }];

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
      { type: 'element', tag: 'div', id: null, classes: [], attributes: {}, text: lit('hello'), children: [] },
    ];
    expect(gen.generate(ast)).toBe('<div>hello</div>');
  });

  it('generates void elements self-closing', () => {
    const ast: ElementNode[] = [
      { type: 'element', tag: 'meta', id: null, classes: [], attributes: { charset: attr('UTF-8') }, text: null, children: [] },
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
      { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: lit('<script>alert(1)</script>'), children: [] },
    ];
    expect(gen.generate(ast)).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('escapes HTML in attributes', () => {
    const ast: ElementNode[] = [
      { type: 'element', tag: 'a', id: null, classes: [], attributes: { onclick: attr('alert("xss")') }, text: lit('click'), children: [] },
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
          { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: lit('hello'), children: [] },
        ],
      },
    ];
    expect(gen.generate(ast)).toBe('<div><p>hello</p></div>');
  });

  it('renders unresolved variable as {{varName}} placeholder', () => {
    const ast: ElementNode[] = [
      { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: varSeg('title'), children: [] },
    ];
    expect(gen.generate(ast)).toBe('<p>{{title}}</p>');
  });

  it('substitutes variable when vars provided', () => {
    const genWithVars = new HtmlGenerator({ vars: { title: 'Hello World' } });
    const ast: ElementNode[] = [
      { type: 'element', tag: 'h1', id: null, classes: [], attributes: {}, text: varSeg('title'), children: [] },
    ];
    expect(genWithVars.generate(ast)).toBe('<h1>Hello World</h1>');
  });

  it('renders mixed literal and variable', () => {
    const ast: ElementNode[] = [
      {
        type: 'element', tag: 'p', id: null, classes: [], attributes: {},
        text: [{ kind: 'literal', value: 'Hello ' }, { kind: 'var', name: 'name' }],
        children: [],
      },
    ];
    const genWithVars = new HtmlGenerator({ vars: { name: 'World' } });
    expect(genWithVars.generate(ast)).toBe('<p>Hello World</p>');
  });

  it('escapes substituted variable values', () => {
    const genWithVars = new HtmlGenerator({ vars: { content: '<b>bold</b>' } });
    const ast: ElementNode[] = [
      { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: varSeg('content'), children: [] },
    ];
    expect(genWithVars.generate(ast)).toBe('<p>&lt;b&gt;bold&lt;/b&gt;</p>');
  });

  it('renders loop placeholder when items array not provided', () => {
    const loop: import('../../src/core/types.js').LoopNode = {
      type: 'loop', variable: 'item', iterable: 'items',
      body: { type: 'element', tag: 'li', id: null, classes: [], attributes: {}, text: [{ kind: 'var', name: 'item' }], children: [] },
    };
    expect(gen.generate([loop])).toBe('{{for item in items}}');
  });

  it('renders loop items when array provided', () => {
    const loop: import('../../src/core/types.js').LoopNode = {
      type: 'loop', variable: 'item', iterable: 'items',
      body: { type: 'element', tag: 'li', id: null, classes: [], attributes: {}, text: [{ kind: 'var', name: 'item' }], children: [] },
    };
    const genWithVars = new HtmlGenerator({ vars: { items: ['a', 'b', 'c'] } });
    expect(genWithVars.generate([loop])).toBe('<li>a</li><li>b</li><li>c</li>');
  });

  it('renders loop nested inside a parent element', () => {
    const loop: import('../../src/core/types.js').LoopNode = {
      type: 'loop', variable: 'x', iterable: 'list',
      body: { type: 'element', tag: 'li', id: null, classes: [], attributes: {}, text: [{ kind: 'var', name: 'x' }], children: [] },
    };
    const ul: ElementNode = { type: 'element', tag: 'ul', id: null, classes: [], attributes: {}, text: null, children: [loop] };
    const genWithVars = new HtmlGenerator({ vars: { list: ['one', 'two'] } });
    expect(genWithVars.generate([ul])).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  it('renders nothing when condition is false', () => {
    const cond: import('../../src/core/types.js').CondNode = {
      type: 'cond', negate: false, condition: 'show', elseBody: null,
      body: { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: lit('Hi'), children: [] },
    };
    const genFalse = new HtmlGenerator({ vars: { show: false } });
    expect(genFalse.generate([cond])).toBe('');
  });

  it('renders body when condition is true', () => {
    const cond: import('../../src/core/types.js').CondNode = {
      type: 'cond', negate: false, condition: 'show', elseBody: null,
      body: { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: lit('Hi'), children: [] },
    };
    const genTrue = new HtmlGenerator({ vars: { show: true } });
    expect(genTrue.generate([cond])).toBe('<p>Hi</p>');
  });

  it('renders nothing when condition variable is undefined', () => {
    const cond: import('../../src/core/types.js').CondNode = {
      type: 'cond', negate: false, condition: 'missing', elseBody: null,
      body: { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: lit('Hi'), children: [] },
    };
    expect(gen.generate([cond])).toBe('');
  });

  it('renders conditional inside parent element', () => {
    const cond: import('../../src/core/types.js').CondNode = {
      type: 'cond', negate: false, condition: 'show', elseBody: null,
      body: { type: 'element', tag: 'span', id: null, classes: [], attributes: {}, text: lit('yes'), children: [] },
    };
    const div: ElementNode = { type: 'element', tag: 'div', id: null, classes: [], attributes: {}, text: null, children: [cond] };
    const genTrue = new HtmlGenerator({ vars: { show: true } });
    expect(genTrue.generate([div])).toBe('<div><span>yes</span></div>');
  });

  it('renders else branch when condition is false', () => {
    const cond: import('../../src/core/types.js').CondNode = {
      type: 'cond', negate: false, condition: 'isLoggedIn', elseBody:
        { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: lit('Please log in'), children: [] },
      body: { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: lit('Welcome'), children: [] },
    };
    const genFalse = new HtmlGenerator({ vars: { isLoggedIn: false } });
    expect(genFalse.generate([cond])).toBe('<p>Please log in</p>');
  });

  it('renders negated condition', () => {
    const cond: import('../../src/core/types.js').CondNode = {
      type: 'cond', negate: true, condition: 'isHidden', elseBody: null,
      body: { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: lit('Visible'), children: [] },
    };
    const genHidden = new HtmlGenerator({ vars: { isHidden: false } });
    expect(genHidden.generate([cond])).toBe('<p>Visible</p>');
    const genShown = new HtmlGenerator({ vars: { isHidden: true } });
    expect(genShown.generate([cond])).toBe('');
  });

  it('interpolates $var in attribute values', () => {
    const genVars = new HtmlGenerator({ vars: { slug: 'hello-world' } });
    const ast: ElementNode[] = [{
      type: 'element', tag: 'a', id: null, classes: [], attributes: {
        href: [{ kind: 'literal', value: '/posts/' }, { kind: 'var', name: 'slug' }],
      },
      text: lit('Read'), children: [],
    }];
    expect(genVars.generate(ast)).toBe('<a href="/posts/hello-world">Read</a>');
  });
});
