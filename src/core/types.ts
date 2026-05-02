export type TokenType =
  | 'ID'
  | 'STRING'
  | 'VAR'
  | 'DOT'
  | 'HASH'
  | 'COLON'
  | 'LBRACE'
  | 'RBRACE'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string | null;
  line: number;
  col: number;
}

export type TextSegment =
  | { kind: 'literal'; value: string }
  | { kind: 'var'; name: string };

export type VarValue = string | string[];
export type VarsMap = Record<string, VarValue>;

export type AstNode = ElementNode | LoopNode;

export interface LoopNode {
  type: 'loop';
  variable: string;
  iterable: string;
  body: ElementNode;
}

export interface ElementNode {
  type: 'element';
  tag: string;
  id: string | null;
  classes: string[];
  attributes: Record<string, string>;
  text: TextSegment[] | null;
  children: AstNode[];
}
