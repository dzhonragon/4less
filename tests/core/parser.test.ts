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
      text: 'hello',
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

  it('parses attributes', () => {
    const tokens = tokenize('a href:"/" target:"_blank"');
    const ast = buildAst(tokens);
    expect(ast[0]).toMatchObject({
      tag: 'a',
      attributes: { href: '/', target: '_blank' },
    });
  });

  it('parses nested elements', () => {
    const tokens = tokenize('div { p "text" }');
    const ast = buildAst(tokens);
    expect(ast[0]).toMatchObject({
      tag: 'div',
      children: [{ tag: 'p', text: 'text' }],
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
});
