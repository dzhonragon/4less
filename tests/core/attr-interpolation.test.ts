/**
 * Comprehensive tests for attribute value interpolation.
 *
 * Attribute values can be:
 *   key:"literal"          → [{kind:'literal', value:'literal'}]
 *   key:"prefix/$var/end"  → [{literal:'prefix/'}, {var:'var'}, {literal:'/end'}]
 *   key:$var               → [{kind:'var', name:'var'}]
 *
 * Each generator produces the appropriate output:
 *   HTML  → substitutes at render time; unresolved vars become {{varName}}
 *   React → static string literal OR JS template literal
 *   Vue   → static attr OR :attr with backtick template
 *   Astro → static attr OR attr={`template`}
 */
import { describe, it, expect } from 'vitest';
import { tokenize } from '../../src/core/lexer.js';
import { buildAst } from '../../src/core/parser.js';
import { compile, parse, generate } from '../../src/index.js';
import { HtmlGenerator }  from '../../src/generators/html.js';
import { ReactGenerator } from '../../src/generators/react.js';
import { VueGenerator }   from '../../src/generators/vue.js';
import { AstroGenerator } from '../../src/generators/astro.js';
import type { ElementNode, TextSegment } from '../../src/core/types.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const seg = (...parts: Array<string | [string]>): TextSegment[] =>
  parts.map(p => Array.isArray(p)
    ? { kind: 'var', name: p[0] }
    : { kind: 'literal', value: p }
  );

const el = (tag: string, attrs: Record<string, TextSegment[]>, overrides: Partial<ElementNode> = {}): ElementNode => ({
  type: 'element', tag, id: null, classes: [], attributes: attrs, text: null, children: [],
  ...overrides,
});

// ── 1. Parser ─────────────────────────────────────────────────────────────────

describe('attribute interpolation — parser', () => {
  it('parses a plain string attribute as a single literal segment', () => {
    const [node] = buildAst(tokenize('a href:"/home"'));
    expect((node as ElementNode).attributes.href).toEqual([{ kind: 'literal', value: '/home' }]);
  });

  it('parses a bare $var attribute as a single var segment', () => {
    const [node] = buildAst(tokenize('img alt:$caption'));
    expect((node as ElementNode).attributes.alt).toEqual([{ kind: 'var', name: 'caption' }]);
  });

  it('parses $var at the start of a string', () => {
    const [node] = buildAst(tokenize('a href:"$base/docs"'));
    expect((node as ElementNode).attributes.href).toEqual([
      { kind: 'var', name: 'base' },
      { kind: 'literal', value: '/docs' },
    ]);
  });

  it('parses $var in the middle of a string', () => {
    const [node] = buildAst(tokenize('a href:"/posts/$slug/edit"'));
    expect((node as ElementNode).attributes.href).toEqual([
      { kind: 'literal', value: '/posts/' },
      { kind: 'var', name: 'slug' },
      { kind: 'literal', value: '/edit' },
    ]);
  });

  it('parses $var at the end of a string', () => {
    const [node] = buildAst(tokenize('img src:"/avatars/$id"'));
    expect((node as ElementNode).attributes.src).toEqual([
      { kind: 'literal', value: '/avatars/' },
      { kind: 'var', name: 'id' },
    ]);
  });

  it('parses multiple $vars in one attribute value', () => {
    const [node] = buildAst(tokenize('a href:"/$lang/posts/$slug"'));
    expect((node as ElementNode).attributes.href).toEqual([
      { kind: 'literal', value: '/' },
      { kind: 'var', name: 'lang' },
      { kind: 'literal', value: '/posts/' },
      { kind: 'var', name: 'slug' },
    ]);
  });

  it('parses a string that is entirely a $var reference', () => {
    const [node] = buildAst(tokenize('a href:"$url"'));
    expect((node as ElementNode).attributes.href).toEqual([{ kind: 'var', name: 'url' }]);
  });

  it('parses multiple attributes, some with vars and some without', () => {
    const [node] = buildAst(tokenize('a href:"/posts/$slug" target:"_blank" id:$linkId'));
    const attrs = (node as ElementNode).attributes;
    expect(attrs.href).toEqual([{ kind: 'literal', value: '/posts/' }, { kind: 'var', name: 'slug' }]);
    expect(attrs.target).toEqual([{ kind: 'literal', value: '_blank' }]);
    expect(attrs.id).toEqual([{ kind: 'var', name: 'linkId' }]);
  });

  it('parses attr interpolation on a void element', () => {
    const [node] = buildAst(tokenize('img src:"/img/$file" alt:$desc'));
    const attrs = (node as ElementNode).attributes;
    expect(attrs.src).toEqual([{ kind: 'literal', value: '/img/' }, { kind: 'var', name: 'file' }]);
    expect(attrs.alt).toEqual([{ kind: 'var', name: 'desc' }]);
  });
});

