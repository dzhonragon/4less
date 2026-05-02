import { describe, it, expect } from 'vitest';
import { compile, ParseError } from '../src/index.js';

describe('self-closing tags', () => {
  it('renders non-void element with no content or children with closing tag', () => {
    expect(compile('div')).toBe('<div></div>');
  });

  it('renders void element with closing self-closing syntax', () => {
    expect(compile('meta charset:"UTF-8"')).toBe('<meta charset="UTF-8"/>');
  });

  it('renders multiple attributes on void element', () => {
    expect(compile('link rel:"stylesheet" href:"style.css"')).toBe(
      '<link rel="stylesheet" href="style.css"/>'
    );
  });
});

describe('text content', () => {
  it('wraps text in opening and closing tags', () => {
    expect(compile('h1 "Hello"')).toBe('<h1>Hello</h1>');
  });

  it('handles text with spaces', () => {
    expect(compile('p "some longer text here"')).toBe('<p>some longer text here</p>');
  });

  it('strips the surrounding quotes from the string literal', () => {
    expect(compile('title "My Page"')).toBe('<title>My Page</title>');
  });
});

describe('attributes with text content', () => {
  it('applies attributes and wraps text content', () => {
    expect(compile('a "Home" href:"/"')).toBe('<a href="/">Home</a>');
  });

  it('handles multiple attributes alongside text content', () => {
    expect(compile('input "label" type:"text" name:"field"')).toBe(
      '<input type="text" name="field">label</input>'
    );
  });
});

describe('nested elements', () => {
  it('renders a single child element inside a parent', () => {
    expect(compile('div { span "text" }')).toBe('<div><span>text</span></div>');
  });

  it('renders multiple child elements', () => {
    expect(compile('div { span "a" span "b" }')).toBe(
      '<div><span>a</span><span>b</span></div>'
    );
  });

  it('renders deeply nested structures', () => {
    expect(compile('div { div { div "nested" } }')).toBe(
      '<div><div><div>nested</div></div></div>'
    );
  });
});

describe('.class and #id shorthands', () => {
  it('renders class shorthand', () => {
    expect(compile('div.box')).toBe('<div class="box"></div>');
  });

  it('renders multiple classes', () => {
    expect(compile('div.box.card')).toBe('<div class="box card"></div>');
  });

  it('renders id shorthand', () => {
    expect(compile('div#app')).toBe('<div id="app"></div>');
  });

  it('renders id and classes together', () => {
    expect(compile('div#app.box.card')).toBe('<div id="app" class="box card"></div>');
  });

  it('renders shorthands with text and attributes', () => {
    expect(compile('a#link.active "Click" href:"#"')).toBe(
      '<a id="link" class="active" href="#">Click</a>'
    );
  });
});

describe('complex structures', () => {
  it('handles the full example from the README', () => {
    expect(compile('div#app.container { h1.title "Hello" p "World" }')).toBe(
      '<div id="app" class="container"><h1 class="title">Hello</h1><p>World</p></div>'
    );
  });

  it('renders sibling elements', () => {
    expect(compile('div { p "one" p "two" p "three" }')).toBe(
      '<div><p>one</p><p>two</p><p>three</p></div>'
    );
  });

  it('handles mixed attributes and shorthands', () => {
    expect(compile('form#signup.form-group { input type:"email" placeholder:"Email" }')).toBe(
      '<form id="signup" class="form-group"><input type="email" placeholder="Email"/></form>'
    );
  });

  it('renders multiple root elements', () => {
    expect(compile('h1 "Title" p "Content"')).toBe('<h1>Title</h1><p>Content</p>');
  });
});

