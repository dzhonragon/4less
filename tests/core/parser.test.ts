import { describe, it, expect } from 'vitest';
import { tokenize } from '../../src/core/lexer.js';
import { buildAst } from '../../src/core/parser.js';
import { ParseError } from '../../src/errors.js';
import type { ElementNode } from '../../src/core/types.js';

describe('buildAst', () => {
  it('parses a simple element', () => {
    const tokens = tokenize('div');
    const ast = buildAst(tokens);
    expect(ast).toHaveLength(1);
    expect(ast[0]).toMatchObject({
      type: 'element',
      tag: 'div',
      id: null,
      classes: [],
      attributes: {},
      text: null,
      children: [],
    });
  });

  it('parses element with text', () => {
    const tokens = tokenize('div "hello"');
    const ast = buildAst(tokens);
    expect(ast[0]).toMatchObject({
      tag: 'div',
      text: [{ kind: 'literal', value: 'hello' }],
    });
  });

  it('parses class shorthands', () => {
    const tokens = tokenize('div.box.card');
    const ast = buildAst(tokens);
    expect(ast[0]).toMatchObject({
      tag: 'div',
      classes: ['box', 'card'],
    });
  });

  it('parses id shorthand', () => {
    const tokens = tokenize('div#app');
    const ast = buildAst(tokens);
    expect(ast[0]).toMatchObject({
      tag: 'div',
      id: 'app',
    });
  });

  it('parses attributes as TextSegment arrays', () => {
    const tokens = tokenize('a href:"/" target:"_blank"');
    const ast = buildAst(tokens);
    expect(ast[0]).toMatchObject({
      tag: 'a',
      attributes: {
        href:   [{ kind: 'literal', value: '/' }],
        target: [{ kind: 'literal', value: '_blank' }],
      },
    });
  });

  it('parses attribute value with $var interpolation', () => {
    const tokens = tokenize('a href:"/posts/$slug"');
    const ast = buildAst(tokens);
    expect(ast[0]).toMatchObject({
      tag: 'a',
      attributes: {
        href: [{ kind: 'literal', value: '/posts/' }, { kind: 'var', name: 'slug' }],
      },
    });
  });

  it('parses negated conditional', () => {
    const tokens = tokenize('if !isHidden: p "Visible"');
    const ast = buildAst(tokens);
    expect(ast[0]).toMatchObject({ type: 'cond', negate: true, condition: 'isHidden' });
  });

  it('parses else branch', () => {
    const tokens = tokenize('if show: p "yes" else: p "no"');
    const ast = buildAst(tokens);
    const cond = ast[0] as import('../../src/core/types.js').CondNode;
    expect(cond.condition).toBe('show');
    expect(cond.body).toMatchObject({ tag: 'p', text: [{ kind: 'literal', value: 'yes' }] });
    expect(cond.elseBody).toMatchObject({ tag: 'p', text: [{ kind: 'literal', value: 'no' }] });
  });

  it('parses else-if chain', () => {
    const tokens = tokenize('if a: p "a" else-if b: p "b" else: p "c"');
    const ast = buildAst(tokens);
    const cond = ast[0] as import('../../src/core/types.js').CondNode;
    expect(cond.condition).toBe('a');
    const elseIf = cond.elseBody as import('../../src/core/types.js').CondNode;
    expect(elseIf.type).toBe('cond');
    expect(elseIf.condition).toBe('b');
    expect(elseIf.elseBody).toMatchObject({ tag: 'p' });
  });

  it('throws when bare else appears without if', () => {
    const tokens = tokenize('else: p "x"');
    expect(() => buildAst(tokens)).toThrow(ParseError);
  });

  it('parses nested elements', () => {
    const tokens = tokenize('div { p "text" }');
    const ast = buildAst(tokens);
    expect(ast[0]).toMatchObject({
      tag: 'div',
      children: [{ tag: 'p', text: [{ kind: 'literal', value: 'text' }] }],
    });
  });

  it('parses multiple children', () => {
    const tokens = tokenize('div { p "one" p "two" }');
    const ast = buildAst(tokens);
    expect(ast[0].children).toHaveLength(2);
  });

  it('parses multiple root elements', () => {
    const tokens = tokenize('h1 "Title" p "Text"');
    const ast = buildAst(tokens);
    expect(ast).toHaveLength(2);
    expect(ast[0]).toMatchObject({ tag: 'h1' });
    expect(ast[1]).toMatchObject({ tag: 'p' });
  });

  it('throws on unexpected closing brace', () => {
    const tokens = tokenize('{ orphan }');
    expect(() => buildAst(tokens)).toThrow(ParseError);
  });

  it('throws on unmatched opening brace', () => {
    const tokens = tokenize('div {');
    expect(() => buildAst(tokens)).toThrow(ParseError);
  });

  it('children override text', () => {
    const tokens = tokenize('div "ignored" { p "shown" }');
    const ast = buildAst(tokens);
    expect(ast[0].children).toHaveLength(1);
  });

  it('parses single variable reference', () => {
    const tokens = tokenize('p $title');
    const ast = buildAst(tokens);
    expect(ast[0]).toMatchObject({
      tag: 'p',
      text: [{ kind: 'var', name: 'title' }],
    });
  });

  it('parses mixed literal and variable', () => {
    const tokens = tokenize('p "Hello " $name');
    const ast = buildAst(tokens);
    expect(ast[0].text).toEqual([
      { kind: 'literal', value: 'Hello ' },
      { kind: 'var', name: 'name' },
    ]);
  });

  it('parses multiple variables in sequence', () => {
    const tokens = tokenize('p $first " " $last');
    const ast = buildAst(tokens);
    expect(ast[0].text).toEqual([
      { kind: 'var', name: 'first' },
      { kind: 'literal', value: ' ' },
      { kind: 'var', name: 'last' },
    ]);
  });

  it('parses a for loop', () => {
    const tokens = tokenize('for item in items: li $item');
    const ast = buildAst(tokens);
    expect(ast).toHaveLength(1);
    expect(ast[0]).toMatchObject({
      type: 'loop',
      variable: 'item',
      iterable: 'items',
    });
  });

  it('loop body is an ElementNode', () => {
    const tokens = tokenize('for item in items: li $item');
    const ast = buildAst(tokens);
    const loop = ast[0] as import('../../src/core/types.js').LoopNode;
    expect(loop.body.tag).toBe('li');
    expect(loop.body.text).toEqual([{ kind: 'var', name: 'item' }]);
  });

  it('parses loop nested inside a parent element', () => {
    const tokens = tokenize('ul { for item in items: li $item }');
    const ast = buildAst(tokens);
    expect(ast[0]).toMatchObject({ type: 'element', tag: 'ul' });
    const ul = ast[0] as import('../../src/core/types.js').ElementNode;
    expect(ul.children).toHaveLength(1);
    expect(ul.children[0]).toMatchObject({ type: 'loop', variable: 'item', iterable: 'items' });
  });

  it('throws when "in" keyword is missing', () => {
    const tokens = tokenize('for item items: li $item');
    expect(() => buildAst(tokens)).toThrow(ParseError);
  });

  it('parses an if conditional', () => {
    const tokens = tokenize('if isVisible: p "Hello"');
    const ast = buildAst(tokens);
    expect(ast).toHaveLength(1);
    expect(ast[0]).toMatchObject({ type: 'cond', condition: 'isVisible' });
  });

  it('cond body is an ElementNode', () => {
    const tokens = tokenize('if isVisible: p "Hello"');
    const ast = buildAst(tokens);
    const cond = ast[0] as import('../../src/core/types.js').CondNode;
    expect(cond.body).toMatchObject({ type: 'element', tag: 'p' });
  });

  it('parses conditional nested inside a parent', () => {
    const tokens = tokenize('div { if show: span "visible" }');
    const ast = buildAst(tokens);
    const div = ast[0] as import('../../src/core/types.js').ElementNode;
    expect(div.children[0]).toMatchObject({ type: 'cond', condition: 'show' });
  });

  it('parses conditional wrapping a loop', () => {
    const tokens = tokenize('if hasItems: for item in items: li $item');
    const ast = buildAst(tokens);
    const cond = ast[0] as import('../../src/core/types.js').CondNode;
    expect(cond.body).toMatchObject({ type: 'loop', variable: 'item' });
  });

  it('parses nested conditionals', () => {
    const tokens = tokenize('if a: if b: div "deep"');
    const ast = buildAst(tokens);
    const outer = ast[0] as import('../../src/core/types.js').CondNode;
    expect(outer.condition).toBe('a');
    expect(outer.body).toMatchObject({ type: 'cond', condition: 'b' });
  });
});
