# 4less

[![CI](https://github.com/dzhonragon/4less/actions/workflows/ci.yml/badge.svg)](https://github.com/dzhonragon/4less/actions/workflows/ci.yml)

HTML with less noise.

```
div#app.container {
  h1.title "Hello"
  p "World"
  a "Docs" href:"/docs"
}
```

```html
<div id="app" class="container">
  <h1 class="title">Hello</h1>
  <p>World</p>
  <a href="/docs">Docs</a>
</div>
```

A minimal compiler with zero runtime dependencies. Lexer and parser are handwritten in TypeScript. Output is pluggable through generators.

## Install

```bash
npm install l3ssy
```

Node 20+ required. No build step needed for the runtime.

## Setup (dev)

```bash
npm install
npm test
```

---

## API

### `compile(input)`

Compile 4less source to HTML. This is the main entry point for most use cases.

```ts
import { compile } from '@dzhonragon/4less';

compile('h1 "Hello"');                   // <h1>Hello</h1>
compile('meta charset:"UTF-8"');         // <meta charset="UTF-8"/>
compile('div.box { p "hi" }');           // <div class="box"><p>hi</p></div>
```

Throws `ParseError` on invalid input. Each error includes `line`, `col`, and `message`.

---

### `parse(input)`

Parse 4less source into an AST. Use this when you want to process the tree yourself.

```ts
import { parse } from '@dzhonragon/4less';

const ast = parse('a "Docs" href:"/docs"');
// [
//   {
//     type: 'element',
//     tag: 'a',
//     id: null,
//     classes: [],
//     attributes: { href: '/docs' },
//     text: 'Docs',
//     children: []
//   }
// ]
```

---

### `generate(ast, generator)`

Convert an AST to a string using any generator.

```ts
import { parse, generate, HtmlGenerator, JsonGenerator, ReactGenerator } from '4less';

const ast = parse('div.container { p "Hello" }');

generate(ast, new HtmlGenerator());
// <div class="container"><p>Hello</p></div>

generate(ast, new JsonGenerator());
// [ { "type": "element", "tag": "div", ... } ]

generate(ast, new ReactGenerator());
// React.createElement('div', { className: "container" }, React.createElement('p', null, "Hello"))
```

---

## Built-in Generators

### `HtmlGenerator`

Produces HTML5-compliant output:
- Void elements (`meta`, `br`, `input`, `link`, etc.) render as self-closing
- All other empty elements render with opening and closing tags
- Text content and attribute values are HTML-escaped

```ts
import { compile } from '4less';

compile('meta charset:"UTF-8"');     // <meta charset="UTF-8"/>
compile('div');                      // <div></div>
compile('p "<script>"');             // <p>&lt;script&gt;</p>
```

---

### `JsonGenerator`

Serializes the AST as a JSON array. Useful for tooling, analysis, or passing the tree across process boundaries.

```ts
import { parse, generate, JsonGenerator } from '4less';

generate(parse('h1 "Title"'), new JsonGenerator());
// [{ "type": "element", "tag": "h1", "text": "Title", ... }]

// Configurable indentation (default: 2)
new JsonGenerator(4)
new JsonGenerator(0) // minified
```

---

### `ReactGenerator`

Produces `React.createElement()` calls. No JSX transpiler required.

```ts
import { parse, generate, ReactGenerator } from '4less';

const gen = new ReactGenerator();

generate(parse('h1 "Hello"'), gen);
// React.createElement('h1', null, "Hello")

generate(parse('div.box { p "Hi" }'), gen);
// React.createElement('div', { className: "box" }, React.createElement('p', null, "Hi"))

generate(parse('h1 "A" p "B"'), gen);
// React.createElement(React.Fragment, null,
//   React.createElement('h1', null, "A"),
//   React.createElement('p', null, "B")
// )
```

HTML → React prop name mappings are handled automatically (`class` → `className`, `for` → `htmlFor`, `tabindex` → `tabIndex`, etc.).

---

### `VueGenerator`

Produces Vue 3 template-compatible HTML. Valid inside `<template>` blocks. Supports `v-for` and `v-if` directives.

```ts
import { parse, generate, VueGenerator } from '4less';

const ast = parse('div.box { p $title }');
generate(ast, new VueGenerator());
// <div class="box"><p>{{ title }}</p></div>

// Loops and conditionals use Vue directives
generate(parse('for item in items: li $item'), new VueGenerator());
// <li v-for="item in items">{{ item }}</li>

generate(parse('if show: p "Hi"'), new VueGenerator());
// <p v-if="show">Hi</p>
```

---

### `AstroGenerator`

Produces Astro component syntax with optional frontmatter and JSX expressions.

```ts
import { parse, generate, AstroGenerator } from '4less';

const gen = new AstroGenerator({ frontmatter: 'const title = "Page";' });
const ast = parse('h1 $title');
generate(ast, gen);
// ---
// const title = "Page";
// ---
// <h1>{title}</h1>

// Loops use .map() and conditionals use &&
generate(parse('for item in items: li $item'), new AstroGenerator());
// {items.map((item) => <li>{item}</li>)}

generate(parse('if show: div "visible"'), new AstroGenerator());
// {show && <div>visible</div>}
```

---

## Syntax

### Basic Elements

```
tag                          <tag></tag>
tag "text"                   <tag>text</tag>
tag attr:"value"             <tag attr="value"/>
tag "text" attr:"value"      <tag attr="value">text</tag>
tag.class                    <tag class="class"></tag>
tag#id                       <tag id="id"></tag>
tag#id.foo.bar               <tag id="id" class="foo bar"></tag>
tag { child }                <tag><child/></tag>
```

### Variables

Reference values from a `vars` map:

```ts
compile('p $name', { name: 'Alice' });
// <p>Alice</p>

compile('p "Hello " $name', { name: 'Bob' });
// <p>Hello Bob</p>
```

### Loops

Iterate over arrays:

```ts
compile('ul { for item in items: li $item }', { items: ['a', 'b', 'c'] });
// <ul><li>a</li><li>b</li><li>c</li></ul>

// Each generator emits native idiom:
// React:  items.map((item) => React.createElement('li', null, item))
// Vue:    <li v-for="item in items">{{ item }}</li>
// Astro:  {items.map((item) => <li>{item}</li>)}
```

### Conditionals

Show/hide based on truthiness:

```ts
compile('if show: p "visible"', { show: true });
// <p>visible</p>

compile('if show: p "visible"', { show: false });
// (empty string)

// Each generator emits native idiom:
// React:  show ? React.createElement('p', null, "visible") : null
// Vue:    <p v-if="show">visible</p>
// Astro:  {show && <p>visible</p>}
```

### Order & Precedence

Within an element: `tag shorthands? text? attributes? { children }?`

When rendering: **children** > **text** > **self-closing**

---

## CLI

```bash
# pipe from stdin
echo 'h1 "Hello"' | npx 4less

# compile a file
npx 4less page.4l

# write to file
npx 4less page.4l -o page.html

# watch mode
npx 4less page.4l -o page.html --watch

# output as JSON
npx 4less page.4l --format json

# help
npx 4less --help
```

---

## Error Reporting

Parse errors include location info:

```bash
$ echo '{ orphan }' | npx 4less
line 1:0 extraneous input '}' expecting {<EOF>, ID}
```

In code:

```ts
import { compile, ParseError } from '4less';

try {
  compile('{ bad }');
} catch (err) {
  if (err instanceof ParseError) {
    err.errors.forEach(e => {
      console.error(`line ${e.line}:${e.col} — ${e.message}`);
    });
  }
}
```

---

## Custom Generators

Extend `BaseGenerator` to create your own output format. The `generate(nodes)` method receives the full AST.

```ts
import { BaseGenerator, parse, generate } from '4less';
import type { ElementNode } from '4less';

class MarkdownGenerator extends BaseGenerator {
  generate(nodes: ElementNode[]): string {
    return nodes.map(n => this.renderNode(n)).join('\n');
  }

  private renderNode(node: ElementNode): string {
    switch (node.tag) {
      case 'h1': return `# ${node.text ?? ''}`;
      case 'h2': return `## ${node.text ?? ''}`;
      case 'h3': return `### ${node.text ?? ''}`;
      case 'p':  return node.text ?? '';
      case 'a':  return `[${node.text ?? ''}](${node.attributes.href ?? ''})`;
      default:   return node.children.map(c => this.renderNode(c)).join('\n');
    }
  }
}

