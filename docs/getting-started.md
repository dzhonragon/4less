---
title: Getting Started
description: Install 4less and write your first template in under five minutes.
order: 1
---

## Installation

Install from npm:

```bash
npm install @dzhonragon/4less
```

Or run a one-off compile without installing globally:

```bash
npx @dzhonragon/4less template.4l
```

For browser use without a bundler, copy `4less.js` from `node_modules/@dzhonragon/4less/dist/browser/` or import it from the built docs bundle.

## Your First Template

Create a file called `index.4l`:

```
div.card {
  h1 "Hello, 4less"
  p "A minimal DSL for HTML."
  a "Learn more" href:"https://github.com/dzhonragon/4less"
}
```

Compile it with the CLI:

```bash
npx 4less index.4l
```

Output:

```html
<div class="card">
  <h1>Hello, 4less</h1>
  <p>A minimal DSL for HTML.</p>
  <a href="https://github.com/dzhonragon/4less">Learn more</a>
</div>
```

## JavaScript API

Use `compile()` for the simplest case — source string in, HTML string out:

```ts
import { compile } from '@dzhonragon/4less';

const html = compile('h1 "Hello"');
// → <h1>Hello</h1>
```

Pass variables at compile time:

```ts
const html = compile('p $name', { vars: { name: 'Alice' } });
// → <p>Alice</p>
```

Arrays are used by loops:

```ts
const html = compile(
  'ul { for item in stack: li $item }',
  { vars: { stack: ['TypeScript', 'React', 'Tailwind'] } }
);
// → <ul><li>TypeScript</li><li>React</li><li>Tailwind</li></ul>
```

## TypeScript Setup

4less ships full TypeScript types. No `@types/` package needed:

```ts
import { compile, parse, generate, HtmlGenerator, ParseError } from '@dzhonragon/4less';
import type { AstNode, CompileOptions } from '@dzhonragon/4less';
```

## Next Steps

- Read **[Syntax Reference](/docs/syntax.md)** to learn all language features
- Check **[API Reference](/docs/api-reference.md)** for the full TypeScript API
- See **[Integrations](/docs/integrations.md)** for Vite, Webpack, and esbuild plugins
