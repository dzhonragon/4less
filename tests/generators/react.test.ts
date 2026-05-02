import { describe, it, expect } from 'vitest';
import { ReactGenerator } from '../../src/generators/react.js';
import type { ElementNode } from '../../src/core/types.js';

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
    expect(gen.generate([el('h1', { text: 'Hello' })])).toBe(
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
    expect(gen.generate([el('a', { attributes: { href: '/' }, text: 'Home' })])).toBe(
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
      el('div', { children: [el('p', { text: 'Hello' })] }),
    ];
    expect(gen.generate(ast)).toBe(
      `React.createElement('div', null, React.createElement('p', null, "Hello"))`
    );
  });

  it('wraps multiple root nodes in Fragment', () => {
    const ast = [el('h1', { text: 'Title' }), el('p', { text: 'Body' })];
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
});
