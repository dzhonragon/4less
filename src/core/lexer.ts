import type { Token, TokenType } from './types.js';
import { ParseError } from '../errors.js';

interface TokenPattern {
  type: TokenType | 'WS';
  re: RegExp;
}

const TOKEN_PATTERNS: TokenPattern[] = [
  { type: 'STRING', re: /^"([^"\r\n]*)"/ },
  { type: 'VAR', re: /^\$([a-zA-Z_][a-zA-Z0-9_]*)/ },
  { type: 'DOT', re: /^\./ },
  { type: 'HASH', re: /^#/ },
  { type: 'BANG', re: /^!/ },
  { type: 'COLON', re: /^:/ },
  { type: 'LBRACE', re: /^\{/ },
  { type: 'RBRACE', re: /^\}/ },
  { type: 'ID', re: /^[a-zA-Z_][a-zA-Z0-9_-]*/ },
  { type: 'WS', re: /^[ \t\r\n]+/ },
];

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let lineStart = 0;

  while (pos < input.length) {
    const col = pos - lineStart;
    const slice = input.slice(pos);
    let matched = false;

    for (const { type, re } of TOKEN_PATTERNS) {
      const m = slice.match(re);
      if (!m) continue;

      if (type === 'WS') {
        for (const ch of m[0]) {
          if (ch === '\n') {
            line++;
            lineStart = pos + 1;
          }
          pos++;
        }
      } else {
        const value = (type === 'STRING' || type === 'VAR') ? m[1] : m[0];
        tokens.push({ type, value, line, col });
        pos += m[0].length;
      }
      matched = true;
      break;
    }

    if (!matched) {
      throw new ParseError([
        {
          line,
          col: pos - lineStart,
          message: `unexpected character '${input[pos]}'`,
        },
      ]);
    }
  }

  tokens.push({ type: 'EOF', value: null, line, col: pos - lineStart });
  return tokens;
}
