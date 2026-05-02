import { describe, it, expect } from 'vitest';
import { tokenize } from '../src/lexer.js';
import { ParseError } from '../src/errors.js';

describe('tokenize', () => {
  it('recognizes ID tokens', () => {
    const tokens = tokenize('hello world');
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toMatchObject({ type: 'ID', value: 'hello' });
    expect(tokens[1]).toMatchObject({ type: 'ID', value: 'world' });
    expect(tokens[2]).toMatchObject({ type: 'EOF' });
  });

  it('recognizes STRING tokens', () => {
    const tokens = tokenize('"hello world"');
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'hello world' });
  });

  it('recognizes DOT and HASH tokens', () => {
    const tokens = tokenize('.class #id');
    expect(tokens).toHaveLength(5); // DOT, ID, HASH, ID, EOF
    expect(tokens[0]).toMatchObject({ type: 'DOT' });
    expect(tokens[1]).toMatchObject({ type: 'ID', value: 'class' });
    expect(tokens[2]).toMatchObject({ type: 'HASH' });
    expect(tokens[3]).toMatchObject({ type: 'ID', value: 'id' });
    expect(tokens[4]).toMatchObject({ type: 'EOF' });
  });

  it('recognizes attribute syntax', () => {
    const tokens = tokenize('attr:"value"');
    expect(tokens).toHaveLength(4);
    expect(tokens[0]).toMatchObject({ type: 'ID', value: 'attr' });
    expect(tokens[1]).toMatchObject({ type: 'COLON' });
    expect(tokens[2]).toMatchObject({ type: 'STRING', value: 'value' });
    expect(tokens[3]).toMatchObject({ type: 'EOF' });
  });

  it('recognizes braces', () => {
    const tokens = tokenize('{ }');
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toMatchObject({ type: 'LBRACE' });
    expect(tokens[1]).toMatchObject({ type: 'RBRACE' });
    expect(tokens[2]).toMatchObject({ type: 'EOF' });
  });

  it('skips whitespace', () => {
    const tokens = tokenize('div   p   span');
    expect(tokens.filter(t => t.type !== 'EOF')).toHaveLength(3);
  });

  it('tracks line and column', () => {
    const tokens = tokenize('div\np');
    expect(tokens[0]).toMatchObject({ line: 1, col: 0 });
    expect(tokens[1]).toMatchObject({ line: 2, col: 0 });
  });

  it('throws on unexpected character', () => {
    expect(() => tokenize('div @invalid')).toThrow(ParseError);
  });

  it('preserves string content exactly', () => {
    const tokens = tokenize('"hello <world> & friends"');
    expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'hello <world> & friends' });
  });
});
