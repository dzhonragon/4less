import { describe, it, expect } from 'vitest';
import { JsonGenerator } from '../../src/generators/json.js';
import type { ElementNode } from '../../src/types.js';

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
      { type: 'element', tag: 'h1', id: null, classes: [], attributes: {}, text: 'Title', children: [] },
      { type: 'element', tag: 'p', id: null, classes: [], attributes: {}, text: 'Content', children: [] },
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
});
