import {
  compile, parse, generate,
  HtmlGenerator, ReactGenerator, VueGenerator, AstroGenerator, JsonGenerator,
  ParseError,
} from './index.js';
import { readFileSync, writeFileSync, watch } from 'fs';
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);
const PKG_VERSION: string = _require('../package.json').version as string;

const HELP = `
Usage: 4less [options] [file]

Options:
  -e, --eval <code>     compile inline 4less code and print to stdout
  -o, --output <file>   write output to a file instead of stdout
  -w, --watch           watch the input file and recompile on changes
  -f, --format <type>   output format: html (default), react, vue, astro, json
  -v, --version         print version and exit
  -h, --help            show this message

Examples:
  4less -e 'h1 "Hello"'
  echo 'h1 "Hello"' | 4less
  4less page.4l
  4less page.4l -o page.html
  4less page.4l -o page.html --watch
  4less page.4l --format react --output Page.jsx
  4less page.4l --format vue   --output Page.vue
  4less page.4l --format astro --output Page.astro
  4less page.4l --format json
`.trim();

function main(): void {
  const { values, positionals } = parseArgs({
    options: {
      eval:    { type: 'string',  short: 'e' },
      output:  { type: 'string',  short: 'o' },
      watch:   { type: 'boolean', short: 'w', default: false },
      format:  { type: 'string',  short: 'f', default: 'html' },
      version: { type: 'boolean', short: 'v', default: false },
      help:    { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    process.stdout.write(HELP + '\n');
    process.exit(0);
  }

  if (values.version) {
    process.stdout.write(`${PKG_VERSION}\n`);
    process.exit(0);
  }

  function doCompile(input: string): string {
    try {
      const ast = parse(input);
      switch (values.format) {
        case 'html':  return generate(ast, new HtmlGenerator());
        case 'react': return generate(ast, new ReactGenerator());
        case 'vue':   return generate(ast, new VueGenerator());
        case 'astro': return generate(ast, new AstroGenerator());
        case 'json':  return generate(ast, new JsonGenerator());
        default:
          process.stderr.write(`unknown format: ${values.format}\n`);
          process.exit(1);
      }
    } catch (err) {
      if (err instanceof ParseError) {
        process.stderr.write(err.message + '\n');
        process.exit(1);
      }
      throw err;
    }
  }

  function writeOutput(output: string): void {
    if (values.output) {
      writeFileSync(values.output, output, 'utf-8');
      process.stderr.write(`compiled -> ${values.output}\n`);
    } else {
      process.stdout.write(output);
    }
  }

  if (values.eval !== undefined) {
    if (values.watch) {
      process.stderr.write('--watch cannot be used with --eval\n');
      process.exit(1);
    }
    writeOutput(doCompile(values.eval));
    return;
  }

  const file = positionals[0];

  if (file) {
    if (values.watch && !values.output) {
      process.stderr.write('--watch requires --output\n');
      process.exit(1);
    }

    const run = (): void => {
      writeOutput(doCompile(readFileSync(file, 'utf-8')));
    };

    run();

    if (values.watch) {
      process.stderr.write(`watching ${file}...\n`);
      watch(file, () => {
        process.stderr.write('changed: recompiling...\n');
        run();
      });
    }
  } else {
    if (values.watch) {
      process.stderr.write('--watch requires a file argument\n');
      process.exit(1);
    }

    const chunks: Buffer[] = [];
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', () => {
      writeOutput(doCompile(Buffer.concat(chunks).toString('utf-8')));
    });
  }
}

main();
