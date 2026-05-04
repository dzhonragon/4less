---
title: Integrations
description: Use 4less with Vite, Webpack, and esbuild via official plugins.
order: 5
---

## Vite

Import the plugin from `@dzhonragon/4less/vite`:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import fourless from '@dzhonragon/4less/vite';

export default defineConfig({
  plugins: [fourless()],
});
```

Import `.4l` files directly in TypeScript or JavaScript:

```ts
// main.ts
import html from './template.4l';
document.getElementById('app')!.innerHTML = html;
```

Add a type declaration to avoid TypeScript errors:

```ts
// vite-env.d.ts (or any .d.ts file)
declare module '*.4l' {
  const html: string;
  export default html;
}
```

## Webpack

Install the loader alongside the plugin:

```js
// webpack.config.js
const { FourlessWebpackPlugin } = require('@dzhonragon/4less/webpack');

module.exports = {
  plugins: [new FourlessWebpackPlugin()],
  module: {
    rules: [
      {
        test: /\.4l$/,
        use: '@dzhonragon/4less/webpack/loader',
      },
    ],
  },
};
```

Import `.4l` files as strings:

```js
import html from './template.4l';
document.body.innerHTML = html;
```

## esbuild

```js
import * as esbuild from 'esbuild';
import { fourlessPlugin } from '@dzhonragon/4less/esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  plugins: [fourlessPlugin()],
});
```

The plugin resolves `.4l` imports and converts them to exported HTML strings at build time.

## Browser (no bundler)

The package ships a browser-ready ESM bundle. Copy `4less.js` from the `dist/browser/` directory or reference it from a CDN:

```html
<script type="module">
import { compile, parse, generate, HtmlGenerator, ParseError } from './4less.js';

// One-shot compile
const html = compile(`div.card { h1 "Hello" p "From 4less" }`);
document.getElementById('root').innerHTML = html;

// Full pipeline with error handling
try {
  const ast  = parse(document.getElementById('editor').value);
  const html = generate(ast, new HtmlGenerator());
  document.getElementById('preview').innerHTML = html;
} catch (e) {
  if (e instanceof ParseError) {
    console.error(e.errors.map(r => `${r.line}:${r.col} ${r.message}`).join('\n'));
  }
}
</script>
```

All exports available in the browser bundle:

```ts
compile, parse, generate, expandComponents, ParseError,
HtmlGenerator, ReactGenerator, VueGenerator, AstroGenerator, JsonGenerator
```
