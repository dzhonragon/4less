import type { Token, ElementNode, LoopNode, CondNode, AstNode, TextSegment, ComponentDefNode, ComponentCallNode } from './types.js';
import { ParseError } from '../errors.js';

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

  parseProg(): AstNode[] {
    const nodes: AstNode[] = [];
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
      nodes.push(this.parseAnyNode());
    }
    return nodes;
  }

  private parseAnyNode(): AstNode {
    const tok = this.peek();
    if (tok.value === 'for') return this.parseLoop();
    if (tok.value === 'if') return this.parseCond();
    if (tok.value === 'component') return this.parseComponentDef();
    if (tok.type === 'ID' && /^[A-Z]/.test(tok.value!)) return this.parseComponentCall();
    return this.parseElement();
  }

  private parseComponentDef(): ComponentDefNode {
    this.consume('ID'); // 'component'
    const nameTok = this.consume('ID');
    const name = nameTok.value!;
    if (!/^[A-Z]/.test(name)) {
      throw new ParseError([{
        line: nameTok.line,
        col: nameTok.col,
        message: `component name must start with uppercase, got '${name}'`,
      }]);
    }
    this.consume('LBRACE');
    const body: AstNode[] = [];
    while (this.peek().type !== 'RBRACE') {
      if (this.peek().type === 'EOF') {
        const tok = this.peek();
        throw new ParseError([{ line: tok.line, col: tok.col, message: `missing closing '}' in component '${name}'` }]);
      }
      body.push(this.parseAnyNode());
    }
    this.consume('RBRACE');
    return { type: 'component_def', name, body };
  }

  private parseComponentCall(): ComponentCallNode {
    const nameTok = this.consume('ID');
    const props: Record<string, string> = {};
    while (
      this.peek().type === 'ID' &&
      this.tokens[this.pos + 1]?.type === 'COLON'
    ) {
      const key = this.consume('ID').value!;
      this.consume('COLON');
      props[key] = this.consume('STRING').value!;
    }
    return { type: 'component_call', name: nameTok.value!, props, line: nameTok.line, col: nameTok.col };
  }

  private parseLoop(): LoopNode {
    this.consume('ID'); // 'for'
    const variable = this.consume('ID').value!;
    const inTok = this.consume('ID');
    if (inTok.value !== 'in') {
      throw new ParseError([
        {
          line: inTok.line,
          col: inTok.col,
          message: `expected 'in' but got '${inTok.value}'`,
        },
      ]);
    }
    const iterable = this.consume('ID').value!;
    this.consume('COLON');
    const body = this.parseElement();
    return { type: 'loop', variable, iterable, body };
  }

  private parseCond(): CondNode {
    this.consume('ID'); // 'if'
    const condition = this.consume('ID').value!;
    this.consume('COLON');
    const body = this.parseAnyNode();
    return { type: 'cond', condition, body };
  }

  private parseElement(): ElementNode {
    const tagTok = this.consume('ID');
    const tag = tagTok.value!;
    if (/^[A-Z]/.test(tag)) {
      throw new ParseError([{
        line: tagTok.line,
        col: tagTok.col,
        message: `'${tag}' looks like a component; wrap it: 'for x in xs: div { ${tag} ... }'`,
      }]);
    }

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

    let text: TextSegment[] | null = null;
    if (this.peek().type === 'STRING' || this.peek().type === 'VAR') {
      text = [];
      while (this.peek().type === 'STRING' || this.peek().type === 'VAR') {
        const tok = this.peek();
        if (tok.type === 'STRING') {
          this.consume('STRING');
          text.push({ kind: 'literal', value: tok.value! });
        } else {
          this.consume('VAR');
          text.push({ kind: 'var', name: tok.value! });
        }
      }
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

    const children: AstNode[] = [];
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
        children.push(this.parseAnyNode());
      }
      this.consume('RBRACE');
    }

    return { type: 'element', tag, id, classes, attributes, text, children };
  }
}

export function buildAst(tokens: Token[]): AstNode[] {
  return new Parser(tokens).parseProg();
}