// ── 2. HtmlGenerator ──────────────────────────────────────────────────────────

describe('attribute interpolation — HtmlGenerator', () => {
  it('renders a plain literal attribute unchanged', () => {
    const gen = new HtmlGenerator();
    expect(gen.generate([el('a', { href: seg('/home') })])).toBe('<a href="/home"></a>');
  });

  it('substitutes a bare $var attr', () => {
    const gen = new HtmlGenerator({ vars: { slug: 'hello-world' } });
    expect(gen.generate([el('a', { href: seg('/', ['slug']) })])).toBe('<a href="/hello-world"></a>');
  });

  it('substitutes $var in the middle of a string attr', () => {
    const gen = new HtmlGenerator({ vars: { slug: 'my-post' } });
    expect(gen.generate([el('a', { href: seg('/posts/', ['slug'], '/edit') })])).toBe('<a href="/posts/my-post/edit"></a>');
  });

  it('substitutes multiple $vars in one attr', () => {
    const gen = new HtmlGenerator({ vars: { lang: 'en', slug: 'intro' } });
    expect(gen.generate([el('a', { href: seg('/', ['lang'], '/posts/', ['slug']) })])).toBe('<a href="/en/posts/intro"></a>');
  });

  it('renders {{varName}} placeholder for unresolved $var in attr', () => {
    const gen = new HtmlGenerator();
    expect(gen.generate([el('a', { href: seg('/posts/', ['slug']) })])).toBe('<a href="/posts/{{slug}}"></a>');
  });

  it('escapes special HTML chars in substituted attr value', () => {
    const gen = new HtmlGenerator({ vars: { q: '<script>&"xss"</script>' } });
    expect(gen.generate([el('a', { href: seg('/search?q=', ['q']) })])).toBe(
      '<a href="/search?q=&lt;script&gt;&amp;&quot;xss&quot;&lt;/script&gt;"></a>'
    );
  });

  it('substitutes attr $var from loop local variable', () => {
    const gen = new HtmlGenerator({ vars: { items: ['a', 'b'] } });
    const loop: import('../../src/core/types.js').LoopNode = {
      type: 'loop', variable: 'item', iterable: 'items',
      body: el('a', { href: seg('/posts/', ['item']) }, { text: [{ kind: 'var', name: 'item' }] }),
    };
    expect(gen.generate([loop])).toBe('<a href="/posts/a">a</a><a href="/posts/b">b</a>');
  });

  it('substitutes attrs inside a component via expand+generate pipeline', () => {
    const html = compile(`
      component Card {
        a $title href:"/posts/$slug"
      }
      Card slug:"hello" title:"Hello post"
    `);
    expect(html).toBe('<a href="/posts/hello">Hello post</a>');
  });

  it('handles mixed static and dynamic attrs on the same element', () => {
    const gen = new HtmlGenerator({ vars: { id: '42' } });
    const node = el('img', {
      src:    seg('/avatars/', ['id'], '.jpg'),
      width:  seg('64'),
      height: seg('64'),
      alt:    seg(['id']),
    });
    expect(gen.generate([node])).toBe('<img src="/avatars/42.jpg" width="64" height="64" alt="42"/>');
  });
});

