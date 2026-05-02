# Vite Plugin for 4less

Use 4less files directly in your Vite projects. The plugin compiles `.4l` files to HTML at build time and provides hot module reloading during development.

## Installation

```bash
npm install -D 4less vite
```

## Setup

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import plugin4less from '4less/vite';

export default defineConfig({
  plugins: [
    plugin4less(),
    react(),
  ],
});
```

## Usage

### Basic

Create a `.4l` file:

```
// layout.4l
div#app.container {
  header { h1 "My App" }
  main { p "Welcome" }
  footer { small "© 2024" }
}
```

Import it as HTML:

```typescript
// app.tsx
import html from './layout.4l';

export default function App() {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

### With React Components

```
// button.4l
button.btn.primary "Click Me"
```

```typescript
// app.tsx
import html from './button.4l';

export default function App() {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

### With Attributes

```
// form.4l
form {
  input type:"email" placeholder:"your@email.com"
  input type:"password" placeholder:"••••••"
  button type:"submit" "Sign In"
}
```

```typescript
import html from './form.4l';

export default function SignInForm() {
  return <form dangerouslySetInnerHTML={{ __html: html }} />;
}
```

## How It Works

1. The plugin intercepts `.4l` file imports
2. Each file is compiled to HTML using the 4less compiler
3. The result is exported as a JavaScript string
4. During development, changes to `.4l` files trigger HMR (hot module replacement)

## With Other Generators

If you want to use a different generator (JSON, React, custom), you can use the API directly:

```typescript
import { parse, generate, ReactGenerator } from '4less';
import source from './template.4l?raw';

const ast = parse(source);
const jsx = generate(ast, new ReactGenerator());
```

## Error Handling

If a `.4l` file has invalid syntax, the build will fail with a helpful error message:

```
Error: Failed to compile ./src/invalid.4l:
line 1:7 unexpected token '}' expecting ID
```

## Performance

4less is extremely fast—parsing and generating HTML happens at build time, so there's zero runtime overhead in your bundle.

## Examples

See the [main README](./README.md) for more examples and the `ElementNode` structure.
