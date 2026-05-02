import { describe, it, expect } from 'vitest';
import { JsonGenerator } from '../../src/generators/json.js';
import type { ElementNode } from '../../src/core/types.js';

describe('JsonGenerator', () => {
  it('serializes as valid JSON', () => {
    const ast: ElementNode[] = [
      { type: 'element', tag: 'div', id: null, classes: [], attributes: {}, text: null, children: [] },
    ];
    const gen = new JsonGenerator();
    const json = gen.generate(ast);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toHaveProperty('tag', 'div');
  });

  it('serializes multiple elements as array', () => {
    const ast: ElementNode[] = [
      { type: 'element', tag: 'h1', id: null, classes: [], attributes: {}, text: [{ kind: 'literal', value: 'Title' }], children: [] },
      { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: [{ kind: 'literal', value: 'Content' }], children: [] },
    ];
    const gen = new JsonGenerator();
    const json = gen.generate(ast);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
  });

  it('respects indent parameter', () => {
    const ast: ElementNode[] = [
      { type: 'element', tag: 'div', id: null, classes: [], attributes: {}, text: null, children: [] },
    ];
    const gen = new JsonGenerator(4);
    const json = gen.generate(ast);
    expect(json).toContain(`"type": "element"`);
    const lines = json.split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });

  it('serializes TextSegment array in text field', () => {
    const ast: ElementNode[] = [
      {
        type: 'element', tag: 'p', id: null, classes: [], attributes: {},
        text: [{ kind: 'var', name: 'title' }],
        children: [],
      },
    ];
    const gen = new JsonGenerator();
    const parsed = JSON.parse(gen.generate(ast));
    expect(parsed[0].text[0]).toEqual({ kind: 'var', name: 'title' });
  });
});