// ── 3. ReactGenerator ─────────────────────────────────────────────────────────

describe('attribute interpolation — ReactGenerator', () => {
  const gen = new ReactGenerator();

  it('renders a plain literal attr as a JSON string', () => {
    expect(gen.generate([el('a', { href: seg('/home') })])).toBe(
      `React.createElement('a', { href: "/home" })`
    );
  });

  it('renders a single $var attr as a template literal', () => {
    expect(gen.generate([el('a', { href: seg(['slug']) })])).toBe(
      'React.createElement(\'a\', { href: `${slug}` })'
    );
  });

  it('renders prefix + $var as a template literal', () => {
    expect(gen.generate([el('a', { href: seg('/posts/', ['slug']) })])).toBe(
      'React.createElement(\'a\', { href: `/posts/${slug}` })'
    );
  });

  it('renders multiple $vars in one attr as a template literal', () => {
    expect(gen.generate([el('a', { href: seg('/', ['lang'], '/posts/', ['slug']) })])).toBe(
      'React.createElement(\'a\', { href: `/${lang}/posts/${slug}` })'
    );
  });

  it('renders several attrs where only some have $vars', () => {
    expect(gen.generate([el('a', { href: seg('/posts/', ['slug']), target: seg('_blank') })])).toBe(
      'React.createElement(\'a\', { href: `/posts/${slug}`, target: "_blank" })'
    );
  });

  it('renders void element with dynamic attr', () => {
    expect(gen.generate([el('img', { src: seg('/img/', ['file']), alt: seg('photo') })])).toBe(
      'React.createElement(\'img\', { src: `/img/${file}`, alt: "photo" })'
    );
  });

  it('escapes backticks that appear in literal attr segments', () => {
    expect(gen.generate([el('span', { title: seg('he said `hi`') })])).toBe(
      "React.createElement('span', { title: \"he said `hi`\" })"
    );
  });
});

// ── 4. VueGenerator ───────────────────────────────────────────────────────────

describe('attribute interpolation — VueGenerator', () => {
  const gen = new VueGenerator();

  it('renders a plain literal attr as a static attribute', () => {
    expect(gen.generate([el('a', { href: seg('/home') })])).toBe('<a href="/home"></a>');
  });

  it('renders a single $var attr as :attr dynamic binding', () => {
    expect(gen.generate([el('a', { href: seg(['slug']) })])).toBe(
      '<a :href="`${slug}`"></a>'
    );
  });

  it('renders prefix + $var as :attr with template literal', () => {
    expect(gen.generate([el('a', { href: seg('/posts/', ['slug']) })])).toBe(
      '<a :href="`/posts/${slug}`"></a>'
    );
  });

  it('renders multiple $vars in one attr', () => {
    expect(gen.generate([el('a', { href: seg('/', ['lang'], '/posts/', ['slug']) })])).toBe(
      '<a :href="`/${lang}/posts/${slug}`"></a>'
    );
  });

  it('renders mixed static and dynamic attrs correctly', () => {
    expect(gen.generate([el('a', { href: seg('/posts/', ['slug']), target: seg('_blank') })])).toBe(
      '<a :href="`/posts/${slug}`" target="_blank"></a>'
    );
  });

  it('renders void element with dynamic attr', () => {
    expect(gen.generate([el('img', { src: seg('/img/', ['file']), alt: seg('photo') })])).toBe(
      '<img :src="`/img/${file}`" alt="photo"/>'
    );
  });
});

// ── 5. AstroGenerator ────────────────────────────────────────────────────────