const ast = parse('h1 "Hello" p "World" a "Docs" href:"/docs"');
generate(ast, new MarkdownGenerator());
// # Hello
// World
// [Docs](/docs)
```

---

## `ElementNode` Shape

Every node in the AST has this shape:

```ts
interface ElementNode {
  type: 'element';
  tag: string;                      // e.g. 'div', 'h1', 'meta'
  id: string | null;                // from #id shorthand
  classes: string[];                // from .class shorthands
  attributes: Record<string, string>; // from key:"value" pairs
  text: string | null;              // from "string literal"
  children: ElementNode[];          // from { ... } block
}
```

**Precedence** when rendering: `children > text > self-closing`.

---

## How It Works

```
Input string
  → tokenize()    [core/lexer.ts]    → Token[]
  → buildAst()    [core/parser.ts]   → ElementNode[]
  → generator     [generators/*.ts]  → string
```

1. **Lexer** converts raw text into tokens (`ID`, `STRING`, `DOT`, `HASH`, `COLON`, `LBRACE`, `RBRACE`)
2. **Parser** builds an AST using recursive descent
3. **Generator** walks the AST and produces output — HTML, JSON, React, or anything you implement

---

## Tests

```bash
npm test
```

173 tests covering lexer, parser, all generators (HTML, JSON, React, Vue, Astro), loops, conditionals, variables, and the full pipeline.

---

## License

MIT
