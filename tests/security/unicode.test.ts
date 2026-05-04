import { describe, it, expect } from 'vitest';
import { compile, generate, parse, ParseError, HtmlGenerator, ReactGenerator, VueGenerator, AstroGenerator } from '../../src/index.js';

const html = (input: string, vars?: Parameters<typeof compile>[1]) => compile(input, vars);
const vue  = (input: string) => generate(parse(input), new VueGenerator());
const astro = (input: string) => generate(parse(input), new AstroGenerator({ fragment: false }));
const react = (input: string) => generate(parse(input), new ReactGenerator());

// ---------------------------------------------------------------------------
// C1.2 — Unicode & Multibyte Characters
// ---------------------------------------------------------------------------

describe('Unicode in string literals (DSL source)', () => {
  it('CJK characters pass through unchanged', () => {
    expect(html('p "你好世界"')).toBe('<p>你好世界</p>');
  });

  it('Arabic (RTL) text passes through unchanged', () => {
    expect(html('p "مرحبا بالعالم"')).toBe('<p>مرحبا بالعالم</p>');
  });

  it('Hebrew (RTL) text passes through unchanged', () => {
    expect(html('p "שלום עולם"')).toBe('<p>שלום עולם</p>');
  });

  it('emoji (BMP plane) passes through unchanged', () => {
    expect(html('p "Hello 🌍"')).toBe('<p>Hello 🌍</p>');
  });

  it('emoji with skin-tone modifier (multi-codepoint) stays intact', () => {
    // 👋🏾 = U+1F44B + U+1F3FE (waving hand + medium-dark skin tone)
    expect(html('p "👋🏾"')).toBe('<p>👋🏾</p>');
  });

  it('family emoji with ZWJ sequence stays intact', () => {
    // 👨‍👩‍👧‍👦 = four codepoints joined by ZWJ (U+200D)
    expect(html('p "👨‍👩‍👧‍👦"')).toBe('<p>👨‍👩‍👧‍👦</p>');
  });

  it('combining marks (NFD form) pass through unchanged', () => {
    // 'café' with e + combining acute accent (U+0301) — NFD form
    const nfd = 'café';
    expect(html(`p "${nfd}"`)).toBe(`<p>${nfd}</p>`);
  });

  it('precomposed accented characters (NFC form) pass through unchanged', () => {
    // 'café' with precomposed é (U+00E9) — NFC form
    expect(html('p "café"')).toBe('<p>café</p>');
  });

  it('math and Greek symbols pass through unchanged', () => {
    expect(html('p "α + β = γ"')).toBe('<p>α + β = γ</p>');
  });

  it('zero-width space (U+200B) passes through unchanged', () => {
    expect(html('p "a​b"')).toBe('<p>a​b</p>');
  });

  it('non-breaking space (U+00A0) passes through unchanged', () => {
    expect(html('p "a b"')).toBe('<p>a b</p>');
  });

  it('mixed Unicode and HTML-unsafe chars: HTML chars are escaped, Unicode is not', () => {
    expect(html('p "<b>你好</b>"')).toBe('<p>&lt;b&gt;你好&lt;/b&gt;</p>');
  });

  it('mixed emoji and HTML-unsafe chars', () => {
    expect(html('p "<🎉>"')).toBe('<p>&lt;🎉&gt;</p>');
  });
});

describe('Unicode in variable values', () => {
  it('CJK characters in variable', () => {
    expect(html('p $v', { v: '你好世界' })).toBe('<p>你好世界</p>');
  });

  it('Arabic in variable', () => {
    expect(html('p $v', { v: 'مرحبا' })).toBe('<p>مرحبا</p>');
  });

  it('emoji in variable', () => {
    expect(html('p $v', { v: '🎉🎊🎈' })).toBe('<p>🎉🎊🎈</p>');
  });

  it('multi-codepoint emoji in variable stays intact', () => {
    expect(html('p $v', { v: '👨‍👩‍👧‍👦' })).toBe('<p>👨‍👩‍👧‍👦</p>');
  });

  it('Unicode with HTML-unsafe chars — HTML chars escaped, Unicode preserved', () => {
    expect(html('p $v', { v: '<b>你好</b>' }))
      .toBe('<p>&lt;b&gt;你好&lt;/b&gt;</p>');
  });

  it('ampersand in Unicode context', () => {
    expect(html('p $v', { v: 'R&D — 研发部' })).toBe('<p>R&amp;D — 研发部</p>');
  });

  it('emoji in variable mixed with HTML injection attempt', () => {
    expect(html('p $v', { v: '🔥<script>alert(1)</script>🔥' }))
      .toBe('<p>🔥&lt;script&gt;alert(1)&lt;/script&gt;🔥</p>');
  });
});

