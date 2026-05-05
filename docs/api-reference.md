---
title: API Reference
description: TypeScript API for compiling, parsing, and generating 4less templates.
order: 3
---

## compile()

The highest-level entry point. Parses a 4less string, expands components, and emits HTML in one call.

```ts
import { compile } from '@dzhonragon/4less';

compile(source: string, vars?: VarsMap): string
```

`VarsMap` is `Record<string, string | string[] | boolean>`. Pass it directly as the second argument:

```ts
const html = compile(
  `ul { for item in stack: li $item }`,
  { stack: ['TypeScript', 'React'] }
);
// → <ul><li>TypeScript</li><li>React</li></ul>
```

## parse()

Tokenizes and parses source text into an AST. Use when you want to inspect or transform the tree before generating output.

```ts
import { parse } from '@dzhonragon/4less';

parse(source: string): AstNode[]
```

Returns an array of `AstNode`. Throws `ParseError` on invalid syntax.

```ts
const ast = parse(`
  component Badge { span.badge $label }
  Badge label:"stable"
`);
// ast[0].type === 'component_def'
// ast[1].type === 'component_call'
```

## generate()

Walks an AST with a generator instance to produce output. Pair with `parse()` for full control over the pipeline.

```ts
import { parse, generate, HtmlGenerator } from '@dzhonragon/4less';

generate(ast: AstNode[], generator: BaseGenerator): string
```

```ts
const ast  = parse(`div { h1 "Hello" p "World" }`);
const html = generate(ast, new HtmlGenerator());
// → <div><h1>Hello</h1><p>World</p></div>
```

## Generators

All generators extend `BaseGenerator`. Import from the main package entry point:

```ts
import {
  HtmlGenerator,
  ReactGenerator,
  VueGenerator,
  AstroGenerator,
  JsonGenerator,
} from '@dzhonragon/4less';
```

### HtmlGenerator

Renders to plain HTML strings. Used by `compile()` internally.

```ts
new HtmlGenerator(options?: { vars?: VarsMap })
```

```ts
generate(ast, new HtmlGenerator({ vars: { name: 'Alice', admin: true } }));
```

### ReactGenerator

Renders to `React.createElement()` calls. No JSX, no transpiler required.

```ts
new ReactGenerator()
```

```ts
generate(parse(`if show: p $msg`), new ReactGenerator());
// → show ? React.createElement('p', null, msg) : null
```

Dynamic attributes emit template literals:

```ts
generate(parse(`a "Go" href:"/posts/$slug"`), new ReactGenerator());
// → React.createElement('a', { href: `/posts/${slug}` }, "Go")
```

### VueGenerator

Renders to Vue template syntax with `v-for`, `v-if`, `v-else-if`, and `v-else` directives.

```ts
new VueGenerator()
```

```ts
generate(parse(`ul { for item in list: li $item }`), new VueGenerator());
// → <ul><li v-for="item in list" :key="item">{{ item }}</li></ul>
```

Dynamic attributes use `:attr` bindings:

```ts
generate(parse(`a "Go" href:"/posts/$slug"`), new VueGenerator());
// → <a :href="`/posts/${slug}`">Go</a>
```

### AstroGenerator

Renders to Astro component template syntax.

```ts
new AstroGenerator(options?: {
  frontmatter?: string;  // content placed in the --- frontmatter block
  fragment?: boolean;    // wrap multiple roots in <> (default: true)
})
```

```ts
generate(parse(`if show: p $msg`), new AstroGenerator());
// → {show && <p>{msg}</p>}

generate(parse(`if show: p "yes" else: p "no"`), new AstroGenerator());
// → {show ? <p>yes</p> : <p>no</p>}
```

Dynamic attributes emit JSX template literals:

```ts
generate(parse(`a "Go" href:"/posts/$slug"`), new AstroGenerator());
// → <a href={`/posts/${slug}`}>Go</a>
```

### JsonGenerator

Serializes the AST to JSON. Useful for debugging, tooling, or language server integrations.

```ts
new JsonGenerator(indent?: number)  // default: 2
```

## expandComponents()

Expands `component` definitions and calls, replacing them with their resolved element trees. Called automatically by `compile()` and `generate()`.

```ts
import { expandComponents } from '@dzhonragon/4less';

expandComponents(ast: AstNode[]): AstNode[]
```

Use when you want to inspect the expanded tree before passing it to a generator.

## ParseError

Thrown when source contains invalid syntax. Carries structured error locations for editor integration.

```ts
import { ParseError } from '@dzhonragon/4less';

try {
  parse(source);
} catch (e) {
  if (e instanceof ParseError) {
    for (const err of e.errors) {
      console.error(`line ${err.line}:${err.col} — ${err.message}`);
    }
  }
}
```

**Error shape:**

```ts
interface ErrorLocation {
  line:    number;
  col:     number;
  message: string;
}

class ParseError extends Error {
  errors: ErrorLocation[];
}
```

## AstNode Types

The AST uses a discriminated union on the `type` field:

```ts
type AstNode =
  | ElementNode        // type: 'element'
  | LoopNode           // type: 'loop'
  | CondNode           // type: 'cond'
  | ComponentDefNode   // type: 'component_def'
  | ComponentCallNode  // type: 'component_call'
```

**CondNode** — includes negation and optional else branch:

```ts
interface CondNode {
  type:     'cond';
  negate:   boolean;       // true for `if !condition:`
  condition: string;
  body:     AstNode;
  elseBody: AstNode | null; // set when `else:` or `else-if` follows
}
```

**ElementNode** — attribute values are `TextSegment[]` to support `$var` interpolation:

```ts
interface ElementNode {
  type:       'element';
  tag:        string;
  id:         string | null;
  classes:    string[];
  attributes: Record<string, TextSegment[]>;
  text:       TextSegment[] | null;
  children:   AstNode[];
}

type TextSegment =
  | { kind: 'literal'; value: string }
  | { kind: 'var';     name: string  };
```
