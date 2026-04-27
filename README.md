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

A small compiler built on an [ANTLR4](https://www.antlr.org/) grammar. The grammar defines the syntax in one `.g4` file, ANTLR4 generates the lexer and parser, and a visitor walks the parse tree to produce HTML strings.

## Setup

You need Java to run the ANTLR4 tool (generates the lexer/parser from the grammar, done once). Everything else is Node 20+.

```bash
npm install
npm run generate
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

1. Input is tokenized by `GrammarLexer` into a `CommonTokenStream`
2. `GrammarParser` builds a parse tree from the token stream
3. `HtmlGenerator` (a visitor) walks the tree and emits HTML node by node

The only source of truth for the syntax is `src/parser/Grammar.g4`. Change it, run `npm run generate`, and the lexer/parser/visitor update automatically.

## Tests

```bash
npm test
```

26 tests across self-closing tags, text content, attributes, `.class` and `#id` shorthands, nesting, siblings, full document structures, and error cases. Runs with [Vitest](https://vitest.dev/).

## License

MIT
