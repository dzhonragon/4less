import { parseInput } from './index.js';
import { ParseError } from './errors.js';
import { readFileSync, writeFileSync, watch } from 'fs';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
    options: {
        output: { type: 'string',  short: 'o' },
        watch:  { type: 'boolean', short: 'w', default: false },
        help:   { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
});

if (values.help) {
    process.stdout.write(`
Usage: 4less [options] [file]

Options:
  -o, --output <file>   write output to a file instead of stdout
  -w, --watch           watch the input file and recompile on changes
  -h, --help            show this message

Examples:
  echo 'h1 "Hello"' | node src/cli.js
  node src/cli.js page.4l
  node src/cli.js page.4l -o page.html
  node src/cli.js page.4l -o page.html --watch
`.trimStart());
    process.exit(0);
}

function compile(input) {
    try {
        return parseInput(input);
    } catch (err) {
        if (err instanceof ParseError) {
            process.stderr.write(err.message + '\n');
            process.exit(1);
        }
        throw err;
    }
}

function writeOutput(html) {
    if (values.output) {
        writeFileSync(values.output, html, 'utf-8');
        process.stderr.write(`compiled -> ${values.output}\n`);
    } else {
        process.stdout.write(html);
    }
}

const file = positionals[0];

if (file) {
    if (values.watch && !values.output) {
        process.stderr.write('--watch requires --output\n');
        process.exit(1);
    }

    const run = () => writeOutput(compile(readFileSync(file, 'utf-8')));
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

    const chunks = [];
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', () => {
        writeOutput(compile(Buffer.concat(chunks).toString('utf-8')));
    });
}
