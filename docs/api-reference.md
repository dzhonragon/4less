---
title: API Reference
description: TypeScript API for compiling, parsing, and generating 4less templates.
order: 3
---

## compile()

The highest-level entry point. Parses a 4less string, expands components, and emits HTML in one call.

```ts
import { compile } from '@dzhonragon/4less';

compile(source: string, options?: CompileOptions): string
```

**Options:**

```ts
interface CompileOptions {
  vars?: Record<string, string | string[]>;
}
```

**Example:**

```ts
const html = compile(
  `ul { for item in stack: li $item }`,
  { vars: { stack: ['TypeScript', 'React'] } }
);
// → <ul><li>TypeScript</li><li>React</li></ul>
```

## parse()

Tokenizes and parses source text into an AST. Use when you want to inspect or transform the tree before generating output.

```ts
import { parse } from '@dzhonragon/4less';

parse(source: string): AstNode[]
```

Returns an array of `AstNode` (element nodes, loop nodes, conditional nodes, component definitions, and component calls). Throws `ParseError` on invalid syntax.

**Example:**

```ts
const ast = parse(`
  component Badge { span.badge $label }
  Badge label:"stable"
`);
// ast[0].type === 'component-def'
// ast[1].type === 'component-call'
```

## generate()

Walks an AST with a generator instance to produce output. Pair with `parse()` for full control over the pipeline.

```ts
import { parse, generate, HtmlGenerator } from '@dzhonragon/4less';

generate(ast: AstNode[], generator: BaseGenerator): string
```

**Example:**

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
new HtmlGenerator(options?: { vars?: Record<string, string | string[]> })
```

```ts
generate(ast, new HtmlGenerator({ vars: { name: 'Alice' } }));
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

### VueGenerator

Renders to Vue template syntax with `v-for` and `v-if` directives.

```ts
new VueGenerator()
```

```ts
generate(parse(`ul { for item in list: li $item }`), new VueGenerator());
// → <ul><li v-for="item in list" :key="item">{{ item }}</li></ul>
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
interface ParseErrorRecord {
  line:    number;
  col:     number;
  message: string;
}

class ParseError extends Error {
  errors: ParseErrorRecord[];
}
```

## AstNode Types

The AST uses a discriminated union on the `type` field:

```ts
type AstNode =
  | ElementNode       // type: 'element'
  | LoopNode          // type: 'loop'
  | CondNode          // type: 'cond'
  | ComponentDef      // type: 'component-def'
  | ComponentCall     // type: 'component-call'
  | TextSegment;      // type: 'text'
```
