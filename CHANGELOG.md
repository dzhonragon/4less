# Changelog

All notable changes to this project will be documented in this file.

---

## [2.0.0] — 2025-05-02

### Added

#### Phase A — Horizontal (Layered Architecture)
- **TypeScript migration**: Handwritten lexer and parser (zero ANTLR4 dependency)
- **Core modules**: `src/core/types.ts`, `src/core/lexer.ts`, `src/core/parser.ts`
- **Error reporting**: `ParseError` with structured location info (`line`, `col`, `message`)
- **Pluggable generators**: `BaseGenerator` abstract class + implementations
- **Built-in generators**:
  - `HtmlGenerator` — HTML5-compliant with proper void element handling
  - `JsonGenerator` — AST serialization with configurable indentation
  - `ReactGenerator` — `React.createElement()` calls with prop name mappings
  - `VueGenerator` — Vue 3 template-compatible HTML
  - `AstroGenerator` — Astro `.astro` syntax with frontmatter support
- **Build tool plugins**:
  - Vite plugin (`src/plugins/vite.ts`)
  - Webpack loader (`src/plugins/webpack.ts`)
  - esbuild plugin (`src/plugins/esbuild.ts`)
- **CLI tool** (`src/cli.ts`): `4less --format html|json --watch`

#### Phase B — Vertical (Language Features)
- **Variables** (`B1`): Reference values from `vars` map
  - Syntax: `p $title`
  - Example: `compile('p $title', { title: 'Hello' })`
  - Unresolved vars render as `{{varName}}` placeholder in HTML
  - Each generator emits idiom-native output (React: bare identifier, Vue: `{{ varName }}`, etc.)
- **Loops** (`B2`): Iterate over arrays
  - Syntax: `for item in items: li $item`
  - Example: `compile('for item in items: li $item', { items: ['a', 'b'] })`
  - Native per-generator: `v-for` in Vue, `.map()` in React/Astro
  - Supports nesting and variable binding
- **Conditionals** (`B3`): Show/hide based on truthiness
  - Syntax: `if condition: div "content"`
  - Example: `compile('if show: p "Hi"', { show: true })`
  - Native per-generator: `v-if` in Vue, ternary in React, `&&` in Astro
  - Supports nesting and composition with loops

### Changed

- Rewrote lexer/parser to handwritten recursive descent (from ANTLR4)
- Updated `ElementNode` AST structure:
  - `text: string | null` → `text: TextSegment[] | null` (supports variables)
  - `children: ElementNode[]` → `children: AstNode[]` (supports loops, conditionals)
- Renamed main API: `parseInput()` → `compile()`
- Updated `generate()` signature: accepts generator **instance** (not class)
- All generators now accept `AstNode[]` (supports loops and conditionals at top level)
- `HtmlGenerator` options: now accepts `{ vars?: Record<string, string | string[] | boolean> }`
- `compile()` signature: `compile(input: string, vars?: VarsMap): string`

### Fixed

- HTML escaping: now escapes `&`, `<`, `>`, `"` in text content and attributes
- Self-closing tags: only void elements (HTML5 spec) use `/>` syntax
- `ParseError` now includes structured location info instead of single-line format
- Generator tests: updated fixtures to use `TextSegment[]` instead of plain strings
- JSON generator: now always returns array (fixed inconsistency with single elements)

### Removed

- ANTLR4 dependency
- All `.js` generator files (migrated to TypeScript)
- GitHub Actions CI references to ANTLR4 tooling

---

## [1.0.0] — 2025-04-15

### Added

- Initial release with basic DSL syntax
- HTML generator
- CLI with `--output` and `--watch` flags
- Vitest test suite (26 tests)
