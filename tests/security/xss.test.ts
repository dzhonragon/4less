import { describe, it, expect } from 'vitest';
import { compile, generate, parse, HtmlGenerator, VueGenerator, AstroGenerator } from '../../src/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const html = (input: string, vars?: Record<string, unknown>) =>
  compile(input, vars as Parameters<typeof compile>[1]);

const vue = (input: string) =>
  generate(parse(input), new VueGenerator());

const astro = (input: string) =>
  generate(parse(input), new AstroGenerator({ fragment: false }));

// ---------------------------------------------------------------------------
// C1 — XSS & Injection Prevention
// ---------------------------------------------------------------------------

describe('text content — HTML special chars', () => {
  it('escapes < in literal text', () => {
    expect(html('p "<b>bold</b>"')).toBe('<p>&lt;b&gt;bold&lt;/b&gt;</p>');
  });

  it('escapes & in literal text', () => {
    expect(html('p "R&D"')).toBe('<p>R&amp;D</p>');
  });

  it('escapes > in literal text', () => {
    expect(html('p "a > b"')).toBe('<p>a &gt; b</p>');
  });

  it('escapes all three chars in one string', () => {
    expect(html('p "<a>R&D</a>"')).toBe('<p>&lt;a&gt;R&amp;D&lt;/a&gt;</p>');
  });

  it('prevents HTML comment injection', () => {
    const out = html('p "--><!-- injected"');
    expect(out).not.toContain('<!--');
    expect(out).toContain('--&gt;');
  });

  it('prevents CDATA-end injection', () => {
    const out = html('p "]]>"');
    expect(out).toContain(']]&gt;');
  });
});

describe('attribute value escaping', () => {
  it('escapes < and > in attribute values', () => {
    const out = html('a title:"<click>"');
    expect(out).toContain('title="&lt;click&gt;"');
    expect(out).not.toContain('title="<click>"');
  });

  it('escapes & in attribute values', () => {
    const out = html('a title:"R&D"');
    expect(out).toContain('title="R&amp;D"');
  });

  it('escapes " in attribute values', () => {
    const out = html('a onclick:"alert(&quot;xss&quot;)"');
    expect(out).not.toContain('onclick="alert("xss")"');
  });

  it('escapes < in id shorthand — but lexer only accepts [a-zA-Z0-9_-] so this tests the boundary', () => {
    // id/class come from the DSL source via lexer which accepts [a-zA-Z_][a-zA-Z0-9_-]*
    // so special chars can't appear in id/class — confirm parse error
    expect(() => parse('div#<bad>')).toThrow();
  });
});

describe('variable injection — text content', () => {
  it('escapes < and > from variable value', () => {
    expect(html('p $v', { v: '<script>alert(1)</script>' }))
      .toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('escapes & from variable value', () => {
    expect(html('p $v', { v: 'Tom & Jerry' })).toBe('<p>Tom &amp; Jerry</p>');
  });

  it('escapes full XSS payload in variable', () => {
    const xss = '"><img src=x onerror=alert(1)>';
    const out = html('p $v', { v: xss });
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
  });

  it('double-encodes pre-encoded entities (correct behavior — treat input as raw text)', () => {
    // If caller passes "&amp;" the output should be "&amp;amp;" — it is raw text, not HTML
    expect(html('p $v', { v: '&amp;' })).toBe('<p>&amp;amp;</p>');
  });

  it('escapes variable in mixed text segment', () => {
    expect(html('p "Hello " $name', { name: '<b>World</b>' }))
      .toBe('<p>Hello &lt;b&gt;World&lt;/b&gt;</p>');
  });

  it('undefined variable renders as {{placeholder}} which is safe (no HTML)', () => {
    const out = html('p $missing');
    expect(out).toBe('<p>{{missing}}</p>');
    expect(out).not.toContain('<script');
  });
});

describe('variable injection — loop items', () => {
  it('escapes script tag in loop items', () => {
    const out = html('ul { for item in items: li $item }', {
      items: ['<script>alert(1)</script>', 'safe'],
    });
    expect(out).not.toContain('<script');
    expect(out).toContain('&lt;script&gt;');
    expect(out).toContain('<li>safe</li>');
  });

  it('escapes & in loop items', () => {
    const out = html('ul { for item in items: li $item }', {
      items: ['R&D', 'A&B'],
    });
    expect(out).toBe('<ul><li>R&amp;D</li><li>A&amp;B</li></ul>');
  });

  it('escapes full HTML injection in loop items', () => {
    const payload = '"><script>xss</script>';
    const out = html('ul { for item in items: li $item }', { items: [payload] });
    expect(out).not.toContain('<script');
    expect(out).toContain('&lt;script&gt;');
  });
});

describe('component prop injection', () => {
  it('props are string literals from DSL source — not user-controlled', () => {
    // Props come from the template author, but after expansion they become
    // TextSegment literals and go through escapeHtml.
    // "<b>" in a component prop defined by the author would be escaped.
    const out = html('component Tag { span $label } Tag label:"<b>bold</b>"');
    expect(out).toBe('<span>&lt;b&gt;bold&lt;/b&gt;</span>');
  });

  it('& in component prop is escaped', () => {
    const out = html('component Tag { span $label } Tag label:"R&D"');
    expect(out).toBe('<span>R&amp;D</span>');
  });
});

describe('Vue generator literal escaping', () => {
  it('escapes < in literal text for Vue output', () => {
    expect(vue('p "<b>test</b>"')).toBe('<p>&lt;b&gt;test&lt;/b&gt;</p>');
  });

  it('escapes & in literal text for Vue output', () => {
    expect(vue('p "Tom & Jerry"')).toBe('<p>Tom &amp; Jerry</p>');
  });

  it('uses {{ var }} for variables — Vue runtime handles escaping', () => {
    expect(vue('p $name')).toBe('<p>{{ name }}</p>');
  });
});

describe('Astro generator literal escaping', () => {
  it('escapes < in literal text for Astro output', () => {
    expect(astro('p "<b>test</b>"')).toBe('<p>&lt;b&gt;test&lt;/b&gt;</p>');
  });

  it('escapes & in literal text for Astro output', () => {
    expect(astro('p "Tom & Jerry"')).toBe('<p>Tom &amp; Jerry</p>');
  });

  it('uses {var} for variables — Astro runtime handles escaping', () => {
    expect(astro('p $name')).toBe('<p>{name}</p>');
  });
});

describe('combined attack vectors', () => {
  it('escapes XSS across multiple elements', () => {
    const out = html(
      'div { h1 $title p $body }',
      { title: '<script>xss</script>', body: '"><img src=x>' },
    );
    expect(out).not.toContain('<script');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;script&gt;');
    expect(out).toContain('&lt;img');
  });

  it('escapes XSS in nested loop inside conditional', () => {
    const out = html(
      'div { if show: div { for item in items: li $item } }',
      { show: true, items: ['<script>bad</script>', 'ok'] },
    );
    expect(out).not.toContain('<script');
    expect(out).toContain('&lt;script&gt;');
    expect(out).toContain('<li>ok</li>');
  });

  it('escapes XSS in component used inside conditional', () => {
    const out = html(
      'component Alert { div.alert $msg } if show: Alert msg:"<b>danger</b>"',
      { show: true },
    );
    expect(out).toBe('<div class="alert">&lt;b&gt;danger&lt;/b&gt;</div>');
  });
});
