import { describe, it, expect } from 'vitest';
import { compile, generate, parse, HtmlGenerator, ReactGenerator, VueGenerator, AstroGenerator } from '../../src/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** div { div { ... span "inner" ... } } — depth levels of nesting */
function deepNest(depth: number, inner = 'span "x"'): string {
  return 'div { '.repeat(depth) + inner + ' }'.repeat(depth);
}

/** Flat list of siblings: span "0" span "1" ... */
function wideSiblings(count: number, tag = 'span'): string {
  return Array.from({ length: count }, (_, i) => `${tag} "${i}"`).join(' ');
}

/** div { div { ... for item in items: li $item ... } } */
function deepNestLoop(depth: number): string {
  return 'div { '.repeat(depth) + 'for item in items: li $item' + ' }'.repeat(depth);
}

/** div { div { ... if show: p "ok" ... } } */
function deepNestCond(depth: number): string {
  return 'div { '.repeat(depth) + 'if show: p "ok"' + ' }'.repeat(depth);
}

/** Component chain: component C1 { span } component C2 { div { C1 } } ... Cn */
function componentChain(depth: number): string {
  const defs = Array.from({ length: depth }, (_, i) => {
    const name = `C${i + 1}`;
    const body = i === 0 ? 'span "x"' : `div { C${i} }`;
    return `component ${name} { ${body} }`;
  }).join(' ');
  return `${defs} C${depth}`;
}

function htmlOut(depth: number): string {
  let result = '<span>x</span>';
  for (let i = 0; i < depth; i++) result = `<div>${result}</div>`;
  return result;
}

// ---------------------------------------------------------------------------
// C1.3 — Extreme Nesting
// ---------------------------------------------------------------------------

describe('deep element nesting — correctness', () => {
  it('10 levels deep produces correct HTML', () => {
    const expected = htmlOut(10);
    expect(compile(deepNest(10))).toBe(expected);
  });

  it('50 levels deep produces correct HTML', () => {
    expect(compile(deepNest(50))).toBe(htmlOut(50));
  });

  it('100 levels deep produces correct HTML', () => {
    expect(compile(deepNest(100))).toBe(htmlOut(100));
  });

  it('200 levels deep — no stack overflow', () => {
    expect(() => compile(deepNest(200))).not.toThrow();
  });

  it('500 levels deep — no stack overflow', () => {
    expect(() => compile(deepNest(500))).not.toThrow();
  });

  it('innermost text at 100 levels is preserved', () => {
    const out = compile(deepNest(100, 'p "deep content"'));
    expect(out).toContain('<p>deep content</p>');
    expect(out.startsWith('<div>')).toBe(true);
    expect(out.endsWith('</div>')).toBe(true);
  });
});

describe('wide structures — many siblings', () => {
  it('100 siblings at top level', () => {
    const out = compile(wideSiblings(100));
    expect(out).toContain('<span>0</span>');
    expect(out).toContain('<span>99</span>');
    expect(out.match(/<span>/g)?.length).toBe(100);
  });

  it('500 siblings at top level — no slowdown', () => {
    const out = compile(wideSiblings(500));
    expect(out.match(/<span>/g)?.length).toBe(500);
  });

  it('1000 siblings at top level', () => {
    const out = compile(wideSiblings(1000));
    expect(out.match(/<span>/g)?.length).toBe(1000);
  });

  it('100 children inside a parent', () => {
    const out = compile(`div { ${wideSiblings(100)} }`);
    expect(out.startsWith('<div>')).toBe(true);
    expect(out.match(/<span>/g)?.length).toBe(100);
  });
});