describe('attribute interpolation — AstroGenerator', () => {
  const gen = new AstroGenerator();

  it('renders a plain literal attr as a static attribute', () => {
    expect(gen.generate([el('a', { href: seg('/home') })])).toBe('<a href="/home"></a>');
  });

  it('renders a single $var attr as a JSX template expression', () => {
    expect(gen.generate([el('a', { href: seg(['slug']) })])).toBe(
      '<a href={`${slug}`}></a>'
    );
  });

  it('renders prefix + $var as JSX template expression', () => {
    expect(gen.generate([el('a', { href: seg('/posts/', ['slug']) })])).toBe(
      '<a href={`/posts/${slug}`}></a>'
    );
  });

  it('renders multiple $vars in one attr', () => {
    expect(gen.generate([el('a', { href: seg('/', ['lang'], '/posts/', ['slug']) })])).toBe(
      '<a href={`/${lang}/posts/${slug}`}></a>'
    );
  });

  it('renders mixed static and dynamic attrs', () => {
    expect(gen.generate([el('a', { href: seg('/posts/', ['slug']), target: seg('_blank') })])).toBe(
      '<a href={`/posts/${slug}`} target="_blank"></a>'
    );
  });

  it('renders void element with dynamic attr using JSX self-close', () => {
    expect(gen.generate([el('img', { src: seg('/img/', ['file']), alt: seg('photo') })])).toBe(
      '<img src={`/img/${file}`} alt="photo" />'
    );
  });
});

// ── 6. End-to-end via compile() ───────────────────────────────────────────────

describe('attribute interpolation — end-to-end (compile)', () => {
  it('substitutes a single $var in href', () => {
    expect(compile('a "Post" href:"/posts/$slug"', { slug: 'hello-world' }))
      .toBe('<a href="/posts/hello-world">Post</a>');
  });

  it('substitutes multiple $vars in the same attr', () => {
    expect(compile('a "Page" href:"/$lang/posts/$slug"', { lang: 'en', slug: 'intro' }))
      .toBe('<a href="/en/posts/intro">Page</a>');
  });

  it('substitutes bare $var attr', () => {
    expect(compile('img src:"/img/photo.jpg" alt:$caption', { caption: 'Sunset' }))
      .toBe('<img src="/img/photo.jpg" alt="Sunset"/>');
  });

  it('substitutes attr $var inside a loop', () => {
    const html = compile(
      'ul { for p in posts: li { a $p href:"/posts/$p" } }',
      { posts: ['alpha', 'beta'] }
    );
    expect(html).toBe('<ul><li><a href="/posts/alpha">alpha</a></li><li><a href="/posts/beta">beta</a></li></ul>');
  });

  it('substitutes attr $var from component prop', () => {
    const html = compile(`
      component NavLink {
        a $label href:"/$path"
      }
      NavLink label:"Home" path:"home"
      NavLink label:"Docs" path:"docs"
    `);
    expect(html).toBe('<a href="/home">Home</a><a href="/docs">Docs</a>');
  });

  it('escapes special chars in substituted attr value', () => {
    expect(compile('a href:"/search?q=$q"', { q: 'a<b>&c' }))
      .toBe('<a href="/search?q=a&lt;b&gt;&amp;c"></a>');
  });

  it('renders {{varName}} placeholder when var is missing', () => {
    expect(compile('a href:"/posts/$slug"'))
      .toBe('<a href="/posts/{{slug}}"></a>');
  });

  it('handles attr-only interpolation with no text content', () => {
    const html = compile('input type:"text" value:$current', { current: 'hello' });
    expect(html).toBe('<input type="text" value="hello"/>');
  });

  it('generates correct React output via generate()', () => {
    const ast = parse('a "Go" href:"/posts/$slug"');
    const out = generate(ast, new ReactGenerator());
    expect(out).toBe('React.createElement(\'a\', { href: `/posts/${slug}` }, "Go")');
  });

  it('generates correct Vue output via generate()', () => {
    const ast = parse('a "Go" href:"/posts/$slug"');
    const out = generate(ast, new VueGenerator());
    expect(out).toBe('<a :href="`/posts/${slug}`">Go</a>');
  });

  it('generates correct Astro output via generate()', () => {
    const ast = parse('a "Go" href:"/posts/$slug"');
    const out = generate(ast, new AstroGenerator());
    expect(out).toBe('<a href={`/posts/${slug}`}>Go</a>');
  });
});
