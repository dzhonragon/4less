import { readFileSync, writeFileSync, chmodSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(__dir, '../dist/cli.js');

const content = readFileSync(cliPath, 'utf8');
if (!content.startsWith('#!/usr/bin/env node')) {
  writeFileSync(cliPath, '#!/usr/bin/env node\n' + content);
  chmodSync(cliPath, 0o755);
  console.log('Added shebang to dist/cli.js');
}
