import type { Token, ElementNode, LoopNode, CondNode, AstNode, TextSegment, ComponentDefNode, ComponentCallNode } from './types.js';
import { ParseError } from '../errors.js';

/** Splits a raw string value into literal/var segments for attribute interpolation. */
function parseAttrValue(raw: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const re = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) segments.push({ kind: 'literal', value: raw.slice(last, m.index) });
    segments.push({ kind: 'var', name: m[1] });
    last = m.index + m[0].length;
  }
  if (last < raw.length) segments.push({ kind: 'literal', value: raw.slice(last) });
  if (segments.length === 0) segments.push({ kind: 'literal', value: raw });
  return segments;
}

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
    if (tok.value === 'else' || tok.value === 'else-if') {
      throw new ParseError([{
        line: tok.line,
        col: tok.col,
        message: `'${tok.value}' without a preceding 'if'`,
      }]);
    }
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
    let negate = false;
    if (this.peek().type === 'BANG') {
      this.consume('BANG');
      negate = true;
    }
    const condition = this.consume('ID').value!;
    this.consume('COLON');
    const body = this.parseAnyNode();
    const node: CondNode = { type: 'cond', negate, condition, body, elseBody: null };
    return this.attachElse(node);
  }

  private attachElse(node: CondNode): CondNode {
    const next = this.peek();
    if (next.type !== 'ID') return node;

    if (next.value === 'else') {
      this.consume('ID');
      this.consume('COLON');
      return { ...node, elseBody: this.parseAnyNode() };
    }

    if (next.value === 'else-if') {
      this.consume('ID');
      let neg = false;
      if (this.peek().type === 'BANG') { this.consume('BANG'); neg = true; }
      const cond = this.consume('ID').value!;
      this.consume('COLON');
      const body = this.parseAnyNode();
      const inner: CondNode = { type: 'cond', negate: neg, condition: cond, body, elseBody: null };
      return { ...node, elseBody: this.attachElse(inner) };
    }

    return node;
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

    const attributes: Record<string, TextSegment[]> = {};
    const RESERVED = new Set(['for', 'in', 'if', 'else', 'else-if', 'component']);
    while (
      this.peek().type === 'ID' &&
      !RESERVED.has(this.peek().value ?? '') &&
      this.tokens[this.pos + 1]?.type === 'COLON'
    ) {
      const key = this.consume('ID').value!;
      this.consume('COLON');
      const raw = this.consume('STRING').value!;
      attributes[key] = parseAttrValue(raw);
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