describe('deep nesting with loops', () => {
  it('loop at depth 5', () => {
    const out = compile(deepNestLoop(5), { items: ['a', 'b'] });
    expect(out).toContain('<li>a</li>');
    expect(out).toContain('<li>b</li>');
    let depth = 0;
    let s = out;
    while (s.startsWith('<div>')) { depth++; s = s.slice(5); }
    expect(depth).toBe(5);
  });

  it('loop at depth 20', () => {
    const out = compile(deepNestLoop(20), { items: ['x'] });
    expect(out).toContain('<li>x</li>');
    expect(() => compile(deepNestLoop(20), { items: ['x'] })).not.toThrow();
  });

  it('loop placeholder preserved at depth 10 when var not provided', () => {
    const out = compile(deepNestLoop(10));
    expect(out).toContain('{{for item in items}}');
  });

  it('nested loops via element children', () => {
    // outer loop body is an element whose children include an inner loop
    const src = 'for outer in outers: div { for inner in inners: span $inner }';
    const out = compile(src, { outers: ['a', 'b'], inners: ['x', 'y'] });
    expect(out).toBe('<div><span>x</span><span>y</span></div><div><span>x</span><span>y</span></div>');
  });
});

describe('deep nesting with conditionals', () => {
  it('conditional at depth 5 — true branch renders', () => {
    const out = compile(deepNestCond(5), { show: true });
    expect(out).toContain('<p>ok</p>');
  });

  it('conditional at depth 5 — false branch is empty', () => {
    const out = compile(deepNestCond(5), { show: false });
    expect(out).not.toContain('<p>');
    expect(out).toBe('<div><div><div><div><div></div></div></div></div></div>');
  });

  it('conditional at depth 20 — no stack overflow', () => {
    expect(() => compile(deepNestCond(20), { show: true })).not.toThrow();
  });

  it('nested conditionals in series', () => {
    const src = 'div { if a: p "A" if b: p "B" if c: p "C" }';
    expect(compile(src, { a: true, b: false, c: true })).toBe('<div><p>A</p><p>C</p></div>');
  });
});

describe('deep nesting with components', () => {
  it('component chain of depth 5 expands correctly', () => {
    const out = compile(componentChain(5));
    expect(out).toContain('<span>x</span>');
    // depth-1 divs wrapping the span
    let depth = 0;
    let s = out;
    while (s.startsWith('<div>')) { depth++; s = s.slice(5); }
    expect(depth).toBe(4);
  });

  it('component chain of depth 10 — no stack overflow', () => {
    expect(() => compile(componentChain(10))).not.toThrow();
  });

  it('component chain of depth 20 — no stack overflow', () => {
    expect(() => compile(componentChain(20))).not.toThrow();
  });
});

describe('all generators handle deep nesting', () => {
  const src = deepNest(20);

  it('HtmlGenerator — 20 levels', () => {
    expect(() => generate(parse(src), new HtmlGenerator())).not.toThrow();
  });

  it('ReactGenerator — 20 levels', () => {
    const out = generate(parse(src), new ReactGenerator());
    expect(out).toContain("React.createElement('span'");
  });

  it('VueGenerator — 20 levels', () => {
    const out = generate(parse(src), new VueGenerator());
    expect(out).toContain('<div>');
    expect(out).toContain('<span>x</span>');
  });

  it('AstroGenerator — 20 levels', () => {
    const out = generate(parse(src), new AstroGenerator({ fragment: false }));
    expect(out).toContain('<div>');
    expect(out).toContain('<span>x</span>');
  });
});

describe('output size sanity', () => {
  it('100-level deep output has exactly 101 open tags and 101 close tags', () => {
    const out = compile(deepNest(100));
    const opens = (out.match(/<div>/g) ?? []).length + (out.match(/<span>/g) ?? []).length;
    const closes = (out.match(/<\/div>/g) ?? []).length + (out.match(/<\/span>/g) ?? []).length;
    expect(opens).toBe(101);  // 100 divs + 1 span
    expect(closes).toBe(101);
  });

  it('1000 siblings output has exactly 1000 elements', () => {
    const out = compile(wideSiblings(1000));
    expect((out.match(/<span>/g) ?? []).length).toBe(1000);
    expect((out.match(/<\/span>/g) ?? []).length).toBe(1000);
  });
});
