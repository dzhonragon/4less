# 4less

[![npm](https://img.shields.io/npm/v/@dzhonragon/4less)](https://www.npmjs.com/package/@dzhonragon/4less)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Minimal DSL that compiles to HTML, React, Vue, and Astro. Zero dependencies.

```
div.card {
  h1 $title
  ul { for item in items: li $item }
  if show: a "Learn more" href:$link
}
```

## Documentation

| | |
|---|---|
| **Site & playground** | [dzhonragon.github.io/4less](https://dzhonragon.github.io/4less) |
| **Getting Started** | [docs/getting-started.md](docs/getting-started.md) |
| **Syntax Reference** | [docs/syntax.md](docs/syntax.md) |
| **API Reference** | [docs/api-reference.md](docs/api-reference.md) |
| **CLI Reference** | [docs/cli.md](docs/cli.md) |
| **Integrations** | [docs/integrations.md](docs/integrations.md) |

## Install

```bash
npm install @dzhonragon/4less
```

## License

MIT
