# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## Unreleased

## 2.1.0 - 2026-05-04

### Added
- Vue loop :key binding for proper list tracking
- Default variables in playground previews (HTML/Hero editors)
- Guide page generation from markdown metadata
- CLI executable shebang for Unix systems
- Post-build script for automatic shebang injection
- Comprehensive documentation structure with individual markdown files
- Documentation API reference for all generators

### Changed
- Documentation build script now reads individual markdown files
- Navigation uses absolute paths for consistency across page depths
- Guide cards generated dynamically from markdown frontmatter
- Build system structure reorganized (docs/pages/guide instead of docs/guide)

### Fixed
- Vue generator missing :key binding in loops
- CLI executable not working on Unix (missing shebang)
- Documentation layout for guide pages with sidebar
- Navigation path consistency across different page depths

### Documentation
- Created comprehensive API reference (api-reference.md)
- Created CLI reference (cli.md)
- Created integrations guide (integrations.md)
- Created syntax reference (syntax.md)
- Created getting started guide (getting-started.md)
- Reorganized docs/ structure for cleaner codebase

## 2.0.0 - 2026-04-28

Initial release with full feature set.

### Features
- Complete 4less DSL implementation
- HTML generator with variable support
- React generator with proper JSX output
- Vue generator with v-for and v-if directives
- Astro generator with component syntax
- JSON generator for AST inspection
- Vite plugin
- Webpack plugin
- esbuild plugin
- Browser ESM bundle
- CLI tool with stdin/stdout support
- Watch mode for file changes
- Comprehensive test suite (173 tests)
- Zero external dependencies
