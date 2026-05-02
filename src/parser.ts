import type { Token, ElementNode } from './types.js';
import { ParseError } from './errors.js';

class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(expectedType?: string): Token {
    const tok = this.tokens[this.pos];
    if (expectedType && tok.type !== expectedType) {
      throw new ParseError([
        {
          line: tok.line,
          col: tok.col,
          message: `expected ${expectedType} but got ${tok.type}${tok.value ? ` ('${tok.value}')` : ''}`,
        },
      ]);
    }
    this.pos++;
    return tok;
  }

  parseProg(): ElementNode[] {
    const elements: ElementNode[] = [];
    while (this.peek().type !== 'EOF') {
      const tok = this.peek();
      if (tok.type === 'RBRACE') {
        throw new ParseError([
          {
            line: tok.line,
            col: tok.col,
            message: `extraneous input '}' expecting {<EOF>, ID}`,
          },
        ]);
      }
      if (tok.type !== 'ID') {
        throw new ParseError([
          {
            line: tok.line,
            col: tok.col,
            message: `unexpected token '${tok.value ?? tok.type}' expecting ID`,
          },
        ]);
      }
      elements.push(this.parseElement());
    }
    return elements;
  }

  private parseElement(): ElementNode {
    const tagTok = this.consume('ID');
    const tag = tagTok.value!;

    const classes: string[] = [];
    let id: string | null = null;

    while (this.peek().type === 'DOT' || this.peek().type === 'HASH') {
      if (this.peek().type === 'DOT') {
        this.consume('DOT');
        classes.push(this.consume('ID').value!);
      } else {
        this.consume('HASH');
        id = this.consume('ID').value!;
      }
    }

    let text: string | null = null;
    if (this.peek().type === 'STRING') {
      text = this.consume('STRING').value!;
    }

    const attributes: Record<string, string> = {};
    while (
      this.peek().type === 'ID' &&
      this.tokens[this.pos + 1]?.type === 'COLON'
    ) {
      const key = this.consume('ID').value!;
      this.consume('COLON');
      attributes[key] = this.consume('STRING').value!;
    }

    let children: ElementNode[] = [];
    if (this.peek().type === 'LBRACE') {
      this.consume('LBRACE');
      while (this.peek().type !== 'RBRACE') {
        if (this.peek().type === 'EOF') {
          const tok = this.peek();
          throw new ParseError([
            {
              line: tok.line,
              col: tok.col,
              message: `missing closing '}'`,
            },
          ]);
        }
        children.push(this.parseElement());
      }
      this.consume('RBRACE');
    }

    return {
      type: 'element',
      tag,
      id,
      classes,
      attributes,
      text,
      children,
    };
  }
}

export function buildAst(tokens: Token[]): ElementNode[] {
  return new Parser(tokens).parseProg();
}
