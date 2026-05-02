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
<div id="app" class="container"><h1 class="title">Hello</h1><p>World</p><a href="/docs">Docs</a></div>
```

A minimal compiler with zero dependencies. Lexer and parser are handwritten for simplicity and portability.

## Setup

Node 20+ required. No build step needed.

```bash
npm install
npm test
```

## API

```js
import { parseInput } from './src/index.js';

parseInput('h1 "Hello"');             // <h1>Hello</h1>
parseInput('meta charset:"UTF-8"');   // <meta charset="UTF-8"/>
parseInput('div.box { p "hi" }');     // <div class="box"><p>hi</p></div>
```

`parseInput` throws a `ParseError` on invalid input. Each error includes line and column info.

## CLI

```bash
echo 'h1 "Hello"' | node src/cli.js           # pipe to stdout
node src/cli.js page.4l -o page.html           # compile to file
node src/cli.js page.4l -o page.html --watch   # recompile on save
node src/cli.js --help
```

## Syntax

```
tag                          <tag/>
tag "text"                   <tag>text</tag>
tag attr:"value"             <tag attr="value"/>
tag "text" attr:"value"      <tag attr="value">text</tag>
tag.class                    <tag class="class"/>
tag#id                       <tag id="id"/>
tag#id.foo.bar               <tag id="id" class="foo bar"/>
tag { child }                <tag><child/></tag>
```

Order within an element: `tag shorthands? text? attributes? { children }?`

## Error reporting

Invalid input prints specific errors with location info:

```
$ echo '{ orphan }' | node src/cli.js
line 1:0 extraneous input '{' expecting {<EOF>, ID}
```

## How it works

1. **Lexer** tokenizes input
2. **Parser** builds an Abstract Syntax Tree (AST)
3. **Generator** walks the AST and emits output (HTML, JSON, or custom format)

```js
import { parse, generate, HtmlGenerator } from '4less';

const ast = parse('div { p "Hello" }');
const html = generate(ast, HtmlGenerator);
```

Create custom generators by extending the `generate()` API.

## Tests

```bash
npm test
```

26 tests across self-closing tags, text content, attributes, `.class` and `#id` shorthands, nesting, siblings, full document structures, and error cases. Runs with [Vitest](https://vitest.dev/).

## License

MIT
