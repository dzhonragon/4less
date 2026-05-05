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
4less [options] [file]
```

## Options

| Flag | Short | Description |
| --- | --- | --- |
| `--eval <code>` | `-e` | Compile inline 4less code and print to stdout |
| `--output <file>` | `-o` | Write output to a file instead of stdout |
| `--watch` | `-w` | Watch file for changes and recompile on save |
| `--format <name>` | `-f` | Output format: `html` (default), `react`, `vue`, `astro`, `json` |
| `--version` | `-v` | Print version and exit |
| `--help` | `-h` | Show help and exit |

## Examples

Compile inline code and print to stdout:

```bash
4less -e 'h1 "Hello, world"'
```

Compile a file to HTML (default):

```bash
4less template.4l
```

Compile to React and write to a file:

```bash
4less template.4l --format react --output src/Template.jsx
```

Compile to Vue:

```bash
4less template.4l --format vue --output src/Template.vue
```

Compile to Astro:

```bash
4less template.4l --format astro --output src/Template.astro
```

Compile to JSON (AST representation):

```bash
4less template.4l --format json
```

Watch mode — recompiles every time the file is saved:

```bash
4less src/page.4l --output dist/page.html --watch
```

Combine output file with watch and a specific format:

```bash
4less src/page.4l --format react --output src/Page.jsx --watch
```

Print from stdin:

```bash
echo 'h1 "Hello"' | 4less
```

## Exit Codes

| Code | Meaning |
| --- | --- |
| `0` | Compilation succeeded |
| `1` | Parse error or invalid flag — details printed to stderr |
