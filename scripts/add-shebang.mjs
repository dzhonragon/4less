import { readFileSync, writeFileSync, chmodSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Add shebang to CLI for Unix-like systems (Linux, macOS)
// On Windows, npm creates .cmd wrapper automatically during installation
// This shebang allows ./dist/cli.js to work on Unix and enables npm to identify it as executable
const __dir = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(__dir, '../dist/cli.js');

const content = readFileSync(cliPath, 'utf8');
if (!content.startsWith('#!/usr/bin/env node')) {
  writeFileSync(cliPath, '#!/usr/bin/env node\n' + content);
  chmodSync(cliPath, 0o755);
  console.log('Added shebang to dist/cli.js');
}
