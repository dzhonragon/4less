# Contributing to 4less

## Setup

```bash
git clone https://github.com/dzhonragon/4less.git
cd 4less
npm install
npm test        # 296 tests
npm run build   # TypeScript → dist/
npm run bench   # throughput benchmarks
```

Node 20+ required.

---

## Architecture

```
src/
  core/
    lexer.ts      tokenize(input) → Token[]
    parser.ts     buildAst(tokens) → AstNode[]
    expand.ts     expandComponents(nodes) → AstNode[]   (replaces component calls)
    types.ts      all shared types
  errors.ts       ParseError with line/col info
  generators/
    base.ts       abstract BaseGenerator
    html.ts       HtmlGenerator
    json.ts       JsonGenerator
    react.ts      ReactGenerator
    vue.ts        VueGenerator
    astro.ts      AstroGenerator
  plugins/
    vite.ts       vite4lessPlugin()
    webpack.ts    loader4less
    esbuild.ts    esbuild4lessPlugin()
  index.ts        public API: compile, parse, generate, expandComponents
  cli.ts          CLI entry point

tests/
  core/           lexer, parser, components
  generators/     one file per generator
  security/       xss, unicode, nesting
  plugins/        vite, webpack, esbuild
  compile.test.ts integration tests

benchmarks/
  render.bench.ts throughput comparison vs Pug/EJS/Handlebars
```

### Pipeline

```
input string
  → tokenize()         lexer.ts    → Token[]
  → buildAst()         parser.ts   → AstNode[]  (raw, may contain ComponentDef/Call)
  → expandComponents() expand.ts   → AstNode[]  (clean: ElementNode | LoopNode | CondNode)
  → generator.generate()           → string
```

`compile()` and `generate()` run the full pipeline. `parse()` returns the raw AST (useful for tooling).

---

## Adding a New Generator

1. Create `src/generators/yourformat.ts` extending `BaseGenerator`:

```ts
import { BaseGenerator } from './base.js';
import type { AstNode, ElementNode } from '../core/types.js';

export class YourGenerator extends BaseGenerator {
  generate(nodes: AstNode[]): string {
    return nodes.map(n => this.renderNode(n)).join('');
  }

  private renderNode(node: AstNode): string {
    if (node.type === 'loop') return this.renderLoop(node);
    if (node.type === 'cond') return this.renderCond(node);
    if (node.type === 'element') return this.renderElement(node);
    throw new Error(`unexpected node type '${node.type}'`);
  }

  // ...
}
```

2. Export from `src/index.ts`.
3. Add a test file `tests/generators/yourformat.test.ts`.

The generator always receives an *expanded* AST (no `ComponentDefNode` or `ComponentCallNode`
will ever arrive — `generate()` calls `expandComponents()` first). Still add the `throw` guard
for the exhaustive type check.

---

## Adding a New Language Feature

A new syntax node requires changes in four places:

| File | What to do |
|---|---|
| `src/core/types.ts` | Add the new node interface and union it into `AstNode` |
| `src/core/parser.ts` | Dispatch in `parseAnyNode()` and add the parse method |
| `src/core/expand.ts` | Handle the node in `expandNode()` |
| `src/generators/*.ts` | Handle the node in each generator's `renderNode()` |

Look at how `CondNode` is implemented end-to-end as a reference — it's the simplest example of a complete feature.

---

## Adding a Plugin

Plugins live in `src/plugins/`. Each plugin wraps `compile()` or the `parse`/`generate` pipeline for a specific bundler. Look at `vite.ts` as a reference.

---

## Code Style

- TypeScript strict mode — no `any`, no type assertions unless unavoidable
- Zero production dependencies — only `devDependencies` allowed for tests/tooling
- No comments unless the *why* is non-obvious
- Tests use `vitest` — one `describe` block per concept, one `it` per behavior

---

## Tests

```bash
npm test              # run all tests once
npm run bench         # run benchmarks (takes ~30s)
```

All tests must pass before opening a PR. New features need tests covering:
- The happy path
- Error cases (`ParseError` on bad input)
- All generators if the feature affects output

---

## Pull Requests

1. Fork → branch → commit → PR against `main`
2. PR description should explain *why*, not just *what* — link to an issue if one exists
3. Keep PRs focused; one feature or fix per PR
4. Ensure `npm test` passes and `npm run build` produces no TypeScript errors
