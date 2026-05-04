---
title: CLI Reference
description: Command-line interface for compiling .4l files to any supported output format.
order: 4
---

## Installation

The `4less` binary is available after installing the package:

```bash
npm install @dzhonragon/4less
```

Add to `package.json` scripts or run via npx:

```bash
npx 4less --help
```

## Synopsis

```
4less [options] <file>
```

## Options

| Flag | Short | Description |
| --- | --- | --- |
| `--format <name>` | `-f` | Output format: `html` (default), `react`, `vue`, `astro` |
| `--watch` | `-w` | Watch file for changes and recompile on save |
| `--out <file>` | `-o` | Write output to a file instead of stdout |
| `--help` | `-h` | Show help and exit |
| `--version` | `-v` | Print version and exit |

## Examples

Compile to HTML and print to stdout:

```bash
4less template.4l
```

Compile to React and write to a file:

```bash
4less template.4l --format react --out src/Template.jsx
```

Compile to Vue:

```bash
4less template.4l --format vue --out src/Template.vue
```

Compile to Astro:

```bash
4less template.4l --format astro --out src/Template.astro
```

Watch mode — recompiles every time the file is saved:

```bash
4less template.4l --watch
```

Combine output file with watch:

```bash
4less src/page.4l --format react --out src/Page.jsx --watch
```

## Exit Codes

| Code | Meaning |
| --- | --- |
| `0` | Compilation succeeded |
| `1` | Parse error — details printed to stderr |
| `2` | File not found or unreadable |