describe('variables', () => {
  it('renders unresolved variable as {{varName}} placeholder', () => {
    expect(compile('p $title')).toBe('<p>{{title}}</p>');
  });

  it('substitutes variable when vars provided', () => {
    expect(compile('h1 $title', { title: 'Hello World' })).toBe('<h1>Hello World</h1>');
  });

  it('substitutes multiple variables', () => {
    expect(compile('p $first " " $last', { first: 'John', last: 'Doe' })).toBe('<p>John Doe</p>');
  });

  it('renders mixed literal and variable', () => {
    expect(compile('p "Hello " $name', { name: 'World' })).toBe('<p>Hello World</p>');
  });

  it('escapes substituted variable values', () => {
    expect(compile('p $content', { content: '<b>bold</b>' })).toBe('<p>&lt;b&gt;bold&lt;/b&gt;</p>');
  });

  it('renders placeholder for missing variable even with other vars provided', () => {
    expect(compile('p $missing', { other: 'value' })).toBe('<p>{{missing}}</p>');
  });

  it('works with nested elements', () => {
    expect(compile('div { h1 $title p $body }', { title: 'Hi', body: 'Content' }))
      .toBe('<div><h1>Hi</h1><p>Content</p></div>');
  });
});

describe('loops', () => {
  it('renders loop placeholder when items not provided', () => {
    expect(compile('ul { for item in items: li $item }')).toBe(
      '<ul>{{for item in items}}</ul>'
    );
  });

  it('renders loop items when array provided', () => {
    expect(compile('ul { for item in items: li $item }', { items: ['a', 'b', 'c'] })).toBe(
      '<ul><li>a</li><li>b</li><li>c</li></ul>'
    );
  });

  it('renders empty array as empty string', () => {
    expect(compile('ul { for item in items: li $item }', { items: [] })).toBe('<ul></ul>');
  });

  it('loop body can have classes and attributes', () => {
    expect(compile('ul { for item in items: li.entry $item }', { items: ['x'] })).toBe(
      '<ul><li class="entry">x</li></ul>'
    );
  });

  it('loop variable resolves independently from outer vars', () => {
    expect(compile('ul { for item in items: li $item }', { items: ['one', 'two'], item: 'ignored' })).toBe(
      '<ul><li>one</li><li>two</li></ul>'
    );
  });

  it('top-level loop renders without wrapper', () => {
    expect(compile('for item in items: p $item', { items: ['x', 'y'] })).toBe(
      '<p>x</p><p>y</p>'
    );
  });
});

describe('conditionals', () => {
  it('renders nothing when condition is false', () => {
    expect(compile('div { if show: p "Hi" }', { show: false })).toBe('<div></div>');
  });

  it('renders body when condition is true', () => {
    expect(compile('div { if show: p "Hi" }', { show: true })).toBe('<div><p>Hi</p></div>');
  });

  it('renders nothing when condition variable is not provided', () => {
    expect(compile('if show: p "Hi"')).toBe('');
  });

  it('renders body when condition is truthy string', () => {
    expect(compile('if title: h1 $title', { title: 'Hello' })).toBe('<h1>Hello</h1>');
  });

  it('renders nothing when condition is empty string', () => {
    expect(compile('if title: h1 "Hi"', { title: '' })).toBe('');
  });

  it('conditional wrapping a loop', () => {
    expect(compile('if hasItems: for item in items: li $item', { hasItems: true, items: ['a', 'b'] })).toBe(
      '<li>a</li><li>b</li>'
    );
  });

  it('conditional wrapping a loop renders nothing when condition false', () => {
    expect(compile('if hasItems: for item in items: li $item', { hasItems: false, items: ['a', 'b'] })).toBe('');
  });

  it('multiple siblings with conditions', () => {
    expect(compile('div { if a: p "A" if b: p "B" }', { a: true, b: false })).toBe('<div><p>A</p></div>');
  });
});

describe('error handling', () => {
  it('reports unexpected closing brace', () => {
    expect(() => compile('{ orphan }')).toThrow(ParseError);
  });

  it('reports unmatched opening brace', () => {
    expect(() => compile('div {')).toThrow(ParseError);
  });

  it('reports unexpected EOF', () => {
    expect(() => compile('div { p "unclosed"')).toThrow(ParseError);
  });

  it('reports invalid syntax with error location', () => {
    const err = new ParseError([
      { line: 1, col: 0, message: "test error" }
    ]);
    expect(err.errors).toHaveLength(1);
    expect(err.errors[0].message).toBe('test error');
  });
});