describe('Unicode in attribute values (DSL source)', () => {
  it('CJK in title attribute', () => {
    const out = html('span title:"日本語"');
    expect(out).toContain('title="日本語"');
  });

  it('emoji in title attribute', () => {
    const out = html('span title:"🎉 Party"');
    expect(out).toContain('title="🎉 Party"');
  });

  it('Arabic in placeholder attribute', () => {
    const out = html('input placeholder:"اكتب هنا"');
    expect(out).toContain('placeholder="اكتب هنا"');
  });

  it('Unicode with HTML-unsafe chars in attribute value', () => {
    const out = html('span title:"<你好>"');
    expect(out).toContain('title="&lt;你好&gt;"');
  });

  it('& in Unicode attribute value is escaped', () => {
    const out = html('span title:"R&D — 研发"');
    expect(out).toContain('title="R&amp;D — 研发"');
  });
});

describe('Unicode in loop items', () => {
  it('CJK items in loop', () => {
    const out = html('ul { for item in items: li $item }', {
      items: ['你好', '世界'],
    });
    expect(out).toBe('<ul><li>你好</li><li>世界</li></ul>');
  });

  it('emoji items in loop', () => {
    const out = html('ul { for item in items: li $item }', {
      items: ['🍎', '🍊', '🍋'],
    });
    expect(out).toBe('<ul><li>🍎</li><li>🍊</li><li>🍋</li></ul>');
  });

  it('mixed Unicode and HTML-unsafe chars in loop items are escaped', () => {
    const out = html('ul { for item in items: li $item }', {
      items: ['<b>你好</b>', '🔥 & 水'],
    });
    expect(out).toBe('<ul><li>&lt;b&gt;你好&lt;/b&gt;</li><li>🔥 &amp; 水</li></ul>');
  });
});

describe('Unicode in all generators', () => {
  const src = 'h1 "你好 🌍"';

  it('HtmlGenerator preserves Unicode', () => {
    expect(html(src)).toBe('<h1>你好 🌍</h1>');
  });

  it('VueGenerator preserves Unicode', () => {
    expect(vue(src)).toBe('<h1>你好 🌍</h1>');
  });

  it('AstroGenerator preserves Unicode', () => {
    expect(astro(src)).toBe('<h1>你好 🌍</h1>');
  });

  it('ReactGenerator preserves Unicode in JSON.stringify (double quotes)', () => {
    const out = react('p "你好"');
    expect(out).toContain('你好');
  });
});

describe('Unicode line terminators in strings', () => {
  it('U+2028 (line separator) inside a string literal passes through', () => {
    // The lexer STRING pattern [^"\r\n]* only excludes ASCII \r and \n —
    // U+2028 is matched and preserved.
    const input = 'p "line sep"';
    const out = html(input);
    expect(out).toBe('<p>line sep</p>');
  });

  it('U+2029 (paragraph separator) inside a string literal passes through', () => {
    const input = 'p "para sep"';
    const out = html(input);
    expect(out).toBe('<p>para sep</p>');
  });

  it('ASCII \\r\\n in top-level DSL is treated as whitespace (lexer skips WS)', () => {
    expect(html('h1 "Title"\r\np "Body"')).toBe('<h1>Title</h1><p>Body</p>');
  });
});

describe('Unicode boundary: lexer identifier restrictions', () => {
  it('Unicode cannot appear in tag names (lexer rejects non-ASCII identifiers)', () => {
    // The ID pattern is [a-zA-Z_][a-zA-Z0-9_-]* — no Unicode
    expect(() => parse('你好 "text"')).toThrow(ParseError);
  });

  it('Unicode cannot appear in variable names ($var must be ASCII)', () => {
    expect(() => parse('p $你好')).toThrow(ParseError);
  });

  it('Unicode cannot appear in class shorthand', () => {
    expect(() => parse('div.你好')).toThrow(ParseError);
  });
});
